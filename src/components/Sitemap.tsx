import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card } from "@/components/ui/card";
import { 
  Home, 
  Info, 
  Mail, 
  DollarSign, 
  FileText, 
  Shield, 
  BarChart, 
  Users, 
  Settings,
  Phone,
  UserCircle
} from "lucide-react";

const Sitemap = () => {
  const pages = [
    { name: "Home", path: "/", icon: Home },
    { name: "About Us", path: "/about", icon: Info },
    { name: "Our Team", path: "/team", icon: UserCircle },
    { name: "Contact", path: "/contact", icon: Mail },
    { name: "Pricing", path: "/pricing", icon: DollarSign },
    { name: "Free Assessment", path: "/free-assessment", icon: BarChart },
    { name: "Premium Assessment", path: "/premium-assessment", icon: BarChart },
    { name: "Pro Assessment", path: "/pro-assessment", icon: BarChart },
    { name: "Team Program", path: "/team-program", icon: Users },
    { name: "Privacy Policy", path: "/privacy-policy", icon: Shield },
    { name: "Terms of Service", path: "/terms-of-service", icon: FileText },
    { name: "Account Settings", path: "/dashboard", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-wide section-padding">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Sitemap</h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Navigate to any page on our website
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pages.map((page) => (
            <Link key={page.path} to={page.path}>
              <Card className="p-6 hover-lift border-border/50 h-full">
                <div className="flex items-center gap-4">
                  <page.icon className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold">{page.name}</h2>
                    <p className="text-sm text-muted-foreground">{page.path}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Sitemap;
