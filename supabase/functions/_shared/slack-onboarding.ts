// deno-lint-ignore-file no-explicit-any
import {
  buildCompanyAdminPortalUrl,
  buildEmployeePortalUrl,
  createServiceSupabaseClient,
  getCompanyByOrgId,
  getSlackUserInfo,
  openDirectMessageChannel,
  postSlackMessage,
  resolveRoleColorFromResults,
  roleColorToProfile,
  slackApiFetch,
  type CompanyContext,
  type SlackConnectionRecord,
} from "./slack.ts";

type SupabaseClient = ReturnType<typeof createServiceSupabaseClient>;

type ConfirmationStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "expired"
  | "ignored"
  | "auto_created"
  | "admin_approved"
  | "admin_rejected";

type EmailMismatchAction = "confirm" | "ignore" | "auto_create";

const APP_BASE_URL =
  (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.APP_BASE_URL ||
  Deno.env.get("APP_BASE_URL") ||
  Deno.env.get("PUBLIC_APP_URL") ||
  "https://rolecolorfinder.com";

const COLOR_EMOJI: Record<string, string> = {
  red: "🔴",
  yellow: "🟡",
  green: "🟢",
  blue: "🔵",
};

const CONFIRMATION_WINDOW_HOURS = 48;

export interface SlackProfileSnapshot {
  slackUserId: string;
  email: string | null;
  displayName: string | null;
  realName: string | null;
  title: string | null;
  avatarUrl: string | null;
}

export interface CompanyUserIdentity {
  id: string;
  orgId: string;
  email: string;
  fullName: string | null;
  jobRole: string | null;
  role: string;
  status: string | null;
  inviteCode: string | null;
  userId: string | null;
  slackUserId: string | null;
  slackLinkedAt: string | null;
  assessmentResultId: string | null;
  roleColor: string | null;
}

export interface FuzzyMatchResult {
  companyUserId: string;
  fullName: string | null;
  jobRole: string | null;
  roleColor: string | null;
  matchConfidence: number | null;
}

export interface SlackPendingConfirmationRecord {
  id: string;
  org_id: string;
  slack_user_id: string;
  slack_email: string | null;
  slack_display_name: string | null;
  slack_real_name: string | null;
  slack_title: string | null;
  slack_avatar_url: string | null;
  matched_rcf_user_id: string | null;
  matched_rcf_name: string | null;
  matched_rcf_role: string | null;
  matched_rcf_color: string | null;
  match_type: "exact_email" | "fuzzy_name" | "none" | null;
  match_confidence: number | null;
  confirmation_token: string;
  status: ConfirmationStatus;
  initiated_by: "system" | "admin";
  dm_sent_at: string | null;
  responded_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SlackChannelOption {
  id: string;
  name: string;
}

const toText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const normalizeEmail = (value: unknown) => {
  const text = toText(value);
  return text ? text.toLowerCase() : null;
};

const nowIso = () => new Date().toISOString();

const addHoursIso = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const firstNameFrom = (name: string | null, fallback = "there") => {
  const candidate = toText(name);
  if (!candidate) return fallback;
  return candidate.split(/\s+/)[0] || fallback;
};

const fallbackSlackEmail = (orgId: string, slackUserId: string) =>
  `slack-${slackUserId.toLowerCase()}@${orgId}.slack.rolecolorfinder.local`;

const roleColorSummary = (color: string | null) => {
  const profile = roleColorToProfile(color);
  if (!profile) {
    return {
      colorLabel: "Unknown",
      roleLabel: "RoleColor pending",
      emoji: "⚪",
    };
  }

  return {
    colorLabel: profile.color,
    roleLabel: profile.role,
    emoji: COLOR_EMOJI[profile.color.toLowerCase()] || "⚪",
  };
};

export const manualSlackLinkUrl = (token: string) => {
  const url = new URL("/settings/integrations/slack/link", APP_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
};

const employeeAssessmentUrl = (company: CompanyContext, email: string, inviteCode: string) =>
  buildEmployeePortalUrl(company, "/login", {
    email,
    inviteCode,
  });

const loadAssessmentResults = async (supabase: SupabaseClient, assessmentResultId: string | null) => {
  if (!assessmentResultId) {
    return null;
  }

  const { data, error } = await supabase
    .from("assessment_results")
    .select("results")
    .eq("id", assessmentResultId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const results = (data?.results as Record<string, unknown> | null) ?? null;
  return resolveRoleColorFromResults(results);
};

const hydrateCompanyUserIdentity = async (
  supabase: SupabaseClient,
  row: {
    id: string;
    company_id: string;
    email: string;
    full_name: string | null;
    job_role: string | null;
    role: string;
    status: string | null;
    invite_code: string | null;
    user_id: string | null;
    slack_user_id: string | null;
    slack_linked_at: string | null;
    assessment_result_id: string | null;
  },
): Promise<CompanyUserIdentity> => {
  const roleColor = await loadAssessmentResults(supabase, row.assessment_result_id);

  return {
    id: row.id,
    orgId: row.company_id,
    email: row.email,
    fullName: row.full_name,
    jobRole: row.job_role,
    role: row.role,
    status: row.status,
    inviteCode: row.invite_code,
    userId: row.user_id,
    slackUserId: row.slack_user_id,
    slackLinkedAt: row.slack_linked_at,
    assessmentResultId: row.assessment_result_id,
    roleColor,
  };
};

export const fetchSlackProfileSnapshot = async (
  botToken: string,
  slackUserId: string,
): Promise<SlackProfileSnapshot | null> => {
  const payload = await getSlackUserInfo(botToken, slackUserId);
  const user = payload.user;
  if (!user?.id) {
    return null;
  }

  return {
    slackUserId: user.id,
    email: normalizeEmail(user.profile?.email),
    displayName: toText(user.profile?.display_name) || toText(user.name),
    realName: toText(user.real_name) || toText(user.profile?.real_name),
    title: toText(user.profile?.title),
    avatarUrl: toText(user.profile?.image_192),
  };
};

export const getCompanyUserIdentityById = async (
  supabase: SupabaseClient,
  orgId: string,
  companyUserId: string,
) => {
  const { data, error } = await supabase
    .from("company_users")
    .select(
      "id, company_id, email, full_name, job_role, role, status, invite_code, user_id, slack_user_id, slack_linked_at, assessment_result_id",
    )
    .eq("company_id", orgId)
    .eq("id", companyUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return await hydrateCompanyUserIdentity(supabase, data as any);
};

export const resolveCompanyUserIdentityByEmail = async (
  supabase: SupabaseClient,
  orgId: string,
  email: string,
) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await supabase
    .from("company_users")
    .select(
      "id, company_id, email, full_name, job_role, role, status, invite_code, user_id, slack_user_id, slack_linked_at, assessment_result_id",
    )
    .eq("company_id", orgId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return await hydrateCompanyUserIdentity(supabase, data as any);
};

export const resolveCompanyUserIdentityByAuthUser = async (
  supabase: SupabaseClient,
  orgId: string,
  authUserId: string,
) => {
  const { data, error } = await supabase
    .from("company_users")
    .select(
      "id, company_id, email, full_name, job_role, role, status, invite_code, user_id, slack_user_id, slack_linked_at, assessment_result_id",
    )
    .eq("company_id", orgId)
    .eq("user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return await hydrateCompanyUserIdentity(supabase, data as any);
};

export const findFuzzyNameMatch = async (
  supabase: SupabaseClient,
  orgId: string,
  fullName: string | null,
): Promise<FuzzyMatchResult | null> => {
  const candidateName = toText(fullName);
  if (!candidateName) {
    return null;
  }

  const { data, error } = await supabase.rpc("match_company_user_by_name", {
    p_org_id: orgId,
    p_name: candidateName,
  });

  if (error) {
    throw new Error(error.message);
  }

  const match = Array.isArray(data) ? data[0] : null;
  if (!match?.company_user_id) {
    return null;
  }

  return {
    companyUserId: match.company_user_id,
    fullName: toText(match.full_name),
    jobRole: toText(match.job_role),
    roleColor: toText(match.rolecolor)?.toLowerCase() || null,
    matchConfidence: typeof match.match_confidence === "number" ? match.match_confidence : null,
  };
};

export const linkSlackAccountToCompanyUser = async (
  supabase: SupabaseClient,
  orgId: string,
  companyUserId: string,
  slackUserId: string,
) => {
  const linkedAt = nowIso();

  const { error: clearError } = await supabase
    .from("company_users")
    .update({
      slack_user_id: null,
      slack_linked_at: null,
    } as any)
    .eq("company_id", orgId)
    .eq("slack_user_id", slackUserId)
    .neq("id", companyUserId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: updateError } = await supabase
    .from("company_users")
    .update({
      slack_user_id: slackUserId,
      slack_linked_at: linkedAt,
    } as any)
    .eq("company_id", orgId)
    .eq("id", companyUserId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return linkedAt;
};

const ensureInviteCode = async (supabase: SupabaseClient, companyUserId: string, existingInviteCode: string | null) => {
  if (existingInviteCode) {
    return existingInviteCode;
  }

  const { data: inviteCode, error: inviteError } = await supabase.rpc("generate_invite_code");
  if (inviteError || !inviteCode) {
    throw new Error(inviteError?.message || "Could not generate invite code");
  }

  const { error: updateError } = await supabase
    .from("company_users")
    .update({
      invite_code: inviteCode,
    } as any)
    .eq("id", companyUserId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return inviteCode as string;
};

export const ensureCompanyUserFromSlackProfile = async (
  supabase: SupabaseClient,
  company: CompanyContext,
  profile: SlackProfileSnapshot,
) => {
  const normalizedEmail = profile.email || fallbackSlackEmail(company.id, profile.slackUserId);
  const displayName = profile.realName || profile.displayName || normalizedEmail;
  const existing = await resolveCompanyUserIdentityByEmail(supabase, company.id, normalizedEmail);

  if (existing) {
    const nextInviteCode = await ensureInviteCode(supabase, existing.id, existing.inviteCode);

    const updatePayload: Record<string, unknown> = {
      job_role: existing.jobRole || profile.title || null,
      full_name: existing.fullName || displayName,
      invite_code: nextInviteCode,
    };

    if (existing.status === "revoked") {
      updatePayload.status = "invited";
      updatePayload.invited_at = nowIso();
    }

    const { error: updateError } = await supabase
      .from("company_users")
      .update(updatePayload as any)
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await linkSlackAccountToCompanyUser(supabase, company.id, existing.id, profile.slackUserId);
    return await getCompanyUserIdentityById(supabase, company.id, existing.id);
  }

  const { data: inviteCode, error: inviteError } = await supabase.rpc("generate_invite_code");
  if (inviteError || !inviteCode) {
    throw new Error(inviteError?.message || "Could not generate invite code");
  }

  const { data, error } = await supabase
    .from("company_users")
    .insert({
      company_id: company.id,
      email: normalizedEmail,
      full_name: displayName,
      job_role: profile.title || null,
      role: "employee",
      status: "invited",
      invite_code: inviteCode,
      slack_user_id: profile.slackUserId,
      slack_linked_at: nowIso(),
    } as any)
    .select(
      "id, company_id, email, full_name, job_role, role, status, invite_code, user_id, slack_user_id, slack_linked_at, assessment_result_id",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return await hydrateCompanyUserIdentity(supabase, data as any);
};

export const closeOpenSlackConfirmations = async (
  supabase: SupabaseClient,
  orgId: string,
  slackUserId: string,
) => {
  const timestamp = nowIso();
  const { error } = await supabase
    .from("slack_pending_confirmations")
    .update({
      status: "expired",
      responded_at: timestamp,
      updated_at: timestamp,
    } as any)
    .eq("org_id", orgId)
    .eq("slack_user_id", slackUserId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
};

export const insertSlackPendingConfirmation = async (params: {
  supabase: SupabaseClient;
  orgId: string;
  profile: SlackProfileSnapshot;
  matchType: "exact_email" | "fuzzy_name" | "none" | null;
  matchConfidence?: number | null;
  matchedUser?: CompanyUserIdentity | null;
  status?: ConfirmationStatus;
  initiatedBy?: "system" | "admin";
  dmSentAt?: string | null;
}) => {
  await closeOpenSlackConfirmations(params.supabase, params.orgId, params.profile.slackUserId);

  const payload = {
    org_id: params.orgId,
    slack_user_id: params.profile.slackUserId,
    slack_email: params.profile.email,
    slack_display_name: params.profile.displayName,
    slack_real_name: params.profile.realName,
    slack_title: params.profile.title,
    slack_avatar_url: params.profile.avatarUrl,
    matched_rcf_user_id: params.matchedUser?.id || null,
    matched_rcf_name: params.matchedUser?.fullName || null,
    matched_rcf_role: params.matchedUser?.jobRole || params.matchedUser?.role || null,
    matched_rcf_color: params.matchedUser?.roleColor || null,
    match_type: params.matchType,
    match_confidence: params.matchConfidence ?? null,
    status: params.status || "pending",
    initiated_by: params.initiatedBy || "system",
    dm_sent_at: params.dmSentAt || null,
    expires_at: addHoursIso(CONFIRMATION_WINDOW_HOURS),
  };

  const { data, error } = await params.supabase
    .from("slack_pending_confirmations")
    .insert(payload as any)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SlackPendingConfirmationRecord;
};

export const getSlackPendingConfirmationByToken = async (
  supabase: SupabaseClient,
  token: string,
) => {
  const { data, error } = await supabase
    .from("slack_pending_confirmations")
    .select("*")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlackPendingConfirmationRecord | null) ?? null;
};

export const getSlackPendingConfirmationById = async (
  supabase: SupabaseClient,
  confirmationId: string,
) => {
  const { data, error } = await supabase
    .from("slack_pending_confirmations")
    .select("*")
    .eq("id", confirmationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlackPendingConfirmationRecord | null) ?? null;
};

export const updateSlackPendingConfirmation = async (
  supabase: SupabaseClient,
  confirmationId: string,
  patch: Partial<SlackPendingConfirmationRecord>,
) => {
  const { data, error } = await supabase
    .from("slack_pending_confirmations")
    .update({
      ...patch,
      updated_at: nowIso(),
    } as any)
    .eq("id", confirmationId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SlackPendingConfirmationRecord;
};

export const expireSlackPendingConfirmationIfNeeded = async (
  supabase: SupabaseClient,
  connection: SlackConnectionRecord,
  confirmation: SlackPendingConfirmationRecord,
) => {
  if (confirmation.status !== "pending") {
    return confirmation;
  }

  const expiresAt = new Date(confirmation.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt > Date.now()) {
    return confirmation;
  }

  const updated = await updateSlackPendingConfirmation(supabase, confirmation.id, {
    status: "expired",
    responded_at: nowIso(),
  });

  if (connection.auto_add_users && !confirmation.matched_rcf_user_id) {
    const company = await getCompanyByOrgId(supabase, confirmation.org_id);
    const companyUser = await ensureCompanyUserFromSlackProfile(supabase, company, {
      slackUserId: confirmation.slack_user_id,
      email: confirmation.slack_email,
      displayName: confirmation.slack_display_name,
      realName: confirmation.slack_real_name,
      title: confirmation.slack_title,
      avatarUrl: confirmation.slack_avatar_url,
    });
    await sendAssessmentInviteDm(
      connection,
      company,
      companyUser,
      "Your RoleColorFinder onboarding continued automatically after the confirmation window expired.",
    );
  }

  return updated;
};

export const listSlackPendingConfirmations = async (
  supabase: SupabaseClient,
  orgId: string,
) => {
  const { data, error } = await supabase
    .from("slack_pending_confirmations")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlackPendingConfirmationRecord[]) || [];
};

export const listSlackChannels = async (botToken: string): Promise<SlackChannelOption[]> => {
  const payload = await slackApiFetch<{ channels?: { id?: string; name?: string; is_archived?: boolean }[] }>({
    token: botToken,
    path: "/conversations.list",
    method: "GET",
    query: {
      exclude_archived: true,
      limit: 200,
      types: "public_channel",
    },
  });

  return (payload.channels || [])
    .filter((channel) => channel.id && channel.name && !channel.is_archived)
    .map((channel) => ({
      id: channel.id as string,
      name: channel.name as string,
    }));
};

export const sendSlackDm = async (botToken: string, slackUserId: string, params: { text: string; blocks?: unknown[] }) => {
  const channelId = await openDirectMessageChannel(botToken, slackUserId);
  if (!channelId) {
    throw new Error("Could not open a Slack DM channel");
  }

  await postSlackMessage(botToken, {
    channel: channelId,
    text: params.text,
    blocks: params.blocks,
  });
};

const sendSlackToAdminDestination = async (
  connection: SlackConnectionRecord,
  params: { text: string; blocks?: unknown[] },
) => {
  if (connection.admin_notify_channel) {
    await postSlackMessage(connection.bot_token, {
      channel: connection.admin_notify_channel,
      text: params.text,
      blocks: params.blocks,
    });
    return;
  }

  if (connection.authed_user_id) {
    await sendSlackDm(connection.bot_token, connection.authed_user_id, params);
  }
};

const buildIdentityConfirmationBlocks = (params: {
  company: CompanyContext;
  confirmation: SlackPendingConfirmationRecord;
}) => {
  const summary = roleColorSummary(params.confirmation.matched_rcf_color);
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `👋 Hey ${params.confirmation.slack_real_name || params.confirmation.slack_display_name || "there"}! ` +
          `Welcome to ${params.company.name}.\n\nYour team uses RoleColorFinder to improve how people work together.\n\nWe found an RCF profile that might be yours:`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `Name:\n${params.confirmation.matched_rcf_name || "Unknown"}` },
        { type: "mrkdwn", text: `Role:\n${params.confirmation.matched_rcf_role || "Team member"}` },
        {
          type: "mrkdwn",
          text: `RoleColor:\n${summary.emoji} ${summary.colorLabel} (${summary.roleLabel})`,
        },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: "Is this you?" },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "✅ Yes, that's me" },
          style: "primary",
          action_id: "confirm_identity",
          value: params.confirmation.confirmation_token,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "❌ No, that's not me" },
          style: "danger",
          action_id: "reject_identity",
          value: params.confirmation.confirmation_token,
        },
      ],
    },
  ];
};

const buildNoMatchBlocks = (params: {
  company: CompanyContext;
  confirmation: SlackPendingConfirmationRecord;
}) => [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `👋 Hey ${params.confirmation.slack_real_name || params.confirmation.slack_display_name || "there"}! ` +
        `Welcome to ${params.company.name}.\n\nYour team uses RoleColorFinder — we couldn't find an RCF account linked to ${params.confirmation.slack_email || "your Slack profile"}.`,
    },
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "🎨 Take My Assessment" },
        style: "primary",
        action_id: "take_assessment",
        value: params.confirmation.confirmation_token,
      },
      {
        type: "button",
        text: { type: "plain_text", text: "🔗 I already have an account" },
        action_id: "link_existing",
        value: params.confirmation.confirmation_token,
      },
    ],
  },
];

