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
      
      {/* Hero Section - Values Bridge Style */}
      <section className="relative section-padding overflow-hidden" aria-label="Hero section">
        <div className="absolute inset-0 bg-background"></div>
        
        <div className="relative container-wide">
          <div className="max-w-5xl mx-auto">
            
            {/* Main Headline - Centered, Large Serif */}
            <div className="text-center space-y-8 mb-16">
              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium text-foreground leading-tight text-balance">
                Discover the leadership style
                <br />
                <span className="block">that makes you shine.</span>
                <br />
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-muted-foreground">Then, learn how to adapt.</span>
              </h1>
            </div>

            {/* Pastel Circles with Icons - Scrolling Row */}
            <div className="mb-16 overflow-hidden">
              <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap max-w-6xl mx-auto px-4">
                {/* Yellow Circle */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-yellow-light flex items-center justify-center">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-dark" strokeWidth={1.5} />
                </div>
                
                {/* Red Circle */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-red-light flex items-center justify-center">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-dark" strokeWidth={1.5} />
                </div>
                
                {/* Green Circle */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-green-light flex items-center justify-center">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-dark" strokeWidth={1.5} />
                </div>
                
                {/* Blue Circle */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-blue-light flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-dark" strokeWidth={1.5} />
                </div>
                
                {/* Additional smaller circles for variety */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-yellow-light flex items-center justify-center">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-dark" strokeWidth={1.5} />
                </div>
                
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-red-light flex items-center justify-center">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-red-dark" strokeWidth={1.5} />
                </div>
                
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-green-light flex items-center justify-center">
                  <Settings className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-dark" strokeWidth={1.5} />
                </div>
                
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-blue-light flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-dark" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Description Text */}
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <p className="text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed">
                Receive your unique RoleColor™ profile, contextual leadership insights, 
                and practical strategies to adapt your strengths across different team stages and challenges.
              </p>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button 
                variant="default" 
                size="lg" 
                className="text-lg px-12 py-6 font-semibold rounded-full" 
                onClick={() => navigate('/free-assessment')}
              >
                Get Started Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Brochure Download */}
            <div className="text-center mt-8">
              <Button variant="ghost" size="lg" className="text-base px-8 py-4" asChild>
                <a href="https://static.wixstatic.com/ugd/9b68f8_417b1cdded3c4bef94e31bea9343cf47.pdf" rel="noopener noreferrer" className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>Download Brochure</span>
                </a>
              </Button>
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
              Our algorithm translates your answers into one of four <span className="gradient-text-primary">RoleColor™ Profiles</span>:
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
              <Button variant="default" size="xl" className="text-xl px-16 py-6 font-bold group" onClick={() => navigate('/free-assessment')}>
                Discover Your RoleColor™ Profile
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section className="section-padding bg-background" aria-label="Testimonials">
        <div className="container-wide">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="text-base px-6 py-3 mb-8 font-semibold">
              <Star className="w-5 h-5 mr-2" />
              Testimonials
            </Badge>
            <h3 className="text-4xl md:text-6xl font-bold text-foreground mb-8">
              What Leaders Are <span className="gradient-text-primary">Saying</span>
            </h3>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="glass-card-strong rounded-3xl p-8 md:p-12 border border-primary/20 shadow-elegant hover-lift">
              <div className="flex items-start gap-4 mb-6">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-1" />
              </div>
              
              <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed mb-8 italic">
                "Loved the simplicity and effectiveness of the test- it was engaging and focused only on leadership which was interesting. I was quite intrigued by the accuracy of the results. All the best Sanjay and RoleColorFinder."
              </blockquote>
              
              <div className="border-t border-border pt-6">
                <p className="text-lg font-semibold text-foreground mb-1">Divakar Vijayasarathy</p>
                <p className="text-base text-muted-foreground">Founder and CEO of DVS Advisory Group</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                  The basic assessment is completely free! We also offer Premium reports ($19) with detailed insights and action plans, and Pro Deep Dive reports ($49) with comprehensive team-building recommendations. We believe everyone should have access to understanding their leadership style, which is why we start with a free option.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="getting-started" className="glass-card-strong rounded-2xl border border-primary/20 p-6">
                <AccordionTrigger className="text-left text-xl font-semibold text-foreground hover:text-primary hover:no-underline">
                  How do I get started?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground leading-relaxed pt-4">
                  Simply click "Start Your Free Assessment" above to begin the 3-minute quiz. You'll get immediate results showing your RoleColor™ profile.
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
    </div>;
};
export default Index;