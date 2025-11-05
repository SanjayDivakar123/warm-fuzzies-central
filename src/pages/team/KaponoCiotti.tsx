import { Navbar } from "@/components/navigation/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Linkedin, MapPin, Twitter, ArrowLeft } from "lucide-react";
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
                src="https://cdn.prod.website-files.com/5f5a6c90bd57df3beeddb6a9/5f6b654a9b8304566b800bd3_Kapono-Ciotti-Photo.jpg"
                alt="Dr. Kapono Ciotti"
                className="w-64 h-64 md:w-full md:h-auto aspect-square object-cover rounded-2xl shadow-xl"
              />
            </div>

            {/* Header Info */}
            <div>
              <Badge variant="secondary" className="mb-4">Chief Experience Officer</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Dr. Kapono Ciotti</h1>
              
              <div className="space-y-3 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Kāne'ohe, Hawai'i, USA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:kapono@rolecolorfinder.com" className="hover:text-primary transition-colors">
                    kapono@rolecolorfinder.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  <a href="https://www.linkedin.com/in/dr-kapono-ciotti-99426746/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    LinkedIn Profile
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  <a href="https://twitter.com/KaponoC" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    Twitter Profile
                  </a>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-foreground">Languages:</span> English, Wolof
                </div>
              </div>
            </div>
          </div>

          {/* Full Bio */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Dr. Kapono Ciotti is a globally recognized educational leader who believes that education is the most profound act of social justice. As CEO of the Pacific American Foundation, he builds <em>pilina</em>—deep connections—between people, systems, and ideas to empower and transform communities. Drawing from his Native Hawaiian heritage, Kapono integrates <em>mo'okū'auhau</em> (genealogy and legacy) and <em>makawalu</em> (the ability to see from multiple perspectives) into every facet of his work.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Co-author of <em>The Landscape Model of Learning</em>, Kapono's decades of experience span continents, cultures, and educational systems. His facilitation and leadership have advanced authentic assessment, deeper learning, and place-based education worldwide.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Kapono holds a Ph.D. in Indigenous and International Education, a master's in Social Change and Development, and a bachelor's in Language and Cultural Studies. His work bridges the Pacific Islands, West Africa, and beyond—connecting Indigenous wisdom to global innovation.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether leading systemic change, mentoring emerging leaders, or paddling Hawaiian outrigger canoes, Dr. Ciotti embodies the spirit of connection, purpose, and leadership that RoleColorFinder represents.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KaponoCiotti;
