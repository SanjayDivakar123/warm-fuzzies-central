import { Navbar } from "@/components/navigation/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Linkedin, Globe } from "lucide-react";
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
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link to="/team">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Team
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[300px_1fr] gap-12 mb-12">
            {/* Square Profile Image */}
            <div className="mx-auto md:mx-0">
              <img src="/images/tristan-beley.png?v=2" alt="Tristan Beley" className="w-64 h-64 md:w-full md:h-auto aspect-square object-cover rounded-2xl shadow-xl" />
            </div>

            {/* Header Info */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black mb-4">Tristan Beley</h1>
              <p className="text-2xl text-primary font-semibold mb-6">Chief Technology Officer (CTO)</p>
              
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Toronto, Ontario, Canada</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-5 h-5" />
                  <a href="mailto:Tristan@rolecolorfinder.com" className="hover:text-primary transition-colors">
                    Tristan@rolecolorfinder.com
                  </a>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Globe className="w-5 h-5" />
                  <span>Languages: English</span>
                </div>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed mb-6">
              Tristan Beley is the CTO at RoleColorFinder and a builder at heart. He loves starting from zero, sketching ideas on paper, and turning them into real products that people actually use. Tristan joined RoleColorFinder as an intern and worked his way onto the executive team because he saw three things clearly: a real product-market gap in how we teach leadership, a founder with a vision worth betting on, and an opportunity to create something that genuinely benefits others, not just look good on a slide deck.
            </p>

            <p className="text-lg leading-relaxed mb-6">
              At RoleColorFinder, Tristan leads the technology and product direction, focusing on tools that feel as intuitive as they are intelligent. He's obsessed with innovation in a very practical sense: shipping features, testing them with real users, and iterating until the experience feels simple, human, and genuinely helpful. His work centers on building systems that scale while still feeling personal for every student, educator, and leader who uses the platform.
            </p>

            <p className="text-lg leading-relaxed">
              Tristan is currently completing his BSc in Software Engineering at the University of Western Ontario, with a minor in Business Leadership. He believes leadership tools should start human and become technical only in service of that humanity, and that real growth happens when people have self-awareness paired with clear and honest feedback, with a system designed to meet them exactly where they are.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TristanBeley;
