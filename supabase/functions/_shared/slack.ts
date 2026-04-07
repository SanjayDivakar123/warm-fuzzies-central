// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

type ProcessEnv = Record<string, string | undefined>;

const process = {
  env:
    ((globalThis as typeof globalThis & { process?: { env?: ProcessEnv } }).process?.env as ProcessEnv | undefined) ??
    Deno.env.toObject(),
};

const REQUIRED_COMPANY_ROLES = new Set(["admin", "hr"]);
const FIVE_MINUTES_IN_SECONDS = 60 * 5;
const SLACK_API_BASE = "https://slack.com/api";
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || "https://rolecolorfinder.com";
const SLACK_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-slack-request-timestamp, x-slack-signature",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export interface CompanyContext {
  id: string;
  name: string;
  subdomain: string | null;
}

export interface AuthContext {
  user: {
    id: string;
    email: string | null;
  };
  company: CompanyContext;
  membership: {
    id: string;
    role: string;
    status: string | null;
  };
  supabase: ReturnType<typeof createClient>;
}

export interface SlackConnectionRecord {
  id: string;
  org_id: string;
  team_id: string;
  team_name: string;
  bot_token: string;
  authed_user_id: string | null;
  incoming_webhook_url: string | null;
  incoming_webhook_channel: string | null;
  auto_add_users: boolean;
  email_mismatch_action: "confirm" | "ignore" | "auto_create";
  name_matching_enabled: boolean;
  admin_notify_on_new_user: boolean;
  admin_notify_channel: string | null;
  connected_at: string;
  is_active: boolean;
}

export interface SlackWorkspaceUserRecord {
  slack_user_id: string;
  email: string | null;
  display_name: string | null;
  real_name: string | null;
  title: string | null;
  avatar_url: string | null;
}

export interface SlackResolvedLookup {
  slackUserId: string | null;
  email: string | null;
  displayName: string | null;
  realName: string | null;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...headers,
    },
  });

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const createServiceSupabaseClient = () =>
  createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

const createAuthSupabaseClient = (accessToken: string) =>
  createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_ANON_KEY"), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

const toText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const normalizeEmail = (value: unknown) => {
  const text = toText(value);
  return text ? text.toLowerCase() : null;
};

const normalizeSlackLookupValue = (value: string | null | undefined) =>
  (value || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9]+/g, "");

const emailLocalPart = (email: string | null | undefined) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return normalized.split("@")[0] || null;
};

const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
};

const hexEncode = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const signSlackPayload = async (value: string) => {
  const signingSecret = getRequiredEnv("SLACK_SIGNING_SECRET");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return `v0=${hexEncode(digest)}`;
};

export const verifySlackSignature = async (headers: Headers, rawBody: string) => {
  const timestampHeader = headers.get("X-Slack-Request-Timestamp") || headers.get("x-slack-request-timestamp");
  const signatureHeader = headers.get("X-Slack-Signature") || headers.get("x-slack-signature");

  if (!timestampHeader || !signatureHeader) {
    return false;
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > FIVE_MINUTES_IN_SECONDS) {
    return false;
  }

  const basestring = `v0:${timestampHeader}:${rawBody}`;
  const expectedSignature = await signSlackPayload(basestring);
  return constantTimeEqual(expectedSignature, signatureHeader);
};

export const requireCompanyAccess = async (
  req: Request,
  orgId: string,
  accessTokenOverride?: string | null,
) => {
  const authHeader = req.headers.get("Authorization");
  const accessToken = accessTokenOverride || authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    throw new HttpError(401, "Missing authorization header");
  }

  const authSupabase = createAuthSupabaseClient(accessToken);
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    throw new HttpError(401, "Invalid or expired session");
  }

  const serviceSupabase = createServiceSupabaseClient();
  const { data: membership, error: membershipError } = await serviceSupabase
    .from("company_users")
    .select("id, role, status")
    .eq("company_id", orgId)
    .eq("user_id", user.id)
    .in("role", [...REQUIRED_COMPANY_ROLES])
    .single();

  if (membershipError || !membership || membership.status !== "active") {
    throw new HttpError(403, "You do not have permission to manage Slack integrations for this company");
  }

  const { data: company, error: companyError } = await serviceSupabase
    .from("companies")
    .select("id, name, subdomain")
    .eq("id", orgId)
    .single();

  if (companyError || !company) {
    throw new HttpError(404, "Company not found");
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    company: {
      id: company.id,
      name: company.name,
      subdomain: company.subdomain ?? null,
    },
    membership: {
      id: membership.id,
      role: membership.role,
      status: membership.status ?? null,
    },
    supabase: serviceSupabase,
  } satisfies AuthContext;
};