const buildAdminNotificationBlocks = (params: {
  confirmation: SlackPendingConfirmationRecord;
}) => [
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "🔔 New Slack member not in RoleColorFinder\n\n" +
        `*${params.confirmation.slack_real_name || params.confirmation.slack_display_name || "Unknown member"}* ` +
        `(${params.confirmation.slack_email || "No email"}) just joined your workspace but doesn't have an RCF account.`,
    },
  },
  {
    type: "section",
    fields: [
      { type: "mrkdwn", text: `Slack Email:\n${params.confirmation.slack_email || "Unavailable"}` },
      { type: "mrkdwn", text: `Job Title:\n${params.confirmation.slack_title || "Not provided"}` },
    ],
  },
  {
    type: "section",
    text: { type: "mrkdwn", text: "Would you like to add them to RoleColorFinder?" },
  },
  {
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "✅ Add to RCF" },
        style: "primary",
        action_id: "admin_approve_add_user",
        value: params.confirmation.confirmation_token,
      },
      {
        type: "button",
        text: { type: "plain_text", text: "❌ Skip" },
        style: "danger",
        action_id: "admin_reject_add_user",
        value: params.confirmation.confirmation_token,
      },
    ],
  },
];

const buildAssessmentInviteBlocks = (params: {
  company: CompanyContext;
  companyUser: CompanyUserIdentity;
}) => {
  const firstName = firstNameFrom(params.companyUser.fullName, "there");
  const assessmentUrl = employeeAssessmentUrl(params.company, params.companyUser.email, params.companyUser.inviteCode || "");

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `👋 Hey ${firstName}! Welcome to ${params.company.name}.\n\n` +
          "Your team uses RoleColorFinder to improve how people work together. Start your assessment below.",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `Email:\n${params.companyUser.email}` },
        { type: "mrkdwn", text: `Invite Code:\n${params.companyUser.inviteCode || "Generated in portal"}` },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "🎨 Take My Assessment" },
          style: "primary",
          url: assessmentUrl,
        },
      ],
    },
  ];
};

