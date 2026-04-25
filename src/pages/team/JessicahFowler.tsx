import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const JessicahFowler = () => {
  useEffect(() => {
    const title = "Jessicah Fowler - Head of Revenue | Role Color Finder";
    const description =
      "Jessicah Fowler is the Head of Revenue at RoleColorFinder, leading go-to-market systems with a focus on clarity, alignment, and scalable growth.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/team/jessicah-fowler`;
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
      name: "Jessicah Fowler",
      jobTitle: "Head of Revenue",
      worksFor: {
        "@type": "Organization",
        name: "RoleColor",
      },
      url: canonicalHref,
      image: `${window.location.origin}/images/jessicah-fowler-clean.jpg`,
      email: "jessicah@rolecolor.com",
    };

    let scriptEl = document.getElementById("jsonld-jessicah-fowler") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-jessicah-fowler";
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
                    src="/images/jessicah-fowler-clean.jpg"
                    alt="Jessicah Fowler"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 ring-4 ring-white/90 shadow-xl flex-shrink-0" />
                    <span className="text-white font-bold text-base drop-shadow-lg">Creative Motivator</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold">Jessicah Fowler</h1>
                    <p className="text-lg text-primary font-semibold">Head of Revenue</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href="mailto:jessicah@rolecolor.com" className="hover:text-primary transition-colors">
                        jessicah@rolecolor.com
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>Dallas, TX</span>
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

          <div className="lg:col-span-2 space-y-8">
            <section>
              <Badge variant="default" className="mb-4">Head of Revenue</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Designing Systems That Scale Human-Centered Growth
              </h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Jessicah Fowler is the Head of Revenue at RoleColorFinder, where she leads the
                  design and execution of the company&apos;s go-to-market systems with a focus on clarity,
                  alignment, and measurable impact. She is known for building the operational backbone that
                  allows fast-moving teams to scale without losing cohesion, connecting people, process, and
                  technology into systems that actually work in the real world.
                </p>
                <p>
                  Jessicah joined RoleColorFinder after recognizing a rare combination: a product grounded in
                  real behavioral insight, a clear gap in how organizations operationalize leadership, and a
                  team positioned to turn that insight into enterprise-level impact. She brings an AI-native,
                  systems-first mindset to growth, ensuring that revenue is not just generated, but structured
                  in a way that is repeatable and sustainable.
                </p>
                <p>
                  At RoleColorFinder, Jessicah leads revenue operations, GTM architecture, and cross-functional
                  alignment across sales, product, and partnerships. Her work focuses on building scalable
                  infrastructure, from CRM systems and automation to governance frameworks, that drives
                  accountability and enables teams to execute with precision. She has a particular strength in
                  translating complex environments into clear operational models, helping leadership teams move
                  from ambiguity to action.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold mb-4">Education & Background</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Jessicah&apos;s background spans over a decade of clinical healthcare experience alongside
                  work in SaaS startups, venture operations, and enterprise partnerships. Before moving into
                  technology and revenue leadership, she spent 11 years as a lead periodontal practitioner,
                  building a strong understanding of how real-world systems function under pressure.
                </p>
                <p>
                  That mix of clinical and technical experience shapes how she builds today. Across companies
                  like UptimeHealth and DentalRobot, she developed expertise in CRM architecture, partnership
                  growth, and operational strategy, helping teams clarify accountability, improve alignment,
                  and build systems that scale with confidence.
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

            <section className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500" />
                Why a Red?
              </h3>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p>
                  As a <strong>Creative Motivator</strong>, Jessicah embodies the Red RoleColor through her
                  ability to create momentum, align people around a clear direction, and move teams toward
                  action with confidence. Red leaders bring drive, ownership, and forward energy, and
                  Jessicah&apos;s work reflects that by turning complex go-to-market challenges into focused,
                  executable systems. At RoleColorFinder, her Red energy helps revenue strategy move with
                  urgency while still staying structured enough to scale.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JessicahFowler;