export const logSlackError = async (params: {
  supabase?: ReturnType<typeof createClient>;
  orgId?: string | null;
  functionName: string;
  errorMessage: string;
  payload?: unknown;
}) => {
  try {
    const supabase = params.supabase ?? createServiceSupabaseClient();
    await supabase.from("slack_errors").insert({
      org_id: params.orgId ?? null,
      function_name: params.functionName,
      error_message: params.errorMessage,
      payload: params.payload ?? {},
    } as any);
  } catch (error) {
    console.error("Failed to log Slack error", error);
  }
};

export const getSlackRedirectUri = () =>
  `${getRequiredEnv("SUPABASE_URL")}/functions/v1/slack-oauth-callback`;

export const buildSlackOAuthUrl = (orgId: string) => {
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", getRequiredEnv("SLACK_CLIENT_ID"));
  url.searchParams.set(
    "scope",
    "app_mentions:read,channels:read,chat:write,chat:write.public,commands,im:history,im:write,users:read,users:read.email,team:read",
  );
  url.searchParams.set("redirect_uri", getSlackRedirectUri());
  url.searchParams.set("state", orgId);
  return url.toString();
};

const parseSlackApiResponse = async <T>(response: Response) => {
  const payload = (await response.json()) as T & { ok?: boolean; error?: string; warning?: string };
  if (!response.ok || payload.ok === false) {
    throw new Error((payload as { error?: string }).error || `Slack API request failed with status ${response.status}`);
  }
  return payload;
};

export const exchangeSlackOAuthCode = async (code: string) => {
  const response = await fetch(`${SLACK_API_BASE}/oauth.v2.access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getRequiredEnv("SLACK_CLIENT_ID"),
      client_secret: getRequiredEnv("SLACK_CLIENT_SECRET"),
      code,
      redirect_uri: getSlackRedirectUri(),
    }),
  });

  return await parseSlackApiResponse<any>(response);
};

export const slackApiFetch = async <T>(params: {
  token: string;
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: Record<string, unknown>;
}) => {
  const url = new URL(`${SLACK_API_BASE}${params.path}`);

  for (const [key, value] of Object.entries(params.query || {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: params.method || "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  return await parseSlackApiResponse<T>(response);
};

export const getActiveSlackConnectionByOrgId = async (supabase: ReturnType<typeof createClient>, orgId: string) => {
  const { data, error } = await supabase
    .from("slack_connections")
    .select(
      "id, org_id, team_id, team_name, bot_token, authed_user_id, incoming_webhook_url, incoming_webhook_channel, auto_add_users, email_mismatch_action, name_matching_enabled, admin_notify_on_new_user, admin_notify_channel, connected_at, is_active",
    )
    .eq("org_id", orgId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlackConnectionRecord | null) ?? null;
};

export const getActiveSlackConnectionByTeamId = async (supabase: ReturnType<typeof createClient>, teamId: string) => {
  const { data, error } = await supabase
    .from("slack_connections")
    .select(
      "id, org_id, team_id, team_name, bot_token, authed_user_id, incoming_webhook_url, incoming_webhook_channel, auto_add_users, email_mismatch_action, name_matching_enabled, admin_notify_on_new_user, admin_notify_channel, connected_at, is_active",
    )
    .eq("team_id", teamId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlackConnectionRecord | null) ?? null;
};

export const getCompanyByOrgId = async (supabase: ReturnType<typeof createClient>, orgId: string) => {
  const { data, error } = await supabase.from("companies").select("id, name, subdomain").eq("id", orgId).single();
  if (error || !data) {
    throw new Error("Company not found");
  }

  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain ?? null,
  } satisfies CompanyContext;
};

export const buildCompanyAdminPortalUrl = (company: CompanyContext, params?: Record<string, string | null | undefined>) => {
  const url = new URL("/b2b/company-portal", APP_BASE_URL);
  url.searchParams.set("company", company.id);

  for (const [key, value] of Object.entries(params || {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
};

export const buildEmployeePortalUrl = (company: CompanyContext, path = "/login", params?: Record<string, string>) => {
  if (company.subdomain) {
    const url = new URL(`/company/${company.subdomain}${path}`, APP_BASE_URL);
    for (const [key, value] of Object.entries(params || {})) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  return buildCompanyAdminPortalUrl(company, params);
};

export const postIncomingWebhook = async (webhookUrl: string, payload: Record<string, unknown>) => {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Slack webhook request failed with status ${response.status}`);
  }
};

