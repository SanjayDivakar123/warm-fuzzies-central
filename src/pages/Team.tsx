import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Linkedin, MapPin, Globe, Twitter } from "lucide-react";
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

  const teamMembers = [
    {
      name: "Sanjay Divakar",
      title: "Founder & CEO",
      location: "Greenwich, Connecticut, USA",
      email: "sanjay@rolecolorfinder.com",
      linkedin: "www.linkedin.com/in/sanjayrcf",
      website: "www.rolecolorfinder.com",
      languages: "English, Tamil",
      image: "https://sol.rolecolorfinder.com/wp-content/uploads/2025/10/Sanjay-roleColor-1.jpg",
      bio: "Sanjay Divakar is the founder and CEO of RoleColorFinder, a company redefining leadership development through color-based psychology and adaptive learning. A visionary entrepreneur from Greenwich, Connecticut, Sanjay created RoleColorFinder to help individuals and organizations understand how they lead—and how they can lead better.\n\nBridging psychology, technology, and human behavior, Sanjay's mission is to make leadership development accessible, evidence-based, and deeply personal. Under his leadership, RoleColorFinder has built partnerships with global education leaders and is rapidly growing as a platform for schools and companies seeking to unlock the full potential of their teams.\n\nSanjay believes adaptability is the ultimate skill—and that leadership begins with self-awareness and the courage to evolve.",
      color: "primary"
    },
    {
      name: "Jennifer D. Klein",
      title: "Chief Experience Officer (CXO)",
      location: "Denver, Colorado, USA",
      email: "jennifer@rolecolorfinder.com",
      linkedin: "www.linkedin.com/in/jdeborahklein/",
      twitter: "https://twitter.com/jdeborahklein?lang=en",
      languages: "English, Spanish",
      image: "https://cdn.prod.website-files.com/5f5a6c90bd57df3beeddb6a9/68fb52920062fde6e213e25f_JDK%20TtT%20low%20res.jpg",
      bio: "Jennifer D. Klein is a product of experiential, project-based education herself—and she lives and breathes the student-centered pedagogies that shaped her. She became a teacher during graduate school in 1990, finding the intersection between her love of writing and her fascination with educational transformation. Over nineteen years in the classroom—including several years in Costa Rica and eleven in all-girls education—Jennifer refined her vision of learning as a catalyst for social change.\n\nShe has since supported educators worldwide through workshops, coaching, and system-level change across four continents, always emphasizing authentic assessment, student voice, diversity, and equity. Jennifer's leadership philosophy centers on culturally responsive and anti-racist practices that help schools build healthy, inclusive communities.\n\nHer books include The Global Education Guidebook (2017), The Landscape Model of Learning (2022), and her forthcoming Taming the Turbulence in Educational Leadership (September 2025). She formerly served as Head of School at Gimnasio Los Caobos in Bogotá, Colombia, where she implemented transformative learning practices that continue to shape the school's legacy.\n\nJennifer holds degrees from Bard College and the University of Colorado at Boulder, with principal licensing studies from the University of Denver. She currently leads professional learning worldwide through Principled Learning Strategies and serves as CXO at RoleColorFinder, bringing her passion for experiential, student-centered learning to global leadership development.",
      color: "blue"
    },
    {
      name: "Dr. Kapono Ciotti",
      title: "Chief Experience Officer (CXO)",
      location: "Kāne'ohe, Hawai'i, USA",
      email: "kapono@rolecolorfinder.com",
      linkedin: "www.linkedin.com/in/dr-kapono-ciotti-99426746/",
      twitter: "https://twitter.com/KaponoC",
      languages: "English, Wolof",
      image: "https://cdn.prod.website-files.com/5f5a6c90bd57df3beeddb6a9/5f6b654a9b8304566b800bd3_Kapono-Ciotti-Photo.jpg",
      bio: "Dr. Kapono Ciotti is a globally recognized educational leader who believes that education is the most profound act of social justice. As CEO of the Pacific American Foundation, he builds pilina—deep connections—between people, systems, and ideas to empower and transform communities. Drawing from his Native Hawaiian heritage, Kapono integrates mo'okū'auhau (genealogy and legacy) and makawalu (the ability to see from multiple perspectives) into every facet of his work.\n\nCo-author of The Landscape Model of Learning, Kapono's decades of experience span continents, cultures, and educational systems. His facilitation and leadership have advanced authentic assessment, deeper learning, and place-based education worldwide.\n\nKapono holds a Ph.D. in Indigenous and International Education, a master's in Social Change and Development, and a bachelor's in Language and Cultural Studies. His work bridges the Pacific Islands, West Africa, and beyond—connecting Indigenous wisdom to global innovation. Whether leading systemic change, mentoring emerging leaders, or paddling Hawaiian outrigger canoes, Dr. Ciotti embodies the spirit of connection, purpose, and leadership that RoleColorFinder represents.",
      color: "yellow"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
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

        {/* Team Members */}
        <div className="space-y-16">
          {teamMembers.map((member, index) => (
            <Card key={index} className="overflow-hidden border-border/50 hover-lift">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                  {/* Image */}
                  <div className="relative h-80 md:h-auto">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-12">
                    <div className="mb-6">
                      <h2 className="text-3xl md:text-4xl font-bold mb-2">{member.name}</h2>
                      <p className="text-xl text-primary font-semibold mb-4">{member.title}</p>
                      
                      {/* Contact Info */}
                      <div className="space-y-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{member.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors">
                            {member.email}
                          </a>
                        </div>
                        {member.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <a href={`https://${member.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                              {member.website}
                            </a>
                          </div>
                        )}
                        {member.linkedin && (
                          <div className="flex items-center gap-2">
                            <Linkedin className="w-4 h-4" />
                            <a href={`https://${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                        {member.twitter && (
                          <div className="flex items-center gap-2">
                            <Twitter className="w-4 h-4" />
                            <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                              Twitter Profile
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-foreground">Languages:</span>
                          <span>{member.languages}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="prose prose-lg max-w-none">
                      {member.bio.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Team;
