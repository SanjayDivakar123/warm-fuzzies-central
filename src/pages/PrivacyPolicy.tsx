import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Cookie, Share2, Lock, UserCheck, Mail, ChevronRight } from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => {
    const title = "Privacy Policy | RoleColorFinderLLC";
    const description = "Privacy Policy: how we collect, use, and protect your personal data at RoleColorFinderLLC.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/privacy-policy`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Privacy Policy",
      url: canonicalHref,
      description,
    };

    let scriptEl = document.getElementById("jsonld-privacy") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-privacy";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  const sections = [
    {
      icon: Eye,
      title: "1. Information We Collect",
      color: "blue",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          We may collect information you provide directly (like name, email), usage data (pages visited, actions taken), and device data
          (browser type, IP address). For payments, processing is handled by our secure payment provider; we do not store full card details.
        </p>
      )
    },
    {
      icon: UserCheck,
      title: "2. How We Use Information",
      color: "green",
      content: (
        <ul className="space-y-3 text-muted-foreground">
          {[
            "Operate, maintain, and improve our services",
            "Process transactions and send related information",
            "Provide customer support and respond to requests",
            "Personalize experiences and communicate updates",
            "Protect against fraud, abuse, or security risks"
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <ChevronRight className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    },
    {
      icon: Cookie,
      title: "3. Cookies & Tracking",
      color: "yellow",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          We use cookies and similar technologies to remember preferences, measure performance, and analyze traffic. You can control cookies
          through your browser settings; disabling cookies may affect certain features.
        </p>
      )
    },
    {
      icon: Share2,
      title: "4. Data Sharing",
      color: "purple",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          We do not sell your personal information. We may share limited data with trusted service providers (e.g., analytics, payments) under
          contracts that require appropriate safeguards and use only for specified purposes.
        </p>
      )
    },
    {
      icon: Lock,
      title: "5. Data Security",
      color: "red",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          We implement administrative, technical, and physical safeguards designed to protect your information. However, no method of
          transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>
      )
    },
    {
      icon: Shield,
      title: "6. Your Rights",
      color: "blue",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          Depending on your location, you may have rights to access, correct, delete, or restrict processing of your personal data.
          To exercise these rights, contact us using the details below.
        </p>
      )
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> = {
      blue: { bg: "from-blue-500/10 to-transparent", icon: "text-blue-500", border: "border-blue-500/20" },
      green: { bg: "from-green-500/10 to-transparent", icon: "text-green-500", border: "border-green-500/20" },
      yellow: { bg: "from-yellow-500/10 to-transparent", icon: "text-yellow-500", border: "border-yellow-500/20" },
      purple: { bg: "from-purple-500/10 to-transparent", icon: "text-purple-500", border: "border-purple-500/20" },
      red: { bg: "from-red-500/10 to-transparent", icon: "text-red-500", border: "border-red-500/20" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 text-base px-6 py-3">
            <Shield className="w-4 h-4 mr-2" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your privacy matters. This policy explains what we collect, why, and how we protect it.
          </p>
          <nav aria-label="Breadcrumb" className="mt-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-foreground">Privacy Policy</span>
          </nav>
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, i) => {
            const colors = getColorClasses(section.color);
            return (
              <Card key={i} className={`relative overflow-hidden border ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${colors.bg} pointer-events-none`} />
                <CardContent className="p-8 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-background shadow-md ${colors.border} border`}>
                      <section.icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-4">{section.title}</h2>
                      {section.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Section */}
        <Card className="relative overflow-hidden border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-transparent mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">7. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this policy or our data practices, please contact us at{" "}
                  <a href="mailto:privacy@rolecolorfinder.com" className="text-primary hover:underline font-medium">
                    privacy@rolecolorfinder.com
                  </a>
                  {" "}or visit our{" "}
                  <Link to="/contact" className="text-primary hover:underline font-medium">
                    Contact Page
                  </Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-muted/30 border">
          <p className="text-sm text-muted-foreground">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <Link to="/pricing" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View pricing plans
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
