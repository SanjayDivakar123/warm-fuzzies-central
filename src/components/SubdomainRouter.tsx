import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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

function extractSubdomain(hostname: string): string | null {
  if (IGNORED_HOSTS.some(ignored => hostname.includes(ignored))) {
    return null;
  }

  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${MAIN_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain.toLowerCase();
    }
  }

  return null;
}

interface SubdomainRouterProps {
  children: React.ReactNode;
}

/**
 * Component that detects subdomain-based company access
 * and redirects to the appropriate company portal routes
 */
export default function SubdomainRouter({ children }: SubdomainRouterProps) {
  const [checking, setChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSubdomain = async () => {
      const hostname = window.location.hostname;
      const subdomain = extractSubdomain(hostname);

      if (!subdomain) {
        setChecking(false);
        return;
      }

      // Already on a company route, don't redirect
      if (location.pathname.startsWith('/company/')) {
        setChecking(false);
        return;
      }

      try {
        // Verify company exists and has subdomain enabled
        const { data: company, error } = await supabase
          .from('companies')
          .select('id, subdomain, subdomain_enabled')
          .eq('subdomain', subdomain)
          .eq('subdomain_enabled', true)
          .maybeSingle();

        if (error) {
          console.error('Subdomain verification error:', error);
          setChecking(false);
          return;
        }

        if (company) {
          // Map current path to company portal path
          const currentPath = location.pathname;
          let targetPath = `/company/${subdomain}`;

          // Map common paths to company portal equivalents
          if (currentPath === '/' || currentPath === '') {
            targetPath = `/company/${subdomain}`;
          } else if (currentPath === '/login') {
            targetPath = `/company/${subdomain}/login`;
          } else if (currentPath === '/admin') {
            targetPath = `/company/${subdomain}/admin`;
          } else if (currentPath === '/home') {
            targetPath = `/company/${subdomain}/home`;
          } else if (currentPath === '/assessment') {
            targetPath = `/company/${subdomain}/assessment`;
          } else if (currentPath === '/results') {
            targetPath = `/company/${subdomain}/results`;
          } else {
            // For any other paths, go to company landing
            targetPath = `/company/${subdomain}`;
          }

          // Include search params if any
          const search = location.search;
          setShouldRedirect(true);
          navigate(targetPath + search, { replace: true });
        } else {
          // Company not found or subdomain not enabled - show normal site
          setChecking(false);
        }
      } catch (err) {
        console.error('Subdomain check failed:', err);
        setChecking(false);
      }
    };

    checkSubdomain();
  }, [location.pathname, location.search, navigate]);

  // Show loading while checking subdomain
  if (checking && !shouldRedirect) {
    // Quick check - if no subdomain detected, don't show loader
    const subdomain = extractSubdomain(window.location.hostname);
    if (!subdomain) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading company portal...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
