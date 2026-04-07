// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

type ProcessEnv = Record<string, string | undefined>;

const process = {
  env:
    ((globalThis as typeof globalThis & { process?: { env?: ProcessEnv } }).process?.env as ProcessEnv | undefined) ??
    Deno.env.toObject(),
};

const APP_BASE_URL = process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || "https://rolecolorfinder.com";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "https://qbuxoetprodjxpagfkoi.supabase.co";
const MCP_SERVER_URL = `${SUPABASE_URL}/functions/v1/chatgpt-mcp-server`;
const MCP_PROTOCOL_VERSION = "2025-03-26";
const REQUIRED_COMPANY_ROLES = new Set(["admin", "hr"]);
const DEFAULT_B2B_TOOLS = [
  "get_my_rolecolor",
  "get_team_roster",
  "get_team_composition",
  "get_team_health_score",
  "get_org_chart_by_rolecolor",
  "get_team_gap_analysis",
  "get_succession_plan",
  "clone_team_blueprint",
  "get_collaboration_score",
  "compare_departments",
  "get_compatibility",
  "get_person_profile",
  "get_conflict_advice",
  "get_communication_style",
  "suggest_hire_rolecolor",
  "get_pending_assessments",
] as const;
const DEFAULT_PERSONAL_TOOLS = [
  "get_my_rolecolor",
  "get_compatibility",
  "get_conflict_advice",
  "get_communication_style",
] as const;

export const CHATGPT_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg";
export const CHATGPT_MCP_SERVER_URL = MCP_SERVER_URL;
export const CHATGPT_PORTAL_BASE_URL = APP_BASE_URL;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

type SupabaseClient = ReturnType<typeof createClient>;

type ConnectionType = "personal" | "b2b";

interface CompanyContext {
  id: string;
  name: string;
  subdomain: string | null;
}

interface ChatgptConnectionRecord {
  id: string;
  user_id: string | null;
  connected_by_user_id: string | null;
  org_id: string | null;
  connection_type: ConnectionType;
  openai_user_id: string | null;
  access_token: string;
  access_token_hash: string;
  refresh_token: string | null;
  refresh_token_hash: string | null;
  token_expires_at: string | null;
  scopes_granted: string[] | null;
  enabled_tools: string[] | null;
  auto_inject_context: boolean;
  share_profile: boolean;
  include_teammates: boolean;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoleColorProfile {
  color: "Red" | "Yellow" | "Green" | "Blue";
  roleType: "Motivator" | "Executor" | "Architect" | "Visionary";
  colorHex: string;
  summary: string;
  strengths: string[];
  blindSpots: string[];
  worksBestWith: string[];
  communicationTips: string[];
}

interface TeamMemberRecord {
  id: string;
  email: string;
  name: string;
  department: string | null;
  jobTitle: string | null;
  rolecolor: string | null;
  roleType: string | null;
  colorHex: string | null;
  assessmentDate: string | null;
  assessmentResults: Record<string, unknown> | null;
  invitedAt: string | null;
  createdAt: string | null;
}

interface PersonalProfileContext {
  name: string;
  email: string | null;
  roleProfile: RoleColorProfile | null;
  teammates: TeamMemberRecord[];
}

interface BusinessProfileContext {
  adminName: string;
  adminEmail: string | null;
  adminRoleProfile: RoleColorProfile | null;
  company: CompanyContext;
  roster: TeamMemberRecord[];
}

interface OAuthStateRecord {
  id: string;
  state_token: string;
  connection_type: ConnectionType;
  user_id: string | null;
  connected_by_user_id: string | null;
  org_id: string | null;
  requested_scopes: string[] | null;
  redirect_uri: string | null;
  resource: string | null;
  client_id: string | null;
  code: string | null;
  status: string;
  expires_at: string;
}

const ROLE_PROFILES: Record<string, RoleColorProfile> = {
  red: {
    color: "Red",
    roleType: "Motivator",
    colorHex: "#EF4444",
    summary:
      "Red Motivators create momentum, rally people quickly, and move work through energy, influence, and visible action.",
    strengths: ["Decisive leadership", "Momentum building", "Persuasive communication"],
    blindSpots: ["Can move too fast for consensus", "May skip detail or process", "Can unintentionally dominate"],
    worksBestWith: ["Blue (Visionary)", "Yellow (Executor)"],
    communicationTips: ["Lead with impact", "Keep it direct", "Give them ownership quickly"],
  },
  yellow: {
    color: "Yellow",
    roleType: "Executor",
    colorHex: "#EAB308",
    summary:
      "Yellow Executors turn ideas into motion, love clarity, and create dependable forward progress through structure and action.",
    strengths: ["Reliable execution", "Follow-through", "Operational clarity"],
    blindSpots: ["Can prioritize speed over reflection", "May resist ambiguity", "Can feel impatient with ideation"],
    worksBestWith: ["Blue (Visionary)", "Green (Architect)"],
    communicationTips: ["Be clear about outcomes", "Name deadlines and owners", "Show what success looks like"],
  },
  green: {
    color: "Green",
    roleType: "Architect",
    colorHex: "#10B981",
    summary:
      "Green Architects build strong systems, improve decision quality, and create order by thinking carefully before they act.",
    strengths: ["Systems thinking", "Risk spotting", "Thoughtful decision-making"],
    blindSpots: ["Can over-analyze", "May under-signal urgency", "Can feel slow to more action-driven teammates"],
    worksBestWith: ["Yellow (Executor)", "Blue (Visionary)"],
    communicationTips: ["Share context up front", "Give them time to process", "Invite their critique early"],
  },
  blue: {
    color: "Blue",
    roleType: "Visionary",
    colorHex: "#3B82F6",
    summary:
      "Blue Visionaries think in systems and long-term outcomes. They lead with ideas, need context before action, and work best with Executors who can implement their vision.",
    strengths: ["Strategic thinking", "Pattern recognition", "Long-term planning"],
    blindSpots: ["Can overlook short-term execution", "May under-communicate urgency", "Can stay in possibilities too long"],
    worksBestWith: ["Yellow (Executor)", "Green (Architect)"],
    communicationTips: ["Lead with the big picture", "Give them space to think", "Avoid micromanaging timelines"],
  },
};

const COMMUNICATION_STYLES = {
  Red: {
    tone: "Direct, energetic, action-focused",
    structure: "Lead with the ask, then the why. Keep it short.",
    do: ["Be direct", "Show enthusiasm", "Give them ownership"],
    dont: ["Overload with data", "Be passive", "Use long preambles"],
  },
  Yellow: {
    tone: "Clear, pragmatic, progress-focused",
    structure: "State the goal, steps, and timing clearly.",
    do: ["Spell out next steps", "Give clear deadlines", "Recognize delivery wins"],
    dont: ["Be vague", "Change priorities late", "Leave ownership unclear"],
  },
  Green: {
    tone: "Calm, thoughtful, well-reasoned",
    structure: "Provide context, logic, and room for questions.",
    do: ["Share rationale", "Invite critique", "Leave thinking space"],
    dont: ["Rush them", "Skip details", "Frame disagreement as personal"],
  },
  Blue: {
    tone: "Strategic, collaborative, future-oriented",
    structure: "Start with the larger purpose, then connect to action.",
    do: ["Explain the vision", "Connect dots", "Invite perspective"],
    dont: ["Lead only with tactics", "Micromanage", "Shut down exploration too early"],
  },
} as const;

const TOOL_METADATA = [
  {
    name: "get_my_rolecolor",
    title: "Get My RoleColor",
    description: "Get the RoleColor profile of the current user.",
    scopes: ["rolecolor:read"],
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_team_roster",
    title: "Get Team Roster",
    description: "Get the full team's RoleColor profiles for this organization.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
        rolecolor: { type: "string", enum: ["Red", "Yellow", "Green", "Blue"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_team_composition",
    title: "Get Team Composition",
    description: "Get a summary of the team's RoleColor balance and distribution.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_team_health_score",
    title: "Get Team Health Score",
    description: "Get a 0-100 team health score based on RoleColor coverage, balance, and assessment completion.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_org_chart_by_rolecolor",
    title: "Get Org Chart By RoleColor",
    description: "Get an org chart-style company map with RoleColor-enriched nodes and reporting lines where available.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_team_gap_analysis",
    title: "Get Team Gap Analysis",
    description: "Analyze missing or underrepresented RoleColors and explain what strengths the team lacks.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_succession_plan",
    title: "Get Succession Plan",
    description: "Model the RoleColor gap created if a specific person leaves and identify internal successors.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        person_query: { type: "string" },
      },
      required: ["person_query"],
      additionalProperties: false,
    },
  },
  {
    name: "clone_team_blueprint",
    title: "Clone Team Blueprint",
    description: "Build a RoleColor blueprint for recreating a strong team mix at a new team size.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
        target_team_size: { type: "integer", minimum: 1 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_collaboration_score",
    title: "Get Collaboration Score",
    description: "Estimate collaboration strength between two people or two departments based on RoleColor compatibility.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        person_a_query: { type: "string" },
        person_b_query: { type: "string" },
        department_a: { type: "string" },
        department_b: { type: "string" },
        context: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "compare_departments",
    title: "Compare Departments",
    description: "Compare RoleColor balance, health, and gaps across departments side by side.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        departments: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_compatibility",
    title: "Get Compatibility",
    description: "Get the working dynamic and compatibility between two RoleColors.",
    scopes: ["rolecolor:read"],
    inputSchema: {
      type: "object",
      properties: {
        color_a: { type: "string" },
        color_b: { type: "string" },
        context: { type: "string" },
      },
      required: ["color_a", "color_b"],
      additionalProperties: false,
    },
  },
  {
    name: "get_person_profile",
    title: "Get Person Profile",
    description: "Look up a specific team member's RoleColor profile by name or email.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_conflict_advice",
    title: "Get Conflict Advice",
    description: "Get RoleColor-based advice for resolving a conflict or difficult situation between people.",
    scopes: ["rolecolor:read"],
    inputSchema: {
      type: "object",
      properties: {
        situation: { type: "string" },
        person_a_color: { type: "string" },
        person_b_color: { type: "string" },
        person_a_role: { type: "string" },
        person_b_role: { type: "string" },
      },
      required: ["situation", "person_a_color", "person_b_color"],
      additionalProperties: false,
    },
  },
  {
    name: "get_communication_style",
    title: "Get Communication Style",
    description: "Get advice on how to communicate with someone based on their RoleColor.",
    scopes: ["rolecolor:read"],
    inputSchema: {
      type: "object",
      properties: {
        recipient_color: { type: "string" },
        message_type: {
          type: "string",
          enum: ["feedback", "request", "difficult_news", "praise", "instruction", "pitch"],
        },
        context: { type: "string" },
      },
      required: ["recipient_color"],
      additionalProperties: false,
    },
  },
  {
    name: "suggest_hire_rolecolor",
    title: "Suggest Hire RoleColor",
    description: "Based on the current team composition, suggest which RoleColor to hire next.",
    scopes: ["team:read"],
    inputSchema: {
      type: "object",
      properties: {
        department: { type: "string" },
        job_title: { type: "string" },
        priority: { type: "string", enum: ["balance", "execution", "vision", "culture"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_pending_assessments",
    title: "Get Pending Assessments",
    description: "Get a list of team members who haven't completed their RoleColor assessment yet.",
    scopes: ["team:read"],
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
] as const;

export const CHATGPT_TOOL_NAMES = TOOL_METADATA.map((tool) => tool.name);

const textEncoder = new TextEncoder();

const hexEncode = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const hexDecode = (value: string) => {
  const normalized = value.trim();
  const bytes = new Uint8Array(normalized.length / 2);

  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
};

const toText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const normalizeEmail = (value: unknown) => {
  const text = toText(value);
  return text ? text.toLowerCase() : null;
};

const normalizeColor = (value: unknown) => {
  const text = toText(value)?.toLowerCase() || null;
  if (!text) return null;
  if (text.startsWith("r")) return "Red";
  if (text.startsWith("y")) return "Yellow";
  if (text.startsWith("g")) return "Green";
  if (text.startsWith("b")) return "Blue";
  return null;
};

const normalizeRoleColorKey = (value: unknown) => normalizeColor(value)?.toLowerCase() || null;

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

const getAuthorizationToken = (req: Request, accessTokenOverride?: string | null) => {
  if (accessTokenOverride) {
    return accessTokenOverride.trim();
  }

  const authHeader = req.headers.get("Authorization");
  return authHeader?.replace(/^Bearer\s+/i, "").trim() || null;
};

export const requireAuthenticatedUser = async (req: Request, accessTokenOverride?: string | null) => {
  const accessToken = getAuthorizationToken(req, accessTokenOverride);
  if (!accessToken) {
    throw new HttpError(401, "Missing authorization header");
  }

  const authSupabase = createAuthSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await authSupabase.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, "Invalid or expired session");
  }

  return {
    accessToken,
    user,
  };
};

export const requireCompanyAccess = async (req: Request, orgId: string, accessTokenOverride?: string | null) => {
  const auth = await requireAuthenticatedUser(req, accessTokenOverride);
  const supabase = createServiceSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("company_users")
    .select("id, role, status")
    .eq("company_id", orgId)
    .eq("user_id", auth.user.id)
    .in("role", [...REQUIRED_COMPANY_ROLES])
    .single();

  if (membershipError || !membership || membership.status !== "active") {
    throw new HttpError(403, "This integration requires a Business admin account");
  }

  const company = await getCompanyById(supabase, orgId);

  return {
    ...auth,
    membership,
    company,
    supabase,
  };
};

const getEncryptionSecret = () => process.env.CHATGPT_TOKEN_ENCRYPTION_KEY || getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

const getEncryptionKey = async () => {
  const secretDigest = await crypto.subtle.digest("SHA-256", textEncoder.encode(getEncryptionSecret()));
  return await crypto.subtle.importKey(
    "raw",
    secretDigest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
};

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return hexEncode(digest);
};

export const encryptSecret = async (value: string) => {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(value),
  );

  return `${hexEncode(iv.buffer)}:${hexEncode(encrypted)}`;
};

export const decryptSecret = async (value: string | null | undefined) => {
  const secret = toText(value);
  if (!secret) return null;

  const [ivHex, cipherHex] = secret.split(":");
  if (!ivHex || !cipherHex) {
    return null;
  }

  const key = await getEncryptionKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexDecode(ivHex) },
    key,
    hexDecode(cipherHex),
  );

  return new TextDecoder().decode(decrypted);
};

export const generateOpaqueToken = (prefix: string) => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `${prefix}_${Array.from(bytes).map((value) => value.toString(16).padStart(2, "0")).join("")}`;
};

export const getCompanyById = async (supabase: SupabaseClient, companyId: string) => {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, subdomain")
    .eq("id", companyId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "Company not found");
  }