const buildLinkedWelcomeBlocks = (params: {
  company: CompanyContext;
  companyUser: CompanyUserIdentity;
}) => {
  const summary = roleColorSummary(params.companyUser.roleColor);
  const firstName = firstNameFrom(params.companyUser.fullName, "there");
  const profileUrl = buildCompanyAdminPortalUrl(params.company, { tab: "users" });

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `👋 Hey ${firstName}! Your Slack account has been linked to your RoleColorFinder profile.\n` +
          `🎨 RoleColor: *${summary.colorLabel}* (${summary.roleLabel})\n` +
          `<${profileUrl}|View your profile>`,
      },
    },
  ];
};

export const sendIdentityConfirmationDm = async (
  connection: SlackConnectionRecord,
  company: CompanyContext,
  confirmation: SlackPendingConfirmationRecord,
) => {
  await sendSlackDm(connection.bot_token, confirmation.slack_user_id, {
    text: `We found an RCF profile that might belong to ${confirmation.slack_real_name || confirmation.slack_display_name || "you"}.`,
    blocks: buildIdentityConfirmationBlocks({ company, confirmation }),
  });
};

export const sendNoMatchDm = async (
  connection: SlackConnectionRecord,
  company: CompanyContext,
  confirmation: SlackPendingConfirmationRecord,
) => {
  await sendSlackDm(connection.bot_token, confirmation.slack_user_id, {
    text: `We couldn't find an RCF account linked to ${confirmation.slack_email || "your Slack profile"}.`,
    blocks: buildNoMatchBlocks({ company, confirmation }),
  });
};

