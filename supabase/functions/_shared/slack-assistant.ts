import {
  buildCompanyAdminPortalUrl,
  buildEmployeePortalUrl,
  buildTeamBalanceInsight,
  createServiceSupabaseClient,
  listOrgRoleColors,
  postSlackMessage,
  resolveCompanyUserByEmail,
  resolveCompanyUserBySlackUserId,
  resolveSlackLookupTargetFromText,
  roleColorToProfile,
  type CompanyContext,
  type SlackConnectionRecord,
} from "./slack.ts";

type SupabaseClient = ReturnType<typeof createServiceSupabaseClient>;

export interface SlackAssistantReply {
  text: string;
  blocks?: unknown[];
}

export interface SlackCommandDefinition {
  command: string;
  description: string;
  example?: string;
}

export const SLACK_SUPPORTED_COMMANDS: SlackCommandDefinition[] = [
  {
    command: "/rcf",
    description: "Open RoleColorFinder quick actions and command help.",
    example: "/rcf help",
  },
  {
    command: "/rolecolor [email|@handle|@mention]",
    description: "Look up a teammate's RoleColor and working style.",
    example: "/rolecolor @sanjaydivakar",
  },
  {
    command: "/teambalance",
    description: "See your team's RoleColor distribution and hiring insight.",
  },
];

const HELP_INTENTS = ["help", "commands", "menu", "what can you do", "what are the commands"];
const TEAM_BALANCE_INTENTS = ["teambalance", "team balance", "balance my team"];
const ROLECOLOR_INTENTS = ["rolecolor", "role color", "who is", "what color is"];
const stripBotMention = (text: string) => text.replace(/^<@[A-Z0-9]+(?:\|[^>]+)?>\s*/i, "").trim();

const normalizeText = (text: string) => stripBotMention(text).replace(/\s+/g, " ").trim();

const commandsSectionText = () =>
  SLACK_SUPPORTED_COMMANDS.map((item) => `• *${item.command}* — ${item.description}`).join("\n");

const buildCommandHelpBlocks = (company: CompanyContext) => {
  const assessmentUrl = buildEmployeePortalUrl(company);
  const dashboardUrl = buildCompanyAdminPortalUrl(company, { tab: "overview" });
  const integrationsUrl = buildCompanyAdminPortalUrl(company, { tab: "settings", settingsTab: "integrations" });

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*RoleColorFinder commands*\n" +
          `${commandsSectionText()}\n\n` +
          "You can also DM me questions about assessments, RoleColors, team balance, hiring workflows, and where to find things in the portal.",
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Take Assessment" },
          url: assessmentUrl,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Open Dashboard" },
          url: dashboardUrl,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Slack Integration" },
          url: integrationsUrl,
        },
      ],
    },
  ];
};

