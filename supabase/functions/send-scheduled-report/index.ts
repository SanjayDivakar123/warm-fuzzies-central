import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEDULE_HOUR_LOCAL = 8;

const zonedDatePartsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getZonedDateParts(date: Date, timeZone: string) {
  const cacheKey = `parts:${timeZone}`;
  let formatter = zonedDatePartsFormatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    zonedDatePartsFormatterCache.set(cacheKey, formatter);
  }

  const partEntries = formatter
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value] as const);
  const parts = Object.fromEntries(partEntries);

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function zonedLocalTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second, 0);

  // Resolve timezone offset (and DST) for this local datetime.
  for (let i = 0; i < 6; i++) {
    const zoned = getZonedDateParts(new Date(utcMs), timeZone);
    const expectedAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, 0);
    const actualAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
      0,
    );
    const diff = expectedAsUtc - actualAsUtc;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

function calculateNextSendAt(
  frequency: string,
  timezone: string,
  baseInstant: Date,
) {
  const localBase = getZonedDateParts(baseInstant, timezone);

  let year = localBase.year;
  let month = localBase.month;
  let day = localBase.day;

  switch (frequency) {
    case "daily":
      day += 1;
      break;
    case "weekly":
      day += 7;
      break;
    case "monthly":
      month += 1;
      break;
    default:
      day += 1;
      break;
  }

  let next = zonedLocalTimeToUtc(year, month, day, SCHEDULE_HOUR_LOCAL, 0, 0, timezone);

  // Guard against stale next-send values after delays/outages.
  while (next <= new Date()) {
    const localNext = getZonedDateParts(next, timezone);
    const bumpDay = frequency === "weekly" ? 7 : 1;
    const bumpMonth = frequency === "monthly" ? 1 : 0;

    next = zonedLocalTimeToUtc(
      localNext.year,
      localNext.month + bumpMonth,
      localNext.day + bumpDay,
      SCHEDULE_HOUR_LOCAL,
      0,
      0,
      timezone,
    );
  }

  return next.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN") || "rolecolorfinder.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get reports due to be sent
    const now = new Date().toISOString();
    const { data: dueReports, error: reportsError } = await supabase
      .from("scheduled_reports")
      .select("*, companies(*)")
      .eq("is_active", true)
      .lte("next_send_at", now);

    if (reportsError) {
      throw new Error(`Failed to fetch due reports: ${reportsError.message}`);
    }

    console.log(`Found ${dueReports?.length || 0} reports to send`);

    const results = [];

    for (const report of dueReports || []) {
      try {
        // Fetch company stats
        const { data: users } = await supabase
          .from("company_users")
          .select("*")
          .eq("company_id", report.company_id);

        const totalUsers = users?.length || 0;
        const completedUsers = users?.filter(u => u.assessment_completed_at)?.length || 0;
        const completionRate = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

        // Count colors
        const colorCounts: Record<string, number> = { yellow: 0, red: 0, green: 0, blue: 0 };
        users?.forEach(user => {
          if (user.assessment_result_id) {
            // Would need to join with assessment_results to get actual color
            // For now, simulate based on available data
          }
        });

        // Build email content
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${report.companies?.primary_color || '#22c55e'}, ${report.companies?.secondary_color || '#16a34a'}); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .stat-card { background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
              .stat-label { font-size: 14px; color: #6b7280; }
              .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">${report.name}</h1>
                <p style="margin: 8px 0 0;">Team Summary for ${report.companies?.name || 'Your Company'}</p>
              </div>
              <div class="content">
                <div class="stat-card">
                  <div class="stat-value">${totalUsers}</div>
                  <div class="stat-label">Total Team Members</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${completedUsers}</div>
                  <div class="stat-label">Assessments Completed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${completionRate}%</div>
                  <div class="stat-label">Completion Rate</div>
                </div>
              </div>
              <div class="footer">
                <p>This is an automated report from RoleColorFinder.</p>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send to all recipients
        for (const recipient of report.recipients || []) {
          if (mailgunApiKey) {
            const formData = new FormData();
            formData.append("from", `RoleColorFinder <reports@${mailgunDomain}>`);
            formData.append("to", recipient);
            formData.append("subject", `${report.name} - ${new Date().toLocaleDateString()}`);
            formData.append("html", emailHtml);

            await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
              },
              body: formData,
            });
          }
        }

        const reportTimezone = report.timezone || "UTC";
        const nextSendAt = calculateNextSendAt(
          report.frequency,
          reportTimezone,
          report.next_send_at ? new Date(report.next_send_at) : new Date(),
        );

        // Update report
        await supabase
          .from("scheduled_reports")
          .update({
            last_sent_at: now,
            next_send_at: nextSendAt
          })
          .eq("id", report.id);

        results.push({ report_id: report.id, success: true });

      } catch (reportError) {
        console.error(`Error processing report ${report.id}:`, reportError);
        results.push({ report_id: report.id, success: false, error: reportError.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-scheduled-report:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
