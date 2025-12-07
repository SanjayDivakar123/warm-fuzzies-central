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

interface AssessmentResults {
  dominantColor: string;
  scores: {
    yellow: number;
    red: number;
    green: number;
    blue: number;
  };
  totalQuestions: number;
  assessmentType: string;
  companyId?: string;
  companyName?: string;
  completedAt?: string;
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
  assessmentResults: AssessmentResults | null;
  loading: boolean;
  error: string | null;
  refreshEmployee: () => Promise<void>;
  setEmployee: (employee: CompanyEmployee | null) => void;
  fetchAssessmentResults: () => Promise<void>;
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
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch company data
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

  // Try to restore employee session from localStorage
  useEffect(() => {
    if (company && !employee) {
      const savedEmployeeId = localStorage.getItem(`employee_session_${company.subdomain}`);
      if (savedEmployeeId) {
        // Fetch fresh employee data from Supabase
        refreshEmployeeById(savedEmployeeId);
      }
    }
  }, [company]);

  const refreshEmployeeById = async (employeeId: string) => {
    if (!company) return;

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-employee-data', {
        body: { employeeId, companyId: company.id }
      });

      if (fetchError || !data?.success) {
        console.error('Failed to refresh employee:', fetchError || data?.message);
        localStorage.removeItem(`employee_session_${company.subdomain}`);
        setEmployee(null);
        return;
      }

      setEmployee(data.employee);
      
      // Fetch assessment results if completed
      if (data.employee.assessment_result_id) {
        setAssessmentResults(data.assessmentResults?.results || null);
      }
    } catch (err) {
      console.error('Error refreshing employee:', err);
    }
  };

  const refreshEmployee = async () => {
    if (employee) {
      await refreshEmployeeById(employee.id);
    }
  };

  const fetchAssessmentResults = async () => {
    if (!employee?.assessment_result_id) {
      setAssessmentResults(null);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-employee-data', {
        body: { employeeId: employee.id, companyId: company?.id }
      });

      if (!fetchError && data?.success && data.assessmentResults) {
        setAssessmentResults(data.assessmentResults.results);
      }
    } catch (err) {
      console.error('Error fetching assessment results:', err);
    }
  };

  const handleSetEmployee = (emp: CompanyEmployee | null) => {
    setEmployee(emp);
    if (emp && company) {
      localStorage.setItem(`employee_session_${company.subdomain}`, emp.id);
    } else if (company) {
      localStorage.removeItem(`employee_session_${company.subdomain}`);
    }
  };

  return (
    <CompanyPortalContext.Provider value={{ 
      company, 
      employee, 
      assessmentResults,
      loading, 
      error,
      refreshEmployee,
      setEmployee: handleSetEmployee,
      fetchAssessmentResults
    }}>
      {children}
    </CompanyPortalContext.Provider>
  );
};
