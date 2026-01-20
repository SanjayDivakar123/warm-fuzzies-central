import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MenuIcon, User, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SlideTabs } from '@/components/ui/slide-tabs';
import { MenuVertical } from '@/components/ui/menu-vertical';

const navTabs = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Free Assessment', href: '/free-assessment' },
  { label: 'Our Team', href: '/team' },
];

export function FloatingHeader() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <>
      {/* Spacer to prevent content from going under the fixed header */}
      <div className="h-20" aria-hidden="true" />
      <header className="fixed top-4 left-1/2 z-50 w-[95%] max-w-6xl -translate-x-1/2">
      <nav className="flex items-center justify-between gap-2 rounded-2xl border border-border/50 bg-card/80 p-2 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 px-2">
          <img 
            src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" 
            alt="RoleColor™ Finder" 
            className="h-8 w-auto" 
          />
        </Link>

        {/* Desktop Navigation - SlideTabs */}
        <div className="hidden lg:block">
          <SlideTabs tabs={navTabs} />
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'rounded-xl'
                )}
              >
                <User className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'rounded-xl'
                )}
              >
                Sign In
              </Link>
              <Link
                to="/free-assessment"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'rounded-xl'
                )}
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(!open)}
                className="lg:hidden rounded-xl"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Nav Links - MenuVertical */}
                <div className="flex-1 px-4 py-6">
                  <MenuVertical 
                    menuItems={navTabs} 
                    onItemClick={() => setOpen(false)}
                  />
                </div>

                {/* Mobile Auth Buttons */}
                <SheetFooter className="flex-col gap-2 px-4 pb-6 border-t pt-4">
                  {user ? (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={() => setOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'w-full rounded-xl justify-center'
                        )}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          signOut();
                          setOpen(false);
                        }}
                        className="w-full rounded-xl"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/auth"
                        onClick={() => setOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          'w-full rounded-xl justify-center'
                        )}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/free-assessment"
                        onClick={() => setOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'default' }),
                          'w-full rounded-xl justify-center'
                        )}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Menu Button (visible on mobile) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
        </Sheet>
      </nav>
    </header>
    </>
  );
}
