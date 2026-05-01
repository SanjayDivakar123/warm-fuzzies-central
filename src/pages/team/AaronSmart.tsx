import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const AaronSmart = () => {
  useEffect(() => {
    const title = "Aaron Smart - Sales Enablement Lead | Role Color Finder";
    const description =
      "Aaron Smart is the Sales Enablement Lead at RoleColorFinder, driving pipeline generation, full-cycle execution, and scalable revenue systems as a Fast Executor.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/aaron-smart`;
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
      name: "Aaron Smart",
      jobTitle: "Sales Enablement Lead",
      worksFor: {
        "@type": "Organization",
        name: "RoleColor",
      },
      url: canonicalHref,
      image: `${window.location.origin}/images/aaron-smart.png`,
      email: "aaron@rolecolor.com",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Illinois",
        addressCountry: "USA",
      },
    };

    let scriptEl = document.getElementById("jsonld-aaron-smart") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-aaron-smart";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-wide section-padding">
        <Button variant="ghost" size="sm" className="mb-8 group" asChild>
          <Link to="/team">
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Team
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-border/50 sticky top-8">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src="/images/aaron-smart.png"
                    alt="Aaron Smart"
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
                    <h1 className="text-2xl font-bold">Aaron Smart</h1>
                    <p className="text-lg text-primary font-semibold">Sales Enablement Lead</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:aaron@rolecolor.com" className="hover:text-primary transition-colors">
                        aaron@rolecolor.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Illinois, USA</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span>English</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Sales Enablement</Badge>
                      <Badge variant="secondary">Outbound Sales</Badge>
                      <Badge variant="secondary">Inbound Conversion</Badge>
                      <Badge variant="secondary">Full-Cycle Execution</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Sales Enablement Lead</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Building Revenue Systems That Move Fast
              </h2>
              <div className="prose max-w-none text-muted-foreground space-y-3">
                <p>
                  Aaron Smart is the Sales Enablement Lead at RoleColorFinder and a Fast Executor with a strong
                  foundation in outbound and inbound sales, pipeline creation, and full-cycle execution. He helps
                  teams turn strategy into action, moving quickly from prospecting to qualified conversations and
                  from conversation to revenue.
                </p>
                <p>
                  Before joining RoleColorFinder, Aaron built experience across SDR, account executive, and business
                  development roles in high-growth environments. At RoleColorFinder, he focuses on enablement systems
                  that improve messaging, prospecting quality, workflow discipline, and conversion consistency across
                  the revenue motion.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Aaron&apos;s background combines hands-on selling, enablement design, and startup execution. Across
                  previous roles and consulting work, he has supported CRM workflows, outreach systems, and sales
                  playbook development, helping teams scale growth without losing quality.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Core Responsibilities</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Building and refining outbound and inbound sales enablement systems</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Driving pipeline quality through better messaging, targeting, and execution rhythm</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Supporting full-cycle sales processes that improve conversion and velocity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Creating repeatable sales playbooks and SOPs that scale GTM consistency</span>
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
                  As a <strong>Fast Executor</strong>, Aaron embodies the Yellow RoleColor through speed, ownership,
                  and an action-first approach to growth. Yellow leaders thrive by turning strategy into motion, and
                  Aaron does that by creating practical systems that accelerate pipeline and improve execution quality.
                  At RoleColorFinder, his Yellow energy shows up in how quickly ideas become outreach experiments,
                  experiments become process improvements, and process improvements become revenue outcomes.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AaronSmart;
