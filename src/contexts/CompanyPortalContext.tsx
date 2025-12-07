import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  admin_email: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  seats_purchased: number;
  assessment_type: '25q' | '50q';
}

interface CompanyEmployee {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  status: 'invited' | 'active' | 'revoked';
  invite_code: string | null;
  user_id: string | null;
  assessment_completed_at: string | null;
  assessment_result_id: string | null;
}

interface CompanyPortalContextType {
  company: Company | null;
  employee: CompanyEmployee | null;
  loading: boolean;
  error: string | null;
  refreshEmployee: () => Promise<void>;
  setEmployee: (employee: CompanyEmployee | null) => void;
}

const CompanyPortalContext = createContext<CompanyPortalContextType | undefined>(undefined);

export const useCompanyPortal = () => {
  const context = useContext(CompanyPortalContext);
  if (context === undefined) {
    throw new Error('useCompanyPortal must be used within a CompanyPortalProvider');
  }
  return context;
};

interface CompanyPortalProviderProps {
  children: ReactNode;
}

export const CompanyPortalProvider = ({ children }: CompanyPortalProviderProps) => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [employee, setEmployee] = useState<CompanyEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!subdomain) {
        setLoading(false);
        setError('No company subdomain provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch company by subdomain - this is a public query
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('subdomain', subdomain)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching company:', fetchError);
          setError('Failed to load company');
          setCompany(null);
        } else if (!data) {
          setError('Company not found');
          setCompany(null);
        } else {
          setCompany(data as Company);
        }
      } catch (err) {
        console.error('Error in fetchCompany:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [subdomain]);

  const refreshEmployee = async () => {
    // This will be called after login to refresh employee data
    // The employee data is set via setEmployee from the login flow
  };

  return (
    <CompanyPortalContext.Provider value={{ 
      company, 
      employee, 
      loading, 
      error,
      refreshEmployee,
      setEmployee
    }}>
      {children}
    </CompanyPortalContext.Provider>
  );
};