export const openDirectMessageChannel = async (botToken: string, userId: string) => {
  const payload = await slackApiFetch<{ channel?: { id?: string } }>({
    token: botToken,
    path: "/conversations.open",
    body: {
      users: userId,
    },
  });

  return payload.channel?.id || null;
};

export const postSlackMessage = async (botToken: string, params: {
  channel: string;
  text: string;
  blocks?: unknown[];
  thread_ts?: string;
}) =>
  await slackApiFetch({
    token: botToken,
    path: "/chat.postMessage",
    body: params,
  });

export const getSlackUserInfo = async (botToken: string, userId: string) =>
  await slackApiFetch<{
    user?: {
      id?: string;
      name?: string;
      real_name?: string;
      profile?: {
        email?: string;
        display_name?: string;
        real_name?: string;
        title?: string;
        image_192?: string;
      };
    };
  }>({
    token: botToken,
    path: "/users.info",
    query: { user: userId },
    method: "GET",
  });

export const lookupSlackUserByEmail = async (botToken: string, email: string) =>
  await slackApiFetch<{
    user?: {
      id?: string;
      name?: string;
      real_name?: string;
      profile?: {
        email?: string;
        display_name?: string;
        real_name?: string;
        title?: string;
        image_192?: string;
      };
    };
  }>({
    token: botToken,
    path: "/users.lookupByEmail",
    query: { email },
    method: "GET",
  });

export const listSlackWorkspaceUsers = async (botToken: string): Promise<SlackWorkspaceUserRecord[]> => {
  const users: SlackWorkspaceUserRecord[] = [];
  let cursor: string | null = null;
  let safetyCounter = 0;

  do {
    const payload = await slackApiFetch<{
      members?: Array<{
        id?: string;
        deleted?: boolean;
        is_bot?: boolean;
        is_app_user?: boolean;
        name?: string;
        real_name?: string;
        profile?: {
          email?: string;
          display_name?: string;
          real_name?: string;
          title?: string;
          image_192?: string;
        };
      }>;
      response_metadata?: {
        next_cursor?: string;
      };
    }>({
      token: botToken,
      path: "/users.list",
      query: {
        limit: 200,
        cursor: cursor || undefined,
      },
      method: "GET",
    });

    for (const member of payload.members || []) {
      if (!member.id || member.deleted || member.is_bot || member.is_app_user) {
        continue;
      }

      users.push({
        slack_user_id: member.id,
        email: member.profile?.email?.trim().toLowerCase() || null,
        display_name: member.profile?.display_name?.trim() || member.name?.trim() || null,
        real_name: member.real_name?.trim() || member.profile?.real_name?.trim() || null,
        title: member.profile?.title?.trim() || null,
        avatar_url: member.profile?.image_192?.trim() || null,
      });
    }

    cursor = payload.response_metadata?.next_cursor?.trim() || null;
    safetyCounter += 1;
  } while (cursor && safetyCounter < 10);

  return users.sort((left, right) => {
    const leftName = left.real_name || left.display_name || left.email || left.slack_user_id;
    const rightName = right.real_name || right.display_name || right.email || right.slack_user_id;
    return leftName.localeCompare(rightName);
  });
};

const resolveWorkspaceUserEmail = async (botToken: string, user: SlackWorkspaceUserRecord) => {
  if (user.email) {
    return user.email.toLowerCase();
  }

  const userInfo = await getSlackUserInfo(botToken, user.slack_user_id);
  return userInfo.user?.profile?.email?.toLowerCase() || null;
};

