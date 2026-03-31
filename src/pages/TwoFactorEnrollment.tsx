import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function TwoFactorEnrollment() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const startEnrollment = async () => {
      try {
        const factors = await supabase.auth.mfa.listFactors();
        const existing = factors.data?.totp?.find((factor) => factor.status === "verified" || factor.status === "unverified");
        if (existing?.status === "verified") {
          navigate("/dashboard");
          return;
        }

        if (existing) {
          setFactorId(existing.id);
          return;
        }

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "RoleColorFinder Admin",
        });
        if (error) throw error;
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
      } catch (error) {
        toast({
          title: "2FA enrollment failed",
          description: error instanceof Error ? error.message : "Unexpected error",
          variant: "destructive",
        });
      }
    };

    void startEnrollment();
  }, [navigate, toast, user]);

  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleVerify = async () => {
    if (!factorId || !verifyCode) return;
    setSaving(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;
      toast({ title: "Two-factor authentication enabled" });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Scan the QR code with your authenticator app, then enter the 6-digit code to finish enrollment.</p>
          {qrCode ? (
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
              <img src={qrCode} alt="2FA QR code" className="h-56 w-56" />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Preparing enrollment...</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="verifyCode">Authenticator code</Label>
            <Input id="verifyCode" value={verifyCode} onChange={(event) => setVerifyCode(event.target.value)} placeholder="123456" />
          </div>
          <Button className="w-full" disabled={saving || !factorId} onClick={handleVerify}>
            {saving ? "Verifying..." : "Verify and Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
