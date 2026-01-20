import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
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

  const [activeFilter, setActiveFilter] = useState<RoleColor | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  type RoleColor = "red" | "yellow" | "green" | "blue";

  const handleFilterClick = (color: RoleColor) => {
    const newFilter = activeFilter === color ? null : color;
    setActiveFilter(newFilter);
    
    if (newFilter && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const executionTeam = [{
    name: "Sanjay Divakar",
    title: "Founder & CEO",
    location: "Greenwich, Connecticut, USA",
    image: "/images/sanjay-divakar.png",
    summary: "Visionary entrepreneur redefining leadership development through color-based psychology and adaptive learning. Bridging psychology, technology, and human behavior to make leadership development accessible and evidence-based.",
    link: "/team/sanjay-divakar",
    roleColor: "red" as const
  }, {
    name: "Tristan Beley",
    title: "Chief Technology Officer (CTO)",
    location: "Toronto, Ontario, Canada",
    image: "/images/tristan-beley-new.png",
    summary: "Builder at heart who leads technology and product direction at RoleColorFinder. Focused on creating tools that feel as intuitive as they are intelligent, shipping features that are simple, human, and genuinely helpful.",
    link: "/team/tristan-beley",
    roleColor: "green" as const
  }, {
    name: "Sam Otten",
    title: "Head of Application Development",
    location: "Greenwich, Connecticut, USA",
    image: "/images/sam-otten-new.png",
    summary: "Oversees technical architecture and engineering strategy at RoleColorFinder. Known for his builder's mindset, translating high-level psychological theories into functional, scalable code.",
    link: "/team/sam-otten",
    roleColor: "yellow" as const
  }];
  const advisoryTeam = [{
    name: "Jennifer D. Klein",
    title: "Chief Experience Officer (CXO)",
    location: "Denver, Colorado, USA",
    image: "/images/jennifer-klein.png?v=2",
    summary: "Educational transformation leader with 19+ years in the classroom. Author of The Global Education Guidebook and The Landscape Model of Learning. Specializes in culturally responsive practices and experiential learning.",
    link: "/team/jennifer-klein",
    roleColor: "blue" as const
  }, {
    name: "Dr. Kapono Ciotti",
    title: "Chief Experience Officer (CXO)",
    location: "Kāne'ohe, Hawai'i, USA",
    image: "/images/kapono-ciotti.png",
    summary: "Globally recognized educational leader and CEO of Pacific American Foundation. Co-author of The Landscape Model of Learning. Integrates Native Hawaiian wisdom with global innovation in education and leadership development.",
    link: "/team/kapono-ciotti",
    roleColor: "green" as const
  }];
  const roleColorConfig = {
    red: { bg: "bg-red-500", text: "text-white", label: "Creative Motivator", border: "border-red-500" },
    yellow: { bg: "bg-yellow-400", text: "text-yellow-900", label: "Fast Executor", border: "border-yellow-400" },
    green: { bg: "bg-green-500", text: "text-white", label: "Supportive Collaborator", border: "border-green-500" },
    blue: { bg: "bg-blue-500", text: "text-white", label: "Analytical Strategist", border: "border-blue-500" }
  };

  const allMembers = [...executionTeam, ...advisoryTeam];
  const filteredMembers = activeFilter 
    ? allMembers.filter(m => m.roleColor === activeFilter)
    : null;

  const TeamMemberCard = ({
    member
  }: {
    member: { name: string; title: string; location: string; image: string; summary: string; link: string; roleColor: RoleColor };
  }) => {
    const colorConfig = roleColorConfig[member.roleColor];
    
    return (
      <Card className="overflow-hidden border-border/50 hover-lift group animate-fade-in">
        <CardContent className="p-0">
          {/* Square Profile Image with Role Color Border */}
          <div className="relative aspect-square overflow-hidden">
            <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Role Color Badge - prominent at bottom of image */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${colorConfig.bg} ring-4 ring-white/90 shadow-xl flex-shrink-0`} />
              <span className={`text-white font-bold text-base drop-shadow-lg`}>
                {colorConfig.label}
              </span>
            </div>
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
      </Card>
    );
  };
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
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12">
            RoleColorFinder is built by a multidisciplinary team spanning education, psychology, engineering, and organizational design — combining lived experience, technical execution, and systems-level thinking to redefine leadership assessment.
          </p>

          {/* Role Color Legend */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <button 
              onClick={() => handleFilterClick("red")}
              className={`flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 hover:border-red-500/50 cursor-pointer ${activeFilter === "red" ? "ring-2 ring-red-500 scale-105" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Creative Motivator</p>
                <p className="text-sm text-muted-foreground">Energizes teams with vision and passion, driving innovation through bold ideas</p>
              </div>
            </button>
            <button 
              onClick={() => handleFilterClick("yellow")}
              className={`flex items-start gap-3 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20 hover:border-yellow-400/50 cursor-pointer ${activeFilter === "yellow" ? "ring-2 ring-yellow-400 scale-105" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-600 dark:text-yellow-400">Fast Executor</p>
                <p className="text-sm text-muted-foreground">Turns ideas into action quickly, focused on results and efficient delivery</p>
              </div>
            </button>
            <button 
              onClick={() => handleFilterClick("green")}
              className={`flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50 cursor-pointer ${activeFilter === "green" ? "ring-2 ring-green-500 scale-105" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-600 dark:text-green-400">Supportive Collaborator</p>
                <p className="text-sm text-muted-foreground">Builds harmony and trust, ensuring everyone feels valued and heard</p>
              </div>
            </button>
            <button 
              onClick={() => handleFilterClick("blue")}
              className={`flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50 cursor-pointer ${activeFilter === "blue" ? "ring-2 ring-blue-500 scale-105" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-600 dark:text-blue-400">Analytical Strategist</p>
                <p className="text-sm text-muted-foreground">Brings structure and insight, solving problems with logic and precision</p>
              </div>
            </button>
          </div>
          {activeFilter && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing {filteredMembers?.length} team member{filteredMembers?.length !== 1 ? "s" : ""} • <button onClick={() => setActiveFilter(null)} className="text-primary hover:underline">Clear filter</button>
            </p>
          )}
        </div>

        {/* Filtered Results or Team Sections */}
        <div ref={resultsRef} className="scroll-mt-8">
          {activeFilter ? (
            <section key={activeFilter} className="animate-fade-in">
              <div className="text-center mb-10">
                <Badge variant="default" className="mb-4 text-sm px-4 py-2">
                  {roleColorConfig[activeFilter].label}s
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Filtered Team Members
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {filteredMembers?.map((member, index) => (
                  <div key={member.name} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in">
                    <TeamMemberCard member={member} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
          <>
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
                <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
                  Advisory Team
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Guiding Vision & Strategy
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {advisoryTeam.map((member, index) => <TeamMemberCard key={index} member={member} />)}
              </div>
            </section>
          </>
        )}
        </div>
      </main>

    </div>;
};
export default Team;