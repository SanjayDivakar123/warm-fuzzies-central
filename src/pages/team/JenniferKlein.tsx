import { Navbar } from "@/components/navigation/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, MapPin, Twitter, ArrowLeft } from "lucide-react";
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
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link to="/team">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team
          </Link>
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-[300px_1fr] gap-12 mb-12">
            {/* Square Profile Image */}
            <div className="mx-auto md:mx-0">
              <img 
                src="/images/jennifer-klein.png?v=2"
                alt="Jennifer D. Klein"
                className="w-64 h-64 md:w-full md:h-auto aspect-square object-cover rounded-2xl shadow-xl"
              />
            </div>

            {/* Header Info */}
            <div>
              <Badge variant="secondary" className="mb-4">Chief Experience Officer</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Jennifer D. Klein</h1>
              
              <div className="space-y-3 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Denver, Colorado, USA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:jennifer@rolecolorfinder.com" className="hover:text-primary transition-colors">
                    jennifer@rolecolorfinder.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <a href="https://www.linkedin.com/in/jdeborahklein/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    LinkedIn Profile
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  <a href="https://twitter.com/jdeborahklein?lang=en" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Twitter Profile
                  </a>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-foreground">Languages:</span> English, Spanish
                </div>
              </div>
            </div>
          </div>

          {/* Full Bio */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Jennifer D. Klein is a product of experiential, project-based education herself—and she lives and breathes the student-centered pedagogies that shaped her. She became a teacher during graduate school in 1990, finding the intersection between her love of writing and her fascination with educational transformation. Over nineteen years in the classroom—including several years in Costa Rica and eleven in all-girls education—Jennifer refined her vision of learning as a catalyst for social change.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              She has since supported educators worldwide through workshops, coaching, and system-level change across four continents, always emphasizing authentic assessment, student voice, diversity, and equity. Jennifer's leadership philosophy centers on culturally responsive and anti-racist practices that help schools build healthy, inclusive communities.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Her books include <em>The Global Education Guidebook</em> (2017), <em>The Landscape Model of Learning</em> (2022), and her forthcoming <em>Taming the Turbulence in Educational Leadership</em> (September 2025). She formerly served as Head of School at Gimnasio Los Caobos in Bogotá, Colombia, where she implemented transformative learning practices that continue to shape the school's legacy.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Jennifer holds degrees from Bard College and the University of Colorado at Boulder, with principal licensing studies from the University of Denver. She currently leads professional learning worldwide through Principled Learning Strategies and serves as CXO at RoleColorFinder, bringing her passion for experiential, student-centered learning to global leadership development.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JenniferKlein;