const findSlackWorkspaceUserByText = (users: SlackWorkspaceUserRecord[], lookupText: string) => {
  const normalizedLookup = normalizeSlackLookupValue(lookupText);
  if (!normalizedLookup) {
    return null;
  }

  const exactMatches = users.filter((user) =>
    [
      user.display_name,
      user.real_name,
      emailLocalPart(user.email),
      user.email,
    ].some((candidate) => normalizeSlackLookupValue(candidate) === normalizedLookup)
  );

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1) {
    const emailMatches = exactMatches.filter((user) => normalizeSlackLookupValue(emailLocalPart(user.email)) === normalizedLookup);
    if (emailMatches.length === 1) {
      return emailMatches[0];
    }
    return null;
  }

  const prefixMatches = users.filter((user) =>
    [
      user.display_name,
      user.real_name,
      emailLocalPart(user.email),
    ].some((candidate) => {
      const normalizedCandidate = normalizeSlackLookupValue(candidate);
      return normalizedCandidate.length > normalizedLookup.length && normalizedCandidate.startsWith(normalizedLookup);
    })
  );

  return prefixMatches.length === 1 ? prefixMatches[0] : null;
};

export const resolveSlackLookupTargetFromText = async (params: {
  botToken: string;
  text: string;
  requestUserId?: string | null;
  requestUserName?: string | null;
}): Promise<SlackResolvedLookup | null> => {
  const trimmed = params.text.trim();

  if (!trimmed && params.requestUserId) {
    const selfInfo = await getSlackUserInfo(params.botToken, params.requestUserId);
    return {
      slackUserId: params.requestUserId,
      email: selfInfo.user?.profile?.email?.toLowerCase() || null,
      displayName: selfInfo.user?.profile?.display_name?.trim() || selfInfo.user?.name?.trim() || null,
      realName: selfInfo.user?.real_name?.trim() || selfInfo.user?.profile?.real_name?.trim() || null,
    };
  }

  const directEmail = normalizeEmail(trimmed);
  if (directEmail && SLACK_EMAIL_PATTERN.test(directEmail)) {
    return {
      slackUserId: null,
      email: directEmail,
      displayName: null,
      realName: null,
    };
  }

  const mentionMatch = trimmed.match(/<@([A-Z0-9]+)(?:\|[^>]+)?>/i);
  if (mentionMatch) {
    const mentionedUser = await getSlackUserInfo(params.botToken, mentionMatch[1]);
    return {
      slackUserId: mentionMatch[1],
      email: mentionedUser.user?.profile?.email?.toLowerCase() || null,
      displayName: mentionedUser.user?.profile?.display_name?.trim() || mentionedUser.user?.name?.trim() || null,
      realName: mentionedUser.user?.real_name?.trim() || mentionedUser.user?.profile?.real_name?.trim() || null,
    };
  }

  const normalizedLookup = normalizeSlackLookupValue(trimmed);
  if (!normalizedLookup) {
    return null;
  }

  if (params.requestUserId && params.requestUserName) {
    const normalizedRequester = normalizeSlackLookupValue(params.requestUserName);
    if (normalizedRequester && normalizedRequester === normalizedLookup) {
      const selfInfo = await getSlackUserInfo(params.botToken, params.requestUserId);
      return {
        slackUserId: params.requestUserId,
        email: selfInfo.user?.profile?.email?.toLowerCase() || null,
        displayName: selfInfo.user?.profile?.display_name?.trim() || selfInfo.user?.name?.trim() || null,
        realName: selfInfo.user?.real_name?.trim() || selfInfo.user?.profile?.real_name?.trim() || null,
      };
    }
  }

  const workspaceUser = findSlackWorkspaceUserByText(await listSlackWorkspaceUsers(params.botToken), trimmed);
  if (!workspaceUser) {
    return null;
  }

  return {
    slackUserId: workspaceUser.slack_user_id,
    email: await resolveWorkspaceUserEmail(params.botToken, workspaceUser),
    displayName: workspaceUser.display_name,
    realName: workspaceUser.real_name,
  };
};

export const resolveSlackUserEmailFromText = async (params: {
  botToken: string;
  text: string;
  requestUserId?: string | null;
  requestUserName?: string | null;
}) => {
  const lookup = await resolveSlackLookupTargetFromText(params);
  return lookup?.email || null;
};

export const parseSlackFormBody = (rawBody: string) => new URLSearchParams(rawBody);

export const respondToSlack = (payload: unknown) => json(payload, 200);

export const respondToSlackText = (text: string) =>
  json({
    response_type: "ephemeral",
    text,
  });

export const reconnectMessage = (portalUrl: string) =>
  `RoleColorFinder needs to be reconnected. Ask your admin to visit ${portalUrl}`;

const ROLE_LABELS: Record<string, string> = {
  red: "Motivator",
  yellow: "Executor",
  green: "Architect",
  blue: "Visionary",
};

