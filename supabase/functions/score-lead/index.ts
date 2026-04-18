// Lovable AI Gateway lead scoring
// Auth required: caller must be authenticated. RLS-protected supabase client
// is used so users can only score their own tenant's leads.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  leadId: string;
}

interface LeadRow {
  id: string;
  tenant_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  title: string | null;
  website: string | null;
  linkedin_url: string | null;
  metadata: Record<string, unknown>;
}

interface TenantRow {
  id: string;
  name: string;
  icp_description: string | null;
  website: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2.45.0"
    );

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const body = (await req.json()) as RequestBody;
    if (!body?.leadId) return json({ error: "leadId required" }, 400);

    // RLS ensures the user can only fetch leads from their tenant
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select(
        "id, tenant_id, email, first_name, last_name, company, title, website, linkedin_url, metadata",
      )
      .eq("id", body.leadId)
      .maybeSingle();

    if (leadErr || !lead) {
      return json({ error: "Lead not found" }, 404);
    }

    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("id, name, icp_description, website")
      .eq("id", (lead as LeadRow).tenant_id)
      .maybeSingle();

    if (tErr || !tenant) return json({ error: "Tenant not found" }, 404);

    const t = tenant as TenantRow;
    const l = lead as LeadRow;

    const prompt = buildPrompt(t, l);

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert B2B sales analyst. You score how well a prospect matches an ideal customer profile (ICP). Always reply with valid JSON only.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );

    if (aiRes.status === 429) {
      return json(
        { error: "AI rate limit exceeded. Try again shortly." },
        429,
      );
    }
    if (aiRes.status === 402) {
      return json(
        { error: "AI credits exhausted. Add credits in Lovable settings." },
        402,
      );
    }
    if (!aiRes.ok) {
      const text = await aiRes.text();
      return json({ error: `AI gateway error: ${text}` }, 500);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { score?: number; reason?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const score = clamp(Number(parsed.score ?? 0), 0, 100);
    const reason = String(parsed.reason ?? "").slice(0, 500);

    const { error: updateErr } = await supabase
      .from("leads")
      .update({
        icp_score: score,
        metadata: { ...(l.metadata ?? {}), icp_reason: reason },
      })
      .eq("id", l.id);

    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ score, reason });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});

function buildPrompt(tenant: TenantRow, lead: LeadRow): string {
  const icp = tenant.icp_description?.trim() || "Not specified";
  return [
    `Tenant: ${tenant.name}`,
    `Tenant website: ${tenant.website ?? "n/a"}`,
    `ICP description: ${icp}`,
    "",
    "Prospect:",
    `- Name: ${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "n/a"}`,
    `- Email: ${lead.email ?? "n/a"}`,
    `- Title: ${lead.title ?? "n/a"}`,
    `- Company: ${lead.company ?? "n/a"}`,
    `- Website: ${lead.website ?? "n/a"}`,
    `- LinkedIn: ${lead.linkedin_url ?? "n/a"}`,
    "",
    'Reply with JSON: {"score": <0-100 integer>, "reason": "<one short sentence>"}',
  ].join("\n");
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