export const sendAdminNotificationForConfirmation = async (
  connection: SlackConnectionRecord,
  confirmation: SlackPendingConfirmationRecord,
) => {
  await sendSlackToAdminDestination(connection, {
    text: `${confirmation.slack_real_name || confirmation.slack_display_name || "A Slack member"} needs an RCF onboarding decision.`,
    blocks: buildAdminNotificationBlocks({ confirmation }),
  });
};

export const sendAssessmentInviteDm = async (
  connection: SlackConnectionRecord,
  company: CompanyContext,
  companyUser: CompanyUserIdentity,
  customText?: string,
) => {
  if (!companyUser.slackUserId) {
    throw new Error("Slack user id missing for assessment invite DM");
  }

  await sendSlackDm(connection.bot_token, companyUser.slackUserId, {
    text: customText || `Welcome to ${company.name}! Start your RoleColorFinder assessment.`,
    blocks: buildAssessmentInviteBlocks({ company, companyUser }),
  });
};

export const sendLinkedWelcomeDm = async (
  connection: SlackConnectionRecord,
  company: CompanyContext,
  companyUser: CompanyUserIdentity,
) => {
  if (!companyUser.slackUserId) {
    throw new Error("Slack user id missing for linked welcome DM");
  }

  const summary = roleColorSummary(companyUser.roleColor);

  await sendSlackDm(connection.bot_token, companyUser.slackUserId, {
    text:
      `Your Slack account is linked to RoleColorFinder. ` +
      `RoleColor: ${summary.colorLabel} (${summary.roleLabel}).`,
    blocks: buildLinkedWelcomeBlocks({ company, companyUser }),
  });
};

