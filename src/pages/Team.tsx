import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
const Team = () => {
  useEffect(() => {
    const title = "Our Team - Role Color Finder | Meet the Leadership Experts";
    const description = "Meet the team behind Role Color Finder. Our leadership experts combine decades of experience in education, psychology, and organizational development.";
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    const canonicalHref = `${window.location.origin}/team`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    // Structured data for Team
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "Our Team - Role Color Finder",
      "description": description,
      "url": canonicalHref
    };
    let scriptEl = document.getElementById("jsonld-team") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-team";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);
  const executionTeam = [{
    name: "Sanjay Divakar",
    title: "Founder & CEO",
    location: "Greenwich, Connecticut, USA",
    image: "/images/sanjay-divakar.png",
    summary: "Visionary entrepreneur redefining leadership development through color-based psychology and adaptive learning. Bridging psychology, technology, and human behavior to make leadership development accessible and evidence-based.",
    link: "/team/sanjay-divakar"
  }, {
    name: "Tristan Beley",
    title: "Chief Technology Officer (CTO)",
    location: "Toronto, Ontario, Canada",
    image: "/images/tristan-beley.png?v=2",
    summary: "Builder at heart who leads technology and product direction at RoleColorFinder. Focused on creating tools that feel as intuitive as they are intelligent, shipping features that are simple, human, and genuinely helpful.",
    link: "/team/tristan-beley"
  }, {
    name: "Amit Suthar",
    title: "AI Engineer",
    location: "Vadodara, Gujarat, India",
    image: "/images/amit-suthar.png",
    summary: "AI Engineer leading RoleColorAI development, designing models for resume reconstruction, leadership-style interpretation, and psychometric insights. Passionate about building human-centered AI systems.",
    link: "/team/amit-suthar"
  }, {
    name: "Sam Otten",
    title: "Head of Application Development",
    location: "Greenwich, Connecticut, USA",
    image: "/images/sam-otten.png",
    summary: "Oversees technical architecture and engineering strategy at RoleColorFinder. Known for his builder's mindset, translating high-level psychological theories into functional, scalable code.",
    link: "/team/sam-otten"
  }];
  const advisoryTeam = [{
    name: "Jennifer D. Klein",
    title: "Chief Experience Officer (CXO)",
    location: "Denver, Colorado, USA",
    image: "/images/jennifer-klein.png?v=2",
    summary: "Educational transformation leader with 19+ years in the classroom. Author of The Global Education Guidebook and The Landscape Model of Learning. Specializes in culturally responsive practices and experiential learning.",
    link: "/team/jennifer-klein"
  }, {
    name: "Dr. Kapono Ciotti",
    title: "Chief Experience Officer (CXO)",
    location: "Kāne'ohe, Hawai'i, USA",
    image: "/images/kapono-ciotti.png",
    summary: "Globally recognized educational leader and CEO of Pacific American Foundation. Co-author of The Landscape Model of Learning. Integrates Native Hawaiian wisdom with global innovation in education and leadership development.",
    link: "/team/kapono-ciotti"
  }];
  const TeamMemberCard = ({
    member
  }: {
    member: typeof executionTeam[0];
  }) => <Card className="overflow-hidden border-border/50 hover-lift group">
      <CardContent className="p-0">
        {/* Square Profile Image */}
        <div className="relative aspect-square overflow-hidden">
          <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{member.name}</h2>
          <p className="text-lg text-primary font-semibold mb-2">{member.title}</p>
          <p className="text-sm text-muted-foreground mb-4">{member.location}</p>
          
          <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-4">
            {member.summary}
          </p>

          <Button variant="outline" size="sm" className="group/btn w-full" asChild>
            <Link to={member.link}>
              View Full Profile
              <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>;
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 text-base px-6 py-3">
            Our Team
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-balance">
            Meet the Leaders Behind
            <span className="gradient-text-primary block mt-2">RoleColorFinder</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our team combines decades of experience in education, psychology, and organizational development to revolutionize leadership assessment.
          </p>
        </div>

        {/* Execution Team Section */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <Badge variant="default" className="mb-4 text-sm px-4 py-2">
              Execution Team
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Building the Future of Leadership
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {executionTeam.map((member, index) => <TeamMemberCard key={index} member={member} />)}
          </div>
        </section>

        {/* Advisory Team Section */}
        <section>
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">Advisory Team
          </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Guiding Vision & Strategy
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {advisoryTeam.map((member, index) => <TeamMemberCard key={index} member={member} />)}
          </div>
        </section>
      </main>
    </div>;
};
export default Team;