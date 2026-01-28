import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const TanishaSikder = () => {
  useEffect(() => {
    const title = "Tanisha Sikder - AI Engineer | Role Color Finder";
    const description = "Tanisha Sikder is an AI Engineer at RoleColorFinder, passionate about building AI systems to help people understand their leadership style using color-based psychology.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/tanisha-sikder`;
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
      "name": "Tanisha Sikder",
      "jobTitle": "AI Engineer",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColorFinder"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/tanisha-sikder.jpg`
    };

    let scriptEl = document.getElementById("jsonld-tanisha-sikder") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-tanisha-sikder";
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
                    src="/images/tanisha-sikder.jpg" 
                    alt="Tanisha Sikder"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400 ring-4 ring-white/90 shadow-xl flex-shrink-0" />
                    <span className="text-white font-bold text-base drop-shadow-lg">Fast Executor</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Tanisha Sikder</h1>
                    <p className="text-lg text-primary font-semibold">AI Engineer</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Liberty Township, OH, USA</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:tanisha@rolecolorfinder.com" className="hover:text-primary transition-colors">
                        tanisha@rolecolorfinder.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span>English</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">AI/ML</Badge>
                      <Badge variant="secondary">Deep Learning</Badge>
                      <Badge variant="secondary">Full-Stack</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">AI Engineer</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Engineering Intelligence for Leadership Discovery
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Tanisha Sikder is an AI Engineer at RoleColorFinder. She joined the company as an AI/ML intern and worked her way towards becoming an engineer. She is passionate about building, improving, and experimenting with AI systems to solve real-world problems.
                </p>
                <p>
                  At RoleColorFinder, Tanisha engineers AI to help people understand their leadership style using color-based psychology. Her work bridges the gap between complex machine learning models and practical applications that make leadership development more accessible and personalized.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Tanisha Sikder is currently pursuing her bachelor's degree in Software Engineering. She has obtained several certifications in AI/ML Engineering, demonstrating her commitment to staying at the forefront of artificial intelligence technologies.
                </p>
                <p>
                  Tanisha has developed many personal projects involving artificial intelligence, machine learning, and deep learning. Using her software engineering background, she has also constructed several full-stack development projects, giving her a comprehensive understanding of end-to-end product development.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Design and train models to help users understand their leadership style</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Engineer AI to reconstruct and analyze resumes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Collaborate with engineering teams to properly construct final products</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Experiment with and improve AI systems for real-world applications</span>
                </li>
              </ul>
            </section>

            <section className="p-6 bg-yellow-400/10 border border-yellow-400/30 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400" />
                Why Yellow?
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  As a <strong>Fast Executor</strong>, Tanisha embodies the Yellow RoleColor through her results-driven approach and rapid iteration on AI systems. Yellow leaders excel at turning ideas into action quickly, focusing on efficient delivery and tangible outcomes. Her journey from intern to engineer demonstrates the Yellow strength of momentum—consistently shipping improvements, testing with real data, and iterating until the models perform optimally. At RoleColorFinder, Tanisha's Yellow energy ensures that AI innovations move swiftly from concept to production, helping users discover their leadership potential faster.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TanishaSikder;
