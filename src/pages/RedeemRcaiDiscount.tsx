import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRcaiDiscount } from "@/hooks/useRcaiDiscount";

/**
 * /redeem?source=rolecolorai[&token=...]
 * Confirms whether the signed-in user has an unconsumed RCAI member discount.
 * Does NOT apply anything client-side — pricing is enforced server-side at checkout.
 */
export default function RedeemRcaiDiscount() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const source = params.get("source");
  const token = params.get("token"); // reserved for future signed RCAI redirects
  const status = useRcaiDiscount();

  useEffect(() => {
    if (!authLoading && !user) {
      const next = `/redeem?${params.toString()}`;
      navigate(`/auth?next=${encodeURIComponent(next)}`);
    }
  }, [authLoading, user, navigate, params]);

  const isRcai = source === "rolecolorai";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">RoleColorAI Member Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!isRcai && (
            <p className="text-sm text-muted-foreground text-center">
              This page is for RoleColorAI member redemptions. Add{" "}
              <code>?source=rolecolorai</code> to the URL.
            </p>
          )}

          {(authLoading || status.loading) && (
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Checking your eligibility…
            </div>
          )}

          {!status.loading && status.eligible && (
            <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-200">
                You're eligible — 50% off your first assessment
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The discount will be applied automatically at checkout.
              </p>
              <Button className="mt-4 w-full" onClick={() => navigate("/pricing")}>
                Continue to assessments
              </Button>
            </div>
          )}

          {!status.loading && !status.eligible && status.consumedAt && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="font-semibold">
                You've already used your one-time RoleColorAI discount on{" "}
                {new Date(status.consumedAt).toLocaleDateString()}.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Charging full price going forward.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => navigate("/pricing")}>
                View pricing
              </Button>
            </div>
          )}

          {!status.loading && !status.eligible && !status.consumedAt && user && (
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-semibold">No active discount</p>
              <p className="text-sm text-muted-foreground mt-1">
                We couldn't find a RoleColorAI member discount on your account.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => navigate("/pricing")}>
                View full pricing
              </Button>
            </div>
          )}

          {token && (
            <p className="text-[11px] text-muted-foreground text-center">Token received: {token.slice(0, 8)}…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}