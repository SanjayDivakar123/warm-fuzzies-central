import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const SanjayDivakar = () => {
  useEffect(() => {
    const title = "Sanjay Divakar - Founder & CEO | Role Color Finder";
    const description = "Meet Sanjay Divakar, Founder & CEO of RoleColorFinder. A visionary entrepreneur redefining leadership development through color-based psychology.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/sanjay-divakar`;
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
      "name": "Sanjay Divakar",
      "jobTitle": "Founder & CEO",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/sanjay-divakar.png`,
      "email": "sanjay@rolecolorfinder.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Greenwich",
        "addressRegion": "Connecticut",
        "addressCountry": "USA"
      }
    };

    let scriptEl = document.getElementById("jsonld-sanjay-divakar") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-sanjay-divakar";
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
                    src="/images/sanjay-divakar.png" 
                    alt="Sanjay Divakar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 ring-4 ring-white/90 shadow-xl flex-shrink-0" />
                    <span className="text-white font-bold text-base drop-shadow-lg">Creative Motivator</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Sanjay Divakar</h1>
                    <p className="text-lg text-primary font-semibold">Founder & CEO</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Greenwich, Connecticut, USA</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:sanjay@rolecolorfinder.com" className="hover:text-primary transition-colors">
                        sanjay@rolecolorfinder.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <a href="https://www.rolecolorfinder.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        www.rolecolorfinder.com
                      </a>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Leadership</Badge>
                      <Badge variant="secondary">Psychology</Badge>
                      <Badge variant="secondary">EdTech</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Founder & CEO</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Redefining Leadership Development
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Sanjay Divakar is the Founder & CEO of RoleColorFinder, a leadership development company redefining how people understand and grow their leadership style using color-based psychology and adaptive learning.
                </p>
                <p>
                  A forward-thinking entrepreneur from Greenwich, Connecticut, Sanjay is obsessed (productively) with one question: <em>"How do you help someone lead better—starting with who they already are?"</em>
                </p>
                <p>
                  To answer that, he designed RoleColorFinder—an assessment and learning platform used by schools, companies, and emerging leaders to uncover their natural leadership tendencies and rapidly close the gap between potential and performance.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Credentials</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Sanjay's approach blends psychology, technology, and human behavior. His work is grounded in credibility—not hype. He has completed formal leadership and innovation training from two of the world's top institutions:
                </p>
                <ul className="space-y-2">
                  <li><strong>Leadership Skills</strong>, Indian Institute of Management Ahmedabad (IIM-A)</li>
                  <li><strong>Strategic Innovation: Building & Sustaining Innovative Organizations</strong>, University of Illinois (Gies College of Business)</li>
                </ul>
                <p>
                  These programs reinforce his commitment to evidence-based leadership—not fluffy motivational quotes.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Leading RoleColorFinder's vision and strategic direction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Building partnerships across education and business sectors</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Designing evidence-based leadership assessment frameworks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Championing self-awareness and adaptability as leadership foundations</span>
                </li>
              </ul>
            </section>

            <section className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500" />
                Why Red?
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  As a <strong>Creative Motivator</strong>, Sanjay embodies the Red RoleColor through his vision-driven, inspiring approach to leadership. Red leaders excel at communication, persuasion, and creative direction—exactly the qualities needed to found and lead a company redefining how people understand leadership. His obsession with helping people "lead better starting with who they already are" reflects the Red strength of seeing potential in others and motivating them toward it. At RoleColorFinder, Sanjay's Red energy fuels the company's mission, partnerships, and the passionate belief that everyone has a unique leadership style worth discovering.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SanjayDivakar;
