import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Code2, Cpu, Rocket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const SamOtten = () => {
  useEffect(() => {
    const title = "Sam Otten - Head of Application Development | RoleColorFinder";
    const description = "Sam Otten serves as the Head of Application Development at RoleColorFinder, overseeing technical architecture and engineering strategy for the leadership platform.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/sam-otten`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    // Structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Sam Otten",
      "jobTitle": "Head of Application Development",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "description": description,
      "url": canonicalHref,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Greenwich",
        "addressRegion": "Connecticut",
        "addressCountry": "USA"
      }
    };

    let scriptEl = document.getElementById("jsonld-sam-otten") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-sam-otten";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-wide section-padding">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link to="/team">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Team
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Photo and Quick Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="overflow-hidden border-border/50">
                <CardContent className="p-0">
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src="/images/sam-otten-new.png"
                      alt="Sam Otten"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-400 ring-4 ring-white/90 shadow-xl flex-shrink-0" />
                      <span className="text-white font-bold text-base drop-shadow-lg">Fast Executor</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-2">Sam Otten</h1>
                    <p className="text-lg text-primary font-semibold mb-4">Head of Application Development</p>

                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>Greenwich, Connecticut, USA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a href="mailto:sam@rolecolorfinder.com" className="hover:text-primary transition-colors">
                          sam@rolecolorfinder.com
                        </a>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border">
                      <p className="text-sm font-medium mb-3">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Application Development</Badge>
                        <Badge variant="secondary">Technical Architecture</Badge>
                        <Badge variant="secondary">EdTech</Badge>
                        <Badge variant="secondary">Scalable Systems</Badge>
                        <Badge variant="secondary">User Experience</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Full Bio */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-6">Professional Summary</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="leading-relaxed">
                  Sam Otten serves as the Head of Application Development at RoleColorFinder, where he oversees the technical architecture and engineering strategy for the company's leadership platform. A current student at Greenwich High School, Sam brings a rare combination of academic insight and deep technical expertise, fueled by over six years of rigorous development experience.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Education</h2>
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">Greenwich High School</h3>
                  <p className="text-muted-foreground">Current Student</p>
                  <p className="text-sm text-muted-foreground mt-2">Greenwich, Connecticut</p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Background</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p className="leading-relaxed">
                  At RoleColorFinder, Sam is responsible for the end-to-end execution of the platform's digital environment. He serves as the primary bridge between Sanjay Divakar's evidence-based leadership frameworks and the high-performance software required to deliver them. His work focuses on building scalable, secure, and intuitive interfaces that transform complex behavioral data into clear, actionable insights for educational institutions and corporate teams.
                </p>
                <p className="leading-relaxed">
                  Known for his "builder's mindset," Sam specializes in translating high-level psychological theories into functional code. His approach to application development is grounded in precision and scalability, ensuring that as RoleColorFinder expands its partnerships, the infrastructure is capable of supporting rapid growth. He is obsessed with the user journey, constantly refining the platform to ensure that the transition from a "color-based" assessment to a personalized growth roadmap is both frictionless and high-impact.
                </p>
                <p className="leading-relaxed">
                  As a developer and leader within the organization, Sam provides a unique vantage point on how the next generation of professionals interacts with technology. By balancing his professional role with his perspective as a current GHS student, he ensures RoleColorFinder remains at the cutting edge of EdTech and leadership innovation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Core Responsibilities</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <Code2 className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Technical Architecture</h3>
                    <p className="text-sm text-muted-foreground">
                      Overseeing the platform's digital environment and engineering strategy
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <Cpu className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Scalable Systems</h3>
                    <p className="text-sm text-muted-foreground">
                      Building infrastructure capable of supporting rapid organizational growth
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <Users className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">User Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      Refining the platform for frictionless, high-impact user journeys
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <Rocket className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">EdTech Innovation</h3>
                    <p className="text-sm text-muted-foreground">
                      Keeping RoleColorFinder at the cutting edge of education technology
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="p-6 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400" />
                Why Yellow?
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  As a <strong>Fast Executor</strong>, Sam exemplifies the Yellow RoleColor through his action-first, builder's mindset. Yellow leaders thrive on speed, initiative, and getting things done—and Sam has consistently demonstrated this by rapidly rising from intern to Head of Application Development. His obsession with translating complex psychological theories into functional code, and his drive to ship features and iterate quickly, are hallmarks of the Yellow energy. At RoleColorFinder, Sam's Yellow strength ensures the platform evolves rapidly, turning ambitious ideas into production-ready features.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SamOtten;
