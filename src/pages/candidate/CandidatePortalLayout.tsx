import { Outlet } from 'react-router-dom';
import { CandidatePortalProvider } from '@/contexts/CandidatePortalContext';

export default function CandidatePortalLayout() {
  return (
    <CandidatePortalProvider>
      <Outlet />
    </CandidatePortalProvider>
  );
}
