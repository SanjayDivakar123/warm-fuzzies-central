import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Shield, 
  UserX, 
  AlertTriangle, 
  Scale, 
  Mail, 
  ChevronRight,
  BookOpen,
  User,
  Brain,
  Lock,
  RefreshCw,
  Gavel,
  MapPin
} from "lucide-react";

const TermsOfService = () => {
  useEffect(() => {
    const title = "Terms of Service | RoleColorFinderLLC";
    const description = "Terms of Service for RoleColorFinderLLC. Read our legal terms, user agreements, and conditions for using our leadership assessment platform.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/terms-of-service`;
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
      name: "Terms of Service",
      url: canonicalHref,
      description,
    };

    let scriptEl = document.getElementById("jsonld-terms") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-terms";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  const sections = [
    {
      icon: CheckCircle,
      title: "1. Acceptance of Terms",
      color: "green",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          By accessing and using RoleColorFinderLLC ("the Service"), you accept and agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our Service.
        </p>
      )
    },
    {
      icon: BookOpen,
      title: "2. Description of Service",
      color: "blue",
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            RoleColorFinderLLC provides a leadership assessment platform that helps users discover their natural leadership style 
            through our patent-pending color-based diagnostic system. Our services include:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            {[
              "Free and premium leadership assessments",
              "Personalized results and career recommendations",
              "Team development programs",
              "Educational content and resources"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    {
      icon: User,
      title: "3. User Accounts",
      color: "purple",
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            To access certain features, you must create an account. You agree to:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            {[
              "Provide accurate, current, and complete information",
              "Maintain the security of your password and account",
              "Notify us immediately of any unauthorized use of your account",
              "Accept responsibility for all activities under your account"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    {
      icon: CreditCard,
      title: "4. Payment Terms",
      color: "green",
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">For paid services:</p>
          <ul className="space-y-2 text-muted-foreground">
            {[
              "All fees are in USD and non-refundable unless otherwise stated",
              "Payments are processed securely through our payment provider (Stripe)",
              "You authorize us to charge your payment method for all fees incurred",
              "We reserve the right to change pricing with 30 days notice",
              "Refunds may be issued at our discretion within 7 days of purchase"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    {
      icon: Shield,
      title: "5. Intellectual Property",
      color: "yellow",
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            All content, features, and functionality of the Service are owned by RoleColorFinderLLC and are protected by 
            international copyright, trademark, and other intellectual property laws. Our patent-pending assessment methodology 
            is proprietary and confidential.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You may not reproduce, distribute, modify, create derivative works, publicly display, or exploit any of our 
            proprietary content without express written permission.
          </p>
        </>
      )
    },
    {
      icon: UserX,
      title: "6. User Conduct",
      color: "red",
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
          <ul className="space-y-2 text-muted-foreground">
            {[
              "Use the Service for any unlawful purpose",
              "Attempt to gain unauthorized access to any systems or data",
              "Interfere with or disrupt the Service or servers",
              "Impersonate any person or entity",
              "Transmit any viruses, malware, or harmful code",
              "Scrape, copy, or reverse engineer the Service"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    {
      icon: Brain,
      title: "7. Assessment Results",
      color: "blue",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          Our assessments are educational tools based on psychological research. Results are for informational purposes only 
          and should not be considered professional career counseling, medical advice, or psychological diagnosis. We do not 
          guarantee specific outcomes from using our assessments.
        </p>
      )
    },
    {
      icon: Lock,
      title: "8. Privacy & Data Protection",
      color: "purple",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          Your privacy is important to us. Our collection and use of personal information is governed by our{" "}
          <Link to="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</Link>. 
          By using the Service, you consent to our data practices as described in the Privacy Policy.
        </p>
      )
    },
    {
      icon: AlertTriangle,
      title: "9. Disclaimers",
      color: "yellow",
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            {[
              "The Service will be uninterrupted, secure, or error-free",
              "Results will be accurate, reliable, or complete",
              "Any defects will be corrected",
              "The Service is free from viruses or harmful components"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      )
    },
    {
      icon: Scale,
      title: "10. Limitation of Liability",
      color: "red",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, RoleColorFinderLLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR 
          INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
        </p>
      )
    },
    {
      icon: UserX,
      title: "11. Termination",
      color: "gray",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, 
          without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, 
          or for any other reason.
        </p>
      )
    },
    {
      icon: RefreshCw,
      title: "12. Changes to Terms",
      color: "blue",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          We reserve the right to modify these Terms at any time. We will notify users of material changes via email or 
          prominent notice on the Service. Continued use of the Service after changes constitutes acceptance of the modified Terms.
        </p>
      )
    },
    {
      icon: Gavel,
      title: "13. Governing Law",
      color: "purple",
      content: (
        <p className="text-muted-foreground leading-relaxed">
          These Terms shall be governed by and construed in accordance with the laws of the State of Connecticut, United States, 
          without regard to its conflict of law provisions.
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
      gray: { bg: "from-gray-500/10 to-transparent", icon: "text-gray-500", border: "border-gray-500/20" },
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
            <FileText className="w-4 h-4 mr-2" />
            Legal
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before using our services.
          </p>
          <nav aria-label="Breadcrumb" className="mt-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-foreground">Terms of Service</span>
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
                    <div className={`p-3 rounded-xl bg-background shadow-md ${colors.border} border flex-shrink-0`}>
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
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For questions about these Terms, please contact us:
                </p>
                <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm"><strong>RoleColorFinderLLC</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <a href="mailto:legal@rolecolorfinder.com" className="text-sm text-primary hover:underline">
                      legal@rolecolorfinder.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-muted/30 border mb-8">
          <p className="text-sm text-muted-foreground">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="text-sm text-primary hover:underline font-medium">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-sm text-primary hover:underline font-medium">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
