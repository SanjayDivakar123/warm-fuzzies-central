import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const AmitSuthar = () => {
  useEffect(() => {
    const title = "Amit Suthar - AI Engineer | Role Color Finder";
    const description = "Amit Suthar is an AI Engineer at RoleColorFinder, leading AI engineering efforts behind RoleColorAI with expertise in machine learning and full-stack development.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/amit-suthar`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    // Structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Amit Suthar",
      "jobTitle": "AI Engineer",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/amit-suthar.png`,
      "email": "amit@rolocolorfinder.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Vadodara",
        "addressRegion": "Gujarat",
        "addressCountry": "India"
      }
    };

    let scriptEl = document.getElementById("jsonld-amit-suthar") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-amit-suthar";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-8 group" asChild>
          <Link to="/team">
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Team
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-border/50 sticky top-8">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src="/images/amit-suthar.png" 
                    alt="Amit Suthar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Amit Suthar</h1>
                    <p className="text-lg text-primary font-semibold">AI Engineer</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Vadodara, Gujarat, India</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:amit@rolocolorfinder.com" className="hover:text-primary transition-colors">
                        amit@rolocolorfinder.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span>English</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">AI/ML</Badge>
                      <Badge variant="secondary">RoleColorAI</Badge>
                      <Badge variant="secondary">Full-Stack</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">AI Engineer</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Building Human-Centered AI Systems
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Amit Suthar is an AI Engineer at RoleColorFinder and one of the earliest contributors to RoleColorAI. He joined the company as an intern and quickly became a core part of the team by demonstrating rare ownership, technical curiosity, and a genuine passion for building human-centered AI systems.
                </p>
                <p>
                  At RoleColorFinder, Amit leads the AI engineering efforts behind RoleColorAI, designing and training models that power resume reconstruction, leadership-style interpretation, and psychometric insights. He manages and mentors the AI intern team through structured development sprints. Amit also works closely with the product and engineering teams to ship new AI-driven features.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Amit is currently pursuing his Master of Computer Applications (MCA) at The Maharaja Sayajirao University of Baroda (2024–present). Before that, he completed his Bachelor of Computer Applications from the same university (2021–2024).
                </p>
                <p>
                  Before joining RoleColorFinder full-time, Amit worked as a Backend Developer at Consectus Limited. He has also led academic and personal projects involving machine learning, React, Node.js, and full-stack development.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Leading AI engineering efforts behind RoleColorAI</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Designing and training models for resume reconstruction and leadership-style interpretation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Managing and mentoring the AI intern team through structured development sprints</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Collaborating with product and engineering teams to ship AI-driven features</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AmitSuthar;
