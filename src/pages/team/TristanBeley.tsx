import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const TristanBeley = () => {
  useEffect(() => {
    const title = "Tristan Beley - Chief Technology Officer | Role Color Finder";
    const description = "Tristan Beley is the CTO at RoleColorFinder, leading technology and product direction with a focus on intuitive, intelligent leadership tools.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/tristan-beley`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Tristan Beley",
      "jobTitle": "Chief Technology Officer (CTO)",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/tristan-beley.png`,
      "email": "tristan@rolecolorfinder.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Toronto",
        "addressRegion": "Ontario",
        "addressCountry": "Canada"
      }
    };

    let scriptEl = document.getElementById("jsonld-tristan-beley") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-tristan-beley";
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
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src="/images/tristan-beley.png?v=2" 
                    alt="Tristan Beley"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 ring-2 ring-white shadow-lg" title="Yellow Role Color" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Tristan Beley</h1>
                    <p className="text-lg text-primary font-semibold">Chief Technology Officer (CTO)</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Toronto, Ontario, Canada</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:tristan@rolecolorfinder.com" className="hover:text-primary transition-colors">
                        tristan@rolecolorfinder.com
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
                      <Badge variant="secondary">Product</Badge>
                      <Badge variant="secondary">Engineering</Badge>
                      <Badge variant="secondary">UX</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Chief Technology Officer</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Building Human-Centered Technology
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Tristan Beley is the CTO at RoleColorFinder and a builder at heart. He loves starting from zero, sketching ideas on paper, and turning them into real products that people actually use. Tristan joined RoleColorFinder as an intern and worked his way onto the executive team because he saw three things clearly: a real product-market gap in how we teach leadership, a founder with a vision worth betting on, and an opportunity to create something that genuinely benefits others, not just look good on a slide deck.
                </p>
                <p>
                  At RoleColorFinder, Tristan leads the technology and product direction, focusing on tools that feel as intuitive as they are intelligent. He's obsessed with innovation in a very practical sense: shipping features, testing them with real users, and iterating until the experience feels simple, human, and genuinely helpful.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Tristan is currently completing his BSc in Software Engineering at the University of Western Ontario, with a minor in Business Leadership. He believes leadership tools should start human and become technical only in service of that humanity, and that real growth happens when people have self-awareness paired with clear and honest feedback, with a system designed to meet them exactly where they are.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Leading technology and product direction at RoleColorFinder</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Building systems that scale while feeling personal for every user</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Shipping features and iterating based on real user feedback</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Creating intuitive, intelligent tools for leadership development</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TristanBeley;
