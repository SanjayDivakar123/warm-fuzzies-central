import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Header1 } from "@/components/ui/header";
import { FAQAccordion } from "@/components/ui/faq-accordion";
import { ContactCard } from "@/components/ui/contact-card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Target, Lightbulb, Zap, Brain, Heart, Settings, CheckCircle, TrendingUp, ArrowRight, Sparkles, HelpCircle, Star, Loader2, Copy, X, MailIcon, PhoneIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import professionalTeamImage from "@/assets/professional-team.jpg";
import roleColorAILogo from "@/assets/rolecolor-ai-logo.svg";
import { HeroScrollDemo } from "@/components/ui/demo";
import LogoCloud3Demo from "@/components/ui/logo-cloud-3-demo";
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/scroll-reveal";
import { TestimonialsCarousel } from "@/components/ui/testimonials-carousel";
import { TestimonialsColumns } from "@/components/ui/testimonials-columns";

// Celebrity results type
interface CelebrityResult {
  celebrityName: string;
  dominantColor: string;
  secondaryColor: string;
  scores: { yellow: number; red: number; green: number; blue: number };
  totalQuestions: number;
  profile: {
    dominant: {
      name: string;
      emoji: string;
      description: string;
      traits: string[];
      strengths: string[];
      challenges: string[];
      famousExamples: string[];
    };
    secondary: {
      name: string;
      emoji: string;
      description: string;
      traits: string[];
      strengths: string[];
      challenges: string[];
      famousExamples: string[];
    };
  };
  timestamp: string;
}

