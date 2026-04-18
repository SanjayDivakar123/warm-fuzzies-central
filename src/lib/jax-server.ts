import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are Jax, an AI Chief of Staff for a B2B sales team using OutreachOS.

You help the user manage their leads. You have access to live lead data from their tenant (provided in the user message as JSON context).

You can PROPOSE actions for the user to confirm. To propose actions, end your reply with a fenced JSON block like:
\`\`\`actions
[
  { "type": "score_all_unscored", "label": "Score all unscored leads with AI" },
  { "type": "set_status", "leadId": "<uuid>", "status": "qualified", "label": "Mark Acme Corp as qualified" },
  { "type": "draft_email", "leadId": "<uuid>", "label": "Draft intro email to John at Acme" }
]
\`\`\`

Valid action types:
- score_all_unscored — no extra fields
- set_status — requires leadId (uuid) and status (one of: new, contacted, replied, qualified, meeting_booked, closed_won, closed_lost, unsubscribed)
- draft_email — requires leadId (uuid)

Only propose actions when the user clearly asks for them. Otherwise just answer the question conversationally with markdown. Be concise, direct, and useful. No filler.`;

const ChatSchema = z.object({
  tenantId: z.string().uuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(50),
});

export const jaxChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { reply: "Groq API key is not configured.", error: "missing_key" };
    }

    const { supabase } = context;

    // Verify tenant membership and load context
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("id, name, icp_description, website")
      .eq("id", data.tenantId)
      .maybeSingle();

    if (tErr || !tenant) {
      return { reply: "I can't access that workspace.", error: "tenant_not_found" };
    }

    const { data: leads } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, company, title, status, icp_score")
      .eq("tenant_id", data.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);

    const leadSummary = (leads ?? []).map((l) => ({
      id: l.id,
      name: [l.first_name, l.last_name].filter(Boolean).join(" ") || null,
      email: l.email,
      company: l.company,
      title: l.title,
      status: l.status,
      score: l.icp_score,
    }));

    const counts = (leads ?? []).reduce<Record<string, number>>((acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    }, {});
    const unscored = (leads ?? []).filter((l) => l.icp_score == null).length;

    const contextBlock = `WORKSPACE CONTEXT:
- Tenant: ${tenant.name}
- ICP: ${tenant.icp_description ?? "(not set)"}
- Total leads loaded: ${leadSummary.length}
- Unscored leads: ${unscored}
- Status counts: ${JSON.stringify(counts)}

LEADS (JSON, up to 100 most recent):
${JSON.stringify(leadSummary)}`;

    const lastUserMsgIdx = data.messages.length - 1;
    const augmentedMessages = data.messages.map((m, i) =>
      i === lastUserMsgIdx && m.role === "user"
        ? { role: m.role, content: `${contextBlock}\n\nUSER: ${m.content}` }
        : m
    );

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...augmentedMessages],
          temperature: 0.4,
          max_tokens: 1200,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("Groq error:", res.status, body);
        if (res.status === 429) {
          return { reply: "Groq rate limit hit. Try again in a moment.", error: "rate_limit" };
        }
        return { reply: `Groq returned ${res.status}.`, error: "upstream" };
      }

      const json = await res.json();
      const reply = json?.choices?.[0]?.message?.content ?? "";
      return { reply, error: null };
    } catch (err) {
      console.error("Groq fetch failed:", err);
      return { reply: "Couldn't reach Groq. Try again.", error: "network" };
    }
  });

// ---- Action runners ----

const ScoreAllSchema = z.object({ tenantId: z.string().uuid() });

export const jaxScoreAllUnscored = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ScoreAllSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { ok: false, error: "Groq API key not configured", scored: 0 };

    const { supabase } = context;

    const { data: tenant } = await supabase
      .from("tenants")
      .select("icp_description, name")
      .eq("id", data.tenantId)
      .maybeSingle();

    const { data: leads } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, company, title")
      .eq("tenant_id", data.tenantId)
      .is("icp_score", null)
      .limit(25);

    if (!leads || leads.length === 0) {
      return { ok: true, scored: 0, error: null };
    }

    let scored = 0;
    for (const lead of leads) {
      const desc = `Name: ${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "?"}
Email: ${lead.email ?? "?"}
Company: ${lead.company ?? "?"}
Title: ${lead.title ?? "?"}`;

      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: `You score B2B leads 0-100 against this ICP: ${tenant?.icp_description ?? "B2B businesses"}. Reply with ONLY JSON: {"score": number, "reason": "short string"}`,
              },
              { role: "user", content: desc },
            ],
            temperature: 0.1,
            max_tokens: 200,
          }),
        });
        if (!res.ok) continue;
        const j = await res.json();
        const content = j?.choices?.[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(content);
        const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
        await supabase
          .from("leads")
          .update({ icp_score: score })
          .eq("id", lead.id);
        scored++;
      } catch (e) {
        console.error("Score failed for lead", lead.id, e);
      }
    }

    return { ok: true, scored, error: null };
  });

const SetStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum([
    "new",
    "contacted",
    "replied",
    "qualified",
    "meeting_booked",
    "closed_won",
    "closed_lost",
    "unsubscribed",
  ]),
});

export const jaxSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("leads")
      .update({ status: data.status })
      .eq("id", data.leadId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  });

const DraftSchema = z.object({ leadId: z.string().uuid() });

export const jaxDraftEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DraftSchema.parse(input))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { ok: false, error: "Groq API key not configured", draft: null };

    const { supabase } = context;
    const { data: lead } = await supabase
      .from("leads")
      .select("first_name, last_name, email, company, title, tenant_id")
      .eq("id", data.leadId)
      .maybeSingle();

    if (!lead) return { ok: false, error: "Lead not found", draft: null };

    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, icp_description, website")
      .eq("id", lead.tenant_id)
      .maybeSingle();

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You write short, personalized B2B cold outreach emails. Sender works at ${tenant?.name ?? "our company"} (${tenant?.website ?? ""}). Their ICP/value prop: ${tenant?.icp_description ?? ""}. Reply with ONLY JSON: {"subject": "string", "body": "string"}. Body should be 60-90 words, no fluff, ends with a soft CTA.`,
            },
            {
              role: "user",
              content: `Recipient — Name: ${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "?"}, Title: ${lead.title ?? "?"}, Company: ${lead.company ?? "?"}, Email: ${lead.email ?? "?"}`,
            },
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("Draft Groq error:", res.status, t);
        return { ok: false, error: `Groq ${res.status}`, draft: null };
      }
      const j = await res.json();
      const content = j?.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      return {
        ok: true,
        error: null,
        draft: {
          subject: String(parsed.subject ?? ""),
          body: String(parsed.body ?? ""),
          to: lead.email,
        },
      };
    } catch (e) {
      console.error("Draft failed:", e);
      return { ok: false, error: "Network error", draft: null };
    }
  });
