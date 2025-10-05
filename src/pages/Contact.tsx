import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Phone, MapPin, Clock, HelpCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6">Get In Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our team using any of the methods below.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover-lift border-border/50">
            <CardHeader>
              <Mail className="w-12 h-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For general inquiries and support questions
              </p>
              <a 
                href="mailto:support@rolecolorfinder.com" 
                className="text-primary hover:underline font-semibold text-lg"
              >
                support@rolecolorfinder.com
              </a>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-green mb-4" />
              <CardTitle className="text-2xl">Sales Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Team programs and enterprise solutions
              </p>
              <a 
                href="mailto:sales@rolecolorfinder.com" 
                className="text-primary hover:underline font-semibold text-lg"
              >
                sales@rolecolorfinder.com
              </a>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50">
            <CardHeader>
              <Clock className="w-12 h-12 text-blue mb-4" />
              <CardTitle className="text-2xl">Book a Call</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Schedule a 20-minute consultation
              </p>
              <a 
                href="https://app.reclaim.ai/m/sanjayd/12-week-fit-call" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold text-lg"
              >
                Schedule Now →
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Business Information */}
        <section className="mb-16">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Headquarters</h3>
                    <p className="text-muted-foreground">
                      Connecticut, United States
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Legal Inquiries</h3>
                    <p className="text-muted-foreground">
                      legal@rolecolorfinder.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Support Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Friday: 9am - 6pm EST<br />
                      Weekend: Limited support
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Response Time</h3>
                    <p className="text-muted-foreground">
                      We typically respond within 24 hours on business days
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Additional Resources */}
        <section className="text-center">
          <div className="glass-card-strong rounded-3xl p-12 border border-primary/20">
            <h2 className="text-3xl font-bold mb-6">Looking for Something Else?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/pricing">
                <button className="btn-secondary px-6 py-3">
                  View Pricing
                </button>
              </Link>
              <Link to="/about">
                <button className="btn-secondary px-6 py-3">
                  About Us
                </button>
              </Link>
              <Link to="/privacy-policy">
                <button className="btn-secondary px-6 py-3">
                  Privacy Policy
                </button>
              </Link>
              <Link to="/terms-of-service">
                <button className="btn-secondary px-6 py-3">
                  Terms of Service
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