  return {
    id: data.id,
    name: data.name,
    subdomain: data.subdomain ?? null,
  } satisfies CompanyContext;
};

export const buildPortalPath = (company: CompanyContext | null, params?: Record<string, string | null | undefined>) => {
  if (company) {
    const url = new URL("/b2b/company-portal", APP_BASE_URL);
    url.searchParams.set("company", company.id);
    for (const [key, value] of Object.entries(params || {})) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  const url = new URL("/settings/integrations", APP_BASE_URL);
  for (const [key, value] of Object.entries(params || {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
};

export const buildReconnectMessage = async (connection: ChatgptConnectionRecord | null) => {
  if (connection?.connection_type === "b2b" && connection.org_id) {
    const company = await getCompanyById(createServiceSupabaseClient(), connection.org_id);
    return `Reconnect RoleColorFinder in your portal: ${buildPortalPath(company, { tab: "settings", settingsTab: "integrations" })}`;
  }

  return `Reconnect RoleColorFinder in your portal: ${buildPortalPath(null)}`;
};

export const getDefaultToolsForType = (connectionType: ConnectionType) =>
  [...(connectionType === "b2b" ? DEFAULT_B2B_TOOLS : DEFAULT_PERSONAL_TOOLS)];

export const upsertChatgptConnection = async (params: {
  supabase?: SupabaseClient;
  connectionType: ConnectionType;
  userId?: string | null;
  connectedByUserId?: string | null;
  orgId?: string | null;
  scopesGranted?: string[] | null;
}) => {
  const supabase = params.supabase || createServiceSupabaseClient();
  const accessTokenPlain = generateOpaqueToken("rcf_chatgpt");
  const refreshTokenPlain = generateOpaqueToken("rcf_refresh");
  const accessTokenHash = await sha256Hex(accessTokenPlain);
  const refreshTokenHash = await sha256Hex(refreshTokenPlain);
  const encryptedAccessToken = await encryptSecret(accessTokenPlain);
  const encryptedRefreshToken = await encryptSecret(refreshTokenPlain);
  const enabledTools = getDefaultToolsForType(params.connectionType);

  const query = supabase
    .from("chatgpt_connections")
    .select("*")
    .eq("connection_type", params.connectionType)
    .eq("is_active", true)
    .limit(1);

  const { data: existingRows, error: existingError } = await (
    params.connectionType === "b2b"
      ? query.eq("org_id", params.orgId || "")
      : query.eq("user_id", params.userId || "")
  );

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existing = (existingRows?.[0] as ChatgptConnectionRecord | undefined) || null;

  if (existing) {
    const updatePayload = {
      connected_by_user_id: params.connectedByUserId || existing.connected_by_user_id,
      org_id: params.orgId || existing.org_id,
      user_id: params.userId || existing.user_id,
      scopes_granted: params.scopesGranted || existing.scopes_granted || [],
      enabled_tools: Array.from(new Set([...(existing.enabled_tools || []), ...enabledTools])),
      auto_inject_context: existing.auto_inject_context ?? true,
      share_profile: existing.share_profile ?? true,
      include_teammates: existing.include_teammates ?? false,
      last_sync_at: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("chatgpt_connections")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update ChatGPT connection");
    }

    return {
      connection: data as ChatgptConnectionRecord,
      accessTokenPlain,
      refreshTokenPlain,
      created: false,
    };
  }

  const insertPayload = {
    user_id: params.userId || null,
    connected_by_user_id: params.connectedByUserId || null,
    org_id: params.orgId || null,
    connection_type: params.connectionType,
    openai_user_id: null,
    access_token: encryptedAccessToken,
    access_token_hash: accessTokenHash,
    refresh_token: encryptedRefreshToken,
    refresh_token_hash: refreshTokenHash,
    token_expires_at: null,
    scopes_granted: params.scopesGranted || [],
    enabled_tools: enabledTools,
    auto_inject_context: true,
    share_profile: true,
    include_teammates: false,
    last_sync_at: new Date().toISOString(),
    is_active: true,
  };

  const { data, error } = await supabase
    .from("chatgpt_connections")
    .insert(insertPayload as any)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create ChatGPT connection");
  }

  return {
    connection: data as ChatgptConnectionRecord,
    accessTokenPlain,
    refreshTokenPlain,
    created: true,
  };
};

export const getChatgptConnectionByAccessToken = async (token: string) => {
  const supabase = createServiceSupabaseClient();
  const tokenHash = await sha256Hex(token);
  const { data, error } = await supabase
    .from("chatgpt_connections")
    .select("*")
    .eq("access_token_hash", tokenHash)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatgptConnectionRecord | null) ?? null;
};

export const getChatgptConnectionByOrgId = async (orgId: string) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("chatgpt_connections")
    .select("*")
    .eq("org_id", orgId)
    .eq("connection_type", "b2b")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatgptConnectionRecord | null) ?? null;
};

