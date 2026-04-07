// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-merge-webhook-signature",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

type ProcessEnv = Record<string, string | undefined>;

const process = {
  env:
    ((globalThis as typeof globalThis & { process?: { env?: ProcessEnv } }).process?.env as ProcessEnv | undefined) ??
    Deno.env.toObject(),
};

export type MergeCategory = "hris" | "ats";

export interface MergeConnectionRecord {
  id: string;
  org_id: string;
  platform_name: string;
  category: MergeCategory;
  integration_slug: string | null;
  account_token: string | null;
  linked_account_id: string | null;
  webhook_listener_url: string | null;
  connection_status: "connected" | "reconnect_required" | "disconnected";
  sync_status: "idle" | "syncing" | "retrying" | "error";
  connected_at: string;
  last_synced_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  is_active: boolean;
}

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
  };
  supabase: ReturnType<typeof createClient>;
}

export interface MergeSummaryCounts {
  employees: number;
  jobs: number;
  candidates: number;
  applications: number;
}

export interface ConnectionSummary {
  id: string;
  orgId: string;
  platformName: string;
  category: MergeCategory;
  integration: string | null;
  connectionStatus: MergeConnectionRecord["connection_status"];
  syncStatus: MergeConnectionRecord["sync_status"];
  connectedAt: string;
  lastSyncedAt: string | null;
  counts: MergeSummaryCounts;
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class MergeApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError;
export const isMergeApiError = (error: unknown): error is MergeApiError => error instanceof MergeApiError;

const MERGE_BASE_URL = process.env.MERGE_API_BASE_URL || "https://api.merge.dev";
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || "https://rolecolorfinder.com";
const MERGE_ATS_EXTERNAL_SOURCE = "merge_ats";

const REQUIRED_COMPANY_ROLES = new Set(["admin", "hr"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const createServiceSupabaseClient = () =>
  createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"));

const createAuthSupabaseClient = (authHeader: string) =>
  createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_ANON_KEY"), {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

const parseJsonSafely = (value: string) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

const asArray = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const chunkArray = <T>(items: T[], chunkSize = 100) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const extractNamedValue = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return toText(value);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      toText(record.name) ||
      toText(record.value) ||
      toText(record.title) ||
      toText(record.label) ||
      toText(record.display_name) ||
      toText(record.remote_id) ||
      toText(record.id)
    );
  }

  return null;
};

const extractStringArray = (value: unknown): string[] => {
  const output = new Set<string>();
  for (const item of asArray(value)) {
    const next = extractNamedValue(item);
    if (next) output.add(next);
  }
  return [...output];
};

const extractPrimaryEmail = (value: Record<string, unknown>) => {
  const direct = normalizeEmail(value.email) || normalizeEmail(value.work_email) || normalizeEmail(value.personal_email);
  if (direct) return direct;

  const emailAddresses = asArray<Record<string, unknown>>(value.email_addresses);
  const primary = emailAddresses.find((item) => item.primary === true || item.email_address_type === "WORK");
  return (
    normalizeEmail(primary?.value) ||
    normalizeEmail(primary?.email_address) ||
    normalizeEmail(primary?.email) ||
    normalizeEmail(emailAddresses[0]?.value) ||
    normalizeEmail(emailAddresses[0]?.email_address) ||
    normalizeEmail(emailAddresses[0]?.email)
  );
};

const extractPrimaryPhone = (value: Record<string, unknown>) => {
  const direct = toText(value.phone) || toText(value.phone_number) || toText(value.mobile_phone_number);
  if (direct) return direct;

  const phoneNumbers = asArray<Record<string, unknown>>(value.phone_numbers);
  const primary = phoneNumbers.find((item) => item.primary === true);
  return (
    toText(primary?.value) ||
    toText(primary?.phone_number) ||
    toText(phoneNumbers[0]?.value) ||
    toText(phoneNumbers[0]?.phone_number)
  );
};

const extractEmployment = (employee: Record<string, unknown>) => {
  const employments = asArray<Record<string, unknown>>(employee.employments);
  return employments.find((entry) => !entry.end_date) || employments[0] || null;
};

type JobPostingStatus = "draft" | "open" | "paused" | "closed" | "filled";
type EmploymentType = "full_time" | "part_time" | "contract" | "temporary" | "internship";
type RemotePolicy = "onsite" | "remote" | "hybrid";
type HiringStageType =
  | "applied"
  | "screening"
  | "phone_interview"
  | "technical_interview"
  | "onsite_interview"
  | "reference_check"
  | "offer"
  | "hired";

const DEFAULT_PIPELINE_STAGES: Array<{
  name: string;
  stage_type: HiringStageType;
  color_code: string;
  is_final_stage?: boolean;
}> = [
  { name: "Applied", stage_type: "applied", color_code: "#6B7280" },
  { name: "Phone Screen", stage_type: "phone_interview", color_code: "#3B82F6" },
  { name: "Technical Interview", stage_type: "technical_interview", color_code: "#8B5CF6" },
  { name: "Onsite Interview", stage_type: "onsite_interview", color_code: "#EC4899" },
  { name: "Reference Check", stage_type: "reference_check", color_code: "#F59E0B" },
  { name: "Offer", stage_type: "offer", color_code: "#10B981" },
  { name: "Hired", stage_type: "hired", color_code: "#059669", is_final_stage: true },
];

const countActiveRows = async (supabase: ReturnType<typeof createClient>, table: string, orgId: string) => {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("is_active", true);

  if (error) {
    console.error(`Failed to count rows for ${table}`, error);
    return 0;
  }

  return count || 0;
};

const upsertRowsInChunks = async (
  supabase: ReturnType<typeof createClient>,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) => {
  if (!rows.length) return;

  for (const chunk of chunkArray(rows, 100)) {
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) {
      throw new Error(`Failed to upsert ${table}: ${error.message}`);
    }
  }
};

const createDefaultStagesForJob = async (
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  jobPostingId: string,
) => {
  const stageRows = DEFAULT_PIPELINE_STAGES.map((stage, index) => ({
    company_id: companyId,
    job_posting_id: jobPostingId,
    name: stage.name,
    stage_type: stage.stage_type,
    color_code: stage.color_code,
    stage_order: index,
    is_final_stage: Boolean(stage.is_final_stage),
  }));

  const { error } = await supabase.from("hiring_pipeline_stages").insert(stageRows);
  if (error) {
    throw new Error(`Failed to create default pipeline stages: ${error.message}`);
  }
};

const ensureDefaultStagesForJobs = async (
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  jobPostingIds: string[],
) => {
  if (!jobPostingIds.length) return;

  const { data: existingStages, error } = await supabase
    .from("hiring_pipeline_stages")
    .select("job_posting_id")
    .eq("company_id", companyId)
    .in("job_posting_id", jobPostingIds);

  if (error) {
    throw new Error(`Failed to load pipeline stages: ${error.message}`);
  }

  const jobIdsWithStages = new Set(
    asArray<Record<string, unknown>>(existingStages)
      .map((stage) => toText(stage.job_posting_id))
      .filter((value): value is string => Boolean(value)),
  );

  for (const jobPostingId of jobPostingIds) {
    if (!jobIdsWithStages.has(jobPostingId)) {
      await createDefaultStagesForJob(supabase, companyId, jobPostingId);
    }
  }
};

export async function requireCompanyAccess(req: Request, orgId: string): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Missing authorization header");
  }

  const authClient = createAuthSupabaseClient(authHeader);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    throw new HttpError(401, "Unauthorized");
  }

  const supabase = createServiceSupabaseClient();

  const { data: membership, error: membershipError } = await supabase
    .from("company_users")
    .select("id, role")
    .eq("company_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new HttpError(500, "Failed to verify company access");
  }

  if (!membership || !REQUIRED_COMPANY_ROLES.has(membership.role)) {
    throw new HttpError(403, "Only company admins and HR users can manage Merge integrations");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, subdomain")
    .eq("id", orgId)
    .maybeSingle();

  if (companyError || !company) {
    throw new HttpError(404, "Company not found");
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    membership,
    company: company as CompanyContext,
    supabase,
  };
}