const roleColorBlocks = (name: string, profile: { color: string; role: string; tips: string[] }) => ({
  text: `${name} is a ${profile.color} ${profile.role}.`,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${name}* is a *${profile.color} ${profile.role}*`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `🎨 *Color:* ${profile.color}\n💼 *Role:* ${profile.role}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Working with them:*\n• ${profile.tips.join("\n• ")}`,
      },
    },
  ],
});

const buildTeamBalanceBlocks = (company: CompanyContext, counts: Record<string, number>, total: number) => {
  const colors = ["red", "yellow", "green", "blue"] as const;
  const fields = colors.map((color) => {
    const count = counts[color];
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    const label = color.charAt(0).toUpperCase() + color.slice(1);

    return {
      type: "mrkdwn",
      text: `*${label}*\n${count} (${percentage}%)`,
    };
  });

  return {
    text: `${company.name} team balance snapshot.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${company.name}* team balance snapshot`,
        },
      },
      {
        type: "section",
        fields,
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: buildTeamBalanceInsight(counts, total),
        },
      },
    ],
  };
};

const isIntentMatch = (text: string, intents: string[]) => {
  const normalized = normalizeText(text).toLowerCase();
  return intents.some((intent) => normalized === intent || normalized.startsWith(`${intent} `) || normalized.includes(intent));
};

export const buildSlackCommandsSummary = () =>
  SLACK_SUPPORTED_COMMANDS.map((item) =>
    item.example ? `${item.command} — ${item.description} Example: ${item.example}.` : `${item.command} — ${item.description}`,
  ).join(" ");

export const generateSlackAssistantReply = async (params: {
  supabase: SupabaseClient;
  company: CompanyContext;
  connection: SlackConnectionRecord;
  userText: string;
}) : Promise<SlackAssistantReply> => {
  const normalizedText = normalizeText(params.userText);
  const lowered = normalizedText.toLowerCase();

  if (!normalizedText || isIntentMatch(lowered, HELP_INTENTS)) {
    return {
      text: "Here are the RoleColorFinder commands I support.",
      blocks: buildCommandHelpBlocks(params.company),
    };
  }

  if (isIntentMatch(lowered, TEAM_BALANCE_INTENTS)) {
    const users = await listOrgRoleColors(params.supabase, params.connection.org_id);
    const counts = { red: 0, yellow: 0, green: 0, blue: 0 };

    for (const user of users) {
      if (user.color && user.color in counts) {
        counts[user.color as keyof typeof counts] += 1;
      }
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return buildTeamBalanceBlocks(params.company, counts, total);
  }

  if (isIntentMatch(lowered, ROLECOLOR_INTENTS)) {
    const lookup = await resolveSlackLookupTargetFromText({
      botToken: params.connection.bot_token,
      text: normalizedText,
    });
    if (!lookup) {
      return {
        text: "Use /rolecolor with an email, @handle, or @mention so I can find the right teammate.",
      };
    }

    const companyUser =
      (lookup.slackUserId
        ? await resolveCompanyUserBySlackUserId(params.supabase, params.connection.org_id, lookup.slackUserId)
        : null) ||
      (lookup.email ? await resolveCompanyUserByEmail(params.supabase, params.connection.org_id, lookup.email) : null);
    const targetLabel =
      companyUser?.fullName ||
      lookup.realName ||
      lookup.displayName ||
      lookup.email ||
      normalizedText;
    const profile = companyUser?.results
      ? roleColorToProfile(
          String(
            companyUser.results.dominantColor ||
              companyUser.results.primaryColor ||
              companyUser.results.role_color ||
              "",
          ).toLowerCase(),
        )
      : null;

    if (!companyUser?.results || !profile) {
      return {
        text: `No RoleColor found for ${targetLabel}. Send them an assessment: ${buildEmployeePortalUrl(params.company)}`,
      };
    }

    return roleColorBlocks(companyUser.fullName || targetLabel, profile);
  }

  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    return {
      text:
        "I can help with RoleColorFinder commands, assessments, RoleColors, team balance, and portal navigation. Try /rcf help for the full command list.",
    };
  }

  const dashboardUrl = buildCompanyAdminPortalUrl(params.company, { tab: "overview" });
  const integrationsUrl = buildCompanyAdminPortalUrl(params.company, { tab: "settings", settingsTab: "integrations" });
  const assessmentUrl = buildEmployeePortalUrl(params.company);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            `You are RoleColorFinder's Slack assistant for ${params.company.name}. ` +
            "Only answer questions related to RoleColorFinder, RoleColors, assessments, team balance, hiring workflows, invites, integrations, and portal navigation. " +
            "Be concise and Slack-friendly. Prefer short paragraphs or short bullets. " +
            "If the user asks for a teammate-specific RoleColor lookup, tell them to use /rolecolor [email|@handle|@mention]. " +
            "If they ask for team balance, tell them to use /teambalance. " +
            `Available commands: ${buildSlackCommandsSummary()} ` +
            `Useful links: dashboard ${dashboardUrl}, assessment ${assessmentUrl}, integrations ${integrationsUrl}.`,
        },
        {
          role: "user",
          content: normalizedText,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("slack assistant OpenAI error", response.status, errorText);
    return {
      text:
        "I can help with RoleColorFinder workflows, but the AI reply service is unavailable right now. Try /rcf help for commands or ask again in a moment.",
    };
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const replyText = typeof content === "string" && content.trim()
    ? content.trim()
    : "I can help with RoleColorFinder commands, assessments, and team workflows. Try /rcf help for the command list.";

  return {
    text: replyText,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: replyText,
        },
      },
    ],
  };
};

export const postSlackAssistantReply = async (params: {
  connection: SlackConnectionRecord;
  channel: string;
  text: string;
  blocks?: unknown[];
  threadTs?: string | null;
}) => {
  await postSlackMessage(params.connection.bot_token, {
    channel: params.channel,
    text: params.text,
    blocks: params.blocks,
    thread_ts: params.threadTs || undefined,
  });
};
