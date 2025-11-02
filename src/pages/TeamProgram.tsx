import { useState } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { CheckCircle, Users, Target, FileText, Calendar, DollarSign } from "lucide-react";
const TeamProgram = () => {
  const [employeeCount, setEmployeeCount] = useState([100]);
  const calculatePrice = (count: number) => {
    // Per-employee pricing model
    if (count <= 20) {
      return count * 1000; // $1,000 per employee for up to 20
    } else {
      return count * 700; // $700 per employee for 21+
    }
  };
  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };
  const price = calculatePrice(employeeCount[0]);
  
  const handleSliderChange = (value: number[]) => {
    setEmployeeCount(value);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const clampedValue = Math.max(1, Math.min(100000, value));
    setEmployeeCount([clampedValue]);
  };
  
  const getSliderStep = (value: number) => {
    if (value <= 100) return 1;
    if (value <= 1000) return 5;
    if (value <= 10000) return 50;
    return 100;
  };
  const deliverables = ["12-week facilitated leadership experience", "Team analytics + group RoleColor heatmaps", "Custom onboarding & progress dashboards", "Access to RoleColorAI for adaptability tracking", "Option to certify internal facilitators", "Full assessments for all team members", "Live interactive workshops", "Leadership development tracking"];
  const timeline = [{
    weeks: "Weeks 1–2",
    activity: "Discovery & org mapping"
  }, {
    weeks: "Weeks 3–4",
    activity: "Capability inventory & gap analysis"
  }, {
    weeks: "Weeks 5–6",
    activity: "Future org blueprint"
  }, {
    weeks: "Weeks 7–8",
    activity: "Role blueprint + scorecard"
  }, {
    weeks: "Weeks 9–10",
    activity: "Job listing + interview kit + sourcing plan"
  }, {
    weeks: "Weeks 11–12",
    activity: "Executive readout & rollout plan"
  }];
  const faqs = [{
    question: "How is pricing calculated?",
    answer: "Simple per-employee pricing: $1,000 per employee for teams up to 20, and $700 per employee for teams of 21 or more."
  }, {
    question: "What's the typical outcome?",
    answer: "Teams gain shared language around adaptability, improved collaboration, and measurable leadership development across all members."
  }];
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <Badge variant="secondary" className="mb-4 text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            12-Week Program
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
            12-Week Leadership Alignment Program
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-3 sm:mb-4">
            Built for full-team cultural transformation.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Used by schools, nonprofits, and enterprise teams to hardwire adaptability.
          </p>
        </div>

        {/* Pricing Section */}
        <Card className="mb-8 sm:mb-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Select your organization size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8">
            <div>
              <label className="text-sm font-medium mb-3 sm:mb-4 block">Team size (number of employees):</label>
              
              {/* Input field for direct number entry */}
              <div className="mb-4 sm:mb-6">
                <Input
                  type="number"
                  min="1"
                  max="100000"
                  value={employeeCount[0]}
                  onChange={handleInputChange}
                  className="w-full text-center text-base sm:text-lg font-medium py-3"
                  placeholder="Enter team size"
                />
              </div>
              
              {/* Larger slider */}
              <div className="px-2 sm:px-4">
                <Slider 
                  value={employeeCount} 
                  onValueChange={handleSliderChange} 
                  max={100000} 
                  min={1}
                  step={getSliderStep(employeeCount[0])} 
                  className="w-full h-4 sm:h-6" 
                />
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3">
                  <span>1</span>
                  <span>100,000</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-base sm:text-lg mb-2">You selected: <strong>{employeeCount[0].toLocaleString()} employees</strong></p>
              <p className="text-sm text-muted-foreground mb-1">
                Price per employee: <strong>${employeeCount[0] <= 20 ? '1,000' : '700'}</strong>
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-4">
                Total investment: {formatPrice(price)}
              </div>
            </div>

            
          </CardContent>
        </Card>

        {/* What You Get Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              What's included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {deliverables.map((item, index) => <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item}</span>
                </div>)}
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {timeline.map((item, index) => <Card key={index} className="border border-muted">
                  <CardContent className="pt-3 sm:pt-4">
                    <div className="font-semibold text-primary mb-1 sm:mb-2 text-sm sm:text-base">{item.weeks}</div>
                    <div className="text-xs sm:text-sm">{item.activity}</div>
                  </CardContent>
                </Card>)}
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
              {faqs.map((faq, index) => <div key={index}>
                  <h4 className="font-semibold mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button variant="default" size="lg" className="px-8" asChild>
              <a 
                href="https://app.reclaim.ai/m/sanjayd/12-week-fit-call" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Book a 20-min Fit Call
              </a>
            </Button>
            <Button variant="outline" size="lg" className="px-8" asChild>
              <a href={`mailto:sanjay@rolecolorfinder.com?subject=12-Week Leadership Alignment Program Inquiry&body=Hi Sanjay,%0D%0A%0D%0AI'm interested in the 12-Week Leadership Alignment Program.%0D%0A%0D%0AOrganization Details:%0D%0A- Number of employees: ${employeeCount[0].toLocaleString()}%0D%0A- Price per employee: $${employeeCount[0] <= 20 ? '1,000' : '700'}%0D%0A- Total investment: ${formatPrice(price)}%0D%0A%0D%0AI'd like to discuss how this program can transform our team's leadership and adaptability.%0D%0A%0D%0APlease let me know your availability for a consultation.%0D%0A%0D%0ABest regards`}>
                Contact Sanjay to Get Started
              </a>
            </Button>
          </div>
          
          {/* Brochure Download */}
          <div className="mt-4">
            <Button variant="outline" size="sm" className="px-6" asChild>
              <a 
                href="https://static.wixstatic.com/ugd/9b68f8_417b1cdded3c4bef94e31bea9343cf47.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Download: Why Every Team Needs 
                <img 
                  src="/lovable-uploads/2842bc15-73da-4523-b9c9-228cb076346e.png" 
                  alt="RoleColor ™️ Finder" 
                  className="h-4 w-auto inline"
                />
              </a>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Ready to transform your hiring process? This will open a pre-drafted email with your organization details.
          </p>
        </div>
      </main>
    </div>;
};
export default TeamProgram;