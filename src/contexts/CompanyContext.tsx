import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Company {
  id: string;
  name: string;
  subdomain: string;
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
  role: 'admin' | 'employee';
  status: 'invited' | 'active' | 'revoked';
  invite_code?: string;
  invited_at: string;
  joined_at?: string;
  assessment_completed_at?: string;
  assessment_result_id?: string;
}

interface CompanyContextType {
  company: Company | null;
  companyUser: CompanyUser | null;
  loading: boolean;
  isAdmin: boolean;
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
    if (!user) {
      setCompany(null);
      setCompanyUser(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch company user records (user might be admin of multiple companies)
      // Prioritize: active admins first, then by most recent activity
      const { data: companyUserRecords, error: userError } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user.id)
        .order('role', { ascending: true }) // 'admin' comes before 'employee' alphabetically
        .order('status', { ascending: true }) // 'active' comes first
        .order('updated_at', { ascending: false });

      if (userError) throw userError;

      // Pick the first active admin record, or fall back to first active record
      const activeAdminRecord = companyUserRecords?.find(
        (r) => r.role === 'admin' && r.status === 'active'
      );
      const activeRecord = companyUserRecords?.find((r) => r.status === 'active');
      const companyUserData = activeAdminRecord || activeRecord || companyUserRecords?.[0];

      if (companyUserData) {
        setCompanyUser(companyUserData);

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

  const value = {
    company,
    companyUser,
    loading,
    isAdmin: companyUser?.role === 'admin',
    refreshCompany: fetchCompanyData,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
