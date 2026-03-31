import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const INITIAL_SUPER_ADMIN_EMAILS = [
  "sanjay@rolecolorfinder.com",
  "tristan@rolecolorfinder.com",
  "aaron@rolecolor.com",
  "kody@rolecolor.com",
];

export const normalizeEmail = (email: string | null | undefined) => (email || "").trim().toLowerCase();

export const resolveFullName = (metadata: Record<string, unknown> | null | undefined): string | null => {
  if (!metadata) return null;

  const direct =
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    (metadata.display_name as string | undefined);

  if (direct && direct.trim()) return direct.trim();

  const first = (metadata.first_name as string | undefined)?.trim() || "";
  const last = (metadata.last_name as string | undefined)?.trim() || "";
  const combined = `${first} ${last}`.trim();
  return combined || null;
};

export async function isSuperAdminEmail(
  supabase: ReturnType<typeof createClient>,
  email: string | null | undefined,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  if (INITIAL_SUPER_ADMIN_EMAILS.includes(normalizedEmail)) {
    return true;
  }

  const { data, error } = await supabase
    .from("platform_super_admins")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("Error checking platform_super_admins:", error.message);
    return false;
  }

  return Boolean(data?.id);
}
