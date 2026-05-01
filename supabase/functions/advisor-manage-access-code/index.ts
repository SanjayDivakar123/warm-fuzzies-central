import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  advisorCorsHeaders,
  createServiceClient,
  getAdvisorForAuthUser,
  jsonResponse,
} from "../_shared/advisorLanding.ts";

const CODE_LENGTH = 6;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateAccessCode = () => {
  const values = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values)
    .map((value) => CODE_CHARS[value % CODE_CHARS.length])
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: advisorCorsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const supabase = createServiceClient();
    const { advisor } = await getAdvisorForAuthUser(req, supabase);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "get");

    if (action === "generate") {
      const code = generateAccessCode();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("advisors")
        .update({
          active_access_code: code,
          access_code_status: "active",
          access_code_generated_at: now,
          access_code_used_at: null,
        })
        .eq("id", advisor.id)
        .select("id,active_access_code,access_code_status,access_code_generated_at,access_code_used_at")
        .single();

      if (error) throw error;
      return jsonResponse(200, { advisor: data, generated: true });
    }

    const { data, error } = await supabase
      .from("advisors")
      .select("id,active_access_code,access_code_status,access_code_generated_at,access_code_used_at")
      .eq("id", advisor.id)
      .single();
    if (error) throw error;

    return jsonResponse(200, { advisor: data, generated: false });
  } catch (error) {
    console.error("advisor-manage-access-code error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return jsonResponse(status, { error: message });
  }
});
