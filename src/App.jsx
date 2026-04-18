import { useEffect, useState } from 'react';
import AdminApp from './admin/AdminApp.jsx';
import LoginPage from './admin/LoginPage.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import Onboarding from './dashboard/Onboarding.jsx';
import { postJson } from './lib/api.js';

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [tenantId, setTenantId] = useState(null);
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [bootstrapError, setBootstrapError] = useState('');

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === '/login' || pathname.startsWith('/admin')) {
      setReady(true);
      return undefined;
    }

    let active = true;

    async function bootstrap() {
      setBootstrapError('');
      const params = new URLSearchParams(window.location.search);
      let tenant = params.get('tenant_id');
      let onboardingFromBootstrap = null;

      if (!tenant) {
        const response = await postJson('/api/tenant/bootstrap', {});
        tenant = response.tenant.id;
        window.history.replaceState({}, '', `/?tenant_id=${tenant}`);
        if (!active) return;
        onboardingFromBootstrap = response.needsOnboarding !== false;
        setNeedsOnboarding(onboardingFromBootstrap);
      }

      if (!active) return;
      setTenantId(tenant);
      if (!window.location.search.includes('onboarding=')) {
        if (onboardingFromBootstrap === null) {
          const bootstrapResponse = await postJson('/api/tenant/dashboard', { tenantId: tenant });
          if (!active) return;
          setNeedsOnboarding(bootstrapResponse.needsOnboarding !== false);
        }
      } else {
        setNeedsOnboarding(params.get('onboarding') !== 'false');
      }
      setReady(true);
    }

    bootstrap().catch((error) => {
      if (!active) return;
      setBootstrapError(error?.message || 'Unknown bootstrap error');
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  if (pathname === '/login') {
    return <LoginPage />;
  }

  if (pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  if (!ready) {
    return <div className="empty-state">Loading OutreachOS workspace...</div>;
  }

  if (!tenantId) {
    return (
      <div className="empty-state">
        <div>Unable to initialize tenant workspace.</div>
        {bootstrapError ? <div style={{ marginTop: 12, fontSize: 14, opacity: 0.8 }}>{bootstrapError}</div> : null}
        <div style={{ marginTop: 16, fontSize: 13, opacity: 0.75, maxWidth: 560, lineHeight: 1.6 }}>
          Check that the Express API server is running on port 3000, your `.env` has real Supabase and Groq values,
          and the Supabase schema from `supabase/schema.sql` has been applied.
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding tenantId={tenantId} onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <Dashboard tenantId={tenantId} />;
}