export const getChatgptConnectionByUserId = async (userId: string) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("chatgpt_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("connection_type", "personal")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ChatgptConnectionRecord | null) ?? null;
};

export const updateChatgptConnection = async (connectionId: string, updates: Record<string, unknown>) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("chatgpt_connections")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", connectionId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update ChatGPT connection");
  }

  return data as ChatgptConnectionRecord;
};

export const createChatgptOAuthState = async (params: {
  connectionType: ConnectionType;
  userId?: string | null;
  connectedByUserId?: string | null;
  orgId?: string | null;
  requestedScopes?: string[] | null;
  redirectUri?: string | null;
  resource?: string | null;
  clientId?: string | null;
}) => {
  const supabase = createServiceSupabaseClient();
  const stateToken = generateOpaqueToken("rcf_state");
  const code = generateOpaqueToken("rcf_code");

  const { data, error } = await supabase
    .from("chatgpt_oauth_states")
    .insert({
      state_token: stateToken,
      connection_type: params.connectionType,
      user_id: params.userId || null,
      connected_by_user_id: params.connectedByUserId || null,
      org_id: params.orgId || null,
      requested_scopes: params.requestedScopes || [],
      redirect_uri: params.redirectUri || null,
      resource: params.resource || MCP_SERVER_URL,
      client_id: params.clientId || null,
      code,
      status: "approved",
    } as any)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create ChatGPT OAuth state");
  }

  return data as OAuthStateRecord;
};

export const consumeChatgptOAuthState = async (stateToken: string) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("chatgpt_oauth_states")
    .select("*")
    .eq("state_token", stateToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const state = (data as OAuthStateRecord | null) ?? null;
  if (!state) {
    throw new HttpError(404, "OAuth state not found");
  }

  if (new Date(state.expires_at).getTime() < Date.now()) {
    await supabase.from("chatgpt_oauth_states").update({ status: "expired" } as any).eq("id", state.id);
    throw new HttpError(410, "OAuth state expired");
  }

  if (state.status !== "approved" && state.status !== "pending") {
    throw new HttpError(409, "OAuth state already consumed");
  }

  await supabase
    .from("chatgpt_oauth_states")
    .update({ status: "consumed", updated_at: new Date().toISOString() } as any)
    .eq("id", state.id);

  return state;
};

export const resolveRoleColorFromResults = (results: Record<string, unknown> | null | undefined) => {
  return normalizeRoleColorKey(
    results?.dominantColor ||
      results?.primaryColor ||
      results?.role_color ||
      results?.color,
  );
};

const getRoleProfile = (color: unknown) => {
  const key = normalizeRoleColorKey(color);
  return key ? ROLE_PROFILES[key] || null : null;
};

const getAssessmentRowsByIds = async (supabase: SupabaseClient, assessmentIds: string[]) => {
  if (assessmentIds.length === 0) {
    return new Map<string, { created_at: string | null; results: Record<string, unknown> | null }>();
  }

  const { data, error } = await supabase
    .from("assessment_results")
    .select("id, created_at, results")
    .in("id", assessmentIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data || []).map((row) => [
      row.id,
      {
        created_at: row.created_at ?? null,
        results: (row.results as Record<string, unknown> | null) ?? null,
      },
    ]),
  );
};

const getDepartmentByEmail = async (supabase: SupabaseClient, orgId: string, emails: string[]) => {
  const mapping = new Map<string, { department: string | null; job_title: string | null }>();
  if (emails.length === 0) {
    return mapping;
  }

  try {
    const { data, error } = await supabase
      .from("hris_employees" as any)
      .select("email, department, job_title")
      .eq("org_id", orgId)
      .in("email", emails);

    if (error) {
      return mapping;
    }

    for (const employee of (data || []) as Array<{ email?: string | null; department?: string | null; job_title?: string | null }>) {
      const email = normalizeEmail(employee.email);
      if (!email) continue;
      mapping.set(email, {
        department: toText(employee.department),
        job_title: toText(employee.job_title),
      });
    }
  } catch {
    return mapping;
  }

  return mapping;
};

export const listBusinessTeamMembers = async (orgId: string, filters?: { department?: string | null; rolecolor?: string | null }) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, full_name, job_role, invited_at, created_at, assessment_result_id, status")
    .eq("company_id", orgId)
    .in("status", ["active", "invited"])
    .order("full_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as Array<{
    id: string;
    email: string;
    full_name: string | null;
    job_role: string | null;
    invited_at: string | null;
    created_at: string | null;
    assessment_result_id: string | null;
  }>;

  const assessmentIds = rows
    .map((row) => row.assessment_result_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const assessmentsById = await getAssessmentRowsByIds(supabase, assessmentIds);
  const emailMap = await getDepartmentByEmail(
    supabase,
    orgId,
    rows.map((row) => normalizeEmail(row.email)).filter((value): value is string => Boolean(value)),
  );

  const roster = rows
    .map((row) => {
      const email = normalizeEmail(row.email) || row.email;
      const assessment = row.assessment_result_id ? assessmentsById.get(row.assessment_result_id) : null;
      const roleProfile = getRoleProfile(resolveRoleColorFromResults(assessment?.results));
      const employeeInfo = emailMap.get(email) || null;

      return {
        id: row.id,
        email,
        name: row.full_name || email,
        department: employeeInfo?.department || null,
        jobTitle: employeeInfo?.job_title || row.job_role || null,
        rolecolor: roleProfile?.color || null,
        roleType: roleProfile?.roleType || null,
        colorHex: roleProfile?.colorHex || null,
        assessmentDate: assessment?.created_at || null,
        assessmentResults: assessment?.results || null,
        invitedAt: row.invited_at || null,
        createdAt: row.created_at || null,
      } satisfies TeamMemberRecord;
    })
    .filter((member) => {
      if (filters?.department && member.department?.toLowerCase() !== filters.department.trim().toLowerCase()) {
        return false;
      }

      if (filters?.rolecolor && member.rolecolor?.toLowerCase() !== normalizeColor(filters.rolecolor)?.toLowerCase()) {
        return false;
      }

      return true;
    });

  return roster;
};

export const getLatestUserRoleProfile = async (userId: string) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("assessment_results")
    .select("id, created_at, results")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const roleProfile = getRoleProfile(resolveRoleColorFromResults((data?.results as Record<string, unknown> | null) ?? null));
  return {
    assessmentId: data?.id || null,
    assessmentDate: data?.created_at || null,
    results: (data?.results as Record<string, unknown> | null) ?? null,
    roleProfile,
  };
};

export const listPersonalTeammates = async (userId: string) => {
  const supabase = createServiceSupabaseClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("company_users")
    .select("id, company_id, email, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const membershipRows = (memberships || []) as Array<{ id: string; company_id: string; email: string }>;
  if (membershipRows.length === 0) {
    return [] as TeamMemberRecord[];
  }

  const seen = new Set<string>();
  const teammates: TeamMemberRecord[] = [];

  for (const membership of membershipRows) {
    const roster = await listBusinessTeamMembers(membership.company_id);
    for (const member of roster) {
      if (member.id === membership.id) continue;
      const key = member.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      teammates.push(member);
    }
  }

  return teammates;
};

export const getPersonalProfileContext = async (userId: string, includeTeammates: boolean) => {
  const supabase = createServiceSupabaseClient();
  const authClient = createServiceSupabaseClient();
  const { data: authUser } = await authClient.auth.admin.getUserById(userId);
  const latest = await getLatestUserRoleProfile(userId);
  const teammates = includeTeammates ? await listPersonalTeammates(userId) : [];
  return {
    name: authUser.user?.user_metadata?.full_name || authUser.user?.email || "RCF user",
    email: authUser.user?.email || null,
    roleProfile: latest.roleProfile,
    teammates,
  } satisfies PersonalProfileContext;
};

export const getBusinessProfileContext = async (connection: ChatgptConnectionRecord) => {
  if (!connection.org_id) {
    throw new HttpError(400, "Business connection is missing its organization");
  }

  const supabase = createServiceSupabaseClient();
  const company = await getCompanyById(supabase, connection.org_id);
  const roster = await listBusinessTeamMembers(connection.org_id);
  let adminName = company.name;
  let adminEmail: string | null = null;
  let adminRoleProfile: RoleColorProfile | null = null;

  if (connection.connected_by_user_id) {
    const { data: membership } = await supabase
      .from("company_users")
      .select("email, full_name, assessment_result_id")
      .eq("company_id", connection.org_id)
      .eq("user_id", connection.connected_by_user_id)
      .maybeSingle();

    if (membership) {
      adminName = membership.full_name || membership.email || adminName;
      adminEmail = membership.email || null;
      const assessmentsById = await getAssessmentRowsByIds(
        supabase,
        membership.assessment_result_id ? [membership.assessment_result_id] : [],
      );
      adminRoleProfile = getRoleProfile(
        resolveRoleColorFromResults(assessmentsById.get(membership.assessment_result_id || "")?.results),
      );
    }
  }

  return {
    adminName,
    adminEmail,
    adminRoleProfile,
    company,
    roster,
  } satisfies BusinessProfileContext;
};

const redactFreeText = (value: string) =>
  value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[redacted-name]");

export const sanitizeToolInput = (toolName: string, input: Record<string, unknown>) => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input || {})) {
    if (value === null || value === undefined) continue;

    if (["color_a", "color_b", "person_a_color", "person_b_color", "recipient_color", "department", "rolecolor", "priority", "message_type"].includes(key)) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = toolName === "get_person_profile" || key === "query"
        ? "[redacted-query]"
        : redactFreeText(value).slice(0, 120);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
};

