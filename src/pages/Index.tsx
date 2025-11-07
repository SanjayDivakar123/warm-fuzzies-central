import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Palette, Users, Target, Lightbulb, Zap, Brain, Heart, Settings, CreditCard, CheckCircle, TrendingUp, User, FileText, Star, ArrowRight, Sparkles, Shield, Clock, HelpCircle, Phone } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-image.jpg";
import professionalTeamImage from "@/assets/professional-team.jpg";
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
      
      {/* Hero Section - Completely Redesigned */}
      <section className="relative section-padding overflow-hidden mesh-background" aria-label="Hero section">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80"></div>
        
        {/* Modern floating elements */}
        <div className="absolute top-32 left-[10%] w-64 h-64 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-bounce-gentle"></div>
        <div className="absolute bottom-32 right-[15%] w-48 h-48 bg-gradient-green rounded-full blur-2xl opacity-15 animate-bounce-gentle delay-1000"></div>
        <div className="absolute top-48 right-[25%] w-32 h-32 bg-gradient-yellow rounded-full blur-xl opacity-10 animate-bounce-gentle delay-500"></div>
        
        <div className="relative container-wide">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
            
            {/* Left Content - Enhanced */}
            <div className="text-center lg:text-left space-y-12">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-3 glass-card-strong px-6 py-3 rounded-full border border-primary/30 animate-fade-in">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary tracking-wide">Patent Pending System</span>
              </div>
              
              {/* Main Headline */}
              <div className="space-y-4 sm:space-y-6 animate-fade-in delay-200">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-balance">
                  12 Weeks.
                  <br />
                  <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-muted-foreground">Faster Decisions.</span>
                  <br />
                  <span className="gradient-text-primary text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">Cleaner Handoffs.</span>
                  <br />
                  <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-foreground">Stronger Pipeline.</span>
                </h1>
              </div>

              {/* Enhanced Social Proof */}
              <div className="glass-card-strong rounded-2xl p-4 sm:p-6 md:p-8 border border-primary/20 animate-fade-in delay-400 hover-lift">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 md:gap-8">
                  <div className="flex -space-x-3 sm:-space-x-4">
                    {['from-red to-red-glow', 'from-green to-green-glow', 'from-yellow to-yellow-glow', 'from-blue to-blue-glow'].map((gradient, i) => <div key={i} className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${gradient} border-2 sm:border-3 md:border-4 border-background shadow-xl hover-lift`}></div>)}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-yellow text-yellow" />)}
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-foreground">4.8/5</span>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium">
                      "Finally, a quiz that doesn't put me in a box!" <span className="text-primary font-semibold block sm:inline">• 3 min quiz</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-fade-in delay-600">
                <Button variant="hero" size="lg" className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 font-bold group w-full sm:w-auto" onClick={() => navigate('/free-assessment')}>
                  Start Your Free Assessment
                  <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="modern" size="lg" className="text-base sm:text-lg md:text-xl px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 font-semibold w-full sm:w-auto" asChild>
                  <a href="https://app.reclaim.ai/m/sanjayd/12-week-fit-call" rel="noopener noreferrer">
                    <Clock className="mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6" />
                    Book a 20-min Fit Call
                  </a>
                </Button>
              </div>
              
              {/* Brochure Download */}
              <div className="animate-fade-in delay-800">
                <Button variant="glass" size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 hover-lift w-full sm:w-auto" asChild>
                  <a href="https://static.wixstatic.com/ugd/9b68f8_417b1cdded3c4bef94e31bea9343cf47.pdf" rel="noopener noreferrer" className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Download: Why Every Team Needs</span>
                    </div>
                    <img src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RoleColor ™️ Finder" width="200" height="40" className="h-4 sm:h-5 w-auto" />
                  </a>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Philosophy Section - Enhanced */}
      <section className="section-padding bg-gradient-soft relative overflow-hidden" aria-label="Our Philosophy">
        <h2 className="sr-only">Our Philosophy on Contextual Leadership</h2>
        
        <div className="container-wide relative">
          <div className="text-center mb-20 animate-fade-in">
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
          </div>

          <div className="max-w-7xl mx-auto mb-24">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12 animate-fade-in delay-200">
                <div className="glass-card-strong rounded-3xl p-12 border border-primary/20 shadow-elegant hover:shadow-colorful transition-all duration-700 hover-lift">
                  <h4 className="text-4xl font-bold text-foreground mb-8">Contextual Leadership</h4>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    We believe in <strong className="text-foreground gradient-text-primary">Contextual Leadership</strong> — the understanding that leadership isn't a fixed identity. It's adapting your strengths to what a team needs at each stage.
                  </p>
                </div>
                
                <div className="glass-card-strong rounded-3xl p-12 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-green/5 hover-lift">
                  <p className="text-xl text-foreground leading-relaxed">
                    Our tool reveals your unique color profile and shows you how to flex your leadership style across different team stages, contexts, and challenges — because 
                    <strong className="gradient-text-primary text-2xl block mt-4"> effective leaders adapt, they don't impose.</strong>
                  </p>
                </div>
              </div>
              
              <div className="relative animate-fade-in delay-400">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-colorful rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <img src={professionalTeamImage} alt="Professional team collaboration" width="800" height="600" className="rounded-3xl shadow-xl w-full h-auto hover-lift relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent rounded-3xl z-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* How Our Idea Works - Enhanced */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h4 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                Here's how our <span className="gradient-text-primary">patent pending</span> idea works:
              </h4>
              
              <Badge variant="outline" className="text-lg px-8 py-4 border-primary/40 text-primary font-bold">
                🔬 Patent Pending System
              </Badge>
            </div>
            
            <div className="glass-card-strong rounded-3xl p-16 border border-primary/20 shadow-elegant mb-20 hover-lift">
              <p className="text-2xl text-foreground mb-16 leading-relaxed text-center text-balance font-medium">
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

              <p className="text-xl text-foreground text-center leading-relaxed text-balance font-medium">
                At each of these stages, teams need different kinds of leadership.<br />
                Sometimes they need decisive action. Sometimes they need creative vision. Sometimes they need systematic planning.<br />
                <strong className="gradient-text-primary text-2xl block mt-6">Contextual Leadership means knowing when to lead, when to support, and how to adapt your style to what the team needs.</strong>
              </p>
            </div>
          </div>

          {/* Color Roles - Enhanced */}
          <div className="mb-20">
            <h4 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Our algorithm translates your answers into one of four <span className="gradient-text-primary">RoleColor ™️ Profiles</span>:
            </h4>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16">
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
            </div>

            <div className="text-center">
              <Button variant="hero" size="xl" className="text-xl px-16 py-6 font-bold group" onClick={() => navigate('/free-assessment')}>
                Discover Your RoleColor ™️ Profile
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* Voice Assessment Promotion Section */}
      

      {/* FAQ Section */}
      <section className="section-padding bg-gradient-soft" aria-label="Frequently Asked Questions">
        <div className="container-wide">
          <div className="text-center mb-16">
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
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="what-is-rolecolor" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  What is RoleColorFinder and how is it different from other assessments?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  RoleColorFinder is our patent-pending leadership assessment platform based on real group psychology, specifically Tuckman's Five Stages of Team Development. Unlike static personality tests, our system reveals how your leadership style adapts across different team contexts and stages. It's designed for modern teams who need flexible, contextual leadership rather than rigid personality boxes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how-long" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  How long does the assessment take?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  The assessment offers two options: a quick 25-question version (3 minutes) or a comprehensive 50-question version (6 minutes). Both are carefully crafted to provide deep insights into your leadership style and team dynamics, with the longer version offering more detailed analysis.
                </AccordionContent>
              </AccordionItem>

              

              <AccordionItem value="team-vs-individual" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  Can I use this for my entire team or just individually?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  Both! Individual assessments help you understand your own leadership style, while our Team Program is specifically designed for organizations wanting to improve team dynamics. The Team Program includes group workshops, role mapping, and a 12-week implementation plan. Many users start with the individual assessment and then bring it to their team.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cost" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  What does it cost?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  The basic assessment is completely free! We also offer premium reports ($29) with detailed insights and action plans, and professional reports ($99) with team-building recommendations. Our Team Program pricing varies by organization size. We believe everyone should have access to understanding their leadership style, which is why we start with a free option.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="getting-started" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  How do I get started?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  Simply click "Start Your Free Assessment" above to begin the 3-minute quiz. You'll get immediate results showing your RoleColor™️ profile. If you want to explore team applications, you can book a 20-minute fit call with our team to discuss your specific needs and objectives.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scientific-backing" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  What's the scientific backing behind this approach?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  Our assessment is built on Bruce Tuckman's well-established Five Stages of Team Development (Forming, Storming, Norming, Performing, Adjourning), combined with modern organizational psychology research on contextual leadership. We've integrated insights from adaptive leadership theory and situational leadership models to create a framework that's both scientifically grounded and practically applicable.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-footer text-background py-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src="/lovable-uploads/215460ce-2150-4569-b60c-3a223ce10adf.png" alt="RoleColor ™️ Finder" className="h-8 w-auto" />
              </div>
              <p className="text-background/80 text-sm leading-relaxed mb-6">
                Discover your unique leadership color profile with our science-backed assessment system.
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gradient-red rounded-full"></div>
                <div className="w-8 h-8 bg-gradient-yellow rounded-full"></div>
                <div className="w-8 h-8 bg-gradient-green rounded-full"></div>
                <div className="w-8 h-8 bg-gradient-blue rounded-full"></div>
              </div>
            </div>
            
            {/* Main Pages */}
            <div>
              <h3 className="font-bold gradient-text mb-4">Main Pages</h3>
              <ul className="space-y-3">
                <li><Link to="/" className="text-background/80 hover:text-background transition-colors text-sm">Home</Link></li>
                <li><Link to="/pricing" className="text-background/80 hover:text-background transition-colors text-sm">Pricing</Link></li>
                <li><Link to="/team-program" className="text-background/80 hover:text-background transition-colors text-sm">Team Program</Link></li>
                <li><Link to="/sitemap" className="text-background/80 hover:text-background transition-colors text-sm">Sitemap</Link></li>
              </ul>
            </div>
            
            {/* Assessments */}
            <div>
              <h3 className="font-bold gradient-text mb-4">Assessments</h3>
              <ul className="space-y-3">
                <li><Link to="/free-assessment" className="text-background/80 hover:text-background transition-colors text-sm">Free Assessment</Link></li>
                <li><Link to="/premium-assessment" className="text-background/80 hover:text-background transition-colors text-sm">Premium Assessment</Link></li>
                <li><Link to="/pro-assessment" className="text-background/80 hover:text-background transition-colors text-sm">Pro Assessment</Link></li>
                <li><Link to="/dashboard" className="text-background/80 hover:text-background transition-colors text-sm">Dashboard</Link></li>
              </ul>
            </div>
            
            {/* Account & Legal */}
            <div>
              <h3 className="font-bold gradient-text mb-4">Account & Legal</h3>
              <ul className="space-y-3">
                <li><Link to="/auth" className="text-background/80 hover:text-background transition-colors text-sm">Sign In / Sign Up</Link></li>
                <li><Link to="/reset-password" className="text-background/80 hover:text-background transition-colors text-sm">Reset Password</Link></li>
                <li><Link to="/about" className="text-background/80 hover:text-background transition-colors text-sm">About Us</Link></li>
                <li><Link to="/contact" className="text-background/80 hover:text-background transition-colors text-sm">Contact</Link></li>
                <li><Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-background/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-background/80 text-sm">
                <span>&copy; {new Date().getFullYear()}</span>
                <img src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" alt="RoleColor ™️ Finder" className="h-4 w-auto" />
                <span>All rights reserved.</span>
              </div>
              <div className="flex gap-6">
                <Link to="/about" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                  About
                </Link>
                <Link to="/contact" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                  Contact
                </Link>
                <Link to="/privacy-policy" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                  Privacy
                </Link>
                <Link to="/terms-of-service" className="text-background/80 hover:text-background transition-colors text-sm font-medium">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;