export const sendSlackAdminFollowUp = async (
  connection: SlackConnectionRecord,
  adminSlackUserId: string,
  text: string,
) => {
  await sendSlackDm(connection.bot_token, adminSlackUserId, { text });
};

export const unlinkSlackAccountFromCompanyUser = async (
  supabase: SupabaseClient,
  orgId: string,
  slackUserId: string,
) => {
  const { error } = await supabase
    .from("company_users")
    .update({
      slack_user_id: null,
      slack_linked_at: null,
    } as any)
    .eq("company_id", orgId)
    .eq("slack_user_id", slackUserId);

  if (error) {
    throw new Error(error.message);
  }
};

export const manuallyMapSlackUserToCompanyUser = async (
  supabase: SupabaseClient,
  connection: SlackConnectionRecord,
  companyUserId: string,
  slackUserId: string,
) => {
  const company = await getCompanyByOrgId(supabase, connection.org_id);
  const companyUser = await getCompanyUserIdentityById(supabase, connection.org_id, companyUserId);

  if (!companyUser) {
    throw new Error("RCF user not found for manual Slack mapping");
  }

  await linkSlackAccountToCompanyUser(supabase, connection.org_id, companyUser.id, slackUserId);
  const linkedUser = await getCompanyUserIdentityById(supabase, connection.org_id, companyUser.id);

  if (!linkedUser) {
    throw new Error("Slack mapping succeeded but the RCF user could not be reloaded");
  }

  const { data: pendingConfirmations, error: pendingError } = await supabase
    .from("slack_pending_confirmations")
    .select("*")
    .eq("org_id", connection.org_id)
    .eq("slack_user_id", slackUserId)
    .eq("status", "pending");

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  for (const confirmation of (pendingConfirmations as SlackPendingConfirmationRecord[]) || []) {
    await updateSlackPendingConfirmation(supabase, confirmation.id, {
      status: "admin_approved",
      responded_at: nowIso(),
      initiated_by: "admin",
      matched_rcf_user_id: linkedUser.id,
      matched_rcf_name: linkedUser.fullName,
      matched_rcf_role: linkedUser.jobRole || linkedUser.role,
      matched_rcf_color: linkedUser.roleColor,
    });
  }

  await sendLinkedWelcomeDm(connection, company, linkedUser);
  return linkedUser;
};

