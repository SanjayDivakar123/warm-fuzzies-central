import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { Palette, Home, CreditCard, Menu, X, User, LogOut, Users, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    user,
    signOut
  } = useAuth();
  const { company } = useCompany();
  const isActive = (path: string) => location.pathname === path;
  
  // Route to B2B company portal if user has company access, otherwise regular dashboard
  const dashboardPath = company ? '/b2b/company-portal' : '/dashboard';
  return <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex h-16 items-center justify-between bg-white rounded-full px-6 shadow-lg border border-border/10">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0 smooth-hover hover:scale-105">
            <img src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RoleColor™ Finder" className="h-7 w-auto sm:h-8" />
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:block">
            <Menubar className="border-none bg-transparent space-x-2">
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/" className={`cursor-pointer smooth-hover rounded-lg px-4 py-2 ${isActive('/') ? 'bg-primary/10 text-primary font-semibold border border-primary/20' : 'hover:bg-accent/50'}`}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/pricing" className={`cursor-pointer smooth-hover rounded-lg px-4 py-2 ${isActive('/pricing') ? 'bg-primary/10 text-primary font-semibold border border-primary/20' : 'hover:bg-accent/50'}`}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pricing
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/free-assessment" className={`cursor-pointer smooth-hover rounded-lg px-4 py-2 ${isActive('/free-assessment') ? 'bg-primary/10 text-primary font-semibold border border-primary/20' : 'hover:bg-accent/50'}`}>
                    <Palette className="w-4 h-4 mr-2" />
                    Free Assessment
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>


              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/team" className={`cursor-pointer smooth-hover rounded-lg px-4 py-2 ${isActive('/team') ? 'bg-primary/10 text-primary font-semibold border border-primary/20' : 'hover:bg-accent/50'}`}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Our Team
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/blog" className={`cursor-pointer smooth-hover rounded-lg px-4 py-2 ${isActive('/blog') ? 'bg-primary/10 text-primary font-semibold border border-primary/20' : 'hover:bg-accent/50'}`}>
                    <Users className="w-4 h-4 mr-2" />
                    Blog
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

            </Menubar>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? <>
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                  <Link to={dashboardPath}>
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </> : <>
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                  <Link to="/auth">
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6" asChild>
                  <Link to="/free-assessment">
                    Get Started
                  </Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2 rounded-full hover:bg-accent/50 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="lg:hidden mt-2 bg-white rounded-2xl shadow-lg border border-border/10 overflow-hidden">
            <div className="px-4 py-4 space-y-1">
              <Link to="/" className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/pricing" className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/pricing') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link to="/free-assessment" className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/free-assessment') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                Free Assessment
              </Link>
              <Link to="/team" className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/team') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                Our Team
              </Link>
              <Link to="/blog" className={`block px-4 py-3 rounded-xl text-base font-medium ${isActive('/blog') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                Blog
              </Link>
              
              <div className="pt-3 border-t border-border/20 mt-3 space-y-2">
                {user ? <>
                    <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl" asChild>
                      <Link to={dashboardPath}>
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl" onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </> : <>
                    <Button variant="ghost" size="sm" className="w-full rounded-xl" asChild>
                      <Link to="/auth">
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="w-full rounded-xl bg-foreground text-background">
                      <Link to="/free-assessment">
                        Get Started
                      </Link>
                    </Button>
                  </>}
              </div>
            </div>
          </div>}
      </div>
    </div>;
}