const summarizeResponse = (value: unknown) => {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return serialized.slice(0, 100);
};

export const logToolCall = async (params: {
  connectionId: string;
  toolName: string;
  inputParams: Record<string, unknown>;
  response: unknown;
  latencyMs: number;
  isError?: boolean;
  errorMessage?: string | null;
}) => {
  try {
    const supabase = createServiceSupabaseClient();
    await supabase.from("chatgpt_tool_calls").insert({
      connection_id: params.connectionId,
      tool_name: params.toolName,
      input_params: sanitizeToolInput(params.toolName, params.inputParams),
      response_summary: summarizeResponse(params.response),
      latency_ms: params.latencyMs,
      is_error: params.isError || false,
      error_message: params.errorMessage || null,
    } as any);
  } catch (error) {
    console.error("Failed to log ChatGPT tool call", error);
  }
};

export const buildTeamBreakdown = (roster: TeamMemberRecord[]) => {
  const base = {
    Red: { count: 0, percentage: 0, role: "Motivator" },
    Yellow: { count: 0, percentage: 0, role: "Executor" },
    Green: { count: 0, percentage: 0, role: "Architect" },
    Blue: { count: 0, percentage: 0, role: "Visionary" },
  };

  for (const member of roster) {
    if (member.rolecolor && member.rolecolor in base) {
      base[member.rolecolor as keyof typeof base].count += 1;
    }
  }

  const total = roster.filter((member) => member.rolecolor).length;
  for (const key of Object.keys(base) as Array<keyof typeof base>) {
    base[key].percentage = total ? Math.round((base[key].count / total) * 100) : 0;
  }

  return base;
};

const getDominantAndMissingColors = (breakdown: ReturnType<typeof buildTeamBreakdown>) => {
  const entries = Object.entries(breakdown) as Array<[keyof typeof breakdown, typeof breakdown.Red]>;
  const dominant = [...entries].sort((left, right) => right[1].count - left[1].count)[0]?.[0] || "Yellow";
  const missing = [...entries].sort((left, right) => left[1].count - right[1].count)[0]?.[0] || "Blue";
  return { dominant, missing };
};

const buildBalanceInsight = (breakdown: ReturnType<typeof buildTeamBreakdown>) => {
  const { dominant, missing } = getDominantAndMissingColors(breakdown);
  const dominantRole = breakdown[dominant].role;
  const missingRole = breakdown[missing].role;

  const missingStrengths =
    missing === "Blue"
      ? ["Long-term strategy", "Vision setting"]
      : missing === "Green"
      ? ["Systems thinking", "Risk management"]
      : missing === "Yellow"
      ? ["Execution rigor", "Operational follow-through"]
      : ["Influence", "Momentum building"];

  return {
    dominantColor: dominant,
    missingColor: missing,
    insight:
      `Your team is ${dominantRole.toLowerCase()}-heavy. You have strong ${dominant === "Yellow" ? "delivery" : dominant === "Blue" ? "strategic" : dominant === "Green" ? "systems" : "momentum"} capacity but may be underweighted in ${missingStrengths[0].toLowerCase()}.`,
    missingStrengths,
    hireRecommendation: `Your next hire should lean ${missing} ${missingRole} to balance the team.`,
  };
};

const ROLE_ORDER = ["Red", "Yellow", "Green", "Blue"] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const roundNumber = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const getWeekStartIso = () => {
  const weekStart = new Date();
  const day = weekStart.getUTCDay();
  const diff = (day + 6) % 7;
  weekStart.setUTCHours(0, 0, 0, 0);
  weekStart.setUTCDate(weekStart.getUTCDate() - diff);
  return weekStart.toISOString();
};

const getStrengthGapNarrative = (color: string) => {
  switch (color) {
    case "Blue":
      return {
        role_type: "Visionary",
        missing_strengths: ["Long-term strategy", "Vision setting", "Future-state thinking"],
        impact: "Without Blue energy, the team can execute well but under-invest in long-term direction and big-picture alignment.",
      };
    case "Green":
      return {
        role_type: "Architect",
        missing_strengths: ["Systems thinking", "Risk management", "Decision quality"],
        impact: "Without Green energy, the team can miss structural weaknesses and make avoidable process mistakes under pressure.",
      };
    case "Yellow":
      return {
        role_type: "Executor",
        missing_strengths: ["Operational follow-through", "Delivery discipline", "Cadence management"],
        impact: "Without Yellow energy, strong ideas may stall because no one naturally turns them into steady execution.",
      };
    default:
      return {
        role_type: "Motivator",
        missing_strengths: ["Momentum building", "Change energy", "Cross-team influence"],
        impact: "Without Red energy, the team can become thoughtful but slow to rally around action and difficult decisions.",
      };
  }
};

const calculateTeamHealthScore = (roster: TeamMemberRecord[]) => {
  const assessedMembers = roster.filter((member) => Boolean(member.rolecolor));
  const breakdown = buildTeamBreakdown(assessedMembers);
  const assessedCount = assessedMembers.length;
  const uniqueColors = ROLE_ORDER.filter((color) => breakdown[color].count > 0).length;
  const completionRate = roster.length ? assessedCount / roster.length : 0;
  const idealShare = 0.25;
  const absoluteDeviation = assessedCount
    ? ROLE_ORDER.reduce((sum, color) => sum + Math.abs(breakdown[color].count / assessedCount - idealShare), 0)
    : 1.5;
  const coverageScore = (uniqueColors / ROLE_ORDER.length) * 35;
  const balanceScore = 40 * (1 - clamp(absoluteDeviation / 1.5, 0, 1));
  const completionScore = completionRate * 25;
  const score = clamp(Math.round(coverageScore + balanceScore + completionScore), 0, 100);
  const balance = buildBalanceInsight(breakdown);
  const missingColors = ROLE_ORDER.filter((color) => breakdown[color].count === 0);

  return {
    score,
    updated_for_week_of: getWeekStartIso(),
    total_members: roster.length,
    assessed_members: assessedCount,
    completion_rate: Math.round(completionRate * 100),
    color_coverage: uniqueColors,
    dominant_color: balance.dominantColor,
    missing_colors: missingColors,
    balance_insight: balance.insight,
    factors: [
      {
        label: "Color coverage",
        score: Math.round(coverageScore),
        detail: `${uniqueColors} of 4 RoleColors are represented.`,
      },
      {
        label: "Balance",
        score: Math.round(balanceScore),
        detail: assessedCount
          ? `Distribution variance across assessed teammates is ${roundNumber(absoluteDeviation, 2)}.`
          : "No assessed members yet, so balance cannot be measured.",
      },
      {
        label: "Completion",
        score: Math.round(completionScore),
        detail: `${Math.round(completionRate * 100)}% of the team has completed a RoleColor assessment.`,
      },
    ],
  };
};

const buildTeamGapAnalysis = (roster: TeamMemberRecord[]) => {
  const assessedMembers = roster.filter((member) => Boolean(member.rolecolor));
  const breakdown = buildTeamBreakdown(assessedMembers);
  const missingRoles = ROLE_ORDER
    .filter((color) => breakdown[color].count === 0)
    .map((color) => ({
      color,
      count: 0,
      ...getStrengthGapNarrative(color),
    }));
  const underrepresentedRoles = ROLE_ORDER
    .filter((color) => breakdown[color].count > 0 && breakdown[color].percentage <= 15)
    .map((color) => ({
      color,
      count: breakdown[color].count,
      percentage: breakdown[color].percentage,
      ...getStrengthGapNarrative(color),
    }));
  const balance = buildBalanceInsight(breakdown);

  return {
    assessed_members: assessedMembers.length,
    total_members: roster.length,
    dominant_color: balance.dominantColor,
    breakdown,
    missing_roles: missingRoles,
    underrepresented_roles: underrepresentedRoles,
    gap_summary: missingRoles.length
      ? `You have ${missingRoles.map((role) => `0 ${role.role_type}s`).join(", ")} in this team snapshot.`
      : underrepresentedRoles.length
      ? `All RoleColors are present, but ${underrepresentedRoles.map((role) => role.role_type).join(" and ")} are still underweighted.`
      : "All four RoleColors are represented with a healthy spread.",
    recommended_actions: missingRoles.length
      ? missingRoles.map((role) => `Add or develop a ${role.color} ${role.role_type} to strengthen ${role.missing_strengths[0].toLowerCase()}.`)
      : underrepresentedRoles.map((role) => `Protect and grow ${role.color} ${role.role_type} talent so the team doesn't over-index on ${balance.dominantColor}.`),
  };
};

