import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { Palette, Home, CreditCard, HelpCircle, Menu, X, User, LogOut, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    user,
    signOut
  } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  return <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <img src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="Role Color Finder" className="h-12 w-auto sm:h-16" />
          </Link>

          {/* Desktop Navigation Menu */}
          <div className="hidden lg:block">
            <Menubar className="border-none bg-transparent">
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/" className={`cursor-pointer ${isActive('/') ? 'bg-accent text-accent-foreground' : ''}`}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/pricing" className={`cursor-pointer ${isActive('/pricing') ? 'bg-accent text-accent-foreground' : ''}`}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pricing
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/free-assessment" className={`cursor-pointer ${isActive('/free-assessment') ? 'bg-accent text-accent-foreground' : ''}`}>
                    <Palette className="w-4 h-4 mr-2" />
                    Free Assessment
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/team-program" className={`cursor-pointer ${isActive('/team-program') ? 'bg-accent text-accent-foreground' : ''}`}>
                    <Users className="w-4 h-4 mr-2" />
                    Team Program
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>

            </Menubar>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </> : <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/free-assessment">
                    Get Started
                  </Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="lg:hidden border-t bg-background/95 backdrop-blur">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                <Home className="w-4 h-4 mr-2 inline" />
                Home
              </Link>
              <Link to="/pricing" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/pricing') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                <CreditCard className="w-4 h-4 mr-2 inline" />
                Pricing
              </Link>
              <Link to="/free-assessment" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/free-assessment') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                <Palette className="w-4 h-4 mr-2 inline" />
                Free Assessment
              </Link>
              <Link to="/team-program" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/team-program') ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'}`} onClick={() => setMobileMenuOpen(false)}>
                <Users className="w-4 h-4 mr-2 inline" />
                Team Program
              </Link>
              
              <div className="px-3 py-2">
                <div className="space-y-2">
                  {user ? <>
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                        <Link to="/dashboard">
                          <User className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </> : <>
                      <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link to="/auth">
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="w-full">
                        <Link to="/free-assessment">
                          Get Started
                        </Link>
                      </Button>
                    </>}
                </div>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}