export const updateSlackConnectionSettings = async (
  supabase: SupabaseClient,
  orgId: string,
  settings: {
    auto_add_users: boolean;
    email_mismatch_action: EmailMismatchAction;
    name_matching_enabled: boolean;
    admin_notify_on_new_user: boolean;
    admin_notify_channel: string | null;
  },
) => {
  const { error } = await supabase
    .from("slack_connections")
    .update({
      auto_add_users: settings.auto_add_users,
      email_mismatch_action: settings.email_mismatch_action,
      name_matching_enabled: settings.name_matching_enabled,
      admin_notify_on_new_user: settings.admin_notify_on_new_user,
      admin_notify_channel: settings.admin_notify_channel,
      updated_at: nowIso(),
    } as any)
    .eq("org_id", orgId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }
};

export const expireSlackPendingConfirmations = async (
  supabase: SupabaseClient,
  connection: SlackConnectionRecord,
) => {
  const { data, error } = await supabase
    .from("slack_pending_confirmations")
    .select("*")
    .eq("org_id", connection.org_id)
    .eq("status", "pending")
    .lt("expires_at", nowIso());

  if (error) {
    throw new Error(error.message);
  }

  const expired = (data as SlackPendingConfirmationRecord[]) || [];
  if (!expired.length) {
    return [];
  }

  const company = await getCompanyByOrgId(supabase, connection.org_id);

  for (const confirmation of expired) {
    await updateSlackPendingConfirmation(supabase, confirmation.id, {
      status: "expired",
      responded_at: nowIso(),
    });

    if (connection.auto_add_users && !confirmation.matched_rcf_user_id) {
      const companyUser = await ensureCompanyUserFromSlackProfile(supabase, company, {
        slackUserId: confirmation.slack_user_id,
        email: confirmation.slack_email,
        displayName: confirmation.slack_display_name,
        realName: confirmation.slack_real_name,
        title: confirmation.slack_title,
        avatarUrl: confirmation.slack_avatar_url,
      });

      if (companyUser) {
        await sendAssessmentInviteDm(
          connection,
          company,
          {
            ...companyUser,
            slackUserId: confirmation.slack_user_id,
          },
          `Your RoleColorFinder onboarding was queued automatically after your confirmation expired.`,
        );
      }
    }
  }

  return expired;
};

