import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  subdomain_enabled: boolean;
  admin_email: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  seats_purchased: number;
  assessment_type: '25q' | '50q';
  assessment_category: 'professional' | 'entrepreneur' | 'executive' | 'manager';
  google_sso_enabled: boolean | null;
  google_workspace_domain: string | null;
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

export interface ReusableAssessmentOption {
  id: string;
  assessmentType: string;
  displayName: string;
  completedAt: string;
  dominantColor: string | null;
  totalQuestions: number | null;
  sourceKind: 'personal' | 'company' | 'code';
  sourceLabel: string;
  matchesCompanyAssessment: boolean;
  mismatchWarning: string | null;
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
  assessment_category: 'professional' | 'entrepreneur' | 'executive' | 'manager' | null;
  assessment_type: '25q' | '50q' | null;
}

interface CompanyPortalContextType {
  company: Company | null;
  employee: CompanyEmployee | null;
  assessmentResults: AssessmentResults | null;
  reusableAssessments: ReusableAssessmentOption[];
  loading: boolean;
  error: string | null;
  refreshEmployee: () => Promise<void>;
  setEmployee: (employee: CompanyEmployee | null) => void;
  setReusableAssessments: (assessments: ReusableAssessmentOption[]) => void;
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
  const [reusableAssessments, setReusableAssessments] = useState<ReusableAssessmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionRestoring, setSessionRestoring] = useState(false);
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
          setLoading(false);
        } else if (!data) {
          setError('Company not found');
          setCompany(null);
          setLoading(false);
        } else {
          const companyData = data as Company;
          setCompany(companyData);
          
          // Check if there's a session to restore BEFORE setting loading to false
          const raw = localStorage.getItem(`employee_session_${companyData.subdomain}`);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed?.employeeId && parsed?.inviteCode) {
                // There's a session to restore - keep loading true and set restoring flag
                setSessionRestoring(true);
              } else {
                setLoading(false);
              }
            } catch {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error in fetchCompany:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchCompany();
  }, [subdomain]);

  // Try to restore employee session from localStorage
  useEffect(() => {
    if (!company || employee || !sessionRestoring) return;

    const raw = localStorage.getItem(`employee_session_${company.subdomain}`);
    if (!raw) {
      // No saved session - done loading
      setSessionRestoring(false);
      setLoading(false);
      return;
    }

    // Backward compatible: older versions stored just the employeeId
    let employeeId: string | null = null;
    let inviteCode: string | null = null;

    try {
      const parsed = JSON.parse(raw);
      employeeId = parsed?.employeeId ?? null;
      inviteCode = parsed?.inviteCode ?? null;
    } catch {
      employeeId = raw;
      inviteCode = null;
    }

    if (!employeeId || !inviteCode) {
      // Old/incomplete session format – require login
      localStorage.removeItem(`employee_session_${company.subdomain}`);
      setSessionRestoring(false);
      setLoading(false);
      return;
    }

    // Restore the session
    refreshEmployeeBySession(employeeId, inviteCode);
  }, [company, employee, sessionRestoring]);

  const refreshEmployeeBySession = async (employeeId: string, inviteCode: string) => {
    if (!company) return;

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-company-employee-session', {
        body: { employeeId, companyId: company.id, inviteCode },
      });

      if (fetchError || !data?.success) {
        console.error('Failed to refresh employee session:', fetchError || data?.message);
        localStorage.removeItem(`employee_session_${company.subdomain}`);
        setEmployee(null);
        setAssessmentResults(null);
        setReusableAssessments([]);
        return;
      }

      setEmployee(data.employee);
      setAssessmentResults(data.assessmentResults?.results ?? null);
      setReusableAssessments((data.reusableAssessments ?? []) as ReusableAssessmentOption[]);
    } catch (err) {
      console.error('Error refreshing employee session:', err);
    } finally {
      setSessionRestoring(false);
      setLoading(false);
    }
  };

  const refreshEmployee = async () => {
    if (!company || !employee?.id || !employee?.invite_code) return;
    await refreshEmployeeBySession(employee.id, employee.invite_code);
  };

  const fetchAssessmentResults = async () => {
    if (!company || !employee?.id || !employee?.invite_code) {
      setAssessmentResults(null);
      setReusableAssessments([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-company-employee-session', {
        body: { employeeId: employee.id, companyId: company.id, inviteCode: employee.invite_code },
      });

      if (!fetchError && data?.success) {
        setEmployee(data.employee);
        setAssessmentResults(data.assessmentResults?.results ?? null);
        setReusableAssessments((data.reusableAssessments ?? []) as ReusableAssessmentOption[]);
      }
    } catch (err) {
      console.error('Error fetching assessment results:', err);
    }
  };

  const handleSetEmployee = (emp: CompanyEmployee | null) => {
    setEmployee(emp);
    // Clear previous assessment results when employee changes
    setAssessmentResults(null);
    setReusableAssessments([]);

    if (emp && company) {
      // Persist a minimal employee session so they don't have to re-login
      localStorage.setItem(
        `employee_session_${company.subdomain}`,
        JSON.stringify({ employeeId: emp.id, inviteCode: emp.invite_code })
      );
    } else if (company) {
      localStorage.removeItem(`employee_session_${company.subdomain}`);
    }
  };

  return (
    <CompanyPortalContext.Provider value={{ 
      company, 
      employee, 
      assessmentResults,
      reusableAssessments,
      loading, 
      error,
      refreshEmployee,
      setEmployee: handleSetEmployee,
      setReusableAssessments,
      fetchAssessmentResults
    }}>
      {children}
    </CompanyPortalContext.Provider>
  );
};
