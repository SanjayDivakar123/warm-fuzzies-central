import { getServiceSupabase } from './supabase.js';

export async function listAdminTenants() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('tenants')
    .select('id, company_name, owner_email, platform_name, icp_description, brand_voice, calendly_url')
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function resolveAdminTenantId(requestedTenantId = null) {
  if (requestedTenantId) {
    return requestedTenantId;
  }

  const tenants = await listAdminTenants();
  return tenants[0]?.id || null;
}

export function getDateFloor(range) {
  const now = new Date();
  const current = new Date(now);

  if (range === 'today') {
    current.setHours(0, 0, 0, 0);
    return current.toISOString();
  }

  if (range === 'week') {
    const day = current.getDay();
    const distance = day === 0 ? 6 : day - 1;
    current.setDate(current.getDate() - distance);
    current.setHours(0, 0, 0, 0);
    return current.toISOString();
  }

  current.setDate(1);
  current.setHours(0, 0, 0, 0);
  return current.toISOString();
}
