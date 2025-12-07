import { Outlet } from 'react-router-dom';
import { CompanyPortalProvider } from '@/contexts/CompanyPortalContext';

export default function CompanyPortalLayout() {
  return (
    <CompanyPortalProvider>
      <Outlet />
    </CompanyPortalProvider>
  );
}
