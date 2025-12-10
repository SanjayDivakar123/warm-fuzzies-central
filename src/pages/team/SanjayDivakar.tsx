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
  return <div className="min-h-screen bg-background">
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
              <img src="/images/sanjay-divakar.jpg" alt="Sanjay Divakar" className="w-64 h-64 md:w-full md:h-auto aspect-square object-cover rounded-2xl shadow-xl" />
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
                
              </div>
            </div>
          </div>

          {/* Full Bio */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Sanjay Divakar is the Founder & CEO of RoleColorFinder, a leadership development company redefining how people understand and grow their leadership style using color-based psychology and adaptive learning.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              A forward-thinking entrepreneur from Greenwich, Connecticut, Sanjay is obsessed (productively) with one question:<br />
              <em>"How do you help someone lead better—starting with who they already are?"</em>
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              To answer that, he designed RoleColorFinder—an assessment and learning platform used by schools, companies, and emerging leaders to uncover their natural leadership tendencies and rapidly close the gap between potential and performance.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Sanjay's approach blends psychology, technology, and human behavior. His work is grounded in credibility—not hype. He has completed formal leadership and innovation training from two of the world's top institutions:
            </p>
            
            <ul className="text-lg text-muted-foreground leading-relaxed mb-6 space-y-2">
              <li><strong>Leadership Skills</strong>, Indian Institute of Management Ahmedabad (IIM-A)</li>
              <li><strong>Strategic Innovation: Building & Sustaining Innovative Organizations</strong>, University of Illinois (Gies College of Business)</li>
            </ul>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              These programs reinforce his commitment to evidence-based leadership—not fluffy motivational quotes.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Under his direction, RoleColorFinder is rapidly building partnerships across education and business, helping teams improve communication, collaboration, and accountability.
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Sanjay believes adaptability is the ultimate competitive edge—and that leadership begins with self-awareness and the courage to evolve.
            </p>
          </div>
        </div>
      </main>
    </div>;
};
export default SanjayDivakar;