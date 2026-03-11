import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type CompanyUserRole = 'admin' | 'hr' | 'partner' | 'employee';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  subdomain_enabled: boolean;
  admin_email: string;
  seats_purchased: number;
  assessment_type: '25q' | '50q';
  logo_url?: string;
  logo_url_dark?: string;
  primary_color: string;
  secondary_color: string;
  google_sso_enabled: boolean;
  google_workspace_domain?: string;
  custom_domain?: string;
  custom_domain_enabled: boolean;
  credit_balance?: number;
  hiring_subscription_enabled?: boolean;
  hiring_subscription_status?: string;
  hiring_subscription_id?: string;
  hiring_subscription_current_period_end?: string;
  hiring_subscription_cancel_at_period_end?: boolean;
  portal_billing_anchor_at?: string | null;
  portal_billing_next_renewal_at?: string | null;
  hiring_commitment_block_cancel_until?: string | null;
  hiring_ever_subscribed?: boolean;
  portal_access_locked?: boolean;
  portal_access_lock_reason?: string | null;
  portal_access_locked_at?: string | null;
  portal_access_outstanding_balance?: number;
}

interface CompanyUser {
  id: string;
  company_id: string;
  user_id?: string;
  email: string;
  role: CompanyUserRole;
  status: 'invited' | 'active' | 'revoked';
  invite_code?: string;
  invited_at: string;
  joined_at?: string;
  assessment_completed_at?: string;
  assessment_result_id?: string;
}

// Role-based permissions
interface RolePermissions {
  canViewOverview: boolean;
  canManageUsers: boolean;
  canViewUsers: boolean; // Read-only view of users list
  canManageCandidates: boolean;
  canViewCandidates: boolean; // Read-only + add candidates (no hire)
  canHireCandidates: boolean; // Can convert candidates to employees
  canViewAssessments: boolean;
  canManageReminders: boolean;
  canUseWorkMatrix: boolean;
  canManageSettings: boolean;
  canInviteAdmins: boolean;
  canPromoteUsers: boolean;
  canManageAllRoles: boolean; // Can manage admin/hr/partner users (not just employees)
}

const ROLE_PERMISSIONS: Record<CompanyUserRole, RolePermissions> = {
  admin: {
    canViewOverview: true,
    canManageUsers: true,
    canViewUsers: true,
    canManageCandidates: true,
    canViewCandidates: true,
    canHireCandidates: true,
    canViewAssessments: true,
    canManageReminders: true,
    canUseWorkMatrix: true,
    canManageSettings: true,
    canInviteAdmins: true,
    canPromoteUsers: true,
    canManageAllRoles: true,
  },
  hr: {
    canViewOverview: true,
    canManageUsers: true,
    canViewUsers: true,
    canManageCandidates: true,
    canViewCandidates: true,
    canHireCandidates: true,
    canViewAssessments: true,
    canManageReminders: true,
    canUseWorkMatrix: false,
    canManageSettings: false,
    canInviteAdmins: false,
    canPromoteUsers: false, // HR cannot promote users
    canManageAllRoles: false, // HR can only manage employees
  },
  partner: {
    canViewOverview: true,
    canManageUsers: false,
    canViewUsers: true, // Can view users list (read-only)
    canManageCandidates: false,
    canViewCandidates: true, // Can view and add candidates
    canHireCandidates: false, // Cannot hire candidates
    canViewAssessments: true,
    canManageReminders: false,
    canUseWorkMatrix: true,
    canManageSettings: false,
    canInviteAdmins: false,
    canPromoteUsers: false,
    canManageAllRoles: false,
  },
  employee: {
    canViewOverview: false,
    canManageUsers: false,
    canViewUsers: false,
    canManageCandidates: false,
    canViewCandidates: false,
    canHireCandidates: false,
    canViewAssessments: false,
    canManageReminders: false,
    canUseWorkMatrix: false,
    canManageSettings: false,
    canInviteAdmins: false,
    canPromoteUsers: false,
    canManageAllRoles: false,
  },
};

interface CompanyWithUser {
  company: Company;
  companyUser: CompanyUser;
}

interface CompanyContextType {
  company: Company | null;
  companyUser: CompanyUser | null;
  loading: boolean;
  isAdmin: boolean;
  permissions: RolePermissions;
  refreshCompany: () => Promise<void>;
  allCompanies: CompanyWithUser[];
  switchCompany: (companyId: string) => void;
}

