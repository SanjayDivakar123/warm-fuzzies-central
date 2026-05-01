import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { colorLabel } from "@/lib/advisorLanding";

type GuestSubmissionResult = {
  guest_name: string;
  assessment_type: string;
  status: string;
  results?: {
    scores?: Record<string, number>;
  } | null;
  result_summary?: {
    dominantColor?: string | null;
    secondaryColor?: string | null;
    scores?: Record<string, number> | null;
  } | null;
  advisor?: {
    name?: string | null;
  } | null;
};

export default function AdvisorResult() {
  const { token } = useParams();
  const [submission, setSubmission] = useState<GuestSubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      const { data } = await supabase.functions.invoke("advisor-result-access", {
        body: { guestResultToken: token },
      });
      setSubmission(data?.submission || null);
      setLoading(false);
    };

    if (token) loadResult();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold">Result not found</h1>
            <p className="mt-2 text-muted-foreground">This result link is invalid or the assessment has not been completed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = submission.result_summary || {};
  const scores = submission.results?.scores || summary.scores || {};

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-purple-600 p-8 text-white">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">Your results are ready</h1>
            <p className="mt-2 text-white/85">
              Your results were also sent to {submission.advisor?.name || "your advisor"}.
            </p>
          </div>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm font-medium text-muted-foreground">Dominant color</p>
              <p className="mt-2 text-2xl font-bold">{colorLabel(summary.dominantColor)}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm font-medium text-muted-foreground">Secondary color</p>
              <p className="mt-2 text-2xl font-bold">{colorLabel(summary.secondaryColor)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            {Object.entries(scores).map(([color, score]) => (
              <div key={color} className="rounded-xl border bg-white p-4">
                <p className="text-sm font-medium capitalize text-muted-foreground">{color}</p>
                <p className="mt-2 text-2xl font-semibold">{String(score)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