export async function logMergeSyncError(params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  platform: string;
  category?: MergeCategory | null;
  errorCode?: string | null;
  errorMessage: string;
  context?: Record<string, unknown>;
}) {
  const { error } = await params.supabase.from("merge_sync_errors").insert({
    org_id: params.orgId,
    platform: params.platform || "Unknown",
    category: params.category ?? null,
    error_code: params.errorCode ?? null,
    error_message: params.errorMessage,
    context: params.context ?? {},
  });

  if (error) {
    console.error("Failed to log merge sync error", error);
  }
}

export async function getConnectionByCategory(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  category: MergeCategory,
) {
  const { data, error } = await supabase
    .from("merge_connections")
    .select(
      [
        "id",
        "org_id",
        "platform_name",
        "category",
        "integration_slug",
        "account_token",
        "linked_account_id",
        "webhook_listener_url",
        "connection_status",
        "sync_status",
        "connected_at",
        "last_synced_at",
        "last_error_code",
        "last_error_message",
        "is_active",
      ].join(", "),
    )
    .eq("org_id", orgId)
    .eq("category", category)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load ${category} connection: ${error.message}`);
  }

  return (data as MergeConnectionRecord | null) ?? null;
}

export async function saveConnection(params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  platformName: string;
  category: MergeCategory;
  integration: string | null;
  accountToken: string;
  linkedAccountId?: string | null;
  webhookListenerUrl?: string | null;
}) {
  const now = new Date().toISOString();

  const { data, error } = await params.supabase
    .from("merge_connections")
    .upsert(
      {
        org_id: params.orgId,
        platform_name: params.platformName,
        category: params.category,
        integration_slug: params.integration,
        account_token: params.accountToken,
        linked_account_id: params.linkedAccountId ?? null,
        webhook_listener_url: params.webhookListenerUrl ?? null,
        connection_status: "connected",
        sync_status: "idle",
        last_error_code: null,
        last_error_message: null,
        connected_at: now,
        updated_at: now,
        is_active: true,
      },
      { onConflict: "org_id,category" },
    )
    .select(
      [
        "id",
        "org_id",
        "platform_name",
        "category",
        "integration_slug",
        "account_token",
        "linked_account_id",
        "webhook_listener_url",
        "connection_status",
        "sync_status",
        "connected_at",
        "last_synced_at",
        "last_error_code",
        "last_error_message",
        "is_active",
      ].join(", "),
    )
    .single();

  if (error) {
    throw new Error(`Failed to save Merge connection: ${error.message}`);
  }

  return data as MergeConnectionRecord;
}

export async function setConnectionState(params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  category: MergeCategory;
  values: Record<string, unknown>;
}) {
  const { error } = await params.supabase
    .from("merge_connections")
    .update({
      ...params.values,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", params.orgId)
    .eq("category", params.category);

  if (error) {
    throw new Error(`Failed to update ${params.category} connection: ${error.message}`);
  }
}

const parseRetryAfterSeconds = (value: string | null, attempt: number) => {
  const seconds = value ? Number(value) : NaN;
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }
  return Math.min(30_000, 1_000 * 2 ** attempt);
};

const buildMergeUrl = (path: string, query?: Record<string, string | number | boolean | null | undefined>) => {
  const url = new URL(path.startsWith("http") ? path : `${MERGE_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === null || value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  return url;
};

const markReconnectRequired = async (params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  category: MergeCategory;
  platformName: string;
  message: string;
}) => {
  await setConnectionState({
    supabase: params.supabase,
    orgId: params.orgId,
    category: params.category,
    values: {
      connection_status: "reconnect_required",
      sync_status: "error",
      last_error_code: "401",
      last_error_message: params.message,
    },
  });

  await logMergeSyncError({
    supabase: params.supabase,
    orgId: params.orgId,
    platform: params.platformName,
    category: params.category,
    errorCode: "401",
    errorMessage: params.message,
  });
};

const markDisconnected = async (params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  category: MergeCategory;
  platformName: string;
  message: string;
}) => {
  await setConnectionState({
    supabase: params.supabase,
    orgId: params.orgId,
    category: params.category,
    values: {
      connection_status: "disconnected",
      sync_status: "error",
      account_token: null,
      last_error_code: "404",
      last_error_message: params.message,
      is_active: false,
    },
  });

  await softDeleteCategoryRecords(params.supabase, params.orgId, params.category);

  await logMergeSyncError({
    supabase: params.supabase,
    orgId: params.orgId,
    platform: params.platformName,
    category: params.category,
    errorCode: "404",
    errorMessage: params.message,
  });
};

export async function callMergeApi<T>(params: {
  supabase: ReturnType<typeof createClient>;
  path: string;
  method?: string;
  body?: Record<string, unknown> | null;
  query?: Record<string, string | number | boolean | null | undefined>;
  accountToken?: string | null;
  orgId?: string;
  category?: MergeCategory;
  platformName?: string;
  retries?: number;
}) {
  const apiKey = process.env.REACT_APP_MERGE_API_KEY;
  if (!apiKey) {
    throw new Error("REACT_APP_MERGE_API_KEY is not configured");
  }

  const retries = params.retries ?? 4;
  const method = params.method || (params.body ? "POST" : "GET");
  let attempt = 0;

  while (attempt <= retries) {
    const url = buildMergeUrl(params.path, params.query);
    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(params.accountToken ? { "X-Account-Token": params.accountToken } : {}),
        ...(params.body ? { "Content-Type": "application/json" } : {}),
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
    });

    const text = await response.text();
    const payload = parseJsonSafely(text);

    if (response.ok) {
      return payload as T;
    }

    const message =
      toText((payload as Record<string, unknown> | null)?.detail) ||
      toText((payload as Record<string, unknown> | null)?.message) ||
      toText((payload as Record<string, unknown> | null)?.error) ||
      `${method} ${params.path} failed with status ${response.status}`;

    if (response.status === 429) {
      if (params.orgId && params.category) {
        await setConnectionState({
          supabase: params.supabase,
          orgId: params.orgId,
          category: params.category,
          values: {
            sync_status: "retrying",
            last_error_code: "429",
            last_error_message: message,
          },
        });

        await logMergeSyncError({
          supabase: params.supabase,
          orgId: params.orgId,
          platform: params.platformName || "Unknown",
          category: params.category,
          errorCode: "429",
          errorMessage: message,
          context: {
            path: params.path,
            attempt,
          },
        });
      }

      if (attempt === retries) {
        throw new MergeApiError(429, "RATE_LIMITED", message, payload);
      }

      await sleep(parseRetryAfterSeconds(response.headers.get("Retry-After"), attempt));
      attempt += 1;
      continue;
    }

    if (response.status === 401 && params.orgId && params.category) {
      await markReconnectRequired({
        supabase: params.supabase,
        orgId: params.orgId,
        category: params.category,
        platformName: params.platformName || "Unknown",
        message,
      });
      throw new MergeApiError(401, "RECONNECT_REQUIRED", message, payload);
    }

    if (response.status === 404 && params.accountToken && params.orgId && params.category) {
      await markDisconnected({
        supabase: params.supabase,
        orgId: params.orgId,
        category: params.category,
        platformName: params.platformName || "Unknown",
        message,
      });
      throw new MergeApiError(404, "ACCOUNT_NOT_FOUND", message, payload);
    }

    if (response.status >= 500 && response.status < 600 && attempt < retries) {
      await sleep(parseRetryAfterSeconds(response.headers.get("Retry-After"), attempt));
      attempt += 1;
      continue;
    }

    if (params.orgId) {
      await logMergeSyncError({
        supabase: params.supabase,
        orgId: params.orgId,
        platform: params.platformName || "Unknown",
        category: params.category ?? null,
        errorCode: String(response.status),
        errorMessage: message,
        context: {
          path: params.path,
          payload,
        },
      });
    }

    throw new MergeApiError(response.status, String(response.status), message, payload);
  }

  throw new MergeApiError(500, "UNKNOWN", `Unexpected Merge request failure for ${params.path}`);
}