const computeScaledColorTargets = (breakdown: ReturnType<typeof buildTeamBreakdown>, assessedCount: number, targetSize: number) => {
  const weights = ROLE_ORDER.map((color) => ({
    color,
    raw: assessedCount ? (breakdown[color].count / assessedCount) * targetSize : targetSize / ROLE_ORDER.length,
  }));
  const base = weights.map((item) => ({
    color: item.color,
    count: Math.floor(item.raw),
    fraction: item.raw - Math.floor(item.raw),
  }));
  let remaining = targetSize - base.reduce((sum, item) => sum + item.count, 0);

  for (const item of [...base].sort((left, right) => right.fraction - left.fraction)) {
    if (remaining <= 0) break;
    item.count += 1;
    remaining -= 1;
  }

  return base;
};

const buildCloneTeamBlueprint = (roster: TeamMemberRecord[], targetTeamSize: number) => {
  const assessedMembers = roster.filter((member) => Boolean(member.rolecolor));
  if (assessedMembers.length === 0) {
    throw new HttpError(404, "No assessed team members were found to model a blueprint from");
  }

  const breakdown = buildTeamBreakdown(assessedMembers);
  const targets = computeScaledColorTargets(breakdown, assessedMembers.length, targetTeamSize);

  return {
    source_team_size: roster.length,
    source_assessed_size: assessedMembers.length,
    target_team_size: targetTeamSize,
    source_breakdown: breakdown,
    blueprint: targets.map((item) => ({
      color: item.color,
      role_type: breakdown[item.color].role,
      target_count: item.count,
      current_share: breakdown[item.color].percentage,
    })),
    hiring_sequence: [...targets]
      .sort((left, right) => right.count - left.count)
      .map((item) => `Start with ${item.color} ${breakdown[item.color].role} talent to preserve the source team's operating rhythm.`),
    operating_notes: [
      "Protect the same balance of strategic, executional, architectural, and motivational energy as the source team scales.",
      "Avoid cloning only the dominant color; keep the weaker but essential complementary styles in the plan.",
    ],
  };
};

const averagePairCompatibility = (left: TeamMemberRecord[], right: TeamMemberRecord[]) => {
  const leftAssessed = left.filter((member) => Boolean(member.rolecolor));
  const rightAssessed = right.filter((member) => Boolean(member.rolecolor));
  const scores: number[] = [];

  for (const leftMember of leftAssessed) {
    for (const rightMember of rightAssessed) {
      scores.push(scorePair(leftMember.rolecolor as string, rightMember.rolecolor as string));
    }
  }

  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
};

const buildDepartmentComparison = (roster: TeamMemberRecord[], requestedDepartments?: string[] | null) => {
  const normalizedRequests = (requestedDepartments || [])
    .map((department) => toText(department))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  const departmentNames = Array.from(
    new Set(
      roster
        .map((member) => toText(member.department))
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const departmentsToCompare = normalizedRequests.length
    ? departmentNames.filter((department) => normalizedRequests.includes(department.toLowerCase()))
    : departmentNames;

  const comparison = departmentsToCompare.map((department) => {
    const departmentRoster = roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase());
    const health = calculateTeamHealthScore(departmentRoster);
    const gaps = buildTeamGapAnalysis(departmentRoster);

    return {
      department,
      member_count: departmentRoster.length,
      health_score: health.score,
      completion_rate: health.completion_rate,
      dominant_color: health.dominant_color,
      missing_colors: health.missing_colors,
      breakdown: gaps.breakdown,
      key_gap: gaps.missing_roles[0]?.role_type || gaps.underrepresented_roles[0]?.role_type || null,
    };
  });

  const bestHealth = [...comparison].sort((left, right) => right.health_score - left.health_score)[0] || null;
  const biggestGap = [...comparison].sort((left, right) => left.health_score - right.health_score)[0] || null;

  return {
    departments: comparison,
    summary: comparison.length
      ? `${bestHealth?.department || "One team"} has the strongest current balance, while ${biggestGap?.department || "another team"} shows the biggest RoleColor gap.`
      : "No departments with RoleColor data were found.",
  };
};

const getHierarchyByOrg = async (supabase: SupabaseClient, orgId: string) => {
  const byEmail = new Map<string, {
    email: string;
    merge_id: string | null;
    manager_id: string | null;
    department: string | null;
    job_title: string | null;
  }>();
  const byMergeId = new Map<string, {
    email: string;
    merge_id: string | null;
    manager_id: string | null;
    department: string | null;
    job_title: string | null;
  }>();

  try {
    const { data, error } = await supabase
      .from("hris_employees" as any)
      .select("email, merge_id, manager_id, department, job_title")
      .eq("org_id", orgId)
      .eq("is_active", true);

    if (error) {
      return { byEmail, byMergeId };
    }

    for (const row of (data || []) as Array<{
      email?: string | null;
      merge_id?: string | null;
      manager_id?: string | null;
      department?: string | null;
      job_title?: string | null;
    }>) {
      const email = normalizeEmail(row.email);
      if (!email) continue;
      const record = {
        email,
        merge_id: toText(row.merge_id),
        manager_id: toText(row.manager_id),
        department: toText(row.department),
        job_title: toText(row.job_title),
      };
      byEmail.set(email, record);
      if (record.merge_id) {
        byMergeId.set(record.merge_id, record);
      }
    }
  } catch {
    return { byEmail, byMergeId };
  }

  return { byEmail, byMergeId };
};

const buildOrgChartByRoleColor = async (orgId: string, roster: TeamMemberRecord[]) => {
  const supabase = createServiceSupabaseClient();
  const hierarchy = await getHierarchyByOrg(supabase, orgId);
  const rosterByEmail = new Map(
    roster.map((member) => [normalizeEmail(member.email) || member.email.toLowerCase(), member]),
  );

  const nodes = roster.map((member, index) => {
    const hrisRecord = hierarchy.byEmail.get(normalizeEmail(member.email) || member.email.toLowerCase()) || null;
    const managerEmail = hrisRecord?.manager_id ? hierarchy.byMergeId.get(hrisRecord.manager_id)?.email || null : null;
    const manager = managerEmail ? rosterByEmail.get(managerEmail) || null : null;

    return {
      node_id: `node_${index + 1}`,
      person_id: member.id,
      name: member.name,
      email: member.email,
      department: member.department,
      job_title: member.jobTitle || hrisRecord?.job_title || null,
      rolecolor: member.rolecolor,
      role_type: member.roleType,
      manager_email: manager?.email || managerEmail,
      manager_name: manager?.name || null,
      color_hex: member.colorHex,
    };
  });

  const nodeIdByEmail = new Map(nodes.map((node) => [normalizeEmail(node.email) || node.email.toLowerCase(), node.node_id]));
  const edges = nodes
    .map((node) => {
      const managerKey = normalizeEmail(node.manager_email) || "";
      const managerNodeId = managerKey ? nodeIdByEmail.get(managerKey) || null : null;
      if (!managerNodeId) return null;
      return {
        from: managerNodeId,
        to: node.node_id,
      };
    })
    .filter((edge): edge is { from: string; to: string } => Boolean(edge));

  const mermaidLines = ["graph TD"];
  for (const node of nodes) {
    const label = `${node.name}<br/>${node.rolecolor || "Pending"} ${node.role_type || "RoleColor"}`;
    mermaidLines.push(`  ${node.node_id}["${label.replace(/"/g, '\\"')}"]`);
  }
  for (const edge of edges) {
    mermaidLines.push(`  ${edge.from} --> ${edge.to}`);
  }
  mermaidLines.push("  classDef red fill:#FEE2E2,stroke:#EF4444,color:#7F1D1D;");
  mermaidLines.push("  classDef yellow fill:#FEF3C7,stroke:#EAB308,color:#78350F;");
  mermaidLines.push("  classDef green fill:#DCFCE7,stroke:#10B981,color:#14532D;");
  mermaidLines.push("  classDef blue fill:#DBEAFE,stroke:#3B82F6,color:#1E3A8A;");
  mermaidLines.push("  classDef pending fill:#E5E7EB,stroke:#9CA3AF,color:#111827;");
  for (const node of nodes) {
    mermaidLines.push(`  class ${node.node_id} ${(node.rolecolor || "pending").toLowerCase()};`);
  }

  return {
    node_count: nodes.length,
    edge_count: edges.length,
    nodes,
    edges,
    mermaid: mermaidLines.join("\n"),
  };
};

const scorePair = (left: string, right: string) => {
  const pair = [left, right].sort().join("+");
  const matrix: Record<string, number> = {
    "Blue+Yellow": 82,
    "Blue+Green": 88,
    "Blue+Red": 74,
    "Green+Yellow": 84,
    "Green+Red": 68,
    "Red+Yellow": 79,
    "Blue+Blue": 71,
    "Green+Green": 76,
    "Red+Red": 70,
    "Yellow+Yellow": 78,
    "Green+Blue": 88,
    "Yellow+Red": 79,
  };

  return matrix[pair] || 75;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getCommunicationTemplate = (recipientColor: keyof typeof COMMUNICATION_STYLES, messageType?: string | null) => {
  const style = COMMUNICATION_STYLES[recipientColor];
  const contextSpecific =
    messageType === "feedback"
      ? `I want to share feedback that will help us get stronger together.`
      : messageType === "request"
      ? `Could you take ownership of this next step and let me know what support you need?`
      : messageType === "difficult_news"
      ? `I want to share this clearly and respectfully so we can plan the next move well.`
      : messageType === "praise"
      ? `I want to recognize the impact you just made.`
      : messageType === "instruction"
      ? `Here is the direction, the outcome we need, and the key checkpoints.`
      : `I think this could unlock meaningful impact for the team.`;

  return {
    tone: style.tone,
    structure: style.structure,
    do: style.do,
    dont: style.dont,
    example_opener: contextSpecific,
    full_template: `${contextSpecific}\n\n${style.structure}\n\nDo:\n- ${style.do.join("\n- ")}\n\nAvoid:\n- ${style.dont.join("\n- ")}`,
  };
};

const buildCompatibilityResponse = (colorA: string, colorB: string, context?: string | null) => {
  const profileA = getRoleProfile(colorA);
  const profileB = getRoleProfile(colorB);
  if (!profileA || !profileB) {
    throw new HttpError(400, "Both RoleColors must be Red, Yellow, Green, or Blue");
  }

  const compatibilityScore = scorePair(profileA.color, profileB.color);
  const pair = `${profileA.color} + ${profileB.color}`;
  const dynamic = `${profileA.roleType} meets ${profileB.roleType}`;

  return {
    pair,
    dynamic,
    compatibility_score: compatibilityScore,
    natural_strengths:
      `${profileA.color} brings ${profileA.strengths[0].toLowerCase()}, while ${profileB.color} adds ${profileB.strengths[0].toLowerCase()}. Powerful when aligned.`,
    natural_tensions:
      `${profileA.color} often leans into ${profileA.communicationTips[0].toLowerCase()}, while ${profileB.color} prefers ${profileB.communicationTips[0].toLowerCase()}. They can clash if expectations stay implicit.`,
    tips_for_color_a: profileA.communicationTips,
    tips_for_color_b: profileB.communicationTips,
    context_advice: context
      ? `In this context, frame the conversation around shared outcomes, then adapt pace and detail to each person's style: ${redactFreeText(context)}`
      : "Use explicit expectations, shared goals, and different pacing for each style.",
  };
};

const buildConflictAdviceResponse = (params: {
  situation: string;
  personAColor: string;
  personBColor: string;
  personARole?: string | null;
  personBRole?: string | null;
}) => {
  const compatibility = buildCompatibilityResponse(params.personAColor, params.personBColor, params.situation);
  return {
    conflict_type: `${compatibility.dynamic} misalignment`,
    root_cause:
      `${compatibility.dynamic} creates friction when one person optimizes for ${compatibility.natural_strengths.split(",")[0].replace(" brings", "").toLowerCase()} and the other optimizes for different success signals.`,
    advice_for_person_a:
      `Lead with empathy, then adapt to ${capitalize(params.personBColor.toLowerCase())}. ${compatibility.tips_for_color_a[0]}.`,
    advice_for_person_b:
      `Acknowledge the other's intent before pushing your preference. ${compatibility.tips_for_color_b[0]}.`,
    suggested_conversation_opener:
      `I think we're both trying to solve the same problem from different angles. Can we align on the outcome first and then pick the best way to get there?`,
    what_to_avoid: [
      "Assuming speed means lack of care",
      "Using personality labels as blame",
      "Jumping into solutions before agreeing on the real problem",
    ],
    resolution_path:
      "1. Name the shared outcome. 2. Clarify where each person sees risk. 3. Agree on decision rules, timing, and follow-up checkpoints.",
  };
};

const buildPersonProfile = (member: TeamMemberRecord) => {
  const roleProfile = getRoleProfile(member.rolecolor);
  return {
    name: member.name,
    email: member.email,
    department: member.department,
    job_title: member.jobTitle,
    rolecolor: member.rolecolor,
    role_type: member.roleType,
    assessment_date: member.assessmentDate,
    color_hex: member.colorHex,
    summary: roleProfile?.summary || null,
    strengths: roleProfile?.strengths || [],
    blind_spots: roleProfile?.blindSpots || [],
    works_best_with: roleProfile?.worksBestWith || [],
    communication_tips: roleProfile?.communicationTips || [],
  };
};

const getEnabledToolNames = (connection: ChatgptConnectionRecord) => {
  const defaults = connection.connection_type === "b2b" ? [...DEFAULT_B2B_TOOLS] : [...DEFAULT_PERSONAL_TOOLS];
  return Array.from(new Set([...(connection.enabled_tools || []), ...defaults].map((tool) => String(tool))));
};

const filterEnabledTools = (connection: ChatgptConnectionRecord) => {
  const enabled = new Set(getEnabledToolNames(connection));

  if (connection.connection_type === "personal" && !connection.share_profile) {
    enabled.delete("get_my_rolecolor");
  }

  return TOOL_METADATA.filter((tool) => enabled.has(tool.name)).map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: tool.scopes,
      },
    ],
  }));
};

