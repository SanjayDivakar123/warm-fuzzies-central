import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Users, Target, Lightbulb, Zap, Brain, Heart, Settings, CheckCircle, TrendingUp, ArrowRight, Sparkles, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import professionalTeamImage from "@/assets/professional-team.jpg";
import roleColorAILogo from "@/assets/rolecolor-ai-logo.svg";
import HeroSectionWithGradient from "@/components/ui/hero-section-with-gradient";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user
  } = useAuth();
  useEffect(() => {
    if (searchParams.get('accverified') === 'true') {
      toast({
        title: "Account Verified!",
        description: "Taking you to login page now..."
      });
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    }
  }, [searchParams, navigate]);
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Gradient */}
      <HeroSectionWithGradient />

      {/* Philosophy Section - Enhanced */}
      <section className="section-padding bg-gradient-soft relative overflow-hidden" aria-label="Our Philosophy">
        <h2 className="sr-only">Our Philosophy on Contextual Leadership</h2>
        
        <div className="container-wide relative">
          <ScrollReveal preset="fade-up" className="text-center mb-20">
            <Badge variant="secondary" className="text-base px-6 py-3 mb-8 font-semibold">
              Our Philosophy
            </Badge>
            
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-foreground mb-8 sm:mb-10 md:mb-12 leading-tight text-balance">
              Great teams don't just happen.
              <br />
              <span className="gradient-text-primary font-bold">They grow through stages.</span>
            </h3>
            
            <div className="max-w-6xl mx-auto">
              <blockquote className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light text-muted-foreground mb-6 sm:mb-8 md:mb-10 leading-relaxed italic text-balance">
                "Leadership isn't a fixed identity. It's adapting your strengths to what a team needs at each stage."
              </blockquote>
              <cite className="text-primary font-bold text-base sm:text-lg md:text-xl">— Bruce Tuckman, developer of the team development model</cite>
            </div>
          </ScrollReveal>

          <div className="max-w-7xl mx-auto mb-12 sm:mb-16 md:mb-24">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-center">
              <ScrollReveal preset="fade-right" delay={0.1} className="space-y-6 sm:space-y-8 md:space-y-12">
                <div className="relative rounded-3xl border border-border p-1">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                  />
                  <div className="relative glass-card-strong rounded-[1.25rem] p-6 sm:p-8 md:p-12 bg-background">
                    <h4 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 md:mb-8">Contextual Leadership</h4>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      We believe in <strong className="text-foreground gradient-text-primary">Contextual Leadership</strong> — the understanding that leadership isn't a fixed identity. It's adapting your strengths to what a team needs at each stage.
                    </p>
                  </div>
                </div>
                
                <div className="relative rounded-3xl border border-border p-1">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                  />
                  <div className="relative glass-card-strong rounded-[1.25rem] p-6 sm:p-8 md:p-12 bg-gradient-to-br from-primary/5 to-green/5">
                    <p className="text-base sm:text-lg md:text-xl text-foreground leading-relaxed">
                      Our tool reveals your unique color profile and shows you how to flex your leadership style across different team stages, contexts, and challenges — because 
                      <strong className="gradient-text-primary text-lg sm:text-xl md:text-2xl block mt-4"> effective leaders adapt, they don't impose.</strong>
                    </p>
                  </div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal preset="fade-left" delay={0.2}>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-colorful rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <img src={professionalTeamImage} alt="Professional team collaboration" width="800" height="600" className="rounded-3xl shadow-xl w-full h-auto hover-lift relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent rounded-3xl z-20"></div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* How Our Idea Works - Enhanced */}
          <ScrollReveal preset="fade-up" className="mb-20">
            <div className="text-center mb-16">
              <h4 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                Here's how our <span className="gradient-text-primary">patent pending</span> idea works:
              </h4>
              
              <Badge variant="outline" className="text-lg px-8 py-4 border-primary/40 text-primary font-bold">
                🔬 Patent Pending System
              </Badge>
            </div>
            
            <div className="glass-card-strong rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 border border-primary/20 shadow-elegant mb-12 sm:mb-16 md:mb-20 hover-lift">
              <p className="text-lg sm:text-xl md:text-2xl text-foreground mb-8 sm:mb-12 md:mb-16 leading-relaxed text-center text-balance font-medium">
                Every user takes a 25-question diagnostic designed around real group psychology, especially Tuckman's Five Stages of Team Development:
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16">
                {[{
                icon: Users,
                color: 'red',
                title: 'Forming',
                desc: 'Building connection'
              }, {
                icon: Zap,
                color: 'yellow',
                title: 'Storming',
                desc: 'Navigating friction'
              }, {
                icon: Settings,
                color: 'green',
                title: 'Norming',
                desc: 'Establishing flow'
              }, {
                icon: TrendingUp,
                color: 'blue',
                title: 'Performing',
                desc: 'Reaching peak productivity'
              }, {
                icon: CheckCircle,
                color: 'brand',
                title: 'Adjourning',
                desc: 'Ending with clarity'
              }].map((stage, i) => <div key={i} className="text-center hover-lift">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-${stage.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 shadow-${stage.color} hover:scale-110 transition-transform duration-300`}>
                      <stage.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                    </div>
                    <h4 className="font-bold text-foreground mb-2 sm:mb-3 text-sm sm:text-base md:text-lg lg:text-xl">{stage.title}</h4>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{stage.desc}</p>
                  </div>)}
              </div>

              <p className="text-base sm:text-lg md:text-xl text-foreground text-center leading-relaxed text-balance font-medium">
                At each of these stages, teams need different kinds of leadership.
                <span className="hidden sm:inline"><br /></span> Sometimes they need decisive action. Sometimes they need creative vision. Sometimes they need systematic planning.
                <strong className="gradient-text-primary text-lg sm:text-xl md:text-2xl block mt-4 sm:mt-6">Contextual Leadership means knowing when to lead, when to support, and how to adapt your style to what the team needs.</strong>
              </p>
            </div>
          </ScrollReveal>

          {/* Color Roles - Enhanced */}
          <div id="rolecolor-profiles">
          <ScrollReveal preset="zoom-in" className="mb-20 scroll-mt-24">
            <h4 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Our algorithm translates your answers into one of four <span className="gradient-text-primary">RoleColor™ Profiles</span>:
            </h4>
            
            <ScrollRevealGroup preset="fade-up" staggerDelay={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16">
              {[{
              icon: Target,
              color: 'yellow',
              name: 'Yellow',
              desc: 'Action-first executors (founders, builders, PMs)',
              gradient: 'gradient-yellow'
            }, {
              icon: Heart,
              color: 'red',
              name: 'Red',
              desc: 'Vision-driven motivators (speakers, creatives, brand builders)',
              gradient: 'gradient-red'
            }, {
              icon: Brain,
              color: 'green',
              name: 'Green',
              desc: 'Logic-based architects (analysts, engineers, operators)',
              gradient: 'gradient-green'
            }, {
              icon: Lightbulb,
              color: 'blue',
              name: 'Blue',
              desc: 'Innovation-focused visionaries (strategists, designers, researchers)',
              gradient: 'gradient-blue'
            }].map((role, i) => <div key={i} className="glass-card rounded-2xl p-6 sm:p-8 border border-border text-center hover:border-primary/50 transition-all duration-500 hover-lift group">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-${role.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-${role.color}`}>
                    <role.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h4 className={`font-bold text-${role.color} mb-3 sm:mb-4 text-lg sm:text-xl group-hover:text-${role.color}/80 transition-colors duration-300`}>{role.name}</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{role.desc}</p>
                </div>)}
            </ScrollRevealGroup>

            <div className="text-center">
              <Button variant="default" size="lg" className="text-base sm:text-lg md:text-xl px-6 sm:px-10 md:px-16 py-4 sm:py-5 md:py-6 font-bold group" onClick={() => navigate('/free-assessment')}>
                Discover Your RoleColor™ Profile
                <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </ScrollReveal>
          </div>
        </div>
      </section>


      {/* RoleColorFinder vs RoleColorAI Section */}
      <section className="section-padding bg-background" aria-label="RoleColorFinder and RoleColorAI">
        <div className="container-wide">
          {/* Section Header */}
          <ScrollReveal preset="fade-up" className="text-center mb-16">
            <Badge variant="secondary" className="text-base px-6 py-3 mb-8 font-semibold">
              <Sparkles className="w-5 h-5 mr-2" />
              The Complete System
            </Badge>
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight text-balance">
              From Knowing How People Are Built →
              <br />
              <span className="gradient-text-primary">Knowing If They Can Execute</span>
            </h3>
          </ScrollReveal>

          {/* Narrative */}
          <ScrollReveal preset="blur-in" delay={0.1} className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-xl md:text-2xl text-foreground leading-relaxed mb-6">
              RoleColorFinder reveals how people are built — how they think, lead, decide, and respond under pressure.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
              But understanding structure is only half the equation.
            </p>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed mb-8">
              <strong className="gradient-text-primary">RoleColorAI</strong> extends RoleColorFinder into execution intelligence — showing whether someone can perform in a specific role, on a specific team, at a specific moment in time.
            </p>
            <p className="text-2xl font-semibold text-foreground">
              Together, they form a complete decision system.
            </p>
          </ScrollReveal>

          {/* Two Column Comparison */}
          <ScrollRevealGroup preset="fade-up" staggerDelay={0.15} className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            {/* Left: RoleColorFinder */}
            <div className="glass-card-strong rounded-3xl p-8 md:p-10 border border-primary/20 shadow-elegant hover-lift">
              <div className="flex items-center gap-4 mb-6">
                <img src="/rcf-logo.png" alt="RoleColorFinder" className="h-12 w-auto object-contain" />
              </div>
              
              <p className="text-lg font-semibold text-primary mb-6">How people are built</p>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Decision style",
                  "Leadership behavior",
                  "Pressure response",
                  "Natural team role tendencies"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg text-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">This is the foundation.</strong><br />
                  It explains why people behave the way they do at work.
                </p>
              </div>
            </div>

            {/* Right: RoleColorAI */}
            <div className="glass-card-strong rounded-3xl p-8 md:p-10 border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-blue/5 shadow-elegant hover-lift">
              <div className="flex items-center gap-4 mb-6">
                <img src={roleColorAILogo} alt="RoleColorAI Logo" className="h-12 w-auto" />
              </div>
              
              <p className="text-lg font-semibold text-primary mb-6">How well they can execute</p>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Skill depth and readiness",
                  "Evidence of execution",
                  "Job and team fit",
                  "Outcome prediction"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg text-foreground">
                    <Brain className="w-5 h-5 text-blue flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-border pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">This is the execution layer.</strong><br />
                  It explains whether someone can succeed here — and for how long.
                </p>
              </div>
            </div>
          </ScrollRevealGroup>

          {/* Emphasis Statement */}
          <ScrollReveal preset="zoom-in" delay={0.2} className="text-center mb-16">
            <div className="inline-block glass-card-strong rounded-2xl px-8 py-6 border border-primary/30">
              <p className="text-xl md:text-2xl font-semibold text-foreground">
                RoleColorFinder explains <span className="text-primary">structure</span>.
                <br />
                RoleColorAI explains <span className="gradient-text-primary">outcomes</span>.
              </p>
            </div>
          </ScrollReveal>

          {/* Use Cases */}
          <ScrollReveal preset="fade-up" delay={0.1} className="max-w-4xl mx-auto mb-16">
            <h4 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              What this unlocks for RCF users:
            </h4>
            
            <ScrollRevealGroup preset="fade-right" staggerDelay={0.1} className="grid sm:grid-cols-2 gap-4">
              {[
                "Hiring decisions with real context",
                "Team design that holds under pressure",
                "Career paths that reduce burnout",
                "Fewer mis-hires and faster stabilization"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 glass-card rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
                  <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-lg text-foreground">{item}</span>
                </div>
              ))}
            </ScrollRevealGroup>
            
            <p className="text-center text-lg text-muted-foreground mt-8">
              RoleColorAI doesn't replace RoleColorFinder.<br />
              <strong className="text-foreground">It activates it.</strong>
            </p>
          </ScrollReveal>

          {/* CTA Block */}
          <ScrollReveal preset="fade-up" delay={0.2} className="max-w-3xl mx-auto text-center glass-card-strong rounded-3xl p-8 md:p-12 border border-primary/20">
            <h4 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Want to go deeper than self-awareness?
            </h4>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              RoleColorAI is currently in limited early access for individuals and organizations who want to move from understanding roles to making better decisions with them.
            </p>
            <Button variant="default" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 font-semibold rounded-full group" asChild>
              <a href="https://rolecolorai.com" target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-center justify-center gap-1">
                <span>Request early access to</span>
                <span className="flex items-center">RoleColorAI <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
              </a>
            </Button>
          </ScrollReveal>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="section-padding bg-gradient-soft" aria-label="Frequently Asked Questions">
        <div className="container-wide">
          <ScrollReveal preset="fade-up" className="text-center mb-16">
            <Badge variant="secondary" className="text-base px-6 py-3 mb-8 font-semibold">
              <HelpCircle className="w-5 h-5 mr-2" />
              Frequently Asked Questions
            </Badge>
            <h3 className="text-4xl md:text-6xl font-bold text-foreground mb-8">
              Got Questions? <span className="gradient-text-primary">We've Got Answers</span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about our leadership assessment and team development approach.
            </p>
          </ScrollReveal>

          <ScrollReveal preset="fade-up" delay={0.15} className="max-w-4xl mx-auto">
            <FAQAccordion
              items={[
                {
                  id: "1",
                  title: "What is RoleColorFinder and how is it different?",
                  content: "RoleColorFinder is our patent-pending leadership assessment platform based on real group psychology, specifically Tuckman's Five Stages of Team Development. Unlike static personality tests, our system reveals how your leadership style adapts across different team contexts and stages."
                },
                {
                  id: "2",
                  title: "How long does the assessment take?",
                  content: "The assessment offers two options: a quick 25-question version (3 minutes) or a comprehensive 50-question version (6 minutes). Both are carefully crafted to provide deep insights into your leadership style and team dynamics."
                },
                {
                  id: "3",
                  title: "Can I use this for my entire team?",
                  content: "Both! Individual assessments help you understand your own leadership style, while our Team Program is specifically designed for organizations wanting to improve team dynamics. The Team Program includes group workshops, role mapping, and a 12-week implementation plan."
                },
                {
                  id: "4",
                  title: "What does it cost?",
                  content: "The basic assessment is completely free! We also offer Premium reports ($19) with detailed insights and action plans, and Pro Deep Dive reports ($49) with comprehensive team-building recommendations."
                },
                {
                  id: "5",
                  title: "How do I get started?",
                  content: "Simply click 'Start Your Free Assessment' above to begin the 3-minute quiz. You'll get immediate results showing your RoleColor™ profile."
                },
                {
                  id: "6",
                  title: "What's the scientific backing?",
                  content: "Our assessment is built on Bruce Tuckman's well-established Five Stages of Team Development, combined with modern organizational psychology research on contextual leadership and adaptive leadership theory."
                },
              ]}
            />
          </ScrollReveal>
        </div>
      </section>
    </div>;
};

export default Index;