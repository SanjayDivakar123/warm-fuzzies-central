import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const JenniferKlein = () => {
  useEffect(() => {
    const title = "Jennifer D. Klein - Chief Experience Officer | Role Color Finder";
    const description = "Meet Jennifer D. Klein, CXO of RoleColorFinder. Educational transformation leader and author specializing in experiential learning.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/jennifer-klein`;
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
      "name": "Jennifer D. Klein",
      "jobTitle": "Chief Experience Officer (CXO)",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/jennifer-klein.png`,
      "email": "jennifer@rolecolorfinder.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Denver",
        "addressRegion": "Colorado",
        "addressCountry": "USA"
      }
    };

    let scriptEl = document.getElementById("jsonld-jennifer-klein") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-jennifer-klein";
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
                    src="/images/jennifer-klein.png?v=2" 
                    alt="Jennifer D. Klein"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Jennifer D. Klein</h1>
                    <p className="text-lg text-primary font-semibold">Chief Experience Officer (CXO)</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Denver, Colorado, USA</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:jennifer@rolecolorfinder.com" className="hover:text-primary transition-colors">
                        jennifer@rolecolorfinder.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Linkedin className="w-4 h-4 flex-shrink-0" />
                      <a href="https://www.linkedin.com/in/jdeborahklein/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        LinkedIn Profile
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Twitter className="w-4 h-4 flex-shrink-0" />
                      <a href="https://twitter.com/jdeborahklein" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        Twitter Profile
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span>English, Spanish</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Education</Badge>
                      <Badge variant="secondary">Leadership</Badge>
                      <Badge variant="secondary">DEI</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Chief Experience Officer</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Transforming Education Through Experience
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Jennifer D. Klein is a product of experiential, project-based education herself—and she lives and breathes the student-centered pedagogies that shaped her. She became a teacher during graduate school in 1990, finding the intersection between her love of writing and her fascination with educational transformation.
                </p>
                <p>
                  Over nineteen years in the classroom—including several years in Costa Rica and eleven in all-girls education—Jennifer refined her vision of learning as a catalyst for social change.
                </p>
                <p>
                  She has since supported educators worldwide through workshops, coaching, and system-level change across four continents, always emphasizing authentic assessment, student voice, diversity, and equity. Jennifer's leadership philosophy centers on culturally responsive and anti-racist practices that help schools build healthy, inclusive communities.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Published Works</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Her books include <em>The Global Education Guidebook</em> (2017), <em>The Landscape Model of Learning</em> (2022), and her forthcoming <em>Taming the Turbulence in Educational Leadership</em> (September 2025). She formerly served as Head of School at Gimnasio Los Caobos in Bogotá, Colombia, where she implemented transformative learning practices that continue to shape the school's legacy.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Jennifer holds degrees from Bard College and the University of Colorado at Boulder, with principal licensing studies from the University of Denver. She currently leads professional learning worldwide through Principled Learning Strategies and serves as CXO at RoleColorFinder, bringing her passion for experiential, student-centered learning to global leadership development.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Leading experience design and educational strategy at RoleColorFinder</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Supporting educators worldwide through workshops and coaching</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Championing culturally responsive and anti-racist practices</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Authoring books on educational transformation and leadership</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JenniferKlein;