export async function fetchMergePages<T>(params: {
  supabase: ReturnType<typeof createClient>;
  path: string;
  category: MergeCategory;
  orgId: string;
  platformName: string;
  accountToken: string;
}) {
  const results: T[] = [];
  let cursor: string | null = null;

  while (true) {
    const payload = await callMergeApi<{ results?: T[]; next?: string | null }>({
      supabase: params.supabase,
      path: params.path,
      category: params.category,
      orgId: params.orgId,
      platformName: params.platformName,
      accountToken: params.accountToken,
      query: {
        page_size: 100,
        cursor,
        include_deleted_data: true,
        include_remote_data: true,
      },
    });

    results.push(...asArray<T>(payload?.results));

    const nextCursor = toText(payload?.next);
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return results;
}

const buildConnectionSummary = async (
  supabase: ReturnType<typeof createClient>,
  connection: MergeConnectionRecord,
): Promise<ConnectionSummary> => {
  const counts: MergeSummaryCounts = {
    employees: 0,
    jobs: 0,
    candidates: 0,
    applications: 0,
  };

  if (connection.category === "hris") {
    counts.employees = await countActiveRows(supabase, "hris_employees", connection.org_id);
  } else {
    const [jobs, candidates, applications] = await Promise.all([
      countActiveRows(supabase, "ats_jobs", connection.org_id),
      countActiveRows(supabase, "ats_candidates", connection.org_id),
      countActiveRows(supabase, "ats_applications", connection.org_id),
    ]);
    counts.jobs = jobs;
    counts.candidates = candidates;
    counts.applications = applications;
  }

  return {
    id: connection.id,
    orgId: connection.org_id,
    platformName: connection.platform_name,
    category: connection.category,
    integration: connection.integration_slug,
    connectionStatus: connection.connection_status,
    syncStatus: connection.sync_status,
    connectedAt: connection.connected_at,
    lastSyncedAt: connection.last_synced_at,
    counts,
  };
};

export async function listConnectionSummaries(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
) {
  const { data, error } = await supabase
    .from("merge_connections")
    .select(
      [
        "id",
        "org_id",
        "platform_name",
        "category",
        "integration_slug",
        "linked_account_id",
        "webhook_listener_url",
        "connection_status",
        "sync_status",
        "connected_at",
        "last_synced_at",
        "last_error_code",
        "last_error_message",
        "is_active",
      ].join(", "),
    )
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("connected_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list Merge connections: ${error.message}`);
  }

  const summaries = await Promise.all(
    asArray<MergeConnectionRecord>(data).map((connection) => buildConnectionSummary(supabase, connection)),
  );

  return summaries;
}

const findAssessmentByEmail = async (
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  email: string,
) => {
  const normalizedEmail = email.toLowerCase();

  const { data: companyUser } = await supabase
    .from("company_users")
    .select("assessment_result_id")
    .eq("company_id", orgId)
    .eq("email", normalizedEmail)
    .not("assessment_result_id", "is", null)
    .order("assessment_completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (companyUser?.assessment_result_id) {
    return companyUser.assessment_result_id as string;
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("assessment_result_id")
    .eq("company_id", orgId)
    .eq("email", normalizedEmail)
    .not("assessment_result_id", "is", null)
    .order("assessment_completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (candidate?.assessment_result_id as string | null) ?? null;
};

const ensureInviteCode = async (supabase: ReturnType<typeof createClient>, companyUserId: string) => {
  const { data: generatedCode, error: generateError } = await supabase.rpc("generate_invite_code");
  if (generateError || !generatedCode) {
    throw new Error(generateError?.message || "Failed to generate invite code");
  }

  const { error: updateError } = await supabase
    .from("company_users")
    .update({
      invite_code: generatedCode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyUserId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return generatedCode as string;
};

const sendAssessmentInvite = async (params: {
  supabase: ReturnType<typeof createClient>;
  company: CompanyContext;
  orgId: string;
  employeeRowId: string;
  email: string;
  fullName: string | null;
}) => {
  const normalizedEmail = params.email.toLowerCase();

  const { data: initialCompanyUser, error: companyUserError } = await params.supabase
    .from("company_users")
    .select("id, email, status, invite_code, assessment_result_id")
    .eq("company_id", params.orgId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  let companyUser = initialCompanyUser;

  if (companyUserError) {
    throw new Error(companyUserError.message);
  }

  if (companyUser?.assessment_result_id) {
    return false;
  }

  if (!companyUser) {
    const { data: inserted, error: insertError } = await params.supabase
      .from("company_users")
      .insert({
        company_id: params.orgId,
        email: normalizedEmail,
        role: "employee",
        status: "invited",
        full_name: params.fullName,
      })
      .select("id, email, status, invite_code, assessment_result_id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message || "Failed to create assessment invite");
    }

    companyUser = inserted;
  } else if (!companyUser.invite_code) {
    const inviteCode = await ensureInviteCode(params.supabase, companyUser.id);
    companyUser.invite_code = inviteCode;
  }

  if (companyUser.status === "revoked") {
    return false;
  }

  const assessmentUrl = params.company.subdomain
    ? `${APP_BASE_URL}/company/${params.company.subdomain}/login`
    : `${APP_BASE_URL}/company/login`;

  const response = await fetch(`${getRequiredEnv("SUPABASE_URL")}/functions/v1/send-assessment-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      to: normalizedEmail,
      candidateName: params.fullName || normalizedEmail.split("@")[0] || "Team member",
      companyName: params.company.name,
      assessmentCategory: "professional",
      assessmentType: "25q",
      inviteCode: companyUser.invite_code,
      assessmentUrl,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to send RoleColor invite");
  }

  const { error: employeeUpdateError } = await params.supabase
    .from("hris_employees")
    .update({
      assessment_invite_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.employeeRowId);

  if (employeeUpdateError) {
    console.error("Failed to record RoleColor invite timestamp", employeeUpdateError);
  }

  return true;
};

const runRoleColorLinking = async (params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  company: CompanyContext;
  employeeRows: Array<{
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    assessment_invite_sent_at: string | null;
  }>;
}) => {
  let linked = 0;
  let invitesSent = 0;

  for (const row of params.employeeRows) {
    const email = normalizeEmail(row.email);
    if (!email) continue;

    const assessmentResultId = await findAssessmentByEmail(params.supabase, params.orgId, email);

    if (assessmentResultId) {
      const { error } = await params.supabase
        .from("hris_employees")
        .update({
          rolecolor_id: assessmentResultId,
          rolecolor_status: "matched",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (!error) {
        linked += 1;
      }
      continue;
    }

    const { error: pendingError } = await params.supabase
      .from("hris_employees")
      .update({
        rolecolor_id: null,
        rolecolor_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (pendingError) {
      console.error("Failed to update pending RoleColor state", pendingError);
      continue;
    }

    if (!row.assessment_invite_sent_at) {
      const fullName = [toText(row.first_name), toText(row.last_name)].filter(Boolean).join(" ") || null;
      try {
        const sent = await sendAssessmentInvite({
          supabase: params.supabase,
          company: params.company,
          orgId: params.orgId,
          employeeRowId: row.id,
          email,
          fullName,
        });
        if (sent) invitesSent += 1;
      } catch (error) {
        await logMergeSyncError({
          supabase: params.supabase,
          orgId: params.orgId,
          platform: "RoleColor",
          category: "hris",
          errorCode: "INVITE_FAILED",
          errorMessage: error instanceof Error ? error.message : "Failed to send RoleColor invite",
          context: { employeeId: row.id, email },
        });
      }
    }
  }

  return { linked, invitesSent };
};

const mapHrisEmployee = (
  orgId: string,
  platformName: string,
  employee: Record<string, unknown>,
  syncedAt: string,
) => {
  const employment = extractEmployment(employee);

  return {
    org_id: orgId,
    merge_id: toText(employee.id) || toText(employee.remote_id),
    platform_name: platformName,
    first_name: toText(employee.first_name),
    last_name: toText(employee.last_name),
    email: extractPrimaryEmail(employee),
    department: extractNamedValue(employment?.department) || extractNamedValue(employee.department),
    job_title: toText(employment?.job_title) || toText(employee.job_title),
    employment_status: extractNamedValue(employment?.employment_status) || extractNamedValue(employee.employment_status),
    manager_id: toText((employment?.manager as Record<string, unknown> | undefined)?.id) ||
      toText((employee.manager as Record<string, unknown> | undefined)?.id),
    avatar_url: toText(employee.avatar) || toText(employee.avatar_url),
    raw_data: employee,
    last_synced_at: syncedAt,
    is_active: !employee.remote_was_deleted,
    updated_at: syncedAt,
  };
};

const mapAtsJob = (orgId: string, platformName: string, job: Record<string, unknown>, syncedAt: string) => ({
  org_id: orgId,
  merge_id: toText(job.id) || toText(job.remote_id),
  platform_name: platformName,
  title: toText(job.name) || toText(job.title),
  status: extractNamedValue(job.status),
  departments: extractStringArray(job.departments),
  offices: extractStringArray(job.offices),
  raw_data: job,
  last_synced_at: syncedAt,
  is_active: !job.remote_was_deleted,
  updated_at: syncedAt,
});

const mapJobPostingStatus = (value: unknown): JobPostingStatus => {
  const normalized = (toText(value) || "").toLowerCase();
  if (normalized.includes("filled") || normalized.includes("hire")) return "filled";
  if (normalized.includes("open") || normalized.includes("published") || normalized.includes("active")) return "open";
  if (normalized.includes("pause") || normalized.includes("hold")) return "paused";
  if (normalized.includes("close") || normalized.includes("archive") || normalized.includes("cancel")) return "closed";
  return "draft";
};

const mapEmploymentType = (value: unknown): EmploymentType => {
  const normalized = (toText(value) || "").toLowerCase();
  if (normalized.includes("part")) return "part_time";
  if (normalized.includes("contract")) return "contract";
  if (normalized.includes("temp")) return "temporary";
  if (normalized.includes("intern")) return "internship";
  return "full_time";
};

const mapRemotePolicy = (values: Array<unknown>): RemotePolicy => {
  const combined = values
    .map((value) => {
      if (typeof value === "string") return value;
      if (typeof value === "object" && value) return extractNamedValue(value) || "";
      return "";
    })
    .join(" ")
    .toLowerCase();

  if (combined.includes("hybrid")) return "hybrid";
  if (combined.includes("remote") || combined.includes("virtual") || combined.includes("distributed")) return "remote";
  return "onsite";
};

const extractJobDescription = (job: Record<string, unknown>) => {
  const direct =
    toText(job.description) ||
    toText(job.job_description) ||
    toText(job.posting_description) ||
    toText(job.content) ||
    toText(job.summary);
  if (direct) return direct;

  const descriptions = asArray<Record<string, unknown>>(job.descriptions);
  for (const description of descriptions) {
    const next =
      toText(description.value) ||
      toText(description.body) ||
      toText(description.description) ||
      toText(description.text);
    if (next) return next;
  }

  return null;
};

const mapAtsJobPosting = (job: Record<string, unknown>, syncedAt: string, existingPublishedAt: string | null) => {
  const mergeId = toText(job.id) || toText(job.remote_id);
  if (!mergeId || Boolean(job.remote_was_deleted)) {
    return null;
  }

  const departments = extractStringArray(job.departments);
  const offices = extractStringArray(job.offices);
  const status = mapJobPostingStatus(job.status);

  return {
    external_id: mergeId,
    title: toText(job.name) || toText(job.title) || "Untitled role",
    description: extractJobDescription(job),
    department: departments[0] || extractNamedValue(job.department),
    location:
      toText(job.location) ||
      toText(job.location_name) ||
      toText(job.work_location) ||
      offices.join(", ") ||
      null,
    status,
    employment_type: mapEmploymentType(
      extractNamedValue(job.employment_type) ||
        extractNamedValue(job.job_type) ||
        extractNamedValue(job.employment_status),
    ),
    remote_policy: mapRemotePolicy([
      job.remote_policy,
      job.workplace_type,
      job.location_type,
      job.work_location_type,
      ...offices,
    ]),
    published_at: existingPublishedAt || (status === "open" ? syncedAt : null),
    updated_at: syncedAt,
  };
};

const syncAtsJobPostings = async (params: {
  supabase: ReturnType<typeof createClient>;
  connection: MergeConnectionRecord;
  jobsFetched: boolean;
  jobs: Record<string, unknown>[];
  syncedAt: string;
}) => {
  if (!params.jobsFetched) {
    return { created: 0, updated: 0, deleted: 0, synced: 0, skipped: true };
  }

  const { data: existingRows, error: existingError } = await params.supabase
    .from("job_postings")
    .select("id, external_id, published_at")
    .eq("company_id", params.connection.org_id)
    .eq("external_source", MERGE_ATS_EXTERNAL_SOURCE);

  if (existingError) {
    throw new Error(`Failed to load synced ATS job postings: ${existingError.message}`);
  }

  const existingByExternalId = new Map<
    string,
    {
      id: string;
      published_at: string | null;
    }
  >();

  for (const row of asArray<Record<string, unknown>>(existingRows)) {
    const externalId = toText(row.external_id);
    const id = toText(row.id);
    if (!externalId || !id) continue;
    existingByExternalId.set(externalId, {
      id,
      published_at: toText(row.published_at),
    });
  }

  const activeExternalIds = new Set<string>();
  const syncedJobPostingIds: string[] = [];
  let created = 0;
  let updated = 0;

  for (const job of params.jobs) {
    const mergeId = toText(job.id) || toText(job.remote_id);
    if (!mergeId || Boolean(job.remote_was_deleted)) continue;

    const existingRow = existingByExternalId.get(mergeId);
    const jobPayload = mapAtsJobPosting(job, params.syncedAt, existingRow?.published_at ?? null);
    if (!jobPayload) continue;

    activeExternalIds.add(mergeId);

    const payload = {
      company_id: params.connection.org_id,
      external_source: MERGE_ATS_EXTERNAL_SOURCE,
      ...jobPayload,
    };

    if (existingRow) {
      const { error } = await params.supabase
        .from("job_postings")
        .update(payload)
        .eq("id", existingRow.id);

      if (error) {
        throw new Error(`Failed to update synced ATS job posting: ${error.message}`);
      }

      syncedJobPostingIds.push(existingRow.id);
      updated += 1;
      continue;
    }

    const { data: insertedJob, error } = await params.supabase
      .from("job_postings")
      .insert(payload)
      .select("id")
      .single();

    if (error || !insertedJob) {
      throw new Error(error?.message || "Failed to create synced ATS job posting");
    }

    const insertedId = toText((insertedJob as Record<string, unknown>).id);
    if (insertedId) {
      syncedJobPostingIds.push(insertedId);
    }
    created += 1;
  }

  const staleJobIds = [...existingByExternalId.entries()]
    .filter(([externalId]) => !activeExternalIds.has(externalId))
    .map(([, row]) => row.id);

  if (staleJobIds.length) {
    const { error } = await params.supabase.from("job_postings").delete().in("id", staleJobIds);
    if (error) {
      throw new Error(`Failed to clear stale ATS job postings: ${error.message}`);
    }
  }

  await ensureDefaultStagesForJobs(params.supabase, params.connection.org_id, syncedJobPostingIds);

  return {
    created,
    updated,
    deleted: staleJobIds.length,
    synced: activeExternalIds.size,
    skipped: false,
  };
};

const mapAtsCandidate = (
  orgId: string,
  platformName: string,
  candidate: Record<string, unknown>,
  syncedAt: string,
) => ({
  org_id: orgId,
  merge_id: toText(candidate.id) || toText(candidate.remote_id),
  platform_name: platformName,
  first_name: toText(candidate.first_name),
  last_name: toText(candidate.last_name),
  email: extractPrimaryEmail(candidate),
  phone: extractPrimaryPhone(candidate),
  raw_data: candidate,
  last_synced_at: syncedAt,
  is_active: !candidate.remote_was_deleted,
  updated_at: syncedAt,
});

const mapAtsApplication = (
  orgId: string,
  platformName: string,
  application: Record<string, unknown>,
  syncedAt: string,
) => ({
  org_id: orgId,
  merge_id: toText(application.id) || toText(application.remote_id),
  platform_name: platformName,
  candidate_id: toText((application.candidate as Record<string, unknown> | undefined)?.id) || toText(application.candidate),
  job_id: toText((application.job as Record<string, unknown> | undefined)?.id) || toText(application.job),
  current_stage:
    extractNamedValue(application.current_stage) ||
    extractNamedValue(application.stage) ||
    extractNamedValue(application.current_stage_name),
  status: extractNamedValue(application.status),
  raw_data: application,
  last_synced_at: syncedAt,
  is_active: !application.remote_was_deleted,
  updated_at: syncedAt,
});

const normalizeLookupKey = (value: string | null) => (value || "").trim().toLowerCase();

const normalizeStageLookupKey = (value: string | null) => normalizeLookupKey(value).replace(/[^a-z0-9]+/g, "");

const extractFullName = (candidate: Record<string, unknown>) => {
  const direct = toText(candidate.name) || toText(candidate.full_name);
  if (direct) return direct;

  const firstName = toText(candidate.first_name);
  const lastName = toText(candidate.last_name);
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  const email = extractPrimaryEmail(candidate);
  return email ? email.split("@")[0] : null;
};

const extractDateValue = (...values: unknown[]) => {
  for (const value of values) {
    const next = toText(value);
    if (next) return next;
  }
  return null;
};

const deriveApplicationOutcome = (application: Record<string, unknown>, syncedAt: string) => {
  const statusText = normalizeLookupKey(extractNamedValue(application.status));
  const appliedAt = extractDateValue(application.applied_at, application.created_at, application.created, syncedAt) || syncedAt;
  const stageEnteredAt =
    extractDateValue(application.stage_entered_at, application.updated_at, application.modified_at, appliedAt) || appliedAt;

  const hiredAt =
    extractDateValue(application.hired_at) ||
    (statusText.includes("hired") || statusText.includes("accepted") ? syncedAt : null);
  const rejectedAt =
    extractDateValue(application.rejected_at) ||
    (statusText.includes("rejected") || statusText.includes("declined") || statusText.includes("disqual") ? syncedAt : null);
  const withdrawnAt =
    extractDateValue(application.withdrawn_at) ||
    (statusText.includes("withdrawn") ? syncedAt : null);

  return {
    appliedAt,
    stageEnteredAt,
    hiredAt,
    rejectedAt,
    withdrawnAt,
    rejectionReason: rejectedAt ? toText(application.rejection_reason) || extractNamedValue(application.status) : null,
  };
};

const findStageIdForApplication = (
  stagesByJobId: Map<string, Array<Record<string, unknown>>>,
  jobPostingId: string,
  stageName: string | null,
) => {
  const stages = stagesByJobId.get(jobPostingId) || [];
  if (!stages.length) return null;

  const normalizedTarget = normalizeStageLookupKey(stageName);
  if (!normalizedTarget) {
    return toText(stages[0]?.id);
  }

  const exact = stages.find((stage) => normalizeStageLookupKey(toText(stage.name)) === normalizedTarget);
  if (exact) return toText(exact.id);

  const partial = stages.find((stage) => {
    const normalizedStage = normalizeStageLookupKey(toText(stage.name));
    return normalizedStage.includes(normalizedTarget) || normalizedTarget.includes(normalizedStage);
  });
  if (partial) return toText(partial.id);

  return toText(stages[0]?.id);
};

const syncAtsCandidatesToHiring = async (params: {
  supabase: ReturnType<typeof createClient>;
  connection: MergeConnectionRecord;
  candidates: Record<string, unknown>[];
  syncedAt: string;
}) => {
  const { data: existingCandidates, error: existingCandidatesError } = await params.supabase
    .from("candidates")
    .select("id, email, phone, position_title, source, status, assessment_result_id, external_source, external_id")
    .eq("company_id", params.connection.org_id);

  if (existingCandidatesError) {
    throw new Error(`Failed to load candidates for ATS bridge: ${existingCandidatesError.message}`);
  }

  const existingByExternalId = new Map<string, Record<string, unknown>>();
  const existingByEmail = new Map<string, Record<string, unknown>>();

  for (const candidate of asArray<Record<string, unknown>>(existingCandidates)) {
    const externalId = toText(candidate.external_id);
    const email = normalizeEmail(candidate.email);

    if (externalId && normalizeLookupKey(toText(candidate.external_source)) === MERGE_ATS_EXTERNAL_SOURCE) {
      existingByExternalId.set(externalId, candidate);
    }

    if (email) {
      existingByEmail.set(email, candidate);
    }
  }

  const candidateIdByMergeId = new Map<string, string>();
  const touchedCandidateIds = new Set<string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of params.candidates) {
    const mergeId = toText(candidate.id) || toText(candidate.remote_id);
    if (!mergeId || Boolean(candidate.remote_was_deleted)) continue;

    const email = extractPrimaryEmail(candidate);
    if (!email) {
      skipped += 1;
      await logMergeSyncError({
        supabase: params.supabase,
        orgId: params.connection.org_id,
        platform: params.connection.platform_name,
        category: "ats",
        errorCode: "ATS_CANDIDATE_EMAIL_MISSING",
        errorMessage: `Skipped ATS candidate ${mergeId} because no email address was available.`,
      });
      continue;
    }

    const existing =
      existingByExternalId.get(mergeId) ||
      existingByEmail.get(email) ||
      null;

    const payload = {
      company_id: params.connection.org_id,
      email,
      full_name: extractFullName(candidate),
      phone: extractPrimaryPhone(candidate) || toText(existing?.phone),
      position_title: toText(existing?.position_title),
      source: toText(existing?.source) || MERGE_ATS_EXTERNAL_SOURCE,
      status: toText(existing?.status) || "applied",
      external_source: MERGE_ATS_EXTERNAL_SOURCE,
      external_id: mergeId,
      updated_at: params.syncedAt,
    };

    let candidateId: string | null = toText(existing?.id);

    if (candidateId) {
      const { error } = await params.supabase.from("candidates").update(payload).eq("id", candidateId);
      if (error) {
        throw new Error(`Failed to update ATS candidate bridge row: ${error.message}`);
      }
      updated += 1;
    } else {
      const { data: insertedCandidate, error } = await params.supabase
        .from("candidates")
        .insert(payload)
        .select("id")
        .single();

      if (error || !insertedCandidate) {
        throw new Error(error?.message || "Failed to create ATS candidate bridge row");
      }

      candidateId = toText((insertedCandidate as Record<string, unknown>).id);
      created += 1;
    }

    if (!candidateId) continue;

    candidateIdByMergeId.set(mergeId, candidateId);
    touchedCandidateIds.add(candidateId);

    const nextExisting = {
      ...(existing || {}),
      id: candidateId,
      email,
      phone: payload.phone,
      position_title: payload.position_title,
      source: payload.source,
      status: payload.status,
      external_source: MERGE_ATS_EXTERNAL_SOURCE,
      external_id: mergeId,
    };
    existingByEmail.set(email, nextExisting);
    existingByExternalId.set(mergeId, nextExisting);
  }

  return {
    candidateIdByMergeId,
    touchedCandidateIds: [...touchedCandidateIds],
    created,
    updated,
    skipped,
  };
};

const syncAtsApplicationsToHiring = async (params: {
  supabase: ReturnType<typeof createClient>;
  connection: MergeConnectionRecord;
  applications: Record<string, unknown>[];
  candidateIdByMergeId: Map<string, string>;
  syncedAt: string;
}) => {
  const { data: companyJobs, error: companyJobsError } = await params.supabase
    .from("job_postings")
    .select("id, title, external_source, external_id")
    .eq("company_id", params.connection.org_id);

  if (companyJobsError) {
    throw new Error(`Failed to load job postings for ATS application bridge: ${companyJobsError.message}`);
  }

  const atsJobRows = asArray<Record<string, unknown>>(companyJobs).filter(
    (job) => normalizeLookupKey(toText(job.external_source)) === MERGE_ATS_EXTERNAL_SOURCE && toText(job.external_id),
  );
  const jobsByExternalId = new Map<string, Record<string, unknown>>();
  for (const job of atsJobRows) {
    const externalId = toText(job.external_id);
    if (externalId) jobsByExternalId.set(externalId, job);
  }

  const jobIds = atsJobRows.map((job) => toText(job.id)).filter((value): value is string => Boolean(value));

  const { data: existingApplications, error: existingApplicationsError } = jobIds.length
    ? await params.supabase
      .from("candidate_applications")
      .select("id, candidate_id, job_posting_id, external_source, external_id")
      .in("job_posting_id", jobIds)
    : { data: [], error: null };

  if (existingApplicationsError) {
    throw new Error(`Failed to load applications for ATS bridge: ${existingApplicationsError.message}`);
  }

  const { data: stages, error: stagesError } = jobIds.length
    ? await params.supabase
      .from("hiring_pipeline_stages")
      .select("id, job_posting_id, name, stage_order")
      .eq("company_id", params.connection.org_id)
      .in("job_posting_id", jobIds)
      .order("stage_order")
    : { data: [], error: null };

  if (stagesError) {
    throw new Error(`Failed to load pipeline stages for ATS bridge: ${stagesError.message}`);
  }

  const existingByExternalId = new Map<string, Record<string, unknown>>();
  const existingByCandidateJob = new Map<string, Record<string, unknown>>();

  for (const application of asArray<Record<string, unknown>>(existingApplications)) {
    const externalId = toText(application.external_id);
    const candidateId = toText(application.candidate_id);
    const jobPostingId = toText(application.job_posting_id);

    if (externalId && normalizeLookupKey(toText(application.external_source)) === MERGE_ATS_EXTERNAL_SOURCE) {
      existingByExternalId.set(externalId, application);
    }
    if (candidateId && jobPostingId) {
      existingByCandidateJob.set(`${candidateId}:${jobPostingId}`, application);
    }
  }

  const stagesByJobId = new Map<string, Array<Record<string, unknown>>>();
  for (const stage of asArray<Record<string, unknown>>(stages)) {
    const jobPostingId = toText(stage.job_posting_id);
    if (!jobPostingId) continue;
    if (!stagesByJobId.has(jobPostingId)) {
      stagesByJobId.set(jobPostingId, []);
    }
    stagesByJobId.get(jobPostingId)?.push(stage);
  }

  const touchedCandidateIds = new Set<string>();
  const activeApplicationExternalIds = new Set<string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const application of params.applications) {
    const mergeId = toText(application.id) || toText(application.remote_id);
    if (!mergeId || Boolean(application.remote_was_deleted)) continue;

    const candidateMergeId =
      toText((application.candidate as Record<string, unknown> | undefined)?.id) ||
      toText(application.candidate);
    const jobMergeId =
      toText((application.job as Record<string, unknown> | undefined)?.id) ||
      toText(application.job);

    const candidateId = candidateMergeId ? params.candidateIdByMergeId.get(candidateMergeId) : null;
    const localJob = jobMergeId ? jobsByExternalId.get(jobMergeId) : null;
    const jobPostingId = toText(localJob?.id);

    if (!candidateId || !jobPostingId) {
      skipped += 1;
      continue;
    }

    activeApplicationExternalIds.add(mergeId);
    touchedCandidateIds.add(candidateId);

    const outcome = deriveApplicationOutcome(application, params.syncedAt);
    const currentStageId = findStageIdForApplication(
      stagesByJobId,
      jobPostingId,
      extractNamedValue(application.current_stage) ||
        extractNamedValue(application.stage) ||
        extractNamedValue(application.current_stage_name),
    );

    const payload = {
      candidate_id: candidateId,
      job_posting_id: jobPostingId,
      current_stage_id: currentStageId,
      applied_at: outcome.appliedAt,
      stage_entered_at: outcome.stageEnteredAt,
      source: MERGE_ATS_EXTERNAL_SOURCE,
      rejection_reason: outcome.rejectionReason,
      rejected_at: outcome.rejectedAt,
      withdrawn_at: outcome.withdrawnAt,
      hired_at: outcome.hiredAt,
      external_source: MERGE_ATS_EXTERNAL_SOURCE,
      external_id: mergeId,
      updated_at: params.syncedAt,
    };

    const existing =
      existingByExternalId.get(mergeId) ||
      existingByCandidateJob.get(`${candidateId}:${jobPostingId}`) ||
      null;

    if (existing?.id) {
      const { error } = await params.supabase.from("candidate_applications").update(payload).eq("id", existing.id);
      if (error) {
        throw new Error(`Failed to update ATS application bridge row: ${error.message}`);
      }
      updated += 1;
    } else {
      const { error } = await params.supabase.from("candidate_applications").insert(payload);
      if (error) {
        throw new Error(`Failed to create ATS application bridge row: ${error.message}`);
      }
      created += 1;
    }
  }

  const staleApplicationIds = asArray<Record<string, unknown>>(existingApplications)
    .filter((application) => {
      const externalId = toText(application.external_id);
      return (
        normalizeLookupKey(toText(application.external_source)) === MERGE_ATS_EXTERNAL_SOURCE &&
        externalId &&
        !activeApplicationExternalIds.has(externalId)
      );
    })
    .map((application) => toText(application.id))
    .filter((value): value is string => Boolean(value));

  if (staleApplicationIds.length) {
    const { error } = await params.supabase.from("candidate_applications").delete().in("id", staleApplicationIds);
    if (error) {
      throw new Error(`Failed to clear stale ATS candidate applications: ${error.message}`);
    }
  }

  return {
    touchedCandidateIds: [...touchedCandidateIds],
    created,
    updated,
    deleted: staleApplicationIds.length,
    skipped,
  };
};

const syncAtsCandidateProfiles = async (params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  candidateIds: string[];
  syncedAt: string;
}) => {
  if (!params.candidateIds.length) {
    return { updated: 0 };
  }

  const { data: candidates, error: candidatesError } = await params.supabase
    .from("candidates")
    .select("id, status, assessment_result_id, job_posting_id, position_title")
    .eq("company_id", params.orgId)
    .in("id", params.candidateIds);

  if (candidatesError) {
    throw new Error(`Failed to load bridged candidates: ${candidatesError.message}`);
  }

  const { data: applications, error: applicationsError } = await params.supabase
    .from("candidate_applications")
    .select("id, candidate_id, job_posting_id, hired_at, rejected_at, withdrawn_at, applied_at, job_posting:job_postings(title)")
    .in("candidate_id", params.candidateIds)
    .order("applied_at", { ascending: false });

  if (applicationsError) {
    throw new Error(`Failed to load bridged candidate applications: ${applicationsError.message}`);
  }

  const applicationsByCandidateId = new Map<string, Array<Record<string, unknown>>>();
  for (const application of asArray<Record<string, unknown>>(applications)) {
    const candidateId = toText(application.candidate_id);
    if (!candidateId) continue;
    if (!applicationsByCandidateId.has(candidateId)) {
      applicationsByCandidateId.set(candidateId, []);
    }
    applicationsByCandidateId.get(candidateId)?.push(application);
  }

  let updated = 0;

  for (const candidate of asArray<Record<string, unknown>>(candidates)) {
    const candidateId = toText(candidate.id);
    if (!candidateId) continue;

    const candidateApplications = applicationsByCandidateId.get(candidateId) || [];
    if (!candidateApplications.length) continue;

    const primaryApplication =
      candidateApplications.find((application) => !application.hired_at && !application.rejected_at && !application.withdrawn_at) ||
      candidateApplications[0];

    const hasHired = candidateApplications.some((application) => Boolean(application.hired_at));
    const hasActive = candidateApplications.some(
      (application) => !application.hired_at && !application.rejected_at && !application.withdrawn_at,
    );
    const allClosed = candidateApplications.every(
      (application) => Boolean(application.hired_at || application.rejected_at || application.withdrawn_at),
    );

    let nextStatus = toText(candidate.status) || "applied";
    if (hasHired) {
      nextStatus = "hired";
    } else if (toText(candidate.assessment_result_id)) {
      nextStatus = "assessment_completed";
    } else if (nextStatus === "assessment_pending") {
      nextStatus = "assessment_pending";
    } else if (hasActive) {
      nextStatus = "applied";
    } else if (allClosed) {
      nextStatus = "rejected";
    }

    const nextJobPostingId = toText(primaryApplication.job_posting_id);
    const nextPositionTitle =
      toText((primaryApplication.job_posting as Record<string, unknown> | undefined)?.title) ||
      toText(candidate.position_title);

    const { error } = await params.supabase
      .from("candidates")
      .update({
        status: nextStatus,
        job_posting_id: nextJobPostingId,
        position_title: nextPositionTitle,
        updated_at: params.syncedAt,
      })
      .eq("id", candidateId);

    if (error) {
      throw new Error(`Failed to update bridged candidate profile: ${error.message}`);
    }

    updated += 1;
  }

  return { updated };
};

export async function syncHrisConnection(params: {
  supabase: ReturnType<typeof createClient>;
  connection: MergeConnectionRecord;
  company: CompanyContext;
}) {
  const syncedAt = new Date().toISOString();

  await setConnectionState({
    supabase: params.supabase,
    orgId: params.connection.org_id,
    category: "hris",
    values: {
      sync_status: "syncing",
      connection_status: "connected",
      last_error_code: null,
      last_error_message: null,
    },
  });

  if (!params.connection.account_token) {
    throw new MergeApiError(401, "RECONNECT_REQUIRED", "Missing stored account token");
  }

  const employees = await fetchMergePages<Record<string, unknown>>({
    supabase: params.supabase,
    path: "/api/hris/v1/employees",
    category: "hris",
    orgId: params.connection.org_id,
    platformName: params.connection.platform_name,
    accountToken: params.connection.account_token,
  });

  const rows = employees
    .map((employee) => mapHrisEmployee(params.connection.org_id, params.connection.platform_name, employee, syncedAt))
    .filter((employee) => employee.merge_id);

  await upsertRowsInChunks(params.supabase, "hris_employees", rows as Record<string, unknown>[], "org_id,merge_id");

  const mergeIds = rows.map((row) => row.merge_id).filter(Boolean) as string[];
  let rolecolor = { linked: 0, invitesSent: 0 };

  if (mergeIds.length) {
    const { data: employeeRows, error: employeeRowsError } = await params.supabase
      .from("hris_employees")
      .select("id, email, first_name, last_name, assessment_invite_sent_at")
      .eq("org_id", params.connection.org_id)
      .in("merge_id", mergeIds);

    if (employeeRowsError) {
      throw new Error(employeeRowsError.message);
    }

    rolecolor = await runRoleColorLinking({
      supabase: params.supabase,
      orgId: params.connection.org_id,
      company: params.company,
      employeeRows: asArray(employeeRows),
    });
  }

  await setConnectionState({
    supabase: params.supabase,
    orgId: params.connection.org_id,
    category: "hris",
    values: {
      sync_status: "idle",
      connection_status: "connected",
      last_synced_at: syncedAt,
      last_error_code: null,
      last_error_message: null,
      is_active: true,
    },
  });

  return {
    employeesSynced: rows.length,
    rolecolorLinked: rolecolor.linked,
    invitesSent: rolecolor.invitesSent,
    syncedAt,
  };
}

export async function syncAtsConnection(params: {
  supabase: ReturnType<typeof createClient>;
  connection: MergeConnectionRecord;
}) {
  const syncedAt = new Date().toISOString();

  await setConnectionState({
    supabase: params.supabase,
    orgId: params.connection.org_id,
    category: "ats",
    values: {
      sync_status: "syncing",
      connection_status: "connected",
      last_error_code: null,
      last_error_message: null,
    },
  });

  if (!params.connection.account_token) {
    throw new MergeApiError(401, "RECONNECT_REQUIRED", "Missing stored account token");
  }

  const atsModels = [
    { key: "jobs", path: "/api/ats/v1/jobs" },
    { key: "candidates", path: "/api/ats/v1/candidates" },
    { key: "applications", path: "/api/ats/v1/applications" },
  ] as const;

  const modelResults = await Promise.all(
    atsModels.map(async (model) => {
      try {
        const rows = await fetchMergePages<Record<string, unknown>>({
          supabase: params.supabase,
          path: model.path,
          category: "ats",
          orgId: params.connection.org_id,
          platformName: params.connection.platform_name,
          accountToken: params.connection.account_token,
        });

        return {
          key: model.key,
          rows,
          warning: null,
          fetched: true,
        };
      } catch (error) {
        if (isMergeApiError(error) && error.status === 403) {
          await logMergeSyncError({
            supabase: params.supabase,
            orgId: params.connection.org_id,
            platform: params.connection.platform_name,
            category: "ats",
            errorCode: "ATS_MODEL_FORBIDDEN",
            errorMessage: `${model.key} sync skipped: ${error.message}`,
            context: {
              model: model.key,
              path: model.path,
            },
          });

          return {
            key: model.key,
            rows: [] as Record<string, unknown>[],
            warning: `${model.key} sync skipped: ${error.message}`,
            fetched: false,
          };
        }

        throw error;
      }
    }),
  );

  const warnings = modelResults
    .map((result) => result.warning)
    .filter((warning): warning is string => Boolean(warning));

  const syncWarningMessage =
    warnings.length === atsModels.length
      ? `${params.connection.platform_name} connected, but Merge could not access jobs, candidates, or applications for this linked account. Reconnect with broader ATS permissions if you want to import data.`
      : warnings.length > 0
        ? `${params.connection.platform_name} synced with limited ATS access. Some data models were skipped because the provider did not grant permission.`
        : null;

  const jobs = modelResults.find((result) => result.key === "jobs")?.rows || [];
  const candidates = modelResults.find((result) => result.key === "candidates")?.rows || [];
  const applications = modelResults.find((result) => result.key === "applications")?.rows || [];

  const jobRows = jobs
    .map((job) => mapAtsJob(params.connection.org_id, params.connection.platform_name, job, syncedAt))
    .filter((job) => job.merge_id);
  const candidateRows = candidates
    .map((candidate) => mapAtsCandidate(params.connection.org_id, params.connection.platform_name, candidate, syncedAt))
    .filter((candidate) => candidate.merge_id);
  const applicationRows = applications
    .map((application) => mapAtsApplication(params.connection.org_id, params.connection.platform_name, application, syncedAt))
    .filter((application) => application.merge_id);

  const jobsFetched = Boolean(modelResults.find((result) => result.key === "jobs")?.fetched);

  await Promise.all([
    upsertRowsInChunks(params.supabase, "ats_jobs", jobRows as Record<string, unknown>[], "org_id,merge_id"),
    upsertRowsInChunks(params.supabase, "ats_candidates", candidateRows as Record<string, unknown>[], "org_id,merge_id"),
    upsertRowsInChunks(params.supabase, "ats_applications", applicationRows as Record<string, unknown>[], "org_id,merge_id"),
  ]);

  const jobPostingSync = await syncAtsJobPostings({
    supabase: params.supabase,
    connection: params.connection,
    jobsFetched,
    jobs,
    syncedAt,
  });

  const candidateBridgeSync = await syncAtsCandidatesToHiring({
    supabase: params.supabase,
    connection: params.connection,
    candidates,
    syncedAt,
  });

  const applicationBridgeSync = await syncAtsApplicationsToHiring({
    supabase: params.supabase,
    connection: params.connection,
    applications,
    candidateIdByMergeId: candidateBridgeSync.candidateIdByMergeId,
    syncedAt,
  });

  const candidateProfileSync = await syncAtsCandidateProfiles({
    supabase: params.supabase,
    orgId: params.connection.org_id,
    candidateIds: [...new Set([...candidateBridgeSync.touchedCandidateIds, ...applicationBridgeSync.touchedCandidateIds])],
    syncedAt,
  });

  await setConnectionState({
    supabase: params.supabase,
    orgId: params.connection.org_id,
    category: "ats",
    values: {
      sync_status: "idle",
      connection_status: "connected",
      last_synced_at: syncedAt,
      last_error_code: syncWarningMessage ? "ATS_SYNC_WARNING" : null,
      last_error_message: syncWarningMessage,
      is_active: true,
    },
  });

  return {
    jobsSynced: jobRows.length,
    jobPostingsSynced: jobPostingSync.synced,
    candidatesSynced: candidateRows.length,
    applicationsSynced: applicationRows.length,
    hiringCandidatesCreated: candidateBridgeSync.created,
    hiringCandidatesUpdated: candidateBridgeSync.updated,
    hiringCandidatesSkipped: candidateBridgeSync.skipped,
    hiringApplicationsCreated: applicationBridgeSync.created,
    hiringApplicationsUpdated: applicationBridgeSync.updated,
    hiringApplicationsDeleted: applicationBridgeSync.deleted,
    hiringApplicationsSkipped: applicationBridgeSync.skipped,
    hiringCandidateProfilesUpdated: candidateProfileSync.updated,
    jobPostingsCreated: jobPostingSync.created,
    jobPostingsUpdated: jobPostingSync.updated,
    jobPostingsDeleted: jobPostingSync.deleted,
    syncedAt,
    warnings: syncWarningMessage ? [syncWarningMessage, ...warnings] : warnings,
  };
}

export async function softDeleteCategoryRecords(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  category: MergeCategory,
) {
  const updatedAt = new Date().toISOString();

  if (category === "hris") {
    const { error } = await supabase
      .from("hris_employees")
      .update({ is_active: false, updated_at: updatedAt })
      .eq("org_id", orgId)
      .eq("is_active", true);

    if (error) {
      throw new Error(`Failed to soft delete HRIS records: ${error.message}`);
    }

    return;
  }

  const tasks = ["ats_jobs", "ats_candidates", "ats_applications"].map((table) =>
    supabase
      .from(table)
      .update({ is_active: false, updated_at: updatedAt })
      .eq("org_id", orgId)
      .eq("is_active", true),
  );

  const results = await Promise.all(tasks);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(`Failed to soft delete ATS records: ${failed.error.message}`);
  }

  const { error: jobPostingError } = await supabase
    .from("job_postings")
    .delete()
    .eq("company_id", orgId)
    .eq("external_source", MERGE_ATS_EXTERNAL_SOURCE);

  if (jobPostingError) {
    throw new Error(`Failed to clear synced ATS job postings: ${jobPostingError.message}`);
  }
}

export async function disconnectConnection(params: {
  supabase: ReturnType<typeof createClient>;
  connection: MergeConnectionRecord;
}) {
  if (params.connection.account_token) {
    try {
      await callMergeApi({
        supabase: params.supabase,
        path: `/api/${params.connection.category}/v1/delete-account`,
        method: "POST",
        accountToken: params.connection.account_token,
        orgId: params.connection.org_id,
        category: params.connection.category,
        platformName: params.connection.platform_name,
      });
    } catch (error) {
      if (isMergeApiError(error) && ["ACCOUNT_NOT_FOUND", "RECONNECT_REQUIRED"].includes(error.code)) {
        // Keep disconnect moving for stale tokens.
      } else {
        throw error;
      }
    }
  }

  await softDeleteCategoryRecords(params.supabase, params.connection.org_id, params.connection.category);

  await setConnectionState({
    supabase: params.supabase,
    orgId: params.connection.org_id,
    category: params.connection.category,
    values: {
      platform_name: params.connection.platform_name,
      account_token: null,
      connection_status: "disconnected",
      sync_status: "idle",
      is_active: false,
      last_error_code: null,
      last_error_message: null,
    },
  });
}

export async function fetchAccountDetails(params: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  category: MergeCategory;
  platformName: string;
  accountToken: string;
}) {
  const details = await callMergeApi<Record<string, unknown>>({
    supabase: params.supabase,
    path: `/api/${params.category}/v1/account-details`,
    accountToken: params.accountToken,
    orgId: params.orgId,
    category: params.category,
    platformName: params.platformName,
  });

  return {
    linkedAccountId:
      toText(details.id) ||
      toText((details.account as Record<string, unknown> | undefined)?.id) ||
      toText((details.linked_account as Record<string, unknown> | undefined)?.id),
    webhookListenerUrl:
      toText(details.webhook_listener_url) ||
      toText((details.account as Record<string, unknown> | undefined)?.webhook_listener_url),
  };
}

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function verifyMergeWebhookSignature(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.MERGE_WEBHOOK_SIGNATURE_KEY;
  if (!webhookSecret) {
    throw new Error("MERGE_WEBHOOK_SIGNATURE_KEY is not configured");
  }

  if (!signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const encoded = base64UrlEncode(new Uint8Array(digest));
  return encoded === signature;
}

export function parseWebhookMetadata(payload: Record<string, unknown>) {
  const hook = (payload.hook ?? {}) as Record<string, unknown>;
  const linkedAccount = (payload.linked_account ?? {}) as Record<string, unknown>;

  const event =
    toText(hook.event_name) ||
    toText(hook.event) ||
    toText(hook.type) ||
    toText(hook.webhook_type) ||
    "";

  const category = (toText(linkedAccount.category) || toText(hook.category) || "").toLowerCase() as MergeCategory;
  const orgId = toText(linkedAccount.end_user_origin_id) || toText(linkedAccount.end_user_id);
  const platformName =
    toText(linkedAccount.integration_name) ||
    toText((linkedAccount.integration as Record<string, unknown> | undefined)?.name) ||
    "Unknown";
  const modelName =
    (toText((payload.data as Record<string, unknown> | undefined)?.model_name) ||
      toText((payload.data as Record<string, unknown> | undefined)?.model) ||
      toText((payload.data as Record<string, unknown> | undefined)?.object_type) ||
      "").toLowerCase();

  return {
    event: event.toLowerCase(),
    category,
    orgId,
    platformName,
    modelName,
  };
}

export const shouldSyncForWebhook = (params: {
  category: MergeCategory;
  event: string;
  modelName: string;
}) => {
  const event = params.event;
  const model = params.modelName;

  if (event.includes("linked account deleted")) return true;
  if (event.includes("linked account linked")) return true;
  if (event.includes("linked account synced")) return true;
  if (event.includes("common model synced")) return true;
  if (event.includes("changed data")) {
    if (params.category === "hris") return !model || model.includes("employee");
    return !model || model.includes("job") || model.includes("candidate") || model.includes("application");
  }
  if (event.includes("deleted data")) {
    if (params.category === "hris") return !model || model.includes("employee");
    return !model || model.includes("job") || model.includes("candidate") || model.includes("application");
  }

  return false;
};
