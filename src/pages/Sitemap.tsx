import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Home, CreditCard, Palette, Users, FileText, Shield, RotateCcw, User, Award, Crown, MapPin } from "lucide-react";

const Sitemap = () => {
  const sitePages = [
    {
      title: "Main Pages",
      pages: [
        { name: "Home", path: "/", icon: Home, description: "Welcome to RoleColor Finder" },
        { name: "Pricing", path: "/pricing", icon: CreditCard, description: "View all assessment plans and pricing" },
        { name: "Team Program", path: "/team-program", icon: Users, description: "12-Week Team Composition & Role Design Program" },
      ]
    },
    {
      title: "Assessments",
      pages: [
        { name: "Free Assessment", path: "/free-assessment", icon: Palette, description: "3-question leadership preview" },
        { name: "Premium Assessment", path: "/premium-assessment", icon: Award, description: "25-question comprehensive assessment" },
        { name: "Pro Assessment", path: "/pro-assessment", icon: Crown, description: "50-question deep dive analysis" },
      ]
    },
    {
      title: "Results Pages",
      pages: [
        { name: "Free Results", path: "/free-results", icon: FileText, description: "Preview assessment results" },
        { name: "Premium Results", path: "/premium-results", icon: Award, description: "Detailed premium insights" },
        { name: "Pro Results", path: "/pro-results", icon: Crown, description: "Comprehensive analysis report" },
      ]
    },
    {
      title: "Account & Support",
      pages: [
        { name: "Sign In / Sign Up", path: "/auth", icon: User, description: "Account authentication" },
        { name: "Dashboard", path: "/dashboard", icon: User, description: "User dashboard and results" },
        { name: "Reset Password", path: "/reset-password", icon: RotateCcw, description: "Password recovery" },
        { name: "Privacy Policy", path: "/privacy-policy", icon: Shield, description: "Privacy and data protection policy" },
        { name: "Payment Success", path: "/payment-success", icon: CreditCard, description: "Payment confirmation page" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="section-padding bg-gradient-soft">
        <div className="container-wide">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-3 glass-card px-6 py-3 rounded-full border border-primary/30">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wide">Site Navigation</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-balance">
              Site
              <br />
              <span className="gradient-text-primary">Map</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Navigate through all pages and features of RoleColor Finder.
            </p>
          </div>
        </div>
      </section>

      {/* Sitemap Content */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12">
            {sitePages.map((section, index) => (
              <div key={index} className="space-y-6 animate-fade-in" style={{animationDelay: `${index * 200}ms`}}>
                <h2 className="text-2xl font-bold text-foreground mb-6">{section.title}</h2>
                
                <div className="space-y-4">
                  {section.pages.map((page, pageIndex) => (
                    <Link 
                      key={pageIndex}
                      to={page.path}
                      className="block p-6 glass-card rounded-2xl border border-border/50 hover:border-primary/40 transition-all duration-300 hover-lift group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <page.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                            {page.name}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed mt-1">
                            {page.description}
                          </p>
                          <div className="text-xs text-primary font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {page.path}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sitemap;