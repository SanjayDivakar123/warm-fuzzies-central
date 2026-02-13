import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-footer text-background py-4 lg:py-16 overflow-hidden">
      <div className="container-wide px-4 sm:px-6">
        {/* Mobile/Tablet Footer - 2 column horizontal layout (shows up to lg breakpoint) */}
        <div className="lg:hidden">
          {/* Two column grid for main sections */}
          <div className="grid grid-cols-2 gap-4 text-[11px] mb-4">
            {/* Left Column - Main Pages */}
            <div>
              <h4 className="font-semibold text-background/90 mb-2 text-xs">Main Pages</h4>
              <div className="flex flex-col gap-1">
                <Link to="/" className="text-background/70 hover:text-background">Home</Link>
                <Link to="/pricing" className="text-background/70 hover:text-background">Pricing</Link>
                <Link to="/free-assessment" className="text-background/70 hover:text-background">Free Assessment</Link>
              </div>
            </div>
            
            {/* Right Column - Assessments */}
            <div>
              <h4 className="font-semibold text-background/90 mb-2 text-xs">Assessments</h4>
              <div className="flex flex-col gap-1">
                <Link to="/premium-assessment" className="text-background/70 hover:text-background">Premium</Link>
                <Link to="/pro-assessment" className="text-background/70 hover:text-background">Pro</Link>
                <Link to="/dashboard" className="text-background/70 hover:text-background">Dashboard</Link>
              </div>
            </div>
          </div>
          
          {/* Bottom row - legal links + copyright */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-[10px] border-t border-background/20 pt-3">
            <Link to="/auth" className="text-background/60 hover:text-background">Sign In</Link>
            <span className="text-background/30">•</span>
            <Link to="/privacy-policy" className="text-background/60 hover:text-background">Privacy</Link>
            <span className="text-background/30">•</span>
            <Link to="/terms-of-service" className="text-background/60 hover:text-background">Terms</Link>
            <span className="text-background/30">•</span>
            <span className="text-background/50">© {new Date().getFullYear()} RoleColor™</span>
          </div>
        </div>
        
        {/* Desktop Full Footer (lg and up) */}
        <div className="hidden lg:block">
          <div className="grid lg:grid-cols-4 gap-8 mb-12">
            {/* Logo & Description */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/uploads/215460ce-2150-4569-b60c-3a223ce10adf.png" alt="RoleColor™ Finder" className="h-8 w-auto" />
              </div>
              <p className="text-background/80 text-sm leading-relaxed">
                Discover your unique leadership color profile with our science-backed assessment system.
              </p>
            </div>
            
            {/* Main Pages */}
            <div>
              <h3 className="font-bold gradient-text mb-4">Main Pages</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-background/80 hover:text-background transition-colors text-sm">Home</Link></li>
                <li><Link to="/pricing" className="text-background/80 hover:text-background transition-colors text-sm">Pricing</Link></li>
                <li><Link to="/sitemap" className="text-background/80 hover:text-background transition-colors text-sm">Sitemap</Link></li>
              </ul>
            </div>
            
            {/* Assessments */}
            <div>
              <h3 className="font-bold gradient-text mb-4">Assessments</h3>
              <ul className="space-y-3">
                <li><Link to="/free-assessment" className="text-background/80 hover:text-background transition-colors text-sm">Free Assessment</Link></li>
                <li><Link to="/premium-assessment" className="text-background/80 hover:text-background transition-colors text-sm">Premium Assessment</Link></li>
                <li><Link to="/pro-assessment" className="text-background/80 hover:text-background transition-colors text-sm">Pro Assessment</Link></li>
                <li><Link to="/dashboard" className="text-background/80 hover:text-background transition-colors text-sm">Dashboard</Link></li>
              </ul>
            </div>
            
            {/* Account & Legal */}
            <div>
              <h3 className="font-bold gradient-text mb-4">Account & Legal</h3>
              <ul className="space-y-3">
                <li><Link to="/auth" className="text-background/80 hover:text-background transition-colors text-sm">Sign In / Sign Up</Link></li>
                <li><Link to="/reset-password" className="text-background/80 hover:text-background transition-colors text-sm">Reset Password</Link></li>
                <li><Link to="/contact" className="text-background/80 hover:text-background transition-colors text-sm">Contact</Link></li>
                <li><Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-background/20 pt-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-background/80 text-sm">
                <span>&copy; {new Date().getFullYear()}</span>
                <img src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RoleColor™ Finder" className="h-4 w-auto" />
                <span>All rights reserved.</span>
              </div>
              <div className="flex gap-6">
                <Link to="/about" className="text-background/80 hover:text-background transition-colors text-sm font-medium">About</Link>
                <Link to="/contact" className="text-background/80 hover:text-background transition-colors text-sm font-medium">Contact</Link>
                <Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors text-sm font-medium">Privacy</Link>
                <Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors text-sm font-medium">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
