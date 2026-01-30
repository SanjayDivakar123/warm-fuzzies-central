import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, Brain, Target, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const About = () => {
  useEffect(() => {
    const title = "About Us - Role Color Finder | Leadership Assessment Experts";
    const description = "Learn about Role Color Finder's mission to revolutionize leadership development through our patent-pending color-based assessment system. Founded on proven psychological research.";

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/about`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    // Structured data for Organization
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Role Color Finder",
      "description": description,
      "url": canonicalHref,
      "mainEntity": {
        "@type": "Organization",
        "name": "Role Color Finder",
        "url": window.location.origin,
        "logo": `${window.location.origin}/lovable-uploads/fe97ed85-5d66-4caf-bd60-b8463d40052f.png`,
        "description": "Leadership assessment platform helping professionals discover their natural leadership style through color psychology.",
        "foundingDate": "2024",
        "founder": {
          "@type": "Person",
          "name": "Role Color Finder Team"
        },
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "CT",
          "addressCountry": "US"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "email": "support@rolecolorfinder.com"
        },
        "sameAs": [
          "https://www.linkedin.com/company/rolecolorfinder"
        ]
      }
    };

    let scriptEl = document.getElementById("jsonld-about") as HTMLScriptElement | null;
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement("script");
    scriptEl.id = "jsonld-about";
    scriptEl.type = "application/ld+json";
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-wide section-padding">
        {/* Hero Section with Gradient Background */}
        <div className="relative mb-20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent rounded-3xl" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center py-16 px-8">
            <Badge variant="secondary" className="mb-6 text-base px-6 py-3">
              <Sparkles className="w-4 h-4 mr-2" />
              About Us
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-balance">
              Revolutionizing Leadership
              <span className="block mt-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">Through Color Psychology</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We believe leadership isn't one-size-fits-all. Our patent-pending system helps professionals discover and develop their unique leadership style.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <Card className="relative overflow-hidden border-primary/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
            <CardContent className="p-12 md:p-16 relative z-10">
              <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25 mb-6">
                  <Target className="w-10 h-10" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Mission</h2>
              </div>
            <p className="text-xl text-foreground leading-relaxed text-center max-w-4xl mx-auto">
              To empower individuals and teams to understand their natural leadership strengths and adapt them contextually—because effective leaders don't impose a single style, they flex based on what their team needs at each stage of development.
            </p>
            </CardContent>
          </Card>
        </section>

        {/* Core Values */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Our Foundation</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Science-Backed",
                description: "Built on proven psychological research including Tuckman's Five Stages of Team Development and established leadership frameworks.",
                color: "blue"
              },
              {
                icon: Users,
                title: "People-First",
                description: "We believe in developing people, not just processes. Every assessment is designed to unlock human potential.",
                color: "green"
              },
              {
                icon: Award,
                title: "Innovation Driven",
                description: "Our patent-pending color-based system represents a breakthrough in making leadership development accessible and actionable.",
                color: "yellow"
              }
            ].map((value, i) => {
              const colorClasses = {
                blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-500",
                green: "from-green-500/10 to-transparent border-green-500/20 text-green-500",
                yellow: "from-yellow-500/10 to-transparent border-yellow-500/20 text-yellow-500"
              }[value.color];
              return (
                <Card key={i} className={`relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${colorClasses?.split(' ').slice(0, 2).join(' ')} pointer-events-none`} />
                  <CardContent className="p-8 relative z-10">
                    <div className={`inline-flex p-3 rounded-xl bg-background shadow-md border ${colorClasses?.split(' ')[2]} mb-6`}>
                      <value.icon className={`w-8 h-8 ${colorClasses?.split(' ')[3]}`} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* The Science Behind It */}
        <section className="mb-20">
          <Card className="relative overflow-hidden border-green-500/20 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full blur-3xl" />
            <CardContent className="p-12 md:p-16 relative z-10">
              <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 mb-6">
                  <Shield className="w-10 h-10" />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">The Science Behind Our System</h2>
              </div>
              <div className="max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground">
                <p className="leading-relaxed">
                  Our assessment is grounded in <strong className="text-foreground">Bruce Tuckman's Five Stages of Team Development</strong> (Forming, Storming, Norming, Performing, Adjourning) - a model validated across decades of organizational psychology research.
                </p>
                <p className="leading-relaxed">
                  We've combined this with color psychology principles to create a unique, patent-pending diagnostic that reveals not just who you are as a leader, but <strong className="text-foreground">how to adapt your style</strong> based on team context and stage.
                </p>
                <p className="leading-relaxed">
                  Unlike traditional personality tests that lock you into a single type, our system recognizes that <strong className="text-green-600 dark:text-green-400">contextual leadership</strong> is the key to modern team success.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why Choose Us */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 px-4 py-1.5">
              <Target className="w-4 h-4 mr-2" />
              Why Us
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold">Why Choose Role Color Finder?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { text: "Patent-pending assessment methodology", color: "blue" },
              { text: "Based on 50+ years of team development research", color: "green" },
              { text: "Actionable insights, not just personality labels", color: "yellow" },
              { text: "Comprehensive reports with career recommendations", color: "red" },
              { text: "Secure, confidential data handling", color: "purple" },
              { text: "Trusted by professionals and organizations worldwide", color: "emerald" }
            ].map((benefit, i) => {
              const colorClasses: Record<string, string> = {
                blue: "from-blue-500/10 border-blue-500/20 text-blue-500",
                green: "from-green-500/10 border-green-500/20 text-green-500",
                yellow: "from-yellow-500/10 border-yellow-500/20 text-yellow-500",
                red: "from-red-500/10 border-red-500/20 text-red-500",
                purple: "from-purple-500/10 border-purple-500/20 text-purple-500",
                emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-500"
              };
              const classes = colorClasses[benefit.color];
              return (
                <Card key={i} className={`relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${classes.split(' ')[1]}`}>
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${classes.split(' ')[0]} to-transparent pointer-events-none`} />
                  <CardContent className="p-6 relative z-10 flex items-start gap-4">
                    <div className={`inline-flex p-2 rounded-lg bg-background shadow-md border ${classes.split(' ')[1]} flex-shrink-0`}>
                      <CheckCircle className={`w-5 h-5 ${classes.split(' ')[2]}`} />
                    </div>
                    <p className="text-foreground font-medium leading-relaxed">{benefit.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Company Information */}
        <section className="mb-20">
          <Card className="relative overflow-hidden border-purple-500/20 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />
            <CardContent className="p-12 md:p-16 relative z-10">
              <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25 mb-6">
                  <Award className="w-10 h-10" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Company Information</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
                {[
                  { label: "Headquarters", value: "Connecticut, United States", icon: "🏢" },
                  { label: "Founded", value: "2024", icon: "📅" },
                  { label: "Contact Email", value: "support@rolecolorfinder.com", icon: "✉️" },
                  { label: "Legal Status", value: "Registered Business Entity", icon: "📋" }
                ].map((item, i) => (
                  <div key={i} className="text-center p-6 rounded-2xl bg-background/50 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-foreground mb-2">{item.label}</h3>
                    <p className="text-muted-foreground text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-12 md:p-20 relative z-10">
              <div className="inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-8">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Ready to Discover Your Leadership Color?</h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of professionals who've unlocked their leadership potential
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/free-assessment">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 shadow-xl shadow-black/20 px-8 py-6 text-lg font-semibold">
                    Start Free Assessment
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/20 px-8 py-6 text-lg font-semibold bg-white/10 backdrop-blur-sm">
                    View Plans
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default About;
