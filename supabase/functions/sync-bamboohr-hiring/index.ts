// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "authorize_url" | "sync_jobs" | "get_status" | "update_preferences";

type SyncRequest = {
  action: Action;
  company_id: string;
  company_domain?: string;
  redirect_uri?: string;
  code?: string;
  scope?: string;
  auto_sync_enabled?: boolean;
  auto_sync_interval_seconds?: number;
  auto_trigger?: boolean;
};

type BambooIntegration = {
  company_id: string;
  company_domain: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
};

const DEFAULT_SCOPE = "ats:read ats:write offline_access";

const DEFAULT_PIPELINE_STAGES = [
  { name: "Applied", stage_type: "applied", color_code: "#6B7280", is_final_stage: false },
  { name: "Phone Screen", stage_type: "phone_interview", color_code: "#3B82F6", is_final_stage: false },
  { name: "Technical Interview", stage_type: "technical_interview", color_code: "#8B5CF6", is_final_stage: false },
  { name: "Onsite Interview", stage_type: "onsite_interview", color_code: "#EC4899", is_final_stage: false },
  { name: "Reference Check", stage_type: "reference_check", color_code: "#F59E0B", is_final_stage: false },
  { name: "Offer", stage_type: "offer", color_code: "#10B981", is_final_stage: false },
  { name: "Hired", stage_type: "hired", color_code: "#059669", is_final_stage: true },
] as const;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitizeDomain = (input?: string) => {
  if (!input) return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\.bamboohr\.com.*$/, "")
    .replace(/[^a-z0-9-]/g, "");
};

const mapJobStatus = (statusText?: string): "draft" | "open" | "paused" | "closed" | "filled" => {
  const normalized = (statusText || "").toLowerCase();
  if (normalized.includes("filled") || normalized.includes("hired")) return "filled";
  if (normalized.includes("open")) return "open";
  if (normalized.includes("hold") || normalized.includes("pause")) return "paused";
  if (normalized.includes("cancel") || normalized.includes("close")) return "closed";
  return "draft";
};

const mapEmploymentType = (
  value?: string,
): "full_time" | "part_time" | "contract" | "temporary" | "internship" => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("part")) return "part_time";
  if (normalized.includes("contract")) return "contract";
  if (normalized.includes("temp")) return "temporary";
  if (normalized.includes("intern")) return "internship";
  return "full_time";
};

const mapRemotePolicy = (value?: string): "onsite" | "remote" | "hybrid" => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("remote")) return "remote";
  return "onsite";
};

const mapToBambooJobStatus = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "open":
      return "Open";
    case "paused":
      return "On Hold";
    case "filled":
      return "Filled";
    case "closed":
      return "Canceled";
    default:
      return "Draft";
  }
};

const mapToBambooEmploymentType = (employmentType: string | null) => {
  switch ((employmentType || "").toLowerCase()) {
    case "part_time":
      return "Part-Time";
    case "contract":
      return "Contractor";
    case "temporary":
      return "Temporary";
    case "internship":
      return "Internship";
    default:
      return "Full-Time";
  }
};

const mapToBambooLocationType = (remotePolicy: string | null) => {
  switch ((remotePolicy || "").toLowerCase()) {
    case "remote":
      return "1";
    case "hybrid":
      return "2";
    default:
      return "0";
  }
};

