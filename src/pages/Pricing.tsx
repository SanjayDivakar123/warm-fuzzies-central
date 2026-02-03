import { Button } from "@/components/ui/button"
import { Star, UserCheck, Palette, PlusIcon, ShieldCheckIcon, Check, Building2, Users, BarChart3, Zap, X } from "lucide-react"
import { Link } from "react-router-dom"
import { Navbar } from "@/components/navigation/Navbar"
import { Badge } from "@/components/ui/badge"
import { BorderTrail } from "@/components/ui/border-trail"
import { PaymentButton } from "@/components/payment/PaymentButton"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PlanCardProps {
  name: string
  price: string
  priceNote?: string
  target: string
  description: string
  features: string[]
  cta: string
  popular: boolean
  icon: React.ElementType
  ctaAction: "free" | "premium" | "pro"
}

function PlanCard({ name, price, priceNote, target, description, features, cta, popular, icon: Icon, ctaAction }: PlanCardProps) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-xl bg-muted/40 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:bg-muted/60 group cursor-pointer">
      <PlusIcon className="absolute -right-3 -top-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20" />
      <PlusIcon className="absolute -bottom-3 -left-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">{name}</p>
          {popular && (
            <Badge variant="secondary" className="rounded-full font-normal">
              Popular
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{target}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        
        <div className="mt-6">
          <div className="flex items-baseline gap-1">
            {price !== "Free" && <span className="text-muted-foreground">$</span>}
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {price === "Free" ? "Free" : price.replace("$", "")}
            </span>
            {priceNote && <span className="text-muted-foreground">/{priceNote}</span>}
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {ctaAction === "free" ? (
            <Button className="w-full rounded-full" variant={popular ? "default" : "outline"} asChild>
              <Link to="/free-assessment">{cta}</Link>
            </Button>
          ) : ctaAction === "premium" ? (
            <PaymentButton 
              productType="premium" 
              className="w-full rounded-full" 
              variant={popular ? "default" : "outline"}
            >
              {cta}
            </PaymentButton>
          ) : (
            <PaymentButton 
              productType="pro" 
              className="w-full rounded-full" 
              variant={popular ? "default" : "outline"}
            >
              {cta}
            </PaymentButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Pricing() {
  const individualPlans = [
    {
      name: "Free Assessment",
      price: "Free",
      target: "Quick Preview",
      description: "Get a taste of what we can do with a mini assessment",
      features: [
        "3-question mini quiz",
        "Basic color preview",
        "See sample insights",
        "Understand your potential"
      ],
      cta: "Try Free Preview",
      popular: false,
      icon: Palette,
      ctaAction: "free" as const
    },
    {
      name: "Premium Assessment",
      price: "$19",
      priceNote: "one-time",
      target: "Complete Analysis",
      description: "Full 25-question assessment with detailed insights",
      features: [
        "Complete 25-question quiz",
        "Full color profile analysis",
        "Role recommendations with salaries",
        "Leadership potential assessment",
        "Downloadable PDF report"
      ],
      cta: "Get Premium Assessment",
      popular: true,
      icon: Star,
      ctaAction: "premium" as const
    },
    {
      name: "Pro Deep Dive",
      price: "$49",
      priceNote: "one-time",
      target: "Master Analysis",
      description: "Ultimate 50-question assessment with comprehensive 3-page report",
      features: [
        "Extended 50-question deep assessment",
        "Advanced color blending analysis",
        "3-page comprehensive report",
        "Career transition roadmap",
        "Leadership development plan",
        "Interview strategy guide"
      ],
      cta: "Get Pro Analysis",
      popular: false,
      icon: UserCheck,
      ctaAction: "pro" as const
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Header */}
      <div className="bg-gradient-hero py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="sr-only">Pricing Plans - Role Color Finder</h1>
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" 
              alt="RoleColor™ Finder" 
              width="300" 
              height="60"
              className="h-12 sm:h-16 md:h-20 w-auto"
            />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground mb-6 sm:mb-8">
            Pricing Plans
          </p>
          <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Choose the perfect plan for your needs - from individual discovery to enterprise solutions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Individual Plans */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Choose Your Assessment Level
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              We offer tiered pricing based on the depth of analysis you need. All assessments are one-time purchases with lifetime access to your results.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <BorderTrail
              className={cn(
                'bg-gradient-to-l from-primary via-primary/80 to-primary/20'
              )}
              size={80}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: 'linear',
              }}
            />
            <div className="flex flex-col lg:flex-row gap-4">
              {individualPlans.map((plan) => (
                <PlanCard
                  key={plan.name}
                  {...plan}
                />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="size-4" />
              All features included with no hidden fees
            </div>
          </div>
        </div>

        {/* For Teams Section */}
        <div id="for-teams" className="mb-12 sm:mb-16 scroll-mt-24">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">For Teams</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Empower Your Entire Organization
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Unlock team dynamics, improve collaboration, and build high-performing teams with our B2B platform.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <BorderTrail
              className={cn(
                'bg-gradient-to-l from-secondary via-secondary/80 to-secondary/20'
              )}
              size={80}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: 'linear',
              }}
            />
            <div className="bg-muted/40 rounded-xl p-8 relative overflow-hidden">
              <PlusIcon className="absolute -right-3 -top-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20" />
              <PlusIcon className="absolute -bottom-3 -left-3 size-24 rotate-12 stroke-[0.5] text-muted-foreground/20" />
              
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left side - Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-6 h-6 text-primary" />
                      <h3 className="text-2xl font-bold text-foreground">RoleColor™ for Teams</h3>
                    </div>
                    
                    <p className="text-muted-foreground mb-6">
                      Get your own branded subdomain with full admin controls, team analytics, and AI-powered work assignment tools.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Team Assessments</p>
                          <p className="text-sm text-muted-foreground">Invite employees via email or Google SSO</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Team Analytics</p>
                          <p className="text-sm text-muted-foreground">Color distribution & team insights</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">AI Work Assignment</p>
                          <p className="text-sm text-muted-foreground">Match tasks to team members' strengths</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Palette className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Custom Branding</p>
                          <p className="text-sm text-muted-foreground">Your logo, colors, and subdomain</p>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {[
                        "Private company portal with custom branding",
                        "Admin dashboard with full user management",
                        "25 or 50 question assessments per employee",
                        "Team color distribution analytics",
                        "AI-powered work assignment matrix",
                        "Bulk import & Google Workspace sync",
                        "Email customization & scheduled reminders"
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right side - Pricing */}
                  <div className="lg:w-72 flex flex-col justify-center">
                    <div className="bg-background/50 rounded-lg p-6 text-center border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-2">Starting at</p>
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-muted-foreground">$</span>
                        <span className="text-5xl font-bold tracking-tight text-foreground">20</span>
                        <span className="text-muted-foreground">/user/month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-6">billed monthly</p>
                      
                      <Button className="w-full rounded-full mb-3" asChild>
                        <Link to="/b2b">Get Started</Link>
                      </Button>
                      <Button variant="outline" className="w-full rounded-full" asChild>
                        <Link to="/contact">Contact Sales</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="size-4" />
              Volume discounts available for 50+ seats
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-2">Compare Plans</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Individual vs Teams
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              See which option is right for you
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Feature</TableHead>
                  <TableHead className="text-center">Free</TableHead>
                  <TableHead className="text-center">Premium ($19)</TableHead>
                  <TableHead className="text-center">Pro ($49)</TableHead>
                  <TableHead className="text-center">Teams ($20/user/mo)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Questions</TableCell>
                  <TableCell className="text-center">3</TableCell>
                  <TableCell className="text-center">25</TableCell>
                  <TableCell className="text-center">50</TableCell>
                  <TableCell className="text-center">25 or 50</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Color Profile Analysis</TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Role Recommendations</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">PDF Report</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center">1 page</TableCell>
                  <TableCell className="text-center">3 pages</TableCell>
                  <TableCell className="text-center">Full report</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Leadership Assessment</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Career Roadmap</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Team Analytics</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">AI Work Assignment</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Custom Branding</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Admin Dashboard</TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><X className="w-4 h-4 text-muted-foreground mx-auto" /></TableCell>
                  <TableCell className="text-center"><Check className="w-4 h-4 text-primary mx-auto" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Billing Type</TableCell>
                  <TableCell className="text-center text-muted-foreground">—</TableCell>
                  <TableCell className="text-center">One-time</TableCell>
                  <TableCell className="text-center">One-time</TableCell>
                  <TableCell className="text-center">Monthly</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Testimonial Section */}
        <div className="mb-12 sm:mb-16">
          <div className="max-w-3xl mx-auto">
            <div className="bg-muted/50 border border-primary/20 rounded-lg p-6">
              <div className="flex gap-1 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-lg text-center mb-4 italic">
                "RoleColorFinder helped me discover my ideal career path"
              </p>
              <p className="text-center text-muted-foreground font-medium">
                — Amit Suthar
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-muted rounded-lg p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Discover Your Leadership Color?</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Start with our free 3-question preview or dive deep with our comprehensive assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/free-assessment">Start Free Preview</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}