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
  canManageCandidates: boolean;
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
    canManageCandidates: true,
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
    canManageCandidates: true,
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
    canManageCandidates: false,
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
    canManageCandidates: false,
    canViewAssessments: false,
    canManageReminders: false,
    canUseWorkMatrix: false,
    canManageSettings: false,
    canInviteAdmins: false,
    canPromoteUsers: false,
    canManageAllRoles: false,
  },
};

interface CompanyContextType {
  company: Company | null;
  companyUser: CompanyUser | null;
  loading: boolean;
  isAdmin: boolean;
  permissions: RolePermissions;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

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
  const [loading, setLoading] = useState(true);

  const fetchCompanyData = async () => {
    if (!user || !user.email) {
      setCompany(null);
      setCompanyUser(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch company user records (user might be admin of multiple companies)
      // Query by user_id first, then also check by email for non-linked accounts
      const { data: byUserId, error: userIdError } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user.id);

      const { data: byEmail, error: emailError } = await supabase
        .from('company_users')
        .select('*')
        .ilike('email', user.email);

      console.log('[CompanyContext] Fetching for user:', user.email, 'user_id:', user.id);
      console.log('[CompanyContext] By user_id:', byUserId?.length, 'records', byUserId?.map(r => ({ role: r.role, status: r.status, id: r.id })));
      console.log('[CompanyContext] By email:', byEmail?.length, 'records', byEmail?.map(r => ({ role: r.role, status: r.status, user_id: r.user_id, id: r.id })));

      // Merge and deduplicate records (prefer user_id linked records)
      const userIdRecordIds = new Set(byUserId?.map(r => r.id) || []);
      const emailOnlyRecords = (byEmail || []).filter(r => !userIdRecordIds.has(r.id));
      const companyUserRecords = [...(byUserId || []), ...emailOnlyRecords];

      // Sort: admin/hr/partner first, then active status, then most recent
      companyUserRecords.sort((a, b) => {
        // Non-employee roles come first
        const aIsAdmin = ['admin', 'hr', 'partner'].includes(a.role);
        const bIsAdmin = ['admin', 'hr', 'partner'].includes(b.role);
        if (aIsAdmin && !bIsAdmin) return -1;
        if (!aIsAdmin && bIsAdmin) return 1;
        // Active status comes first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
      });

      // Pick the first admin/hr/partner record (active or invited), or fall back to first active record
      // Admin-level users don't need to complete an invite flow, so 'invited' status is OK for them
      const adminRecord = companyUserRecords?.find(
        (r) => ['admin', 'hr', 'partner'].includes(r.role) && ['active', 'invited'].includes(r.status)
      );
      const activeRecord = companyUserRecords?.find((r) => r.status === 'active');
      const companyUserData = adminRecord || activeRecord || companyUserRecords?.[0];

      console.log('[CompanyContext] All records after merge:', companyUserRecords?.length);
      console.log('[CompanyContext] adminRecord:', adminRecord ? { role: adminRecord.role, status: adminRecord.status } : null);
      console.log('[CompanyContext] Selected:', companyUserData ? { role: companyUserData.role, status: companyUserData.status } : null);

      if (companyUserData) {
        // If found by email but user_id not linked, link it now
        if (!companyUserData.user_id && companyUserData.email.toLowerCase() === user.email?.toLowerCase()) {
          await supabase
            .from('company_users')
            .update({ 
              user_id: user.id, 
              status: 'active',
              joined_at: companyUserData.joined_at || new Date().toISOString()
            })
            .eq('id', companyUserData.id);
          
          // Update local data
          companyUserData.user_id = user.id;
          companyUserData.status = 'active';
        }

        // Map database role to our type
        const mappedUser: CompanyUser = {
          id: companyUserData.id,
          company_id: companyUserData.company_id,
          user_id: companyUserData.user_id ?? undefined,
          email: companyUserData.email,
          role: companyUserData.role as CompanyUserRole,
          status: companyUserData.status,
          invite_code: companyUserData.invite_code ?? undefined,
          invited_at: companyUserData.invited_at ?? '',
          joined_at: companyUserData.joined_at ?? undefined,
          assessment_completed_at: companyUserData.assessment_completed_at ?? undefined,
          assessment_result_id: companyUserData.assessment_result_id ?? undefined,
        };
        setCompanyUser(mappedUser);

        // Fetch company details
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyUserData.company_id)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [user]);

  // Get permissions based on role
  const permissions = companyUser 
    ? ROLE_PERMISSIONS[companyUser.role] 
    : ROLE_PERMISSIONS.employee;

  // isAdmin now means any admin-level role (admin, hr, or partner)
  const isAdmin = companyUser?.role !== 'employee';

  const value = {
    company,
    companyUser,
    loading,
    isAdmin,
    permissions,
    refreshCompany: fetchCompanyData,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
