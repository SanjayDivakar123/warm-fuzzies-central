import { getServiceSupabase } from '../../lib/supabase.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { sendWelcomeEmail } from './onboarding.js';

export const provisionAccess = withAgentErrorHandling(
  {
    agentName: 'Ova',
    action: 'provision_access_failed',
    getContext: ([leadId, , tenantId]) => ({ tenantId, leadId })
  },
  async (leadId, stripeSessionId, tenantId = null) => {
  const supabase = getServiceSupabase();
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, access_provisioned')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (existingPayment?.access_provisioned) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle();

    return { org: existingOrg, user: null, alreadyProvisioned: true };
  }

  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).single();

  if (error) {
    throw error;
  }

  const resolvedTenantId = tenantId || lead.tenant_id || null;

  let org;
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();

  if (existingOrg) {
    org = existingOrg;
  } else {
    const { data: createdOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: lead.company,
        contact_email: lead.email,
        contact_name: lead.name,
        plan: 'standard',
        tenant_id: resolvedTenantId,
        stripe_session_id: stripeSessionId,
        status: 'active',
        created_by: 'Ova (Access Provisioner)'
      })
      .select()
      .single();

    if (orgError) {
      throw orgError;
    }

    org = createdOrg;
  }

  await supabase
    .from('payments')
    .update({ status: 'paid', access_provisioned: true })
    .eq('stripe_session_id', stripeSessionId);

  await supabase.from('leads').update({ status: 'closed_won' }).eq('id', leadId);

  const tempPassword =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10).toUpperCase() +
    '!';

  let authUser = null;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: lead.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: lead.name,
      organization_id: org.id,
      tenant_id: resolvedTenantId,
      role: 'admin'
    },
    app_metadata: {
      tenant_id: resolvedTenantId
    }
  });

  if (authError) {
    if (!/already been registered|already exists|duplicate/i.test(authError.message)) {
      throw authError;
    }

    const usersPage = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    authUser = usersPage.data.users.find((user) => user.email === lead.email) || null;
  } else {
    authUser = authData?.user || null;
  }

  await sendWelcomeEmail(lead, { ...authUser, tempPassword }, org);

  await supabase.from('agent_log').insert({
    agent_name: 'Ova',
    action: 'access_provisioned',
    tenant_id: resolvedTenantId,
    lead_id: lead.id,
    result: `Org ${org.id} created. User ${lead.email} provisioned.`
  });

  return { org, user: authUser };
  }
);
