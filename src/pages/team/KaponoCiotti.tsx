import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe, Linkedin, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const KaponoCiotti = () => {
  useEffect(() => {
    const title = "Dr. Kapono Ciotti - Chief Experience Officer | Role Color Finder";
    const description = "Meet Dr. Kapono Ciotti, CXO of RoleColorFinder. Globally recognized educational leader integrating Indigenous wisdom with global innovation.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/kapono-ciotti`;
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
      "name": "Dr. Kapono Ciotti",
      "jobTitle": "Chief Experience Officer (CXO)",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/kapono-ciotti.png`,
      "email": "kapono@rolecolorfinder.com",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Kāne'ohe",
        "addressRegion": "Hawai'i",
        "addressCountry": "USA"
      }
    };

    let scriptEl = document.getElementById("jsonld-kapono-ciotti") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-kapono-ciotti";
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
                    src="/images/kapono-ciotti.png" 
                    alt="Dr. Kapono Ciotti"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 ring-2 ring-white shadow-lg" title="Green Role Color" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Dr. Kapono Ciotti</h1>
                    <p className="text-lg text-primary font-semibold">Chief Experience Officer (CXO)</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Kāne'ohe, Hawai'i, USA</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:kapono@rolecolorfinder.com" className="hover:text-primary transition-colors">
                        kapono@rolecolorfinder.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Linkedin className="w-4 h-4 flex-shrink-0" />
                      <a href="https://www.linkedin.com/in/dr-kapono-ciotti-99426746/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        LinkedIn Profile
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Twitter className="w-4 h-4 flex-shrink-0" />
                      <a href="https://twitter.com/KaponoC" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        Twitter Profile
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span>English, Wolof</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Indigenous Ed</Badge>
                      <Badge variant="secondary">Leadership</Badge>
                      <Badge variant="secondary">Global Dev</Badge>
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
                Bridging Indigenous Wisdom & Global Innovation
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Dr. Kapono Ciotti is a globally recognized educational leader who believes that education is the most profound act of social justice. As CEO of the Pacific American Foundation, he builds <em>pilina</em>—deep connections—between people, systems, and ideas to empower and transform communities.
                </p>
                <p>
                  Drawing from his Native Hawaiian heritage, Kapono integrates <em>mo'okū'auhau</em> (genealogy and legacy) and <em>makawalu</em> (the ability to see from multiple perspectives) into every facet of his work.
                </p>
                <p>
                  Co-author of <em>The Landscape Model of Learning</em>, Kapono's decades of experience span continents, cultures, and educational systems. His facilitation and leadership have advanced authentic assessment, deeper learning, and place-based education worldwide.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Kapono holds a Ph.D. in Indigenous and International Education, a master's in Social Change and Development, and a bachelor's in Language and Cultural Studies. His work bridges the Pacific Islands, West Africa, and beyond—connecting Indigenous wisdom to global innovation.
                </p>
                <p>
                  Whether leading systemic change, mentoring emerging leaders, or paddling Hawaiian outrigger canoes, Dr. Ciotti embodies the spirit of connection, purpose, and leadership that RoleColorFinder represents.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Leading experience strategy and educational innovation at RoleColorFinder</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Advancing authentic assessment and place-based education globally</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Integrating Indigenous wisdom into leadership development frameworks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Building deep connections between people, systems, and ideas</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KaponoCiotti;
