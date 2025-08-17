import { useState } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Target, FileText, Calendar, DollarSign } from "lucide-react";

const TeamProgram = () => {
  const [employeeCount, setEmployeeCount] = useState([1000]);

  const calculatePrice = (count: number) => {
    if (count <= 5000) {
      // Scale from $20,000 (for 5 employees) to $100,000 (for 5,000 employees)
      const basePrice = 20000;
      const maxPrice = 100000;
      const scaleFactor = (count - 5) / (5000 - 5);
      return Math.round(basePrice + (maxPrice - basePrice) * scaleFactor);
    } else {
      // For organizations larger than 5,000, continue scaling
      // Add $10,000 for every additional 1,000 employees
      const basePrice = 100000;
      const additionalEmployees = count - 5000;
      const additionalCost = Math.round((additionalEmployees / 1000) * 10000);
      return basePrice + additionalCost;
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const price = calculatePrice(employeeCount[0]);

  const deliverables = [
    "Team Capability Map (skills, behaviors, leadership strengths)",
    "Gap Analysis (what's missing; impact & priority)",
    "Future Org Blueprint (how the team should be structured)",
    "Role Design Package for each critical gap",
    "Role Blueprint (purpose, scope, KPIs, reporting lines)",
    "Hiring Scorecard (competencies, evidence signals, red flags)",
    "Structured Interview Kit (questions + rubrics)",
    "Publish-ready Job Listing (inclusive, ATS-optimized)",
    "30-60-90 Onboarding Plan"
  ];

  const timeline = [
    { weeks: "Weeks 1–2", activity: "Discovery & org mapping" },
    { weeks: "Weeks 3–4", activity: "Capability inventory & gap analysis" },
    { weeks: "Weeks 5–6", activity: "Future org blueprint" },
    { weeks: "Weeks 7–8", activity: "Role blueprint + scorecard" },
    { weeks: "Weeks 9–10", activity: "Job listing + interview kit + sourcing plan" },
    { weeks: "Weeks 11–12", activity: "Executive readout & rollout plan" }
  ];

  const faqs = [
    {
      question: "How is pricing calculated?",
      answer: "Pricing scales with organization size. Smaller teams start at $20,000, reaching $100,000 at 5,000 employees, then continuing to scale for larger organizations."
    },
    {
      question: "What's the typical outcome?",
      answer: "A clear view of current capabilities, agreed gaps, and ready-to-hire role(s) with everything your hiring team needs."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            12-Week Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Team Composition & Role Design Program
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Find the gaps. Design the roles. Hire with confidence.
          </p>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            We map your team's capabilities, identify missing roles, and deliver a ready-to-hire package 
            (role blueprint, hiring scorecard, interview kit, and a 30-60-90 onboarding plan).
          </p>
        </div>

        {/* Pricing Section */}
        <Card className="mb-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select your organization size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-4 block">Number of employees:</label>
              <Slider
                value={employeeCount}
                onValueChange={setEmployeeCount}
                max={100000}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>5</span>
                <span>100,000</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-lg mb-2">You selected: <strong>{employeeCount[0].toLocaleString()} employees</strong></p>
              <div className="text-3xl font-bold text-primary mb-4">
                Your custom price: {formatPrice(price)}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Pricing Guide:</h4>
              <ul className="text-sm space-y-1">
                <li>• 5-5,000 employees: $20,000-$100,000</li>
                <li>• 5,000+ employees: $100,000+ (scales with size)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                The exact price updates automatically as you move the slider.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What You Get Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              What you get in 12 weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {deliverables.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeline.map((item, index) => (
                <Card key={index} className="border border-muted">
                  <CardContent className="pt-4">
                    <div className="font-semibold text-primary mb-2">{item.weeks}</div>
                    <div className="text-sm">{item.activity}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Options Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Split Payment</h4>
                <p className="text-sm text-muted-foreground">50% at signing, 50% at Week 12 readout</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Upfront Payment</h4>
                <p className="text-sm text-muted-foreground">100% upfront (2% discount)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQs Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>FAQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Button size="lg" className="px-8">
            Get Started with Your Team Assessment
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Ready to transform your hiring process? Let's begin.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TeamProgram;