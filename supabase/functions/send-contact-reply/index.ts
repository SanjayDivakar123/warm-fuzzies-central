import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, logAdminAction, requireSuperAdmin } from "../_shared/admin.ts";

async function sendViaMailgun(email: string, body: string) {
  const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
  const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

  if (!mailgunApiKey || !mailgunDomain) {
    return false;
  }

  const formData = new FormData();
  formData.append("from", "RoleColorFinder <no-reply@rolecolorfinder.com>");
  formData.append("to", email);
  formData.append("subject", "Reply from RoleColorFinder");
  formData.append("text", body);

  const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`api:${mailgunApiKey}`),
    },
    body: formData,
  });

  return response.ok;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: adminCorsHeaders });
  }

  try {
    const { supabase, user } = await requireSuperAdmin(req);
    const body = await req.json().catch(() => ({}));
    const contactQueryId = (body?.contact_query_id || "").toString().trim();
    const replyBody = (body?.body || "").toString().trim();

    if (!contactQueryId || !replyBody) throw new Error("contact_query_id and body are required");

    const { data: queryRow, error: queryError } = await supabase
      .from("contact_queries")
      .select("id, name, email, status")
      .eq("id", contactQueryId)
      .single();

    if (queryError || !queryRow) throw new Error("Contact query not found");

    const sent = await sendViaMailgun(queryRow.email, replyBody);

    const { error: replyInsertError } = await supabase
      .from("contact_replies")
      .insert({
        contact_query_id: contactQueryId,
        body: replyBody,
        sent_via: sent ? "mailgun" : "draft",
        sent_at: sent ? new Date().toISOString() : null,
        created_by: user.id,
      });

    if (replyInsertError) throw replyInsertError;

    const { error: updateQueryError } = await supabase
      .from("contact_queries")
      .update({
        status: sent ? "resolved" : queryRow.status,
        reply_status: sent ? "replied" : "draft",
        replied_at: sent ? new Date().toISOString() : null,
      })
      .eq("id", contactQueryId);

    if (updateQueryError) throw updateQueryError;

    await logAdminAction({
      supabase,
      actorId: user.id,
      actorEmail: user.email,
      actionType: "contact_reply",
      targetType: "user",
      targetId: contactQueryId,
      targetLabel: queryRow.email,
      metadata: {
        sent,
      },
    });

    return new Response(JSON.stringify({ success: true, sent }), {
      status: 200,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || "Unexpected error" }), {
      status: 500,
      headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
    });
  }
});
