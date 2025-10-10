import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navigation/Navbar";
import { Phone, Loader2, CheckCircle2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const VoiceAssessment = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInitiateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to begin the assessment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('initiate-voice-call', {
        body: { phone_number: phoneNumber },
      });

      if (error) throw error;

      if (data?.success) {
        setCallInitiated(true);
        setSessionId(data.session_id);
        toast({
          title: "Call Initiated!",
          description: "You should receive a call shortly. Answer to begin your assessment.",
        });
      }
    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "No Results Found",
          description: "We couldn't find any completed assessments for this phone number.",
          variant: "destructive",
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
              Voice Assessment
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete your RoleColorFinder assessment over the phone
            </p>
          </div>

          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Assessment</TabsTrigger>
              <TabsTrigger value="lookup">Check Results</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              {!callInitiated ? (
                <Card className="shadow-elegant border-2 border-border/20 animate-scale-in">
                  <CardHeader>
                    <CardTitle>Enter Your Phone Number</CardTitle>
                    <CardDescription>
                      We'll call you and guide you through 25 questions to discover your role color.
                      The assessment takes approximately 10-15 minutes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInitiateCall} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="text-lg"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Include country code (e.g., +1 for US)
                        </p>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-sm">What to expect:</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>You'll receive a call within 1 minute</li>
                          <li>Answer 25 questions about your work style</li>
                          <li>Choose A, B, C, or D for each question</li>
                          <li>Get your results immediately after completion</li>
                        </ul>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading || !phoneNumber}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Initiating Call...
                          </>
                        ) : (
                          <>
                            <Phone className="mr-2 h-5 w-5" />
                            Start Voice Assessment
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-elegant border-2 border-primary/20 animate-scale-in">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                      </div>
                      
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Call Initiated!</h2>
                        <p className="text-muted-foreground">
                          You should receive a call at <span className="font-semibold text-foreground">{phoneNumber}</span> shortly.
                        </p>
                      </div>

                      <div className="bg-muted/30 p-6 rounded-lg space-y-3 text-left">
                        <h3 className="font-semibold">During the call:</h3>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex gap-2">
                            <span className="font-bold text-foreground">1.</span>
                            <span>Answer the phone when you receive the call</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold text-foreground">2.</span>
                            <span>Listen carefully to each question</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold text-foreground">3.</span>
                            <span>Say "A", "B", "C", or "D" to answer</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold text-foreground">4.</span>
                            <span>Complete all 25 questions</span>
                          </li>
                        </ol>
                      </div>

                      {sessionId && (
                        <div className="text-sm text-muted-foreground">
                          Session ID: <span className="font-mono text-xs">{sessionId}</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => {
                          setCallInitiated(false);
                          setPhoneNumber("");
                          setSessionId(null);
                        }}
                      >
                        Start Over
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="lookup">
              <Card className="shadow-elegant border-2 border-border/20 animate-scale-in">
                <CardHeader>
                  <CardTitle>Check Your Previous Results</CardTitle>
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
                        Enter the same number you used for the assessment
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
