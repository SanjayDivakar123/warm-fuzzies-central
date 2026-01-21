import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubdomainDetectionResult {
  isSubdomain: boolean;
  subdomain: string | null;
  companyId: string | null;
  loading: boolean;
  error: string | null;
}

// Main production domain
const MAIN_DOMAIN = 'rolecolorfinder.com';

// Domains that should not be treated as subdomains
const IGNORED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'lovable.app',
  'lovable.dev',
  'preview.lovable.app',
];

/**
 * Extract subdomain from hostname
 * e.g., "acme.rolecolorfinder.com" -> "acme"
 */
function extractSubdomain(hostname: string): string | null {
  // Skip for ignored hosts (localhost, preview environments, etc.)
  if (IGNORED_HOSTS.some(ignored => hostname.includes(ignored))) {
    return null;
  }

  // Check if it's a subdomain of the main domain
  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, '');
    // Ensure it's not www or empty
    if (subdomain && subdomain !== 'www') {
      return subdomain.toLowerCase();
    }
  }

  return null;
}

/**
 * Hook to detect if the current hostname is a company subdomain
 * and fetch the associated company data
 */
export function useSubdomainDetection(): SubdomainDetectionResult {
  const [result, setResult] = useState<SubdomainDetectionResult>({
    isSubdomain: false,
    subdomain: null,
    companyId: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const detectSubdomain = async () => {
      try {
        const hostname = window.location.hostname;
        const subdomain = extractSubdomain(hostname);

        if (!subdomain) {
          setResult({
            isSubdomain: false,
            subdomain: null,
            companyId: null,
            loading: false,
            error: null,
          });
          return;
        }

        // Look up company by subdomain with subdomain_enabled = true
        const { data: company, error } = await supabase
          .from('companies')
          .select('id, subdomain, subdomain_enabled')
          .eq('subdomain', subdomain)
          .eq('subdomain_enabled', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching company by subdomain:', error);
          setResult({
            isSubdomain: false,
            subdomain,
            companyId: null,
            loading: false,
            error: 'Failed to verify company subdomain',
          });
          return;
        }

        if (company) {
          setResult({
            isSubdomain: true,
            subdomain,
            companyId: company.id,
            loading: false,
            error: null,
          });
        } else {
          // Subdomain not found or not enabled
          setResult({
            isSubdomain: false,
            subdomain,
            companyId: null,
            loading: false,
            error: 'Company subdomain not found or not enabled',
          });
        }
      } catch (err) {
        console.error('Subdomain detection error:', err);
        setResult({
          isSubdomain: false,
          subdomain: null,
          companyId: null,
          loading: false,
          error: 'Subdomain detection failed',
        });
      }
    };

    detectSubdomain();
  }, []);

  return result;
}

/**
 * Utility function to check subdomain synchronously (for initial routing)
 */
export function getSubdomainFromHostname(): string | null {
  return extractSubdomain(window.location.hostname);
}
