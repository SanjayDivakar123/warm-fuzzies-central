import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Users, Target, Lightbulb, Zap, Brain, Heart, Settings, CreditCard, CheckCircle, TrendingUp, User } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-image.jpg";
import professionalTeamImage from "@/assets/professional-team.jpg";
const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Sign Up Bar */}
      
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-4 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(var(--primary)/0.1)_0%,_transparent_50%),_radial-gradient(circle_at_70%_80%,_hsl(var(--secondary)/0.1)_0%,_transparent_50%)]"></div>
        
        {/* Animated floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-yellow/20 to-red/20 rounded-full blur-xl animate-[bounce_3s_ease-in-out_infinite] opacity-60"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue/20 to-green/20 rounded-full blur-xl animate-[bounce_4s_ease-in-out_infinite] opacity-60" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-red/20 to-yellow/20 rounded-full blur-xl animate-[bounce_5s_ease-in-out_infinite] opacity-60" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue/10 to-green/10 px-4 py-2 rounded-full border border-blue/20 hover:border-blue/40 transition-all duration-300 hover:scale-105">
                <span className="text-2xl animate-[spin_3s_ease-in-out_infinite]">🎨</span>
                <span className="text-primary text-sm font-semibold tracking-wide">Role Color Finder</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
                <span className="block animate-[slideInLeft_0.8s_ease-out]">Discover Your</span>
                <br />
                <span className="bg-gradient-colorful bg-clip-text text-transparent animate-[slideInRight_0.8s_ease-out] inline-block" style={{ animationDelay: '0.3s' }}>Leadership Color</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s' }}>
                Leadership isn't one‑size‑fits‑all. Our fast, free quiz reveals how your natural style can 
                <span className="text-foreground font-medium hover:text-primary transition-colors duration-300"> adapt and thrive</span> at every stage of a team's journey.
              </p>

              {/* Enhanced Social Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-4 bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg animate-scale-in" style={{ animationDelay: '0.9s' }}>
                <div className="flex -space-x-3">
                  {[
                    'from-red to-yellow',
                    'from-green to-blue', 
                    'from-yellow to-green',
                    'from-blue to-red'
                  ].map((gradient, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-r ${gradient} border-3 border-background shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer`} 
                         style={{ animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-yellow text-lg">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm font-semibold text-foreground">4.8/5</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Finally, a quiz that doesn't put me in a box!" • 3 min quiz
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '1.2s' }}>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="text-lg px-10 py-6 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group" 
                  onClick={() => navigate('/free-assessment')}
                >
                  <span className="group-hover:animate-pulse">Start Your Free Assessment</span>
                  <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse group-hover:animate-bounce"></div>
                </Button>
                {user && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6 hover:scale-105 transition-all duration-300 border-2 hover:border-primary hover:text-primary" 
                    style={{ animationDelay: '0.1s' }}
                    onClick={() => navigate('/premium-results')}
                  >
                    View My Results
                  </Button>
                )}
              </div>
            </div>

            {/* Right Visual - Enhanced */}
            <div className="relative max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="relative group">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-pulse"></div>
                
                {/* Floating particles */}
                <div className="absolute -top-4 -left-4 w-3 h-3 bg-yellow rounded-full animate-[bounce_2s_ease-in-out_infinite] opacity-60"></div>
                <div className="absolute -top-2 right-8 w-2 h-2 bg-red rounded-full animate-[bounce_3s_ease-in-out_infinite] opacity-60" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-4 -left-2 w-4 h-4 bg-green rounded-full animate-[bounce_4s_ease-in-out_infinite] opacity-60" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-2 right-4 w-3 h-3 bg-blue rounded-full animate-[bounce_2.5s_ease-in-out_infinite] opacity-60" style={{ animationDelay: '1.5s' }}></div>
                
                {/* Main card */}
                <div className="bg-card rounded-2xl border border-border p-8 shadow-lg hover:shadow-xl transition-all duration-500 group-hover:scale-105 relative overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="text-center space-y-6 relative z-10">
                    {/* Logo */}
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto border border-border/50 hover:border-primary/50 transition-all duration-300 group-hover:rotate-3">
                        <img 
                          src="/lovable-uploads/2938b86e-e795-4587-9359-51f4b94c106a.png" 
                          alt="Role Color Finder"
                          className="w-16 h-auto transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      
                      {/* Orbiting color dots */}
                      <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-red to-yellow rounded-full shadow-lg"></div>
                        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-yellow to-green rounded-full shadow-lg"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-gradient-to-r from-green to-blue rounded-full shadow-lg"></div>
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-blue to-red rounded-full shadow-lg"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Discover Your Colors</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Take our assessment to reveal your unique color profile and unlock your leadership potential
                      </p>
                    </div>

                    {/* Animated indicator */}
                    <div className="flex justify-center gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse hover:bg-primary transition-colors duration-300" 
                             style={{ animationDelay: `${i * 0.2}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy Section */}
      <section className="py-24 px-4 bg-background relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_hsl(var(--blue))_0%,_transparent_50%),_radial-gradient(circle_at_70%_80%,_hsl(var(--green))_0%,_transparent_50%)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 rounded-full border border-primary/20 mb-8">
              <span className="text-sm font-semibold text-primary tracking-wide">OUR PHILOSOPHY</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8 leading-tight">
              Great teams don't just happen.
              <br />
              <span className="bg-gradient-colorful bg-clip-text text-transparent">They grow through stages.</span>
            </h2>
            
            <div className="max-w-5xl mx-auto">
              <blockquote className="text-2xl md:text-3xl font-light text-muted-foreground mb-6 leading-relaxed italic">
                "Leadership isn't a fixed identity. It's adapting your strengths to what a team needs at each stage."
              </blockquote>
              <cite className="text-primary font-medium">— Bruce Tuckman, developer of the team development model</cite>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 shadow-elegant">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Contextual Leadership</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We believe in <strong className="text-foreground">Contextual Leadership</strong> — the understanding that leadership isn't a fixed identity. It's adapting your strengths to what a team needs at each stage.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/10">
                  <p className="text-lg text-foreground leading-relaxed">
                    Our tool reveals your unique color profile and shows you how to flex your leadership style across different team stages, contexts, and challenges — because 
                    <strong className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> effective leaders adapt, they don't impose.</strong>
                  </p>
                </div>
              </div>
              
              <div className="relative">
                <img 
                  src={professionalTeamImage} 
                  alt="Professional team collaboration" 
                  className="rounded-2xl shadow-elegant w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* How Our Idea Works */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-foreground mb-8">
              Here's how our <span className="bg-gradient-to-r from-red to-yellow bg-clip-text text-transparent">patent pending</span> idea works:
            </h3>
            
            <div className="text-center mb-8">
              <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/40">
                🔬 Patent Pending System
              </Badge>
            </div>
            
            <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant mb-12">
              <p className="text-lg text-foreground mb-8 leading-relaxed">
                Every user takes a 25-question diagnostic designed around real group psychology, especially Tuckman's Five Stages of Team Development:
              </p>
              
              <div className="grid md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-red rounded-full flex items-center justify-center mx-auto mb-3 shadow-colorful">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Forming</h4>
                  <p className="text-sm text-muted-foreground">Building connection</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-yellow rounded-full flex items-center justify-center mx-auto mb-3 shadow-colorful">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Storming</h4>
                  <p className="text-sm text-muted-foreground">Navigating friction</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-green rounded-full flex items-center justify-center mx-auto mb-3 shadow-colorful">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Norming</h4>
                  <p className="text-sm text-muted-foreground">Establishing flow</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-blue rounded-full flex items-center justify-center mx-auto mb-3 shadow-colorful">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Performing</h4>
                  <p className="text-sm text-muted-foreground">Reaching peak productivity</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-brand rounded-full flex items-center justify-center mx-auto mb-3 shadow-colorful">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-foreground mb-2">Adjourning</h4>
                  <p className="text-sm text-muted-foreground">Ending with clarity and reflection</p>
                </div>
              </div>

              <p className="text-lg text-foreground mt-8 text-center leading-relaxed">
                At each of these stages, teams need different kinds of leadership.<br />
                Sometimes they need decisive action. Sometimes they need creative vision. Sometimes they need systematic planning.<br />
                <strong>Contextual Leadership means knowing when to lead, when to support, and how to adapt your style to what the team needs.</strong>
              </p>
            </div>
          </div>

          {/* Color Roles */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-foreground mb-8">
              Our algorithm translates your answers into one of four <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">Color Roles</span>:
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-yellow/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="w-12 h-12 bg-gradient-yellow rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-yellow-600 mb-2 group-hover:text-yellow-500 transition-colors duration-300">Yellow</h4>
                <p className="text-sm text-muted-foreground">Action-first executors (founders, builders, PMs)</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-red/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="w-12 h-12 bg-gradient-red rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-red-600 mb-2 group-hover:text-red-500 transition-colors duration-300">Red</h4>
                <p className="text-sm text-muted-foreground">Vision-driven motivators (speakers, creatives, brand builders)</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-green/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="w-12 h-12 bg-gradient-green rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-green-600 mb-2 group-hover:text-green-500 transition-colors duration-300">Green</h4>
                <p className="text-sm text-muted-foreground">Logic-based architects (analysts, engineers, operators)</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border text-center hover:border-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                <div className="w-12 h-12 bg-gradient-blue rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-blue-600 mb-2 group-hover:text-blue-500 transition-colors duration-300">Blue</h4>
                <p className="text-sm text-muted-foreground">People-first supporters (coaches, HR, community builders)</p>
              </div>
            </div>
          </div>

          {/* What Role Color Finder Reveals */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border mb-16">
            <h3 className="text-2xl font-bold text-center text-foreground mb-8">
              But more than just a "you are this" label, Role Color Finder also reveals:
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-foreground font-medium">How to adapt your leadership style contextually</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-foreground font-medium">Which roles match your natural wiring</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-foreground font-medium">When to lead vs. when to support in team stages</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-muted-foreground rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-foreground font-medium">Where you'll likely struggle and grow</p>
              </div>
            </div>
          </div>

          {/* Final Message */}
          <div className="text-center">
            <p className="text-lg text-foreground mb-6 leading-relaxed">
              We created this to help you master <strong>Contextual Leadership</strong> — knowing how to adapt your natural strengths to what teams need at different stages and situations.
            </p>
            <div className="bg-card rounded-xl p-6 border border-border inline-block">
              <p className="text-xl font-bold text-foreground mb-2">Because leadership isn't a fixed identity.</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">It's adapting your strengths to what a team needs at each stage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalization & Color Details Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              <span className="bg-gradient-to-r from-red to-yellow bg-clip-text text-transparent">Personalized</span> Just for You
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We DON'T USE AI AT ALL. Our assessment uses proven psychological frameworks to create your customized profile based on established personality science.
            </p>
          </div>

          {/* How We Personalize */}
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground mb-6">How Your Results Are Tailored</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-red rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Human Psychology Analysis</h4>
                    <p className="text-muted-foreground text-sm">We analyze patterns based on established psychological research, not AI algorithms</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Context-Aware Insights</h4>
                    <p className="text-muted-foreground text-sm">Results consider your industry, experience level, and career stage</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-green rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Dynamic Recommendations</h4>
                    <p className="text-muted-foreground text-sm">Career paths and growth strategies adapt to your unique color blend</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
              <h4 className="text-xl font-bold text-foreground mb-4 text-center">What You'll Receive</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Personal color intensity scores (0-100)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Custom archetype combination analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Industry-specific role recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Leadership style breakdown</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Communication preferences guide</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Stress triggers & management tips</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Color Explanations */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-foreground mb-12">
              <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">Understanding</span> Your Colors
            </h3>
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Red - Expressive */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-red rounded-2xl flex items-center justify-center shadow-colorful shadow-red/30">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Red - The Expressive</h4>
                    <p className="text-muted-foreground font-medium">Humorous • Fun • Highly Extroverted</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Core Strengths:</h5>
                    <p className="text-sm text-muted-foreground">Natural entertainers and people-pleasers who bring energy and joy to any environment. Excel at building rapport, lightening moods, and making work enjoyable. Highly charismatic but struggle with serious matters.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Ideal Roles:</h5>
                    <p className="text-sm text-muted-foreground">Entertainment Host, Sales Representative, Event Coordinator, Social Media Manager, Public Relations Specialist, Team Morale Coordinator</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Growth Areas:</h5>
                    <p className="text-sm text-muted-foreground">Taking serious matters seriously, attention to detail, following through on commitments, professional boundaries</p>
                  </div>
                </div>
              </div>

              {/* Blue - Analytical */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-blue rounded-2xl flex items-center justify-center shadow-colorful shadow-blue/30">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Blue - The Amiable</h4>
                    <p className="text-muted-foreground font-medium">Kind • Extroverted • People-focused</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Core Strengths:</h5>
                    <p className="text-sm text-muted-foreground">Natural people-pleasers who excel at building relationships and creating positive environments. Highly empathetic leaders who motivate through kindness and genuine care for others.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Ideal Roles:</h5>
                    <p className="text-sm text-muted-foreground">Team Leader, Human Resources Director, Customer Relations Manager, Social Coordinator, Mentor, Community Manager</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Growth Areas:</h5>
                    <p className="text-sm text-muted-foreground">Setting firm boundaries, making tough decisions, managing conflict, assertiveness training</p>
                  </div>
                </div>
              </div>

              {/* Yellow - CEO */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-yellow rounded-2xl flex items-center justify-center shadow-colorful shadow-yellow/30">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Yellow - The CEO</h4>
                    <p className="text-muted-foreground font-medium">Result-oriented • Perfect • Visionary Leader</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Core Strengths:</h5>
                    <p className="text-sm text-muted-foreground">Natural communicators with infectious enthusiasm. Excel at inspiring others and building relationships. Highly creative with strong presentation and persuasion skills.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Ideal Roles:</h5>
                    <p className="text-sm text-muted-foreground">Marketing Director, Public Speaker, Creative Director, Sales Leader, Event Manager, Brand Ambassador</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Growth Areas:</h5>
                    <p className="text-sm text-muted-foreground">Follow-through on details, time management, listening skills, handling criticism constructively</p>
                  </div>
                </div>
              </div>

              {/* Green - Amiable */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-green rounded-2xl flex items-center justify-center shadow-colorful shadow-green/30">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">Green - The Analytical</h4>
                    <p className="text-muted-foreground font-medium">Nerdy • Introverted • Detail-oriented</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Core Strengths:</h5>
                    <p className="text-sm text-muted-foreground">Deep thinkers who excel in complex problem-solving and technical expertise. Prefer working independently or in small teams. Highly focused on accuracy and logical analysis over social interactions.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Ideal Roles:</h5>
                    <p className="text-sm text-muted-foreground">Software Developer, Research Scientist, Data Analyst, Technical Writer, Engineer, Laboratory Specialist</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground mb-2">Growth Areas:</h5>
                    <p className="text-sm text-muted-foreground">Interpersonal communication, presentation skills, networking, team collaboration, leadership development</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combination Insight */}
          <div className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border">
            <h4 className="text-2xl font-bold text-foreground mb-4">Most People Are a Unique Blend</h4>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              While everyone has dominant colors, your secondary and tertiary colors create your unique professional signature. 
              Our assessment reveals how your specific color combination influences your leadership style, communication preferences, 
              and ideal work environment.
            </p>
          </div>
        </div>
      </section>

      {/* Competitive Advantage Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              <span className="bg-gradient-to-r from-green to-blue bg-clip-text text-transparent">Why</span> We're the Leader
            </h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              While others offer generic personality tests, we deliver career-focused insights that professionals actually use to advance their careers.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-colorful">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">Our proprietary AI analyzes response patterns, timing, and consistency to create deeper insights than traditional scoring methods.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elegant">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Career-Specific Mapping</h3>
              <p className="text-muted-foreground">Unlike generic tests, we map your colors to specific roles, industries, and career paths with real job market data.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow bg-slate-950">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Actionable Insights</h3>
              <p className="text-muted-foreground">Get specific strategies for interviews, networking, leadership development, and career transitions based on your unique profile.</p>
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-elegant">
            <h3 className="text-2xl font-bold text-center text-foreground mb-8">How We Compare</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-bold text-muted-foreground mb-4">Other Assessments</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Generic personality types</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Basic scoring systems</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <span className="text-sm text-muted-foreground">One-size-fits-all results</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Academic focus only</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-bold text-accent mb-4">Role Color Finder</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground font-medium">Career-focused color profiles</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground font-medium">AI-powered pattern analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground font-medium">Personalized to your industry</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-sm text-foreground font-medium">Practical career strategies</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to begin your journey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover your true colors and unlock your career potential with our comprehensive assessment.
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 font-bold shadow-elegant hover-scale" onClick={() => navigate('/free-assessment')}>
            🎨 Start Free Assessment
          </Button>
          <div className="mt-4 text-white/80 text-sm font-medium">
            Takes only 2 minutes • Get instant preview results
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <img 
                  src="/lovable-uploads/fe97ed85-5d66-4caf-bd60-b8463d40052f.png" 
                  alt="Role Color Finder" 
                  className="h-8 mb-2"
                />
                <p className="text-sm opacity-80">Discover your leadership style with science-backed insights</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm opacity-80">© 2025 RoleColorFinder</p>
                <p className="text-xs opacity-60 mt-1">
                  All rights reserved
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;