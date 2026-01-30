import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  MapPin, 
  HelpCircle, 
  Calendar, 
  Building2, 
  Send, 
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";

const Contact = () => {
  useEffect(() => {
    const title = "Contact Us | Role Color Finder - Get In Touch";
    const description = "Contact Role Color Finder for support, questions, or partnership inquiries. Multiple ways to reach our team including email, phone, and online booking.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/contact`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Us",
      "url": canonicalHref,
      "description": description,
      "mainEntity": {
        "@type": "Organization",
        "name": "Role Color Finder",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "support@rolecolorfinder.com",
            "availableLanguage": "English"
          },
          {
            "@type": "ContactPoint",
            "contactType": "sales",
            "email": "sales@rolecolorfinder.com",
            "availableLanguage": "English"
          }
        ]
      }
    };

    let scriptEl = document.getElementById("jsonld-contact") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-contact";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "For general inquiries and support questions",
      action: "support@rolecolorfinder.com",
      href: "mailto:support@rolecolorfinder.com",
      color: "blue"
    },
    {
      icon: MessageSquare,
      title: "Sales Inquiries",
      description: "Team programs and enterprise solutions",
      action: "sales@rolecolorfinder.com",
      href: "mailto:sales@rolecolorfinder.com",
      color: "green"
    },
    {
      icon: Calendar,
      title: "Book a Call",
      description: "Schedule a 20-minute consultation",
      action: "Schedule Now →",
      href: "https://app.reclaim.ai/m/sanjayd/12-week-fit-call",
      color: "purple"
    }
  ];

  const businessInfo = [
    { icon: MapPin, label: "Headquarters", value: "Connecticut, United States", color: "red" },
    { icon: Mail, label: "Legal Inquiries", value: "legal@rolecolorfinder.com", color: "blue" },
    { icon: Clock, label: "Support Hours", value: "Mon-Fri: 9am-6pm EST", color: "green" },
    { icon: Zap, label: "Response Time", value: "Within 24 hours", color: "yellow" }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; gradient: string; iconBg: string }> = {
      blue: { 
        bg: "from-blue-500/10 via-blue-500/5 to-transparent", 
        border: "border-blue-500/20 hover:border-blue-500/40", 
        text: "text-blue-500",
        gradient: "from-blue-500 to-blue-600",
        iconBg: "bg-blue-500/10"
      },
      green: { 
        bg: "from-green-500/10 via-green-500/5 to-transparent", 
        border: "border-green-500/20 hover:border-green-500/40", 
        text: "text-green-500",
        gradient: "from-green-500 to-emerald-600",
        iconBg: "bg-green-500/10"
      },
      purple: { 
        bg: "from-purple-500/10 via-purple-500/5 to-transparent", 
        border: "border-purple-500/20 hover:border-purple-500/40", 
        text: "text-purple-500",
        gradient: "from-purple-500 to-violet-600",
        iconBg: "bg-purple-500/10"
      },
      red: { 
        bg: "from-red-500/10 via-red-500/5 to-transparent", 
        border: "border-red-500/20 hover:border-red-500/40", 
        text: "text-red-500",
        gradient: "from-red-500 to-rose-600",
        iconBg: "bg-red-500/10"
      },
      yellow: { 
        bg: "from-yellow-500/10 via-yellow-500/5 to-transparent", 
        border: "border-yellow-500/20 hover:border-yellow-500/40", 
        text: "text-yellow-500",
        gradient: "from-yellow-500 to-amber-600",
        iconBg: "bg-yellow-500/10"
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        {/* Hero Section */}
        <div className="text-center mb-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent rounded-3xl blur-3xl -z-10" />
          <Badge className="mb-6 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-4 py-1.5">
            <Send className="w-4 h-4 mr-2" />
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Get In Touch
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions? We're here to help. Reach out to our team using any of the methods below.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, i) => {
              const colors = getColorClasses(method.color);
              return (
                <Card 
                  key={i} 
                  className={`relative overflow-hidden ${colors.border} shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group`}
                >
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${colors.bg} pointer-events-none`} />
                  <div className={`absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl ${colors.bg} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <CardContent className="p-8 relative z-10">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg mb-6`}>
                      <method.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{method.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {method.description}
                    </p>
                    <a 
                      href={method.href}
                      target={method.href.startsWith("http") ? "_blank" : undefined}
                      rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className={`inline-flex items-center font-semibold ${colors.text} hover:underline text-lg group/link`}
                    >
                      {method.action}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Business Information */}
        <section className="mb-20">
          <Card className="relative overflow-hidden border-purple-500/20 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />
            <CardContent className="p-12 md:p-16 relative z-10">
              <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25 mb-6">
                  <Building2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Business Information</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {businessInfo.map((item, i) => {
                  const colors = getColorClasses(item.color);
                  return (
                    <div 
                      key={i} 
                      className={`text-center p-6 rounded-2xl bg-background/50 border ${colors.border} transition-all duration-300 hover:-translate-y-1`}
                    >
                      <div className={`inline-flex p-3 rounded-xl ${colors.iconBg} mb-4`}>
                        <item.icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{item.label}</h3>
                      <p className="text-muted-foreground text-sm">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Response Promise */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Secure Communications", description: "All inquiries are handled with strict confidentiality", color: "green" },
              { icon: Zap, title: "Fast Response", description: "We respond to all inquiries within 24 hours on business days", color: "yellow" },
              { icon: HelpCircle, title: "Expert Support", description: "Our team has deep expertise in leadership development", color: "blue" }
            ].map((item, i) => {
              const colors = getColorClasses(item.color);
              return (
                <Card key={i} className={`relative overflow-hidden ${colors.border} shadow-lg`}>
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${colors.bg} pointer-events-none`} />
                  <CardContent className="p-6 relative z-10 flex items-start gap-4">
                    <div className={`inline-flex p-2 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Additional Resources CTA */}
        <section className="text-center">
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-12 md:p-16 relative z-10">
              <div className="inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Looking for Something Else?</h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Explore our resources and learn more about Role Color Finder
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/pricing">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 shadow-xl shadow-black/20">
                    View Pricing
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm">
                    About Us
                  </Button>
                </Link>
                <Link to="/privacy-policy">
                  <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm">
                    Privacy Policy
                  </Button>
                </Link>
                <Link to="/terms-of-service">
                  <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm">
                    Terms of Service
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Contact;
