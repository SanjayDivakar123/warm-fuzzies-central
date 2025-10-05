import { Link } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, Brain, Target, CheckCircle } from "lucide-react";
import { useEffect } from "react";

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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 text-base px-6 py-3">
            About Us
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-balance">
            Revolutionizing Leadership
            <span className="gradient-text-primary block mt-2">Through Color Psychology</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We believe leadership isn't one-size-fits-all. Our patent-pending system helps professionals discover and develop their unique leadership style.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <div className="glass-card rounded-3xl p-12 md:p-16 border border-primary/20">
            <div className="text-center mb-12">
              <Target className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Mission</h2>
            </div>
            <p className="text-xl text-foreground leading-relaxed text-center max-w-4xl mx-auto">
              To empower individuals and teams to understand their natural leadership strengths and adapt them contextually—because effective leaders don't impose a single style, they flex based on what their team needs at each stage of development.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Science-Backed",
                description: "Built on proven psychological research including Tuckman's Five Stages of Team Development and established leadership frameworks."
              },
              {
                icon: Users,
                title: "People-First",
                description: "We believe in developing people, not just processes. Every assessment is designed to unlock human potential."
              },
              {
                icon: Award,
                title: "Innovation Driven",
                description: "Our patent-pending color-based system represents a breakthrough in making leadership development accessible and actionable."
              }
            ].map((value, i) => (
              <Card key={i} className="hover-lift border-border/50">
                <CardContent className="p-8">
                  <value.icon className="w-12 h-12 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* The Science Behind It */}
        <section className="mb-20">
          <div className="glass-card-strong rounded-3xl p-12 md:p-16 border border-primary/20">
            <div className="text-center mb-12">
              <Shield className="w-16 h-16 text-green mx-auto mb-6" />
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
                Unlike traditional personality tests that lock you into a single type, our system recognizes that <strong className="text-primary">contextual leadership</strong> is the key to modern team success.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Role Color Finder?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              "Patent-pending assessment methodology",
              "Based on 50+ years of team development research",
              "Actionable insights, not just personality labels",
              "Comprehensive reports with career recommendations",
              "Secure, confidential data handling",
              "Trusted by professionals and organizations worldwide"
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-4 glass-card rounded-xl p-6">
                <CheckCircle className="w-6 h-6 text-green flex-shrink-0 mt-1" />
                <p className="text-lg text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company Information */}
        <section className="mb-20">
          <Card className="border-primary/20">
            <CardContent className="p-12">
              <h2 className="text-2xl font-bold mb-8 text-center">Company Information</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Headquarters</h3>
                  <p className="text-muted-foreground">Connecticut, United States</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Founded</h3>
                  <p className="text-muted-foreground">2024</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Contact Email</h3>
                  <p className="text-muted-foreground">support@rolecolorfinder.com</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Legal Status</h3>
                  <p className="text-muted-foreground">Registered Business Entity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="glass-card-strong rounded-3xl p-12 md:p-16 border border-primary/30">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Discover Your Leadership Color?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've unlocked their leadership potential
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/free-assessment" className="inline-block">
                <button className="btn-primary px-8 py-4 text-lg font-semibold">
                  Start Free Assessment
                </button>
              </Link>
              <Link to="/pricing" className="inline-block">
                <button className="btn-secondary px-8 py-4 text-lg font-semibold">
                  View Plans
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
