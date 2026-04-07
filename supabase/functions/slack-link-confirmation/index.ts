import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import {
  HttpError,
  corsHeaders,
  createServiceSupabaseClient,
  getActiveSlackConnectionByOrgId,
  json,
  logSlackError,
} from "../_shared/slack.ts";
import {
  buildSlackLinkPageState,
  confirmSlackLinkForAuthenticatedUser,
  expireSlackPendingConfirmations,
  rejectSlackLinkForAuthenticatedUser,
} from "../_shared/slack-onboarding.ts";

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const requireAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    throw new HttpError(401, "Missing authorization header");
  }

  const client = createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_ANON_KEY"), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, "Invalid or expired session");
  }

  return user;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown> = {};

  try {
    body = await req.json();
    const action = String(body.action || "fetch");
    const token = String(body.token || "").trim();

    if (!token) {
      throw new HttpError(400, "Missing confirmation token");
    }

    const user = await requireAuthenticatedUser(req);
    const supabase = createServiceSupabaseClient();

    if (action === "fetch") {
      let state = await buildSlackLinkPageState(supabase, token, user.id);

      if (state.confirmation?.status === "pending") {
        const expiresAt = new Date(state.confirmation.expires_at).getTime();
        if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
          const connection = await getActiveSlackConnectionByOrgId(supabase, state.confirmation.org_id);
          if (connection) {
            await expireSlackPendingConfirmations(supabase, connection);
            state = await buildSlackLinkPageState(supabase, token, user.id);
          }
        }
      }

      return json({
        confirmation: state.confirmation
          ? {
              id: state.confirmation.id,
              org_id: state.confirmation.org_id,
              slack_email: state.confirmation.slack_email,
              slack_display_name: state.confirmation.slack_display_name,
              slack_real_name: state.confirmation.slack_real_name,
              slack_title: state.confirmation.slack_title,
              slack_avatar_url: state.confirmation.slack_avatar_url,
              matched_rcf_name: state.confirmation.matched_rcf_name,
              matched_rcf_role: state.confirmation.matched_rcf_role,
              matched_rcf_color: state.confirmation.matched_rcf_color,
              match_type: state.confirmation.match_type,
              match_confidence: state.confirmation.match_confidence,
              status: state.confirmation.status,
              expires_at: state.confirmation.expires_at,
            }
          : null,
        company: state.company,
        viewer: state.companyUser
          ? {
              id: state.companyUser.id,
              email: state.companyUser.email,
              full_name: state.companyUser.fullName,
              role: state.companyUser.role,
            }
          : null,
      });
    }

    if (action === "confirm") {
      const result = await confirmSlackLinkForAuthenticatedUser(supabase, token, user.id);
      if (!result.confirmation || !result.companyUser) {
        throw new HttpError(404, "Slack confirmation could not be linked");
      }

      return json({
        success: true,
        message: "Your Slack account is now linked to RoleColorFinder.",
        company: result.company,
        companyUser: {
          id: result.companyUser.id,
          email: result.companyUser.email,
          full_name: result.companyUser.fullName,
          role: result.companyUser.role,
        },
      });
    }

    if (action === "reject") {
      const confirmation = await rejectSlackLinkForAuthenticatedUser(supabase, token);
      if (!confirmation) {
        throw new HttpError(404, "Slack confirmation not found");
      }

      return json({
        success: true,
        message: "This Slack account was not linked. Contact your admin if you need help.",
      });
    }

    throw new HttpError(400, "Unsupported action");
  } catch (error) {
    await logSlackError({
      functionName: "slack-link-confirmation",
      errorMessage: error instanceof Error ? error.message : "Internal server error",
      payload: body,
    });

    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }

    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
