import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-footer text-background py-16">
      <div className="container-wide">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src="/lovable-uploads/215460ce-2150-4569-b60c-3a223ce10adf.png" alt="RoleColor™ Finder" className="h-8 w-auto" />
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
              <li><Link to="/about" className="text-background/80 hover:text-background transition-colors text-sm">About Us</Link></li>
              <li><Link to="/contact" className="text-background/80 hover:text-background transition-colors text-sm">Contact</Link></li>
              <li><Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-background/80 text-sm">
              <span>&copy; {new Date().getFullYear()}</span>
              <img src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RoleColor™ Finder" className="h-4 w-auto" />
              <span>All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <Link to="/about" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                About
              </Link>
              <Link to="/contact" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                Contact
              </Link>
              <Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                Privacy
              </Link>
              <Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