const ROLE_TIPS: Record<string, string[]> = {
  red: [
    "Lead with the big picture and give them room to influence.",
    "Keep communication direct and energetic.",
    "Invite them into brainstorming early.",
  ],
  yellow: [
    "Be clear on deadlines, owners, and next steps.",
    "Show how progress will be measured.",
    "Keep commitments and handoffs crisp.",
  ],
  green: [
    "Bring structure, rationale, and time to think.",
    "Share context before asking for a recommendation.",
    "Let them pressure-test the plan before moving fast.",
  ],
  blue: [
    "Connect the work to people, meaning, and long-term vision.",
    "Give space for reflection before major changes.",
    "Use collaborative language and check how the team is affected.",
  ],
};

export const resolveRoleColorFromResults = (results: Record<string, unknown> | null | undefined) => {
  const candidate =
    toText(results?.dominantColor) ||
    toText(results?.primaryColor) ||
    toText(results?.role_color) ||
    toText(results?.color);

  return candidate ? candidate.toLowerCase() : null;
};

export const roleColorToProfile = (color: string | null) => {
  if (!color) return null;
  const normalized = color.toLowerCase();
  const role = ROLE_LABELS[normalized];

  if (!role) return null;

  return {
    color: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    role,
    tips: ROLE_TIPS[normalized] || [],
  };
};

export const resolveCompanyUserByEmail = async (
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  email: string,
) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, full_name, assessment_result_id")
    .eq("company_id", orgId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  let results: Record<string, unknown> | null = null;
  if (data.assessment_result_id) {
    const { data: assessmentResult, error: assessmentError } = await supabase
      .from("assessment_results")
      .select("results")
      .eq("id", data.assessment_result_id)
      .maybeSingle();

    if (assessmentError) {
      throw new Error(assessmentError.message);
    }

    results = (assessmentResult?.results as Record<string, unknown> | null) ?? null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name || data.email,
    assessmentResultId: data.assessment_result_id,
    results,
  };
};

export const resolveCompanyUserBySlackUserId = async (
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  slackUserId: string,
) => {
  const normalizedSlackUserId = toText(slackUserId);
  if (!normalizedSlackUserId) return null;

  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, full_name, assessment_result_id")
    .eq("company_id", orgId)
    .eq("slack_user_id", normalizedSlackUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  let results: Record<string, unknown> | null = null;
  if (data.assessment_result_id) {
    const { data: assessmentResult, error: assessmentError } = await supabase
      .from("assessment_results")
      .select("results")
      .eq("id", data.assessment_result_id)
      .maybeSingle();

    if (assessmentError) {
      throw new Error(assessmentError.message);
    }

    results = (assessmentResult?.results as Record<string, unknown> | null) ?? null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name || data.email,
    assessmentResultId: data.assessment_result_id,
    results,
  };
};

export const listOrgRoleColors = async (supabase: ReturnType<typeof createClient>, orgId: string) => {
  const { data, error } = await supabase
    .from("company_users")
    .select("email, full_name, assessment_result_id")
    .eq("company_id", orgId)
    .not("assessment_result_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const assessmentIds = data
    .map((row) => row.assessment_result_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (assessmentIds.length === 0) {
    return [];
  }

  const { data: assessments, error: assessmentError } = await supabase
    .from("assessment_results")
    .select("id, results")
    .in("id", assessmentIds);

  if (assessmentError) {
    throw new Error(assessmentError.message);
  }

  const resultsById = new Map<string, Record<string, unknown>>();
  for (const assessment of assessments || []) {
    resultsById.set(assessment.id, (assessment.results as Record<string, unknown>) || {});
  }

  return data.map((row) => ({
    email: row.email,
    fullName: row.full_name,
    color: resolveRoleColorFromResults(resultsById.get(row.assessment_result_id as string)),
  }));
};

export const buildTeamBalanceInsight = (counts: Record<string, number>, total: number) => {
  if (!total) {
    return "No completed RoleColor assessments are on file yet.";
  }

  const ranking = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  const [topColor, topCount] = ranking[0];
  const weakest = ranking[ranking.length - 1];
  const topPercent = Math.round((topCount / total) * 100);
  const weakestLabel = weakest ? roleColorToProfile(weakest[0])?.role || weakest[0] : "complementary";
  const topLabel = roleColorToProfile(topColor)?.role || topColor;

  return `Your team is ${topLabel.toLowerCase()}-heavy (${topPercent}% ${topColor}). Consider adding a ${weakestLabel} to balance your next hire.`;
};