const colorStyles: Record<string, { gradient: string; bg: string; text: string; border: string }> = {
  yellow: { gradient: "bg-gradient-to-br from-yellow-400 to-amber-500", bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-500/30" },
  red: { gradient: "bg-gradient-to-br from-red-400 to-rose-500", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-500/30" },
  green: { gradient: "bg-gradient-to-br from-green-400 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-500/30" },
  blue: { gradient: "bg-gradient-to-br from-blue-400 to-indigo-500", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-500/30" },
};

const getCelebrityNameError = (name: string) => {
  const trimmed = name.trim();
  const letters = trimmed.replace(/[^\p{L}]/gu, "").toLowerCase();

  if (!trimmed) return "Enter a celebrity or fictional character name.";
  if (trimmed.length < 3 || trimmed.length > 80) return "Use a real name between 3 and 80 characters.";
  if (/^\d+$/.test(trimmed)) return "Names cannot be only numbers.";
  if (!/^[\p{L}\p{N} .,'-:]+$/u.test(trimmed)) return "Use a name, not symbols or a URL.";
  if (letters.length < 2 || /^(\p{L})\1+$/u.test(letters)) return "Enter a recognizable celebrity or character.";
  return null;
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [celebrityName, setCelebrityName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [celebrityResult, setCelebrityResult] = useState<CelebrityResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const {
    user
  } = useAuth();

  const handleCelebrityAnalysis = async () => {
    const name = celebrityName.trim().replace(/\s+/g, " ");
    const inputError = getCelebrityNameError(name);
    if (inputError) {
      toast({ title: "Invalid name", description: inputError, variant: "destructive" });
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('celebrity-assessment', {
        body: { celebrityName: name }
      });

      if (error) throw error;
      
      setCelebrityResult(data);
      setShowResultModal(true);
    } catch (error) {
      console.error('Celebrity analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Enter a recognizable celebrity or fictional character.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyResults = () => {
    if (!celebrityResult) return;
    
    const { profile, scores, totalQuestions } = celebrityResult;
    const text = `🌟 ${celebrityResult.celebrityName}'s RoleColor™ Profile 🌟

${profile.dominant.emoji} Dominant Color: ${profile.dominant.name} (${celebrityResult.dominantColor.toUpperCase()})
${profile.secondary.emoji} Secondary Color: ${profile.secondary.name} (${celebrityResult.secondaryColor.toUpperCase()})

📊 Color Scores (out of ${totalQuestions}):
• Yellow: ${scores.yellow} (${Math.round((scores.yellow / totalQuestions) * 100)}%)
• Red: ${scores.red} (${Math.round((scores.red / totalQuestions) * 100)}%)
• Green: ${scores.green} (${Math.round((scores.green / totalQuestions) * 100)}%)
• Blue: ${scores.blue} (${Math.round((scores.blue / totalQuestions) * 100)}%)

💡 About ${celebrityResult.celebrityName}:
${profile.dominant.description}

✨ Key Traits: ${profile.dominant.traits.join(", ")}
🎯 Strengths: ${profile.dominant.strengths.join(", ")}
📈 Growth Areas: ${profile.dominant.challenges.join(", ")}

Similar to: ${profile.dominant.famousExamples.join(", ")}

---
Discover your own RoleColor™ at rolecolorfinder.com`;

    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Results copied to clipboard" });
  };

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim() || null,
      message: contactForm.message.trim(),
      source_page: "home",
      submitted_by_user_id: user?.id ?? null,
    };

    if (!payload.name || !payload.email || !payload.message) {
      toast({
        title: "Missing details",
        description: "Please fill in your name, email, and message.",
        variant: "destructive",
      });
      return;
    }

    setContactSubmitting(true);
    try {
      const { error } = await supabase.from("contact_queries").insert(payload);
      if (error) throw error;

      toast({
        title: "Message received",
        description: "Thanks! Your query is now in our admin queue.",
      });

      setContactForm({
        name: "",
        email: user?.email ?? "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form submission failed:", error);
      toast({
        title: "Could not send message",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setContactSubmitting(false);
    }
  };

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

  useEffect(() => {
    if (user?.email) {
      setContactForm((prev) => ({ ...prev, email: prev.email || user.email || "" }));
    }
  }, [user?.email]);
    return <div className="min-h-screen bg-background">
      <Header1 />
      <div className="h-20" />
      
      {/* Celebrity Results Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {celebrityResult && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">
                  <Badge variant="secondary" className="mb-4">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Celebrity RoleColor™ Profile
                  </Badge>
                  <div className="mt-2">
                    <span className={colorStyles[celebrityResult.dominantColor]?.text}>{celebrityResult.celebrityName}</span>
                    {" "}is a{" "}
                    <span className={colorStyles[celebrityResult.dominantColor]?.text}>{celebrityResult.profile.dominant.name}</span>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Main Result Card */}
                <div className={`${colorStyles[celebrityResult.dominantColor]?.gradient} p-6 rounded-2xl text-white text-center`}>
                  <div className="text-5xl mb-3">{celebrityResult.profile.dominant.emoji}</div>
                  <h3 className="text-2xl font-bold">{celebrityResult.profile.dominant.name}</h3>
                  <p className="text-white/80 mt-1">Dominant Leadership Style</p>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {celebrityResult.profile.dominant.description.replace("A natural", `${celebrityResult.celebrityName} is a natural`)}
                </p>

                {/* Traits */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Key Traits
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {celebrityResult.profile.dominant.traits.map((trait, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1.5">{trait}</Badge>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="font-bold mb-3">💪 {celebrityResult.celebrityName}'s Strengths</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {celebrityResult.profile.dominant.strengths.map((s, i) => (
                      <div key={i} className={`p-3 rounded-xl ${colorStyles[celebrityResult.dominantColor]?.bg} border ${colorStyles[celebrityResult.dominantColor]?.border}`}>
                        <span className={colorStyles[celebrityResult.dominantColor]?.text}>✓</span> {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Areas */}
                <div>
                  <h4 className="font-bold mb-3">📈 Growth Opportunities</h4>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {celebrityResult.profile.dominant.challenges.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border text-sm">{c}</div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Secondary Color */}
                <div className={`p-5 rounded-xl ${colorStyles[celebrityResult.secondaryColor]?.bg} border ${colorStyles[celebrityResult.secondaryColor]?.border}`}>
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    {celebrityResult.profile.secondary.emoji} Secondary Style: {celebrityResult.profile.secondary.name}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {celebrityResult.celebrityName} also shows strong {celebrityResult.profile.secondary.name.toLowerCase()} tendencies, 
                    bringing {celebrityResult.profile.secondary.traits.slice(0, 2).join(" and ").toLowerCase()} qualities to their approach.
                  </p>
                </div>

                {/* Score Breakdown */}
                <div>
                  <h4 className="font-bold mb-3">📊 Color Score Breakdown</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(celebrityResult.scores).map(([color, score]) => {
                      const styles = colorStyles[color];
                      const percentage = Math.round((score / celebrityResult.totalQuestions) * 100);
                      return (
                        <div key={color} className={`p-3 rounded-xl text-center ${styles?.bg} border ${styles?.border}`}>
                          <div className={`text-xl font-bold ${styles?.text}`}>{percentage}%</div>
                          <div className="text-xs text-muted-foreground capitalize">{color}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Similar Figures */}
                <div>
                  <h4 className="font-bold mb-3">⭐ Similar Leadership Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {celebrityResult.profile.dominant.famousExamples.map((ex, i) => (
                      <Badge key={i} variant="outline" className={`${colorStyles[celebrityResult.dominantColor]?.border} ${colorStyles[celebrityResult.dominantColor]?.text}`}>{ex}</Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center pt-4">
                  <Button onClick={handleCopyResults} variant="outline" className="gap-2">
                    <Copy className="w-4 h-4" /> Copy Results
                  </Button>
                  <Button onClick={() => { setShowResultModal(false); setCelebrityName(""); }} className="gap-2">
                    Try Another
                  </Button>
                </div>

                {/* CTA */}
                <Card className="bg-gradient-to-br from-primary/10 via-green/10 to-blue/10 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <h4 className="text-lg font-bold mb-2">Discover Your Own RoleColor™</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Now that you've analyzed {celebrityResult.celebrityName}, find out your own leadership color!
                    </p>
                    <Button onClick={() => { setShowResultModal(false); navigate('/free-assessment'); }} className="gap-2">
                      Take Your Free Assessment <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Main Hero Section */}
      <HeroScrollDemo />

      <section className="relative pb-8 md:pb-12 bg-gradient-to-b from-background via-background to-card" aria-label="Platforms we connect with">
        <div className="container-wide">
          <LogoCloud3Demo />
        </div>
      </section>

      {/* Philosophy Section - Enhanced */}
      <section className="section-padding bg-gradient-to-b from-card via-background to-background relative overflow-hidden" aria-label="Our Philosophy">
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
            
            <ScrollRevealGroup preset="fade-up" staggerDelay={0.1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-14 md:mb-16 auto-rows-[minmax(0,1fr)]">
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
            }].map((role, i) => <div key={i} className="glass-card rounded-2xl p-6 sm:p-8 border border-border text-center hover:border-primary/50 transition-all duration-500 hover-lift group h-full flex flex-col items-center justify-center">
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

      {/* Testimonials Section */}
      <TestimonialsColumns />

      {/* Celebrity Assessment Section */}
      <section className="section-padding bg-gradient-to-b from-background via-primary/5 to-background" aria-label="Celebrity Assessment">
        <div className="container-wide">
          <ScrollReveal preset="fade-up" className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="text-base px-6 py-3 mb-8 font-semibold">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Fun Feature
            </Badge>
            
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Analyze Any Celebrity or Character
            </h3>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Ever wondered what leadership color your favorite celebrity, fictional character, or historical figure would be? Find out now!
            </p>

            <div className="relative rounded-3xl border border-border p-1 max-w-xl mx-auto">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative glass-card-strong rounded-[1.25rem] p-6 sm:p-8 bg-background">
                <div className="flex flex-col gap-4">
                  <Input
                    type="text"
                    placeholder="Enter a celebrity or character name..."
                    value={celebrityName}
                    onChange={(e) => setCelebrityName(e.target.value)}
                    className="text-lg py-6 px-6 text-center"
                    disabled={isAnalyzing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && celebrityName.trim() && !isAnalyzing) {
                        handleCelebrityAnalysis();
                      }
                    }}
                  />
                  <Button
                    variant="default"
                    size="lg"
                    className="text-base sm:text-lg font-bold group w-full"
                    onClick={handleCelebrityAnalysis}
                    disabled={!celebrityName.trim() || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Analyzing {celebrityName.trim()}...
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 w-5 h-5" />
                        Analyze {celebrityName.trim() || "Their"} RoleColor™
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Examples: Elon Musk, Sherlock Holmes, Oprah, Tony Stark, Princess Diana
                </p>
                {isAnalyzing && (
                  <p className="text-sm text-primary mt-2 animate-pulse">
                    🤖 AI is analyzing 50 leadership questions as {celebrityName.trim()}...
                  </p>
                )}
              </div>
            </div>
          </ScrollReveal>
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
            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-6 font-semibold rounded-full group"
              asChild
            >
              <a
                href="https://rolecolorai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-center !whitespace-normal break-words w-full"
              >
                <span className="leading-tight">Request early access to</span>
                <span className="flex items-center">RoleColorAI</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  content: "The basic assessment is completely free! We also offer Premium reports ($124.99) with detailed insights and action plans, and Pro Deep Dive reports ($199.99) with comprehensive team-building recommendations."
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

      {/* Contact Us Section */}
      <section className="section-padding bg-background" aria-label="Contact Us">
        <div className="container-wide">
          <ContactCard
            title="Contact Us"
            description="Have a question about RoleColorFinder, team plans, or implementation? Send us a message and our team will respond within 1 business day."
            contactInfo={[
              {
                icon: MailIcon,
                label: "Email",
                value: "contact@rolecolorfinder.com",
              },
              {
                icon: PhoneIcon,
                label: "Phone",
                value: "+1 (510) 555-0178",
              },
            ]}
          >
            <form className="w-full space-y-4" onSubmit={handleContactSubmit}>
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={contactForm.email}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="+1 (___) ___-____"
                  value={contactForm.phone}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="How can we help?"
                  value={contactForm.message}
                  onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={contactSubmitting}>
                {contactSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </ContactCard>
        </div>
      </section>
    </div>;
};

export default Index;
