import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdvisorPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("verify-advisor-assessment-payment", {
        body: { sessionId },
      });

      if (error || !data?.redirectPath) {
        toast({
          title: "Payment verification failed",
          description: error?.message || data?.error || "Please contact support if your card was charged.",
          variant: "destructive",
        });
      } else {
        if (data.assessmentToken && data.assessmentType) {
          sessionStorage.setItem(`advisor_assessment_type_${data.assessmentToken}`, data.assessmentType);
        }
        setRedirectPath(data.redirectPath);
      }
      setLoading(false);
    };

    verifyPayment();
  }, [searchParams, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment successful</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your advisor assessment is unlocked. Complete it now so your results can be sent to you and your advisor.
          </p>
          <Button className="w-full" size="lg" onClick={() => redirectPath && navigate(redirectPath)} disabled={!redirectPath}>
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
