"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, MoveRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type NavigationItem = {
  title: string;
  href?: string;
  description?: string;
  items?: Array<{ title: string; href: string }>;
};

function Header1() {
  const { user, signOut } = useAuth();
  const navigationItems: NavigationItem[] = [
    {
      title: "Home",
      href: "/",
      description: "",
    },
    {
      title: "Pricing",
      href: "/pricing",
      description: "",
    },
    {
      title: "Product",
      description: "Discover the tools that turn leadership insights into action.",
      items: [
        {
          title: "Free Assessment",
          href: "/free-assessment",
        },
        {
          title: "Dashboard",
          href: "/dashboard",
        },
        {
          title: "Career Finder",
          href: "/career-finder",
        },
      ],
    },
    {
      title: "About Us",
      description: "Learn more about RoleColorFinder and meet the team behind it.",
      items: [
        {
          title: "About Us",
          href: "/about",
        },
        {
          title: "Our Team",
          href: "/team",
        },
      ],
    },
  ];

  const leftNavigationItems = navigationItems.filter(
    (item) => item.title !== "About Us" && item.title !== "Company"
  );
  const rightNavigationItems = navigationItems.filter(
    (item) => item.title === "About Us"
  );

  const [isOpen, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) {
        setAvatarUrl(undefined);
        return;
      }

      const metadataAvatar = user.user_metadata?.avatar_url as string | undefined;
      if (metadataAvatar) {
        setAvatarUrl(metadataAvatar);
      }

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchAvatar();
  }, [user]);

  useEffect(() => {
    const compute = () => {
      const storyPin = document.documentElement.hasAttribute("data-rc-story-pin");
      // While the Teams story is pinned, keep the header in its top/flush state
      // even though scrollY is still changing during the scrubbed GSAP sequence.
      setIsScrolled(storyPin ? false : window.scrollY > 24);
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    const obs = new MutationObserver(compute);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-rc-story-pin"],
    });
    return () => {
      window.removeEventListener("scroll", compute);
      obs.disconnect();
    };
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-40 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "border-white/20 bg-background/55 shadow-lg backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="container relative mx-auto flex min-h-20 flex-row items-center gap-4 lg:grid lg:grid-cols-3">
        <div className="hidden flex-row items-center justify-start gap-4 lg:flex">
          <NavigationMenu className="flex items-start justify-start">
            <NavigationMenuList className="flex flex-row justify-start gap-4">
              {leftNavigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Link to={item.href}>
                        <Button variant="ghost">{item.title}</Button>
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="text-sm font-medium">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4">
                        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
                          <div className="flex h-full flex-col justify-between">
                            <div className="flex flex-col">
                              <p className="text-base">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Button size="sm" className="mt-10" asChild>
                              <a
                                href="https://app.apollo.io/#/meet/sales"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Book a call today
                              </a>
                            </Button>
                          </div>
                          <div className="flex h-full flex-col justify-end text-sm">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink asChild key={subItem.title}>
                                <Link
                                  to={subItem.href}
                                  className="flex flex-row items-center justify-between rounded px-4 py-2 hover:bg-muted"
                                >
                                  <span>{subItem.title}</span>
                                  <MoveRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex lg:justify-center lg:px-3">
          <Link to="/" className="inline-flex items-center" aria-label="RoleColorFinder home">
            <img
              src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png"
              alt="RoleColorFinder"
              className="h-8 w-auto max-w-[150px] object-contain"
            />
          </Link>
        </div>

        <div className="hidden w-full items-center justify-end gap-4 lg:flex">
          <NavigationMenu className="mr-2 flex items-start justify-start [&>div]:left-auto [&>div]:right-0">
            <NavigationMenuList className="flex flex-row justify-start gap-2">
              {rightNavigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Link to={item.href}>
                        <Button variant="ghost">{item.title}</Button>
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="text-sm font-medium">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[min(450px,calc(100vw-2rem))] p-4">
                        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
                          <div className="flex h-full flex-col justify-between">
                            <div className="flex flex-col">
                              <p className="text-base">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <Button size="sm" className="mt-10" asChild>
                              <a
                                href="https://app.apollo.io/#/meet/sales"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Book a call today
                              </a>
                            </Button>
                          </div>
                          <div className="flex h-full flex-col justify-end text-sm">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink asChild key={subItem.title}>
                                <Link
                                  to={subItem.href}
                                  className="flex flex-row items-center justify-between rounded px-4 py-2 hover:bg-muted"
                                >
                                  <span>{subItem.title}</span>
                                  <MoveRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {user ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage src={avatarUrl} alt={userName} />
                      <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{userName}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      await signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden md:inline" asChild>
                <a
                  href="https://app.apollo.io/#/meet/sales"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a demo
                </a>
              </Button>
              <div className="hidden border-r md:inline" />
              <Button variant="outline" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/free-assessment">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="ml-auto flex w-12 shrink items-center justify-end lg:hidden">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {isOpen && (
            <div className="absolute right-0 top-20 flex w-[min(22rem,calc(100vw-1rem))] flex-col gap-6 rounded-2xl border border-border bg-background px-4 py-4 shadow-lg">
              {navigationItems.map((item) => (
                <div key={item.title}>
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="flex items-center justify-between"
                        onClick={() => setOpen(false)}
                      >
                        <span className="text-lg">{item.title}</span>
                        <MoveRight className="h-4 w-4 stroke-1 text-muted-foreground" />
                      </Link>
                    ) : (
                      <p className="text-lg">{item.title}</p>
                    )}
                    {item.items?.map((subItem) => (
                      <Link
                        key={subItem.title}
                        to={subItem.href}
                        className="flex items-center justify-between"
                        onClick={() => setOpen(false)}
                      >
                        <span className="text-muted-foreground">{subItem.title}</span>
                        <MoveRight className="h-4 w-4 stroke-1" />
                      </Link>
                    ))}
                    {!user && item.title === "About Us" && (
                      <Button
                        variant="outline"
                        className="mt-2 w-full justify-center"
                        asChild
                      >
                        <Link to="/auth" onClick={() => setOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t pt-2">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center justify-between py-1"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-lg">Dashboard</span>
                      <MoveRight className="h-4 w-4 stroke-1 text-muted-foreground" />
                    </Link>
                    <button
                      className="flex w-full items-center justify-between py-1 text-left"
                      onClick={async () => {
                        await signOut();
                        setOpen(false);
                      }}
                    >
                      <span className="text-lg">Sign Out</span>
                      <LogOut className="h-4 w-4 stroke-1 text-muted-foreground" />
                    </button>
                  </>
                ) : (
                  <Button className="mt-2 w-full" asChild>
                    <Link to="/free-assessment" onClick={() => setOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { Header1 };
