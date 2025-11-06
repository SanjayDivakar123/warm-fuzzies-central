import { Navbar } from "@/components/navigation/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Globe, ArrowLeft } from "lucide-react";
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
                src="https://sol.rolecolorfinder.com/wp-content/uploads/2025/10/Sanjay-roleColor-1.jpg"
                alt="Sanjay Divakar"
                className="w-64 h-64 md:w-full md:h-auto aspect-square object-cover rounded-2xl shadow-xl"
              />
            </div>

            {/* Header Info */}
            <div>
              <Badge variant="secondary" className="mb-4">Founder & CEO</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Sanjay Divakar</h1>
              
              <div className="space-y-3 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Greenwich, Connecticut, USA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:sanjay@rolecolorfinder.com" className="hover:text-primary transition-colors">
                    sanjay@rolecolorfinder.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <a href="https://www.rolecolorfinder.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    www.rolecolorfinder.com
                  </a>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-foreground">Languages:</span> English, Tamil
                </div>
              </div>
            </div>
          </div>

          {/* Full Bio */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Sanjay Divakar is the founder and CEO of RoleColorFinder, a company redefining leadership development through color-based psychology and adaptive learning. A visionary entrepreneur from Greenwich, Connecticut, Sanjay created RoleColorFinder to help individuals and organizations understand how they lead—and how they can lead better.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Bridging psychology, technology, and human behavior, Sanjay's mission is to make leadership development accessible, evidence-based, and deeply personal. Under his leadership, RoleColorFinder has built partnerships with global education leaders and is rapidly growing as a platform for schools and companies seeking to unlock the full potential of their teams.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Sanjay believes adaptability is the ultimate skill—and that leadership begins with self-awareness and the courage to evolve.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SanjayDivakar;