// Export context for direct access (e.g., when the hook would throw during HMR)
export const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider = ({ children }: CompanyProviderProps) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [allCompanies, setAllCompanies] = useState<CompanyWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestedCompanyId, setRequestedCompanyId] = useState<string | null>(null);

  const mapCompanyUser = (record: any): CompanyUser => ({
    id: record.id,
    company_id: record.company_id,
    user_id: record.user_id ?? undefined,
    email: record.email,
    role: record.role as CompanyUserRole,
    status: record.status,
    invite_code: record.invite_code ?? undefined,
    invited_at: record.invited_at ?? '',
    joined_at: record.joined_at ?? undefined,
    assessment_completed_at: record.assessment_completed_at ?? undefined,
    assessment_result_id: record.assessment_result_id ?? undefined,
  });

  const fetchCompanyData = async () => {
    if (!user || !user.email) {
      setCompany(null);
      setCompanyUser(null);
      setAllCompanies([]);
      setLoading(false);
      return;
    }

    try {
      const { data: byUserId } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user.id);

      const { data: byEmail } = await supabase
        .from('company_users')
        .select('*')
        .ilike('email', user.email);

      const userIdRecordIds = new Set(byUserId?.map(r => r.id) || []);
      const emailOnlyRecords = (byEmail || []).filter(r => !userIdRecordIds.has(r.id));
      const companyUserRecords = [...(byUserId || []), ...emailOnlyRecords];

      // Link unlinked email-matched records
      for (const record of companyUserRecords) {
        if (!record.user_id && record.email.toLowerCase() === user.email?.toLowerCase()) {
          await supabase
            .from('company_users')
            .update({
              user_id: user.id,
              status: 'active',
              joined_at: record.joined_at || new Date().toISOString(),
            })
            .eq('id', record.id);
          record.user_id = user.id;
          record.status = 'active';
        }
      }

      // Keep only active/invited records with admin-level roles, plus any active records
      const validRecords = companyUserRecords.filter(
        (r) =>
          (['admin', 'hr', 'partner'].includes(r.role) && ['active', 'invited'].includes(r.status)) ||
          r.status === 'active'
      );

      // Deduplicate by company_id (one record per company, prefer admin roles)
      const byCompanyId = new Map<string, any>();
      for (const record of validRecords) {
        const existing = byCompanyId.get(record.company_id);
        if (!existing) {
          byCompanyId.set(record.company_id, record);
        } else {
          const existingIsAdmin = ['admin', 'hr', 'partner'].includes(existing.role);
          const newIsAdmin = ['admin', 'hr', 'partner'].includes(record.role);
          if (newIsAdmin && !existingIsAdmin) {
            byCompanyId.set(record.company_id, record);
          }
        }
      }
      const uniqueRecords = Array.from(byCompanyId.values());

      // Sort: admin roles first, then by active status
      uniqueRecords.sort((a, b) => {
        const aIsAdmin = ['admin', 'hr', 'partner'].includes(a.role);
        const bIsAdmin = ['admin', 'hr', 'partner'].includes(b.role);
        if (aIsAdmin && !bIsAdmin) return -1;
        if (!aIsAdmin && bIsAdmin) return 1;
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
      });

      if (uniqueRecords.length > 0) {
        // Fetch all company details at once
        const companyIds = uniqueRecords.map((r) => r.company_id);
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);

        if (companiesError) throw companiesError;

        const companyMap = new Map((companiesData || []).map((c) => [c.id, c]));

        const all: CompanyWithUser[] = [];
        for (const record of uniqueRecords) {
          const comp = companyMap.get(record.company_id);
          if (comp) {
            all.push({ company: comp, companyUser: mapCompanyUser(record) });
          }
        }
        setAllCompanies(all);

        // Priority: URL-requested > in-memory requested > localStorage persisted > first in list
        const urlParams = new URLSearchParams(window.location.search);
        const urlCompanyId = urlParams.get('company');
        const storageKey = `rcf_selected_company_${user.id}`;
        const storedCompanyId = localStorage.getItem(storageKey);
        const preferredId = requestedCompanyId || urlCompanyId || storedCompanyId || null;
        const match = preferredId ? all.find((c) => c.company.id === preferredId) : null;
        const selected = match || all[0];

        setCompany(selected.company);
        setCompanyUser(selected.companyUser);
        localStorage.setItem(storageKey, selected.company.id);

        if (requestedCompanyId) setRequestedCompanyId(null);
      } else {
        setAllCompanies([]);
        setCompany(null);
        setCompanyUser(null);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchCompany = (companyId: string) => {
    const match = allCompanies.find((c) => c.company.id === companyId);
    if (match) {
      setRequestedCompanyId(companyId);
      setCompany(match.company);
      setCompanyUser(match.companyUser);
      if (user?.id) {
        localStorage.setItem(`rcf_selected_company_${user.id}`, companyId);
      }
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  useEffect(() => {
    if (!company?.id) return;

    const channel = supabase
      .channel(`company-live-${company.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${company.id}`,
        },
        (payload) => {
          const updatedCompany = payload.new as Company;

          setCompany((prev) => {
            if (!prev || prev.id !== updatedCompany.id) return prev;
            return { ...prev, ...updatedCompany };
          });

          setAllCompanies((prev) =>
            prev.map((entry) =>
              entry.company.id === updatedCompany.id
                ? { ...entry, company: { ...entry.company, ...updatedCompany } }
                : entry
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [company?.id]);

  const permissions = companyUser
    ? ROLE_PERMISSIONS[companyUser.role]
    : ROLE_PERMISSIONS.employee;

  const isAdmin = companyUser?.role !== 'employee';

  const value = {
    company,
    companyUser,
    loading,
    isAdmin,
    permissions,
    refreshCompany: fetchCompanyData,
    allCompanies,
    switchCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
