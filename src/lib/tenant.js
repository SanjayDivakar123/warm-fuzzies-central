import { getServiceSupabase } from './supabase.js';
import { withAgentErrorHandling } from './agents.js';

export function tenantQuery(table, tenantId) {
  return getServiceSupabase().from(table).select('*').eq('tenant_id', tenantId);
}

export const getTenantConfig = withAgentErrorHandling(
  {
    agentName: 'Tenant',
    action: 'get_tenant_config_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId) => {
    if (!tenantId) {
      return null;
    }

    const { data, error } = await getServiceSupabase()
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
);

export const updateTenantConfig = withAgentErrorHandling(
  {
    agentName: 'Tenant',
    action: 'update_tenant_config_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId, payload) => {
    const { data, error } = await getServiceSupabase()
      .from('tenants')
      .update(payload)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
);

export const ensureTenant = withAgentErrorHandling(
  {
    agentName: 'Tenant',
    action: 'ensure_tenant_failed',
    getContext: ([tenantId]) => ({ tenantId })
  },
  async (tenantId) => {
    if (tenantId) {
      return getTenantConfig(tenantId);
    }

    const supabase = getServiceSupabase();
    const { data: existing } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_email', 'owner@example.com')
      .eq('company_name', 'Demo Workspace')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert({
        company_name: 'Demo Workspace',
        owner_email: 'owner@example.com',
        icp_description: 'B2B teams exploring autonomous sales',
        brand_voice: 'Professional, concise, human',
        platform_name: 'OutreachOS'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
);

export function buildJaxSystemPrompt(tenantConfig) {
  return `
You are Jax, Chief of Staff for ${tenantConfig?.company_name || 'OutreachOS'}'s autonomous sales system.

Owner: ${tenantConfig?.owner_email || 'owner@example.com'}
ICP: ${tenantConfig?.icp_description || 'B2B companies needing sales automation'}
Brand voice: ${tenantConfig?.brand_voice || 'Professional, concise, human'}
Platform name: ${tenantConfig?.platform_name || 'OutreachOS'}
  `.trim();
}
