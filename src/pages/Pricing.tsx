import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Users, Building, UserCheck, Palette } from "lucide-react"
import { Link } from "react-router-dom"
import { Navbar } from "@/components/navigation/Navbar"
import { PaymentButton } from "@/components/payment/PaymentButton"

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
      price: "$14.25",
      originalPrice: "$19",
      priceNote: "one-time",
      target: "Complete Analysis",
      description: "Full 25-question assessment with detailed insights",
      features: [
        "🎃 25% Halloween Discount",
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
      price: "$36.75",
      originalPrice: "$49",
      priceNote: "one-time",
      target: "Master Analysis",
      description: "Ultimate 50-question assessment with comprehensive 3-page report",
      features: [
        "🎃 25% Halloween Discount",
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
      <div className="bg-gradient-hero text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 sm:mb-6">
            <Badge className="text-lg px-6 py-3 mb-4 bg-primary text-white animate-pulse">
              🎃 HALLOWEEN SPECIAL: 25% OFF ALL ASSESSMENTS!
            </Badge>
          </div>
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src="/lovable-uploads/role-color-finder-halloween.svg" 
              alt="RoleColor ™️ Finder - Halloween Edition 🎃" 
              className="h-12 sm:h-16 md:h-20 w-auto"
            />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8">
            Spooky Good Pricing 👻
          </p>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Don't let this Halloween deal haunt you - grab 25% off before it vanishes! 🕷️
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Individual Plans */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Choose Your Assessment Level</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {individualPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg sm:scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <plan.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.target}</CardDescription>
                  <div className="mt-4">
                    {plan.originalPrice && (
                      <div className="mb-2">
                        <span className="text-xl text-muted-foreground line-through">{plan.originalPrice}</span>
                        <Badge className="ml-2 bg-primary text-white">🎃 25% OFF</Badge>
                      </div>
                    )}
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.priceNote && <span className="text-muted-foreground ml-2">{plan.priceNote}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.name === "Free Assessment" ? (
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                      <Link to="/free-assessment">
                        {plan.cta}
                      </Link>
                    </Button>
                  ) : plan.name === "Premium Assessment" ? (
                    <PaymentButton 
                      productType="premium" 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </PaymentButton>
                  ) : plan.name === "Pro Deep Dive" ? (
                    <PaymentButton 
                      productType="pro" 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </PaymentButton>
                  ) : (
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                      <Link to="/pricing">
                        {plan.cta}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
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