export const buildSystemInstructions = async (connection: ChatgptConnectionRecord) => {
  if (!connection.auto_inject_context) {
    return "Use RoleColorFinder tools only when the user explicitly asks for RoleColor-aware coaching.";
  }

  if (connection.connection_type === "b2b" && connection.org_id) {
    const context = await getBusinessProfileContext(connection);
    const breakdown = buildTeamBreakdown(context.roster);
    const { dominantColor, missingColor } = buildBalanceInsight(breakdown);
    const memberCount = context.roster.length;

    return [
      `You have access to RoleColorFinder data for ${context.company.name}.`,
      `${context.adminName} is a ${context.adminRoleProfile?.color || "RoleColor-unavailable"} ${context.adminRoleProfile?.roleType || "leader"}.`,
      `Their team has ${memberCount} members: ${breakdown.Red.count} Red Motivators, ${breakdown.Yellow.count} Yellow Executors, ${breakdown.Green.count} Green Architects, ${breakdown.Blue.count} Blue Visionaries.`,
      `Dominant color: ${dominantColor}. Key gap: ${missingColor}.`,
      `When answering questions about team dynamics, hiring, conflict, or communication, proactively use RoleColor context.`,
      `Available tools: ${filterEnabledTools(connection).map((tool) => tool.name).join(", ")}.`,
    ].join("\n");
  }

  if (connection.user_id) {
    const context = await getPersonalProfileContext(connection.user_id, connection.include_teammates);
    const teammateSummary = connection.include_teammates && context.teammates.length
      ? `Direct teammates: ${context.teammates
        .slice(0, 6)
        .map((teammate) => `${teammate.name} (${teammate.rolecolor || "No RoleColor yet"})`)
        .join(", ")}.`
      : "Direct teammates are not currently shared with ChatGPT.";

    return [
      `You have access to RoleColorFinder data for this user.`,
      `${context.name} is a ${context.roleProfile?.color || "RoleColor-unavailable"} ${context.roleProfile?.roleType || "professional"}.`,
      `Strengths: ${(context.roleProfile?.strengths || []).join(", ") || "Not available yet"}.`,
      `Blind spots: ${(context.roleProfile?.blindSpots || []).join(", ") || "Not available yet"}.`,
      teammateSummary,
      `When answering questions about work, communication, or relationships, personalize your response to their RoleColor.`,
      `Available tools: ${filterEnabledTools(connection).map((tool) => tool.name).join(", ")}.`,
    ].join("\n");
  }

  return "Use RoleColorFinder tools when a question would benefit from RoleColor-based personalization.";
};

export const buildUnauthorizedToolResponse = (metadataUrl: string, message: string) => ({
  content: [{ type: "text", text: message }],
  isError: true,
  _meta: {
    "mcp/www_authenticate": [
      `Bearer resource_metadata="${metadataUrl}", error="invalid_token", error_description="${message}"`,
    ],
  },
});

export const buildProtectedResourceMetadata = () => ({
  resource: MCP_SERVER_URL,
  authorization_servers: [`${SUPABASE_URL}/functions/v1/chatgpt-oauth-init`],
  scopes_supported: ["rolecolor:read", "team:read", "advice:read"],
  resource_documentation: `${APP_BASE_URL}/settings/integrations`,
});

export const getWeeklyToolCallCount = async (connectionId: string) => {
  const supabase = createServiceSupabaseClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("chatgpt_tool_calls")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", connectionId)
    .gte("occurred_at", since);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
};

