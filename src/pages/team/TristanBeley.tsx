import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const TristanBeley = () => {
  useEffect(() => {
    const title = "Tristan Beley - Co-Founder & CTO | Role Color Finder";
    const description = "Tristan Beley is the Co-Founder & CTO at RoleColorFinder, leading technology and product direction with a Fast Executor mindset focused on momentum, shipping, and real-world product outcomes.";

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
      "jobTitle": "Co-Founder & CTO",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColor"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/tristan-beley-new.png`,
      "email": "tristan@rolecolor.com",
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
                    src="/images/tristan-beley-new.png" 
                    alt="Tristan Beley"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 ring-4 ring-white/90 shadow-xl flex-shrink-0" />
                    <span className="text-white font-bold text-base drop-shadow-lg">Fast Executor</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Tristan Beley</h1>
                    <p className="text-lg text-primary font-semibold">Co-Founder & CTO</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Toronto, Ontario, Canada</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:tristan@rolecolorfinder.com" className="hover:text-primary transition-colors">
                        tristan@rolecolor.com
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
                      <Badge variant="secondary">Execution</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Co-Founder & CTO</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Shipping Human-Centered Technology Fast
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Tristan Beley is the Co-Founder & CTO at RoleColorFinder and a builder who moves ideas into reality quickly. He thrives in fast-moving environments where speed matters, decisions need to turn into product, and momentum creates clarity. Tristan joined RoleColorFinder as an intern and worked his way onto the executive team by consistently turning vision into shipped work that people could actually use.
                </p>
                <p>
                  At RoleColorFinder, Tristan leads technology and product with an execution-first mindset. He focuses on reducing friction, shortening the distance between concept and launch, and building tools that feel intuitive because they have been tested, refined, and improved in the real world. His leadership style is fast, practical, and centered on progress.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Tristan is currently completing his BSc in Software Engineering at the University of Western Ontario, with a minor in Business Leadership. His background blends product thinking, engineering discipline, and startup urgency. He believes great technology should not stay stuck in planning decks for too long. It should get into people's hands quickly, learn from real usage, and improve through action.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Driving technology and product execution from idea to launch</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Turning strategy into shipped features with speed and accountability</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Iterating rapidly based on live user feedback and product signals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Building leadership tools that stay practical, intuitive, and useful</span>
                </li>
              </ul>
            </section>

            <section className="p-6 bg-yellow-400/10 border border-yellow-400/30 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400" />
                Why Yellow?
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  As a <strong>Fast Executor</strong>, Tristan embodies the Yellow RoleColor through his bias for action, rapid iteration, and focus on tangible outcomes. Yellow leaders excel at turning momentum into progress, helping teams move from discussion to delivery without losing energy. At RoleColorFinder, Tristan's Yellow energy shows up in how quickly ideas become prototypes, prototypes become features, and features become better through continuous improvement. He leads by building, shipping, and keeping the work in motion.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TristanBeley;
