import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const KodyKrueger = () => {
  useEffect(() => {
    const title = "Kody Krueger - Head of Sales | Role Color Finder";
    const description = "Kody Krueger is the Head of Sales at RoleColorFinder, leading sales strategy and revenue operations with a focus on building scalable enterprise growth.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/kody-krueger`;
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
      "name": "Kody Krueger",
      "jobTitle": "Head of Sales",
      "worksFor": {
        "@type": "Organization",
        "name": "RoleColor"
      },
      "url": canonicalHref,
      "image": `${window.location.origin}/images/kody-krueger.jpg`,
      "email": "kody@rolecolor.com"
    };

    let scriptEl = document.getElementById("jsonld-kody-krueger") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-kody-krueger";
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
                    src="/images/kody-krueger.jpg" 
                    alt="Kody Krueger"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 ring-4 ring-white/90 shadow-xl flex-shrink-0" />
                    <span className="text-white font-bold text-base drop-shadow-lg">Supportive Collaborator</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Kody Krueger</h1>
                    <p className="text-lg text-primary font-semibold">Head of Sales</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:kody@rolecolor.com" className="hover:text-primary transition-colors">
                        kody@rolecolor.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Seattle, WA</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span>English</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Sales Strategy</Badge>
                      <Badge variant="secondary">Revenue Operations</Badge>
                      <Badge variant="secondary">B2B Growth</Badge>
                      <Badge variant="secondary">Enterprise Sales</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Head of Sales</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Building Human-Centered Growth
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Kody Krueger is the Head of Sales at RoleColorFinder and a growth operator at heart. He thrives on turning early-stage momentum into real, measurable revenue by combining disciplined sales execution with genuine relationship building. Kody joined RoleColorFinder because he recognized the same three signals that define breakout companies: a clear market gap in how teams understand leadership, a founder with conviction, and a product positioned to create real-world impact — not just noise.
                </p>
                <p>
                  At RoleColorFinder, Kody leads the company's sales strategy and revenue operations, focusing on building a scalable, repeatable enterprise motion. He brings a strong background in technology and startup environments, with particular strength in B2B sales and high-touch customer success. Known for his ability to quickly understand client needs and translate them into tailored solutions, Kody has consistently driven growth in SaaS businesses — including tripling sales at FitLift and closing high-value deals across multiple organizations.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Kody's career has been shaped by hands-on experience inside fast-moving startup environments, where speed, ownership, and customer obsession matter most. Across roles at companies like FitLift and Yohana, he developed a reputation for disciplined pipeline management, strong enterprise communication, and an ability to build lasting client relationships that extend beyond the initial sale.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Leading sales and revenue strategy at RoleColorFinder</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Building a scalable B2B and enterprise sales motion</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Driving pipeline growth and high-quality deal execution</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Developing long-term client relationships and expansion opportunities</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Aligning sales feedback with product and leadership insights</span>
                </li>
              </ul>
            </section>

            <section className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500" />
                Why Green?
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  As a <strong>Supportive Collaborator</strong>, Kody embodies the Green RoleColor through his ability to build lasting relationships, foster trust, and create genuine human connections. Green leaders excel at listening, understanding client needs, and developing partnerships that extend far beyond the initial sale. His disciplined approach to relationship building and customer success reflects the Green strength of creating harmony and mutual benefit. At RoleColorFinder, Kody's Green energy ensures that every client interaction is authentic, collaborative, and designed to create lasting value for all parties involved.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KodyKrueger;
