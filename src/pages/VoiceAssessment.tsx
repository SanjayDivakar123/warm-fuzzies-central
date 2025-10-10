import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navigation/Navbar";
import { Phone, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const VoiceAssessment = () => {
  const navigate = useNavigate();
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const { toast } = useToast();

  const handleLookupResults = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lookupPhone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to lookup results.",
        variant: "destructive",
      });
      return;
    }

    setLookupLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("voice_assessments")
        .select("*")
        .eq("phone_number", lookupPhone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "No Assessment Found",
          description: "We couldn't find any assessments for this phone number. Make sure you've completed the call.",
          variant: "destructive",
        });
        return;
      }

      // Show status info
      if (data.status === 'initiated') {
        // Attempt to finalize via edge function in case webhook missed
        try {
          await supabase.functions.invoke('voiceAssessment', {
            body: { completed: true, phone_number: lookupPhone },
          });
          const { data: refreshed } = await supabase
            .from("voice_assessments")
            .select("*")
            .eq("phone_number", lookupPhone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (refreshed?.status === 'complete') {
            navigate(`/voice-results?phone=${encodeURIComponent(lookupPhone)}`);
            return;
          }
        } catch (err) {
          console.error("Finalize via function failed", err);
        }

        toast({
          title: "Assessment In Progress",
          description: "Your call was initiated but not completed. Please finish the assessment by calling again.",
          variant: "destructive",
        });
        return;
      }

      if (data.status === 'in_progress') {
        // Attempt to finalize via edge function in case webhook missed
        try {
          await supabase.functions.invoke('voiceAssessment', {
            body: { completed: true, phone_number: lookupPhone },
          });
          const { data: refreshed } = await supabase
            .from("voice_assessments")
            .select("*")
            .eq("phone_number", lookupPhone)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (refreshed?.status === 'complete') {
            navigate(`/voice-results?phone=${encodeURIComponent(lookupPhone)}`);
            return;
          }
        } catch (err) {
          console.error("Finalize via function failed", err);
        }

        toast({
          title: "Assessment In Progress",
          description: `You've answered some questions. Call back to finish! (${data.score_yellow + data.score_red + data.score_green + data.score_blue}/25 answered)`,
        });
        return;
      }

      navigate(`/voice-results?phone=${encodeURIComponent(lookupPhone)}`);
    } catch (error: any) {
      console.error("Error looking up results:", error);
      toast({
        title: "Error",
        description: "Failed to lookup results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-full mb-4 shadow-glow">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Take Our 25Q Test For Free!
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover your RoleColor leadership type with our voice assessment
            </p>
          </div>

          {/* Call Instructions Card */}
          <Card className="shadow-elegant border-2 border-primary/20 animate-scale-in mb-8">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-hero rounded-full shadow-glow">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold mb-3">Take the Assessment by Phone</h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Call the number below to complete your RoleColorFinder assessment
                  </p>
                  
                  <div className="bg-gradient-subtle p-8 rounded-lg border-2 border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Call Now:</p>
                    <a 
                      href="tel:+18086462957"
                      className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent hover:scale-105 transition-transform inline-block"
                    >
                      +1 (808) 646-2957
                    </a>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-lg space-y-3 text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-center mb-4">What to expect:</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="font-bold text-foreground min-w-[24px]">1.</span>
                      <span>Call the number above from any phone</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-foreground min-w-[24px]">2.</span>
                      <span>Listen to 25 leadership questions</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-foreground min-w-[24px]">3.</span>
                      <span>Say "A", "B", "C", or "D" for each answer</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-foreground min-w-[24px]">4.</span>
                      <span>Takes approximately 10-15 minutes</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-foreground min-w-[24px]">5.</span>
                      <span>Enter your phone number below after completion to view results</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Lookup Card */}
          <Card className="shadow-elegant border-2 border-border/20 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Check Your Results
              </CardTitle>
              <CardDescription>
                Already completed the assessment? Enter your phone number to view your results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookupResults} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="lookup-phone">Phone Number</Label>
                  <Input
                    id="lookup-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    className="text-lg"
                    disabled={lookupLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the same number you used to call for the assessment
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={lookupLoading || !lookupPhone}
                >
                  {lookupLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Looking up results...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      View My Results
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
