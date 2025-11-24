import { Button } from "@/components/ui/button"
import { Star, UserCheck, Palette } from "lucide-react"
import { Link } from "react-router-dom"
import { Navbar } from "@/components/navigation/Navbar"
import { LuminousPricingCard } from "@/components/pricing/LuminousPricingCard"
import "@/components/pricing/luminous-card.css"

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
      icon: Palette
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
      icon: Star
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
      icon: UserCheck
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
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Choose Your Assessment Level</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {individualPlans.map((plan) => (
              <LuminousPricingCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                priceNote={plan.priceNote}
                target={plan.target}
                description={plan.description}
                features={plan.features}
                cta={plan.cta}
                popular={plan.popular}
                icon={plan.icon}
                ctaAction={
                  plan.name === "Free Assessment" ? "free" :
                  plan.name === "Premium Assessment" ? "premium" :
                  plan.name === "Pro Deep Dive" ? "pro" :
                  undefined
                }
              />
            ))}
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