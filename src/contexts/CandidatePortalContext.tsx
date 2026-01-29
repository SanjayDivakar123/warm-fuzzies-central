import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  subdomain: string;
  subdomain_enabled: boolean;
  logo_url: string | null;
  logo_url_dark: string | null;
  primary_color: string | null;
  secondary_color: string | null;
}

interface ApplicationLink {
  id: string;
  company_id: string;
  position_title: string;
  ideal_role_color: string | null;
  required_skills: string[] | null;
  assessment_category: string;
  assessment_type: string;
  link_code: string;
  is_active: boolean;
  max_applications: number | null;
  applications_count: number | null;
  expires_at: string | null;
}

interface Candidate {
  id: string;
  company_id: string;
  email: string;
  full_name: string | null;
  position_title: string | null;
  status: string;
  invite_code: string | null;
  public_token: string | null;
  assessment_category: string | null;
  assessment_type: string | null;
  assessment_completed_at: string | null;
  assessment_result_id: string | null;
  source: string;
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

type PortalMode = 'invite' | 'apply';

interface CandidatePortalContextType {
  company: Company | null;
  candidate: Candidate | null;
  applicationLink: ApplicationLink | null;
  assessmentResults: AssessmentResults | null;
  loading: boolean;
  error: string | null;
  portalMode: PortalMode;
  setCandidate: (candidate: Candidate | null) => void;
  fetchAssessmentResults: () => Promise<void>;
}

const CandidatePortalContext = createContext<CandidatePortalContextType | undefined>(undefined);

export const useCandidatePortal = () => {
  const context = useContext(CandidatePortalContext);
  if (context === undefined) {
    throw new Error('useCandidatePortal must be used within a CandidatePortalProvider');
  }
  return context;
};

interface CandidatePortalProviderProps {
  children: ReactNode;
}

export const CandidatePortalProvider = ({ children }: CandidatePortalProviderProps) => {
  const { subdomain, code } = useParams<{ subdomain: string; code: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applicationLink, setApplicationLink] = useState<ApplicationLink | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalMode, setPortalMode] = useState<PortalMode>('invite');

  // Fetch company and determine portal mode (invite vs public link)
  useEffect(() => {
    const fetchData = async () => {
      console.log('[CandidatePortal] Params - subdomain:', subdomain, 'code:', code);
      
      if (!subdomain || !code) {
        console.error('[CandidatePortal] Missing params - subdomain:', subdomain, 'code:', code);
        setLoading(false);
        setError('Invalid portal URL');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // First fetch company
        console.log('[CandidatePortal] Fetching company with subdomain:', subdomain);
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, subdomain, subdomain_enabled, logo_url, logo_url_dark, primary_color, secondary_color')
          .eq('subdomain', subdomain)
          .maybeSingle();

        console.log('[CandidatePortal] Company result:', companyData, 'Error:', companyError);

        if (companyError || !companyData) {
          setError('Company not found');
          setLoading(false);
          return;
        }

        setCompany(companyData as Company);

        // Check if code is a public application link
        console.log('[CandidatePortal] Checking for application link with company_id:', companyData.id, 'code:', code);
        const { data: linkData, error: linkError } = await supabase
          .from('candidate_application_links')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('link_code', code)
          .eq('is_active', true)
          .maybeSingle();

        console.log('[CandidatePortal] Application link result:', linkData, 'Error:', linkError);

        if (linkData) {
          // It's a public application link
          setPortalMode('apply');
          setApplicationLink(linkData as ApplicationLink);
          
          // Check if link is expired or maxed out
          if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
            setError('This application link has expired');
          } else if (linkData.max_applications && linkData.applications_count >= linkData.max_applications) {
            setError('This position is no longer accepting applications');
          }
        } else {
          // Check if it's a direct invite code
          console.log('[CandidatePortal] Checking for candidate invite with company_id:', companyData.id, 'invite_code:', code);
          const { data: candidateData, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('company_id', companyData.id)
            .eq('invite_code', code)
            .maybeSingle();

          console.log('[CandidatePortal] Candidate result:', candidateData, 'Error:', candidateError);

          if (candidateData) {
            setPortalMode('invite');
            setCandidate(candidateData as Candidate);
            
            // Fetch assessment results if completed
            if (candidateData.assessment_result_id) {
              const { data: resultsData } = await supabase
                .from('assessment_results')
                .select('results')
                .eq('id', candidateData.assessment_result_id)
                .maybeSingle();

              if (resultsData?.results) {
                setAssessmentResults(resultsData.results as unknown as AssessmentResults);
              }
            }
          } else {
            setError('Invalid or expired invitation link');
          }
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subdomain, code]);

  // Restore candidate session from localStorage
  useEffect(() => {
    if (!company || !code || candidate) return;

    const sessionKey = `candidate_session_${company.subdomain}_${code}`;
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.candidateId) {
        refreshCandidateSession(parsed.candidateId);
      }
    } catch {
      localStorage.removeItem(sessionKey);
    }
  }, [company, code, candidate]);

  const refreshCandidateSession = async (candidateId: string) => {
    if (!company) return;

    try {
      const { data: candidateData } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .eq('company_id', company.id)
        .maybeSingle();

      if (candidateData) {
        setCandidate(candidateData as Candidate);
        
        if (candidateData.assessment_result_id) {
          const { data: resultsData } = await supabase
            .from('assessment_results')
            .select('results')
            .eq('id', candidateData.assessment_result_id)
            .maybeSingle();

          if (resultsData?.results) {
            setAssessmentResults(resultsData.results as unknown as AssessmentResults);
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing candidate session:', err);
    }
  };

  const fetchAssessmentResults = async () => {
    if (!candidate?.assessment_result_id) {
      setAssessmentResults(null);
      return;
    }

    try {
      const { data: resultsData } = await supabase
        .from('assessment_results')
        .select('results')
        .eq('id', candidate.assessment_result_id)
        .maybeSingle();

      if (resultsData?.results) {
        setAssessmentResults(resultsData.results as unknown as AssessmentResults);
      }
    } catch (err) {
      console.error('Error fetching assessment results:', err);
    }
  };

  const handleSetCandidate = (cand: Candidate | null) => {
    setCandidate(cand);
    setAssessmentResults(null);

    if (cand && company && code) {
      localStorage.setItem(
        `candidate_session_${company.subdomain}_${code}`,
        JSON.stringify({ candidateId: cand.id })
      );
    } else if (company && code) {
      localStorage.removeItem(`candidate_session_${company.subdomain}_${code}`);
    }
  };

  return (
    <CandidatePortalContext.Provider value={{
      company,
      candidate,
      applicationLink,
      assessmentResults,
      loading,
      error,
      portalMode,
      setCandidate: handleSetCandidate,
      fetchAssessmentResults,
    }}>
      {children}
    </CandidatePortalContext.Provider>
  );
};