const getAuthorizationUrl = (companyDomain: string, redirectUri: string, scope: string, clientId: string) => {
  const params = new URLSearchParams({
    request: "authorize",
    state: "rcf-bamboo-sync",
    response_type: "code",
    scope,
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  return `https://${companyDomain}.bamboohr.com/authorize.php?${params.toString()}`;
};

const exchangeCodeForToken = async ({
  companyDomain,
  clientId,
  clientSecret,
  code,
  redirectUri,
}: {
  companyDomain: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}) => {
  const response = await fetch(`https://${companyDomain}.bamboohr.com/token.php?request=token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_secret: clientSecret,
      client_id: clientId,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    const message = payload?.error_description || payload?.error || "Failed to exchange BambooHR auth code";
    throw new Error(message);
  }

  return payload;
};

const refreshAccessToken = async ({
  companyDomain,
  clientId,
  clientSecret,
  refreshToken,
  redirectUri,
}: {
  companyDomain: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
}) => {
  const response = await fetch(`https://${companyDomain}.bamboohr.com/token.php?request=token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_secret: clientSecret,
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      redirect_uri: redirectUri,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    const message = payload?.error_description || payload?.error || "Failed to refresh BambooHR token";
    throw new Error(message);
  }

  return payload;
};

const isTokenNearExpiry = (iso: string | null) => {
  if (!iso) return true;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return true;
  return ts <= Date.now() + 60_000;
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
    is_final_stage: stage.is_final_stage,
  }));

  const { error } = await supabase.from("hiring_pipeline_stages").insert(stageRows);
  if (error) {
    console.error("Failed creating default pipeline stages", { jobPostingId, error });
  }
};

const fetchBambooHiringLeadId = async (integration: BambooIntegration) => {
  const response = await fetch(
    `https://${integration.company_domain}.bamboohr.com/api/v1/applicant_tracking/hiring_leads`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${integration.access_token}`,
      },
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("Failed to fetch BambooHR hiring leads");
  }

  const leads = Array.isArray(payload) ? payload : Array.isArray(payload?.hiringLeads) ? payload.hiringLeads : [];
  if (!leads.length) {
    throw new Error("No BambooHR hiring leads available for this account");
  }

  const first = leads[0];
  return first.id ?? first.employeeId ?? first.userId;
};

const createBambooJobOpening = async ({
  integration,
  hiringLeadId,
  job,
}: {
  integration: BambooIntegration;
  hiringLeadId: string;
  job: {
    id: string;
    title: string;
    status: string;
    department: string | null;
    description: string | null;
    employment_type: string | null;
    remote_policy: string | null;
  };
}) => {
  const formData = new FormData();
  formData.append("postingTitle", job.title || "New Job");
  formData.append("jobStatus", mapToBambooJobStatus(job.status));
  formData.append("hiringLead", String(hiringLeadId));
  formData.append("employmentType", mapToBambooEmploymentType(job.employment_type));
  formData.append("jobDescription", job.description || `${job.title || "New role"} created from RoleColorFinder`);
  if (job.department) formData.append("department", job.department);
  formData.append("locationType", mapToBambooLocationType(job.remote_policy));

  const response = await fetch(
    `https://${integration.company_domain}.bamboohr.com/api/v1/applicant_tracking/job_opening`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${integration.access_token}`,
      },
      body: formData,
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error_description || payload?.error || "Failed to create BambooHR job";
    throw new Error(message);
  }

  const externalId = payload?.id ?? payload?.jobOpeningId ?? payload?.jobId ?? payload?.result?.id;
  if (!externalId) {
    throw new Error("BambooHR did not return a job id for created opening");
  }

  return String(externalId);
};

