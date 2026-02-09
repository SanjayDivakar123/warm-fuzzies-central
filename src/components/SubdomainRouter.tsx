interface SubdomainRouterProps {
  children: React.ReactNode;
}

/**
 * Component that renders children without subdomain detection
 * Subdomain URL feature has been removed - all access is via path-based URLs
 */
export default function SubdomainRouter({ children }: SubdomainRouterProps) {
  return <>{children}</>;
}