export const buildPendingConfirmationViewModel = (confirmation: SlackPendingConfirmationRecord) => {
  const summary = roleColorSummary(confirmation.matched_rcf_color);
  return {
    ...confirmation,
    matchBadgeLabel:
      confirmation.match_type === "exact_email"
        ? "Email match"
        : confirmation.match_type === "fuzzy_name"
          ? "Name match"
          : "No match",
    matchedRoleColorLabel:
      confirmation.matched_rcf_color && summary.roleLabel
        ? `${summary.emoji} ${summary.colorLabel} (${summary.roleLabel})`
        : null,
  };
};

export const applyEmailMismatchRoute = async (params: {
  supabase: SupabaseClient;
  company: CompanyContext;
  connection: SlackConnectionRecord;
  profile: SlackProfileSnapshot;
  fuzzyMatch: CompanyUserIdentity | null;
  matchConfidence?: number | null;
  mismatchAction: EmailMismatchAction;
}) => {
  if (params.mismatchAction === "auto_create") {
    const companyUser = await ensureCompanyUserFromSlackProfile(params.supabase, params.company, params.profile);
    await insertSlackPendingConfirmation({
      supabase: params.supabase,
      orgId: params.company.id,
      profile: params.profile,
      matchType: params.fuzzyMatch ? "fuzzy_name" : "none",
      matchConfidence: params.matchConfidence ?? null,
      matchedUser: params.fuzzyMatch,
      status: "auto_created",
      initiatedBy: "system",
    });
    await sendAssessmentInviteDm(params.connection, params.company, companyUser);
    return { route: "auto_create", companyUser };
  }

  if (params.mismatchAction === "ignore") {
    await insertSlackPendingConfirmation({
      supabase: params.supabase,
      orgId: params.company.id,
      profile: params.profile,
      matchType: params.fuzzyMatch ? "fuzzy_name" : "none",
      matchConfidence: params.matchConfidence ?? null,
      matchedUser: params.fuzzyMatch,
      status: "ignored",
      initiatedBy: "system",
    });
    return { route: "ignore" };
  }

  const confirmation = await insertSlackPendingConfirmation({
    supabase: params.supabase,
    orgId: params.company.id,
    profile: params.profile,
    matchType: params.fuzzyMatch ? "fuzzy_name" : "none",
    matchConfidence: params.matchConfidence ?? null,
    matchedUser: params.fuzzyMatch,
    status: "pending",
    initiatedBy: "system",
  });

  if (params.fuzzyMatch) {
    await sendIdentityConfirmationDm(params.connection, params.company, confirmation);
    await updateSlackPendingConfirmation(params.supabase, confirmation.id, { dm_sent_at: nowIso() });
    return { route: "confirm_identity", confirmation };
  }

  if (params.connection.auto_add_users) {
    const companyUser = await ensureCompanyUserFromSlackProfile(params.supabase, params.company, params.profile);
    await updateSlackPendingConfirmation(params.supabase, confirmation.id, {
      status: "auto_created",
      responded_at: nowIso(),
    });
    await sendAssessmentInviteDm(params.connection, params.company, companyUser);
    return { route: "confirm_auto_create", confirmation, companyUser };
  }

  if (params.connection.admin_notify_on_new_user) {
    await sendAdminNotificationForConfirmation(params.connection, confirmation);
    return { route: "confirm_admin_notify", confirmation };
  }

  await sendNoMatchDm(params.connection, params.company, confirmation);
  await updateSlackPendingConfirmation(params.supabase, confirmation.id, { dm_sent_at: nowIso() });
  return { route: "confirm_no_match_dm", confirmation };
};

export const resolveMatchedUserFromConfirmation = async (
  supabase: SupabaseClient,
  confirmation: SlackPendingConfirmationRecord,
) => {
  if (!confirmation.matched_rcf_user_id) {
    return null;
  }

  return await getCompanyUserIdentityById(supabase, confirmation.org_id, confirmation.matched_rcf_user_id);
};

export const resendSlackPendingConfirmationDm = async (
  supabase: SupabaseClient,
  connection: SlackConnectionRecord,
  confirmation: SlackPendingConfirmationRecord,
) => {
  const company = await getCompanyByOrgId(supabase, confirmation.org_id);

  if (confirmation.match_type === "fuzzy_name" && confirmation.matched_rcf_user_id) {
    await sendIdentityConfirmationDm(connection, company, confirmation);
  } else {
    await sendNoMatchDm(connection, company, confirmation);
  }

  return await updateSlackPendingConfirmation(supabase, confirmation.id, {
    dm_sent_at: nowIso(),
    expires_at: addHoursIso(CONFIRMATION_WINDOW_HOURS),
  });
};