export const getRecentToolCalls = async (connectionId: string) => {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("chatgpt_tool_calls")
    .select("id, tool_name, response_summary, latency_ms, is_error, occurred_at")
    .eq("connection_id", connectionId)
    .order("occurred_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const buildBusinessConnectionState = async (connection: ChatgptConnectionRecord) => {
  if (!connection.org_id) {
    throw new HttpError(400, "Missing organization");
  }

  const context = await getBusinessProfileContext(connection);
  const roster = context.roster;
  const completedCount = roster.filter((member) => member.rolecolor).length;
  const completionRate = roster.length ? Math.round((completedCount / roster.length) * 100) : 0;
  const weeklyCalls = await getWeeklyToolCallCount(connection.id);

  return {
    connection: {
      id: connection.id,
      org_id: connection.org_id,
      connection_type: connection.connection_type,
      auto_inject_context: connection.auto_inject_context,
      enabled_tools: getEnabledToolNames(connection),
      scopes_granted: connection.scopes_granted || [],
      last_sync_at: connection.last_sync_at,
      is_active: connection.is_active,
      created_at: connection.created_at,
      updated_at: connection.updated_at,
    },
    company: context.company,
    admin: {
      name: context.adminName,
      email: context.adminEmail,
      rolecolor: context.adminRoleProfile?.color || null,
      role_type: context.adminRoleProfile?.roleType || null,
    },
    stats: {
      member_count: roster.length,
      completed_count: completedCount,
      completion_rate: completionRate,
      pending_count: roster.length - completedCount,
      tool_calls_last_7_days: weeklyCalls,
    },
    tool_history: await getRecentToolCalls(connection.id),
    tools_available: filterEnabledTools(connection),
  };
};

export const buildPersonalConnectionState = async (connection: ChatgptConnectionRecord) => {
  if (!connection.user_id) {
    throw new HttpError(400, "Missing personal user");
  }

  const context = await getPersonalProfileContext(connection.user_id, connection.include_teammates);
  const weeklyCalls = await getWeeklyToolCallCount(connection.id);

  return {
    connection: {
      id: connection.id,
      user_id: connection.user_id,
      connection_type: connection.connection_type,
      share_profile: connection.share_profile,
      include_teammates: connection.include_teammates,
      enabled_tools: getEnabledToolNames(connection),
      scopes_granted: connection.scopes_granted || [],
      last_sync_at: connection.last_sync_at,
      is_active: connection.is_active,
      created_at: connection.created_at,
      updated_at: connection.updated_at,
    },
    profile: context.roleProfile
      ? {
        name: context.name,
        rolecolor: context.roleProfile.color,
        role_type: context.roleProfile.roleType,
        color_hex: context.roleProfile.colorHex,
        summary: context.roleProfile.summary,
        strengths: context.roleProfile.strengths,
        blind_spots: context.roleProfile.blindSpots,
        works_best_with: context.roleProfile.worksBestWith,
        communication_tips: context.roleProfile.communicationTips,
      }
      : null,
    teammates: context.teammates.slice(0, 8).map((teammate) => ({
      name: teammate.name,
      email: teammate.email,
      rolecolor: teammate.rolecolor,
      role_type: teammate.roleType,
      job_title: teammate.jobTitle,
    })),
    stats: {
      teammate_count: context.teammates.length,
      tool_calls_last_7_days: weeklyCalls,
    },
    tool_history: await getRecentToolCalls(connection.id),
    tools_available: filterEnabledTools(connection),
  };
};

const findMemberByQuery = (roster: TeamMemberRecord[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  const ranked = roster
    .map((member) => {
      const email = member.email.toLowerCase();
      const name = member.name.toLowerCase();
      let score = 0;

      if (email === normalizedQuery || name === normalizedQuery) {
        score = 100;
      } else if (email.includes(normalizedQuery)) {
        score = 92;
      } else if (name.includes(normalizedQuery)) {
        score = 88;
      }

      return { member, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.member || null;
};

const ensureToolAllowed = (connection: ChatgptConnectionRecord, toolName: string) => {
  const enabled = new Set(filterEnabledTools(connection).map((tool) => tool.name));
  if (!enabled.has(toolName)) {
    throw new HttpError(403, connection.connection_type === "personal"
      ? "This tool requires a Business account"
      : "This ChatGPT connection does not have that tool enabled");
  }
};

export const executeToolCall = async (connection: ChatgptConnectionRecord, toolName: string, input: Record<string, unknown>) => {
  ensureToolAllowed(connection, toolName);

  if (connection.connection_type === "b2b") {
    const business = await getBusinessProfileContext(connection);
    const roster = business.roster;

    switch (toolName) {
      case "get_my_rolecolor": {
        const profile = business.adminRoleProfile;
        if (!profile) {
          throw new HttpError(404, `No RoleColor found. Complete your assessment: ${buildPortalPath(business.company)}`);
        }

        return {
          name: business.adminName,
          rolecolor: profile.color,
          role_type: profile.roleType,
          color_hex: profile.colorHex,
          summary: profile.summary,
          strengths: profile.strengths,
          blind_spots: profile.blindSpots,
          works_best_with: profile.worksBestWith,
          communication_tips: profile.communicationTips,
        };
      }
      case "get_team_roster": {
        const department = toText(input.department);
        const rolecolor = normalizeColor(input.rolecolor);
        const filtered = roster.filter((member) => {
          if (department && member.department?.toLowerCase() !== department.toLowerCase()) return false;
          if (rolecolor && member.rolecolor !== rolecolor) return false;
          return Boolean(member.rolecolor);
        });

        return filtered.map((member) => ({
          name: member.name,
          email: member.email,
          department: member.department,
          job_title: member.jobTitle,
          rolecolor: member.rolecolor,
          role_type: member.roleType,
          assessment_date: member.assessmentDate,
          color_hex: member.colorHex,
        }));
      }
      case "get_team_composition": {
        const department = toText(input.department);
        const filtered = department
          ? roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase())
          : roster;
        const breakdown = buildTeamBreakdown(filtered);
        const balance = buildBalanceInsight(breakdown);

        return {
          total_members: filtered.length,
          breakdown,
          dominant_color: balance.dominantColor,
          balance_insight: balance.insight,
          missing_strengths: balance.missingStrengths,
          hire_recommendation: balance.hireRecommendation,
        };
      }
      case "get_team_health_score": {
        const department = toText(input.department);
        const filtered = department
          ? roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase())
          : roster;

        return calculateTeamHealthScore(filtered);
      }
      case "get_org_chart_by_rolecolor": {
        const department = toText(input.department);
        const filtered = department
          ? roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase())
          : roster;

        if (!connection.org_id) {
          throw new HttpError(400, "Business connection is missing its organization");
        }

        return {
          department: department || null,
          ...(await buildOrgChartByRoleColor(connection.org_id, filtered)),
        };
      }
      case "get_team_gap_analysis": {
        const department = toText(input.department);
        const filtered = department
          ? roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase())
          : roster;

        return {
          department: department || null,
          ...buildTeamGapAnalysis(filtered),
        };
      }
      case "get_person_profile": {
        const query = toText(input.query);
        if (!query) {
          throw new HttpError(400, "query is required");
        }

        const member = findMemberByQuery(roster.filter((entry) => entry.rolecolor), query);
        if (!member) {
          throw new HttpError(404, "No matching team member with a completed RoleColor was found");
        }

        return buildPersonProfile(member);
      }
      case "get_succession_plan": {
        const query = toText(input.person_query);
        if (!query) {
          throw new HttpError(400, "person_query is required");
        }

        const member = findMemberByQuery(roster, query);
        if (!member) {
          throw new HttpError(404, "No matching team member was found");
        }

        const remaining = roster.filter((candidate) => candidate.id !== member.id);
        const beforeHealth = calculateTeamHealthScore(roster);
        const afterHealth = calculateTeamHealthScore(remaining);
        const gapInsight = member.rolecolor ? getStrengthGapNarrative(member.rolecolor) : null;
        const internalSuccessors = remaining
          .filter((candidate) => Boolean(candidate.rolecolor))
          .map((candidate) => {
            let readinessScore = 20;

            if (member.rolecolor && candidate.rolecolor === member.rolecolor) {
              readinessScore += 45;
            }
            if (member.department && candidate.department && member.department.toLowerCase() === candidate.department.toLowerCase()) {
              readinessScore += 20;
            }
            if (member.jobTitle && candidate.jobTitle && member.jobTitle.toLowerCase() === candidate.jobTitle.toLowerCase()) {
              readinessScore += 10;
            }
            if (member.rolecolor && candidate.rolecolor) {
              readinessScore += Math.round(scorePair(member.rolecolor, candidate.rolecolor) / 10);
            }

            return {
              name: candidate.name,
              email: candidate.email,
              department: candidate.department,
              job_title: candidate.jobTitle,
              rolecolor: candidate.rolecolor,
              role_type: candidate.roleType,
              readiness_score: clamp(readinessScore, 0, 100),
              rationale:
                candidate.rolecolor === member.rolecolor
                  ? "Closest like-for-like RoleColor replacement."
                  : candidate.department && member.department && candidate.department.toLowerCase() === member.department.toLowerCase()
                  ? "Strong contextual successor from the same department."
                  : "Useful complementary style who could absorb part of the gap.",
            };
          })
          .sort((left, right) => right.readiness_score - left.readiness_score)
          .slice(0, 5);

        return {
          person: {
            name: member.name,
            email: member.email,
            department: member.department,
            job_title: member.jobTitle,
            rolecolor: member.rolecolor,
            role_type: member.roleType,
          },
          health_score_before: beforeHealth.score,
          health_score_after: afterHealth.score,
          gap_created: member.rolecolor
            ? afterHealth.missing_colors.includes(member.rolecolor)
              ? `If ${member.name} leaves, the team loses its last ${gapInsight?.role_type || member.roleType || member.rolecolor}.`
              : `If ${member.name} leaves, ${member.rolecolor} coverage becomes thinner but remains represented.`
            : "This teammate has no completed RoleColor yet, so the gap is primarily capacity and context rather than a quantified RoleColor loss.",
          what_the_team_loses: gapInsight?.missing_strengths || [],
          risk_summary: gapInsight?.impact || "Assess this role manually for capacity and knowledge-transfer risk.",
          internal_successors: internalSuccessors,
        };
      }
      case "clone_team_blueprint": {
        const department = toText(input.department);
        const sourceRoster = department
          ? roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase())
          : roster;
        const requestedTargetSize = typeof input.target_team_size === "number"
          ? Math.round(input.target_team_size)
          : Number.parseInt(String(input.target_team_size || ""), 10);
        const targetTeamSize = Number.isFinite(requestedTargetSize) && requestedTargetSize > 0
          ? requestedTargetSize
          : sourceRoster.length || 1;

        return {
          source_scope: department || business.company.name,
          ...buildCloneTeamBlueprint(sourceRoster, targetTeamSize),
        };
      }
      case "get_collaboration_score": {
        const personAQuery = toText(input.person_a_query);
        const personBQuery = toText(input.person_b_query);
        const departmentA = toText(input.department_a);
        const departmentB = toText(input.department_b);
        const context = toText(input.context);

        if (personAQuery && personBQuery) {
          const personA = findMemberByQuery(roster.filter((member) => Boolean(member.rolecolor)), personAQuery);
          const personB = findMemberByQuery(roster.filter((member) => Boolean(member.rolecolor)), personBQuery);

          if (!personA || !personB) {
            throw new HttpError(404, "Both teammates need a completed RoleColor for a collaboration score");
          }

          const compatibility = buildCompatibilityResponse(personA.rolecolor as string, personB.rolecolor as string, context);
          return {
            mode: "people",
            collaboration_score: compatibility.compatibility_score,
            pair: compatibility.pair,
            people: [
              { name: personA.name, email: personA.email, rolecolor: personA.rolecolor, role_type: personA.roleType },
              { name: personB.name, email: personB.email, rolecolor: personB.rolecolor, role_type: personB.roleType },
            ],
            strengths: compatibility.natural_strengths,
            tensions: compatibility.natural_tensions,
            recommendations: compatibility.tips_for_color_a.concat(compatibility.tips_for_color_b).slice(0, 4),
            context_advice: compatibility.context_advice,
          };
        }

        if (departmentA && departmentB) {
          const left = roster.filter((member) => member.department?.toLowerCase() === departmentA.toLowerCase());
          const right = roster.filter((member) => member.department?.toLowerCase() === departmentB.toLowerCase());
          const collaborationScore = averagePairCompatibility(left, right);

          if (collaborationScore === null) {
            throw new HttpError(404, "Both departments need assessed members for a collaboration score");
          }

          return {
            mode: "departments",
            collaboration_score: collaborationScore,
            department_a: {
              name: departmentA,
              member_count: left.length,
              breakdown: buildTeamBreakdown(left),
            },
            department_b: {
              name: departmentB,
              member_count: right.length,
              breakdown: buildTeamBreakdown(right),
            },
            strengths: "Cross-functional collaboration is strongest when the departments understand each other's pace and decision style.",
            tensions: "Friction usually comes from mismatched urgency, detail depth, or decision-making style rather than intent.",
            recommendations: [
              "Set explicit decision owners before joint work begins.",
              "Adapt meeting pace and detail level to both departments' dominant colors.",
              "Use shared written briefs to bridge strategic and executional styles.",
            ],
            context_advice: context
              ? `Context-specific note: ${redactFreeText(context)}`
              : "Use the dominant colors in each department to shape meeting structure, escalation paths, and handoffs.",
          };
        }

        throw new HttpError(400, "Provide either person_a_query/person_b_query or department_a/department_b");
      }
      case "compare_departments": {
        const requestedDepartments = Array.isArray(input.departments) ? input.departments.map((value) => String(value)) : null;
        return buildDepartmentComparison(roster, requestedDepartments);
      }
      case "suggest_hire_rolecolor": {
        const department = toText(input.department);
        const priority = toText(input.priority)?.toLowerCase() || "balance";
        const filtered = department
          ? roster.filter((member) => member.department?.toLowerCase() === department.toLowerCase())
          : roster;
        const breakdown = buildTeamBreakdown(filtered);
        const balance = buildBalanceInsight(breakdown);
        const recommendedColor =
          priority === "execution"
            ? "Yellow"
            : priority === "vision"
            ? "Blue"
            : priority === "culture"
            ? "Red"
            : balance.missingColor;
        const profile = getRoleProfile(recommendedColor)!;

        return {
          recommended_color: profile.color,
          recommended_role_type: profile.roleType,
          reasoning: `${profile.color} fills the biggest current gap while complementing the team's dominant style.`,
          current_gap: balance.missingStrengths.join(", "),
          job_description_tips: [
            `Signal that the role values ${profile.strengths[0].toLowerCase()}.`,
            `Describe success in a way that rewards ${profile.communicationTips[0].toLowerCase()}.`,
          ],
          interview_questions: [
            `Tell me about a time you leaned on ${profile.strengths[0].toLowerCase()} under pressure.`,
            `How do you manage the risk that you ${profile.blindSpots[0].toLowerCase()}?`,
            `What teammates help you do your best work, and why?`,
          ],
        };
      }
      case "get_pending_assessments": {
        const pending = roster.filter((member) => !member.rolecolor);
        const completionRate = roster.length ? Math.round(((roster.length - pending.length) / roster.length) * 100) : 0;

        return {
          pending_count: pending.length,
          pending_members: pending.map((member) => ({
            name: member.name,
            email: member.email,
            department: member.department,
            invited_at: member.invitedAt || member.createdAt,
          })),
          completion_rate: completionRate,
        };
      }
      default:
        break;
    }
  }

  if (toolName === "get_my_rolecolor") {
    if (!connection.user_id) {
      throw new HttpError(404, "No connected user was found for this personal account");
    }

    const personal = await getPersonalProfileContext(connection.user_id, connection.include_teammates);
    const profile = personal.roleProfile;
    if (!profile) {
      throw new HttpError(404, `No RoleColor found. Complete your assessment: ${buildPortalPath(null)}`);
    }

    return {
      name: personal.name,
      rolecolor: profile.color,
      role_type: profile.roleType,
      color_hex: profile.colorHex,
      summary: profile.summary,
      strengths: profile.strengths,
      blind_spots: profile.blindSpots,
      works_best_with: profile.worksBestWith,
      communication_tips: profile.communicationTips,
      teammates: connection.include_teammates
        ? personal.teammates.map((teammate) => ({
          name: teammate.name,
          rolecolor: teammate.rolecolor,
          role_type: teammate.roleType,
        }))
        : [],
    };
  }

  if (toolName === "get_compatibility") {
    return buildCompatibilityResponse(String(input.color_a || ""), String(input.color_b || ""), toText(input.context));
  }

  if (toolName === "get_conflict_advice") {
    return buildConflictAdviceResponse({
      situation: String(input.situation || ""),
      personAColor: String(input.person_a_color || ""),
      personBColor: String(input.person_b_color || ""),
      personARole: toText(input.person_a_role),
      personBRole: toText(input.person_b_role),
    });
  }

  if (toolName === "get_communication_style") {
    const recipientColor = normalizeColor(input.recipient_color);
    if (!recipientColor) {
      throw new HttpError(400, "recipient_color must be Red, Yellow, Green, or Blue");
    }

    const profile = getRoleProfile(recipientColor)!;
    const template = getCommunicationTemplate(recipientColor as keyof typeof COMMUNICATION_STYLES, toText(input.message_type));

    return {
      recipient_color: profile.color,
      recipient_role: profile.roleType,
      ...template,
      context: toText(input.context),
    };
  }

  if (connection.connection_type === "personal") {
    throw new HttpError(403, "This tool requires a Business account");
  }

  throw new HttpError(404, `Unknown tool: ${toolName}`);
};

export const mcpSuccess = (id: string | number | null, result: Record<string, unknown>) =>
  json({
    jsonrpc: "2.0",
    id,
    result,
  });

export const mcpError = (id: string | number | null, code: number, message: string, data?: unknown, status = 200) =>
  json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data,
      },
    },
    status,
  );

export const buildToolsListResult = (connection: ChatgptConnectionRecord | null) => ({
  tools: connection ? filterEnabledTools(connection) : [],
});

export const buildInitializeResult = async (connection: ChatgptConnectionRecord | null) => ({
  protocolVersion: MCP_PROTOCOL_VERSION,
  capabilities: {
    tools: {
      listChanged: false,
    },
  },
  serverInfo: {
    name: "RoleColorFinder MCP",
    version: "1.0.0",
  },
  instructions: connection
    ? await buildSystemInstructions(connection)
    : "Authenticate with RoleColorFinder to access RoleColor-aware tools and team context.",
});