const syncRcfToBamboo = async ({
  supabase,
  companyId,
  integration,
}: {
  supabase: ReturnType<typeof createClient>;
  companyId: string;
  integration: BambooIntegration;
}) => {
  const { data: rcfJobs, error } = await supabase
    .from("job_postings")
    .select("id, title, status, department, description, employment_type, remote_policy")
    .eq("company_id", companyId)
    .is("external_source", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Failed to fetch RCF jobs for Bamboo sync");
  }

  if (!rcfJobs?.length) {
    return { pushed: 0, failed: 0 };
  }

  const hiringLeadId = await fetchBambooHiringLeadId(integration);

  let pushed = 0;
  let failed = 0;

  for (const job of rcfJobs) {
    try {
      const externalId = await createBambooJobOpening({ integration, hiringLeadId: String(hiringLeadId), job });
      const { error: updateError } = await supabase
        .from("job_postings")
        .update({ external_source: "bamboohr", external_id: externalId, updated_at: new Date().toISOString() })
        .eq("id", job.id);

      if (updateError) {
        failed += 1;
        continue;
      }

      pushed += 1;
    } catch (err) {
      console.error("Failed pushing RCF job to BambooHR", { jobId: job.id, err });
      failed += 1;
    }
  }

  return { pushed, failed };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("BAMBOOHR_CLIENT_ID");
    const clientSecret = Deno.env.get("BAMBOOHR_CLIENT_SECRET");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase environment is not configured" }, 500);
    }
    if (!clientId || !clientSecret) {
      return json({ error: "BambooHR client credentials are not configured" }, 500);
    }

    const configuredAutoSyncKey = Deno.env.get("BAMBOOHR_AUTO_SYNC_KEY");
    const providedAutoSyncKey = req.headers.get("x-bamboo-auto-sync-key") || "";
    const isInternalAutoSync = !!configuredAutoSyncKey && providedAutoSyncKey === configuredAutoSyncKey;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as SyncRequest;
    const action = body.action;
    const companyId = body.company_id;

    if (!action || !companyId) {
      return json({ error: "action and company_id are required" }, 400);
    }

    let connectedByUserId: string | null = null;

    if (!isInternalAutoSync) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ error: "Missing authorization token" }, 401);
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData?.user) {
        return json({ error: "Unauthorized" }, 401);
      }

      connectedByUserId = authData.user.id;

      const { data: membership, error: membershipError } = await supabase
        .from("company_users")
        .select("id, role")
        .eq("company_id", companyId)
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (membershipError) {
        return json({ error: "Failed to verify company access" }, 500);
      }

      if (!membership || !["admin", "hr"].includes(membership.role)) {
        return json({ error: "Only company admins or HR users can manage BambooHR sync" }, 403);
      }
    }

    if (action === "get_status") {
      const { data: integration } = await supabase
        .from("bamboohr_integrations")
        .select("company_domain, connected_at, last_synced_at, auto_sync_enabled, auto_sync_interval_seconds, last_auto_sync_at")
        .eq("company_id", companyId)
        .maybeSingle();

      return json({
        success: true,
        connected: !!integration,
        integration: integration || null,
      });
    }

    if (action === "update_preferences") {
      const { data: integration } = await supabase
        .from("bamboohr_integrations")
        .select("company_id")
        .eq("company_id", companyId)
        .maybeSingle();

      if (!integration) {
        return json({ error: "Connect BambooHR first before setting auto-sync preferences." }, 400);
      }

      const interval = Math.max(6, Math.min(604800, Number(body.auto_sync_interval_seconds || 3600)));
      const enabled = Boolean(body.auto_sync_enabled);

      const { error } = await supabase
        .from("bamboohr_integrations")
        .update({
          auto_sync_enabled: enabled,
          auto_sync_interval_seconds: interval,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId);

      if (error) return json({ error: "Failed to update auto-sync preferences" }, 500);
      return json({ success: true, message: "Auto-sync preferences updated." });
    }

    const requestedDomain = sanitizeDomain(body.company_domain);
    const redirectUri = body.redirect_uri?.trim();
    const scope = (body.scope?.trim() || DEFAULT_SCOPE).replace(/\s+/g, " ");

    if (action === "authorize_url") {
      if (!requestedDomain) {
        return json({ error: "company_domain is required" }, 400);
      }
      if (!redirectUri) {
        return json({ error: "redirect_uri is required" }, 400);
      }

      const authorizeUrl = getAuthorizationUrl(requestedDomain, redirectUri, scope, clientId);
      return json({ success: true, authorizeUrl });
    }

    // action === "sync_jobs"
    let integration: BambooIntegration | null = null;
    const { data: existingIntegration } = await supabase
      .from("bamboohr_integrations")
      .select("company_id, company_domain, access_token, refresh_token, token_expires_at, scope")
      .eq("company_id", companyId)
      .maybeSingle();

    if (existingIntegration) {
      integration = existingIntegration as BambooIntegration;
    }

    // If auth code is supplied, connect/update integration first.
    if (body.code) {
      if (!requestedDomain) {
        return json({ error: "company_domain is required when providing an auth code" }, 400);
      }
      if (!redirectUri) {
        return json({ error: "redirect_uri is required when providing an auth code" }, 400);
      }

      const tokenResponse = await exchangeCodeForToken({
        companyDomain: requestedDomain,
        clientId,
        clientSecret,
        code: body.code,
        redirectUri,
      });

      const expiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + Number(tokenResponse.expires_in) * 1000).toISOString()
        : null;

      const upsertPayload = {
        company_id: companyId,
        company_domain: requestedDomain,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        token_expires_at: expiresAt,
        scope: tokenResponse.scope || scope,
        connected_by: connectedByUserId,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("bamboohr_integrations")
        .upsert(upsertPayload, { onConflict: "company_id" });

      if (upsertError) {
        console.error("Failed to save BambooHR integration", upsertError);
        return json({ error: "Connected to BambooHR, but failed to save integration state" }, 500);
      }

      integration = {
        company_id: companyId,
        company_domain: requestedDomain,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token || null,
        token_expires_at: expiresAt,
        scope: tokenResponse.scope || scope,
      };
    }

    if (!integration) {
      if (!requestedDomain || !redirectUri) {
        return json({
          error: "No BambooHR connection found. Provide company_domain and redirect_uri to start OAuth.",
        }, 400);
      }

      const authorizeUrl = getAuthorizationUrl(requestedDomain, redirectUri, scope, clientId);
      return json({
        success: false,
        needsAuthorization: true,
        authorizeUrl,
        message: "Authorize the app in BambooHR, then paste the returned code and sync again.",
      }, 200);
    }

    // Refresh token if needed.
    if (isTokenNearExpiry(integration.token_expires_at) && integration.refresh_token) {
      if (!redirectUri) {
        return json({ error: "redirect_uri is required to refresh an expired BambooHR token" }, 400);
      }

      const refreshed = await refreshAccessToken({
        companyDomain: integration.company_domain,
        clientId,
        clientSecret,
        refreshToken: integration.refresh_token,
        redirectUri,
      });

      const expiresAt = refreshed.expires_in
        ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString()
        : integration.token_expires_at;

      const { error: tokenUpdateError } = await supabase
        .from("bamboohr_integrations")
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || integration.refresh_token,
          token_expires_at: expiresAt,
          scope: refreshed.scope || integration.scope,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", companyId);

      if (tokenUpdateError) {
        console.error("Failed to update refreshed BambooHR token", tokenUpdateError);
      }

      integration.access_token = refreshed.access_token;
      integration.refresh_token = refreshed.refresh_token || integration.refresh_token;
      integration.token_expires_at = expiresAt;
      integration.scope = refreshed.scope || integration.scope;
    }

    const jobsResponse = await fetch(
      `https://${integration.company_domain}.bamboohr.com/api/v1/applicant_tracking/jobs`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${integration.access_token}`,
        },
      },
    );

    const jobsPayload = await jobsResponse.json().catch(() => null);

    if (!jobsResponse.ok) {
      const message = jobsPayload?.error_description || jobsPayload?.error || "Failed to fetch BambooHR jobs";
      return json({ error: message }, jobsResponse.status >= 400 && jobsResponse.status < 600 ? jobsResponse.status : 500);
    }

    const bambooJobsRaw = Array.isArray(jobsPayload)
      ? jobsPayload
      : Array.isArray(jobsPayload?.jobs)
        ? jobsPayload.jobs
        : [];

    const normalizedJobs = bambooJobsRaw
      .map((job: Record<string, unknown>) => {
        const externalId =
          job.id ??
          job.jobOpeningId ??
          job.jobId ??
          job.requisitionId ??
          null;

        const title =
          (job.title as string | undefined) ??
          (job.name as string | undefined) ??
          (job.jobTitle as string | undefined) ??
          "Untitled Job";

        const statusText =
          (job.status as string | undefined) ??
          (job.statusName as string | undefined) ??
          ((job.status as Record<string, unknown> | undefined)?.name as string | undefined) ??
          "";

        const department =
          (job.department as string | undefined) ??
          ((job.department as Record<string, unknown> | undefined)?.name as string | undefined) ??
          null;

        const city = (job.city as string | undefined) || "";
        const state = (job.state as string | undefined) || "";
        const country = (job.country as string | undefined) || "";
        const locationFromParts = [city, state, country].filter(Boolean).join(", ");

        const location = (job.location as string | undefined) ?? (locationFromParts || null);

        const description =
          (job.description as string | undefined) ??
          (job.summary as string | undefined) ??
          null;

        const employmentTypeRaw =
          (job.employmentStatus as string | undefined) ??
          (job.employmentType as string | undefined) ??
          "";

        const locationTypeRaw =
          (job.locationType as string | undefined) ??
          (job.remoteType as string | undefined) ??
          "";

        return {
          externalId: externalId ? String(externalId) : null,
          title,
          department,
          location,
          description,
          status: mapJobStatus(statusText),
          employment_type: mapEmploymentType(employmentTypeRaw),
          remote_policy: mapRemotePolicy(locationTypeRaw),
        };
      })
      .filter((job) => !!job.externalId);

    let created = 0;
    let updated = 0;

    if (normalizedJobs.length > 0) {
      const externalIds = normalizedJobs.map((job) => job.externalId);

      const { data: existingJobs, error: existingJobsError } = await supabase
        .from("job_postings")
        .select("id, external_id")
        .eq("company_id", companyId)
        .eq("external_source", "bamboohr")
        .in("external_id", externalIds);

      if (existingJobsError) {
        console.error("Failed to fetch existing synced jobs", existingJobsError);
        return json({ error: "Failed to inspect existing job mappings" }, 500);
      }

      const existingByExternalId = new Map<string, string>();
      for (const row of existingJobs || []) {
        if (row.external_id) {
          existingByExternalId.set(row.external_id, row.id);
        }
      }

      for (const job of normalizedJobs) {
        const jobPayload = {
          company_id: companyId,
          title: job.title,
          department: job.department,
          location: job.location,
          description: job.description,
          status: job.status,
          employment_type: job.employment_type,
          remote_policy: job.remote_policy,
          external_source: "bamboohr",
          external_id: job.externalId,
          updated_at: new Date().toISOString(),
        };

        const existingId = existingByExternalId.get(job.externalId!);
        if (existingId) {
          const { error } = await supabase
            .from("job_postings")
            .update(jobPayload)
            .eq("id", existingId);

          if (error) {
            console.error("Failed to update synced BambooHR job", { job: job.externalId, error });
            continue;
          }
          updated += 1;
        } else {
          const { data: insertedJob, error } = await supabase
            .from("job_postings")
            .insert({
              ...jobPayload,
              status: job.status || "draft",
              published_at: job.status === "open" ? new Date().toISOString() : null,
            })
            .select("id")
            .single();

          if (error || !insertedJob) {
            console.error("Failed to create synced BambooHR job", { job: job.externalId, error });
            continue;
          }

          await createDefaultStagesForJob(supabase, companyId, insertedJob.id);
          created += 1;
        }
      }
    }

    const rcfToBamboo = await syncRcfToBamboo({
      supabase,
      companyId,
      integration,
    });

    const integrationUpdatePayload: Record<string, unknown> = {
      company_domain: integration.company_domain,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (body.auto_trigger) {
      integrationUpdatePayload.last_auto_sync_at = new Date().toISOString();
    }

    await supabase
      .from("bamboohr_integrations")
      .update(integrationUpdatePayload)
      .eq("company_id", companyId);

    return json({
      success: true,
      two_way_sync: true,
      bamboo_to_rcf: { synced: created + updated, created, updated },
      rcf_to_bamboo: rcfToBamboo,
      message: `Two-way sync complete. Bamboo->RCF: ${created} created, ${updated} updated. RCF->Bamboo: ${rcfToBamboo.pushed} pushed${rcfToBamboo.failed ? `, ${rcfToBamboo.failed} failed` : ""}.`,
    });
  } catch (error) {
    console.error("sync-bamboohr-hiring error", error);
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