export const approveSlackPendingConfirmationByAdmin = async (
  supabase: SupabaseClient,
  connection: SlackConnectionRecord,
  confirmation: SlackPendingConfirmationRecord,
  forceCreate = false,
) => {
  const company = await getCompanyByOrgId(supabase, confirmation.org_id);
  let companyUser: CompanyUserIdentity | null = null;

  if (!forceCreate && confirmation.matched_rcf_user_id) {
    companyUser = await getCompanyUserIdentityById(supabase, confirmation.org_id, confirmation.matched_rcf_user_id);
    if (companyUser) {
      await linkSlackAccountToCompanyUser(supabase, confirmation.org_id, companyUser.id, confirmation.slack_user_id);
      companyUser = await getCompanyUserIdentityById(supabase, confirmation.org_id, companyUser.id);
    }
  }

  if (!companyUser) {
    companyUser = await ensureCompanyUserFromSlackProfile(supabase, company, {
      slackUserId: confirmation.slack_user_id,
      email: confirmation.slack_email,
      displayName: confirmation.slack_display_name,
      realName: confirmation.slack_real_name,
      title: confirmation.slack_title,
      avatarUrl: confirmation.slack_avatar_url,
    });
  }

  const nextStatus: ConfirmationStatus = forceCreate || !confirmation.matched_rcf_user_id ? "admin_approved" : "admin_approved";
  const updatedConfirmation = await updateSlackPendingConfirmation(supabase, confirmation.id, {
    status: nextStatus,
    responded_at: nowIso(),
    initiated_by: "admin",
    matched_rcf_user_id: companyUser.id,
    matched_rcf_name: companyUser.fullName,
    matched_rcf_role: companyUser.jobRole || companyUser.role,
    matched_rcf_color: companyUser.roleColor,
  });

  if (forceCreate || !confirmation.matched_rcf_user_id) {
    await sendAssessmentInviteDm(connection, company, companyUser);
  } else {
    await sendLinkedWelcomeDm(connection, company, companyUser);
  }

  return { companyUser, confirmation: updatedConfirmation, company };
};

export const rejectSlackPendingConfirmationByAdmin = async (
  supabase: SupabaseClient,
  connection: SlackConnectionRecord,
  confirmation: SlackPendingConfirmationRecord,
) => {
  const company = await getCompanyByOrgId(supabase, confirmation.org_id);
  let companyUser: CompanyUserIdentity | null = null;

  const updatedConfirmation = await updateSlackPendingConfirmation(supabase, confirmation.id, {
    status: "admin_rejected",
    responded_at: nowIso(),
    initiated_by: "admin",
  });

  if (connection.auto_add_users) {
    companyUser = await ensureCompanyUserFromSlackProfile(supabase, company, {
      slackUserId: confirmation.slack_user_id,
      email: confirmation.slack_email,
      displayName: confirmation.slack_display_name,
      realName: confirmation.slack_real_name,
      title: confirmation.slack_title,
      avatarUrl: confirmation.slack_avatar_url,
    });
    await sendAssessmentInviteDm(connection, company, companyUser);
  } else {
    await sendNoMatchDm(connection, company, updatedConfirmation);
  }

  return { company, companyUser, confirmation: updatedConfirmation };
};

export const buildSlackLinkPageState = async (
  supabase: SupabaseClient,
  token: string,
  authUserId: string,
) => {
  const confirmation = await getSlackPendingConfirmationByToken(supabase, token);
  if (!confirmation) {
    return { confirmation: null, company: null, companyUser: null };
  }

  const company = await getCompanyByOrgId(supabase, confirmation.org_id);
  const companyUser = await resolveCompanyUserIdentityByAuthUser(supabase, confirmation.org_id, authUserId);

  return { confirmation, company, companyUser };
};

export const confirmSlackLinkForAuthenticatedUser = async (
  supabase: SupabaseClient,
  token: string,
  authUserId: string,
) => {
  const state = await buildSlackLinkPageState(supabase, token, authUserId);
  if (!state.confirmation || !state.company || !state.companyUser) {
    return state;
  }

  await linkSlackAccountToCompanyUser(
    supabase,
    state.confirmation.org_id,
    state.companyUser.id,
    state.confirmation.slack_user_id,
  );

  const linkedUser = await getCompanyUserIdentityById(supabase, state.confirmation.org_id, state.companyUser.id);

  const confirmation = await updateSlackPendingConfirmation(supabase, state.confirmation.id, {
    status: "confirmed",
    responded_at: nowIso(),
    matched_rcf_user_id: state.companyUser.id,
    matched_rcf_name: linkedUser?.fullName || state.companyUser.fullName,
    matched_rcf_role: linkedUser?.jobRole || linkedUser?.role || state.companyUser.role,
    matched_rcf_color: linkedUser?.roleColor || state.companyUser.roleColor,
  });

  return {
    confirmation,
    company: state.company,
    companyUser: linkedUser,
  };
};

export const rejectSlackLinkForAuthenticatedUser = async (
  supabase: SupabaseClient,
  token: string,
) => {
  const confirmation = await getSlackPendingConfirmationByToken(supabase, token);
  if (!confirmation) {
    return null;
  }

  return await updateSlackPendingConfirmation(supabase, confirmation.id, {
    status: "rejected",
    responded_at: nowIso(),
  });
};
