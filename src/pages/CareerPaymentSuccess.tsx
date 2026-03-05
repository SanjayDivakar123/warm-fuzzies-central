import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Briefcase, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/navigation/Navbar";

const CareerPaymentSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (user) {
      // Store career access in localStorage
      const careerAccessKey = `career_access_${user.id}`;
      const careerAccess = {
        verified: true,
        timestamp: new Date().toISOString(),
        userId: user.id
      };
      localStorage.setItem(careerAccessKey, JSON.stringify(careerAccess));
      
      // Fire Google Ads conversion tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17863629259/VC_nCNu61uAbEMuzhcZC',
          'transaction_id': `${user.id}_career_${Date.now()}`
        });
        console.log('Google Ads conversion tracked for career purchase');
      }
      
      setIsVerifying(false);
    }
  }, [user]);

  const handleViewResults = () => {
    navigate('/career-finder/results');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to access your career report.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => navigate('/career-finder')}>
                  Back to Career Finder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Verifying your purchase...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              🎉 Payment Successful!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Your Career Report is now unlocked and ready to view!
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 text-sm mb-2">
                ✅ What's Included:
              </h4>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• Top 8 careers matched to your RoleColor</li>
                <li>• Salary ranges and fit percentages</li>
                <li>• Key skills breakdown for each career</li>
                <li>• Ideal work environment insights</li>
                <li>• Career action steps and recommendations</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleViewResults}
                className="w-full"
                size="lg"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                View Your Career Matches
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CareerPaymentSuccess;
