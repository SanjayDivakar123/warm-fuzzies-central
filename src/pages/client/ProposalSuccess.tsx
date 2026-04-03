import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import type { Proposal } from "@/pages/admin/ProposalManager";
import { fetchLatestProposalBySlug } from "@/lib/clientProposals";

interface ContactForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
}

export default function ProposalSuccess() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const sessionId = searchParams.get("session_id");
  const acceptanceId = searchParams.get("acceptance_id");

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentRecorded, setPaymentRecorded] = useState(false);

  const [form, setForm] = useState<ContactForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    designation: "",
  });

  // Load proposal + record payment
  useEffect(() => {
    if (!slug) return;

    fetchLatestProposalBySlug(slug).then(({ data }) => {
        if (data) {
          setProposal(data);
          document.title = `Welcome — ${data.proposal_title} | RoleColorFinder`;
        }
      });

    // Update acceptance record with payment info
    if (acceptanceId && sessionId && !paymentRecorded) {
      setPaymentRecorded(true);
      supabase
        .from("proposal_acceptances")
        .update({
          stripe_session_id: sessionId,
          payment_status: "paid",
          paid_at: new Date().toISOString(),
          status: "contact_pending",
        })
        .eq("id", acceptanceId)
        .then(() => {});
    }
  }, [slug, acceptanceId, sessionId, paymentRecorded]);

  function handleChange(field: keyof ContactForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const isValid =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.designation.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaving(true);
    try {
      if (acceptanceId) {
        const { error } = await supabase
          .from("proposal_acceptances")
          .update({
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            designation: form.designation.trim(),
            status: "completed",
          })
          .eq("id", acceptanceId);

        if (error) throw error;
      }
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error saving details", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d1fae5,_transparent_40%),linear-gradient(to_bottom,_#f8fafc,_#ecfdf5_40%,_#f8fafc)]">
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src="/uploads/2842bc15-73da-4523-b9c9-228cb076346e.png"
            alt="RoleColorFinder"
            className="h-10 mx-auto object-contain"
          />
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
          </div>
          <Badge className="border-emerald-300/40 bg-emerald-500/20 text-emerald-700">
            Payment Confirmed
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to RoleColorFinder!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Your $5,000 platform deployment payment has been received. {proposal.company_name}'s
            account setup is now in progress.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-0">
          {[
            { label: "Review Proposal", done: true },
            { label: "Sign Agreement", done: true },
            { label: "Payment", done: true },
            { label: "Onboarding", done: submitted, active: !submitted },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 w-28 ${step.active ? "opacity-100" : step.done ? "opacity-70" : "opacity-40"}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-emerald-500 text-white" : step.active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {step.done ? "✓" : i + 1}
                </div>
                <span className="text-[11px] text-center text-slate-600 leading-tight">{step.label}</span>
              </div>
              {i < 3 && <div className="h-px w-8 bg-slate-300 mb-4" />}
            </div>
          ))}
        </div>

        {/* Wait notice */}
        <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-md">
          <CardContent className="p-6 flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base">Please allow 1–2 business days</p>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                A member of the RoleColorFinder team will be in touch shortly to confirm your account details,
                schedule your onboarding session, and get everything set up for {proposal.company_name}.
                You will receive an email directly from our team.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact form or confirmation */}
        {!submitted ? (
          <Card className="rounded-3xl border-slate-200 bg-white shadow-lg">
            <CardContent className="p-7 md:p-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Your Contact Details</h2>
                  <p className="text-sm text-slate-500">So we know who to reach out to for onboarding</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="first_name"
                      placeholder="Jane"
                      value={form.first_name}
                      onChange={(e) => handleChange("first_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="last_name"
                      placeholder="Doe"
                      value={form.last_name}
                      onChange={(e) => handleChange("last_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane.doe@company.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="designation">Designation / Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="designation"
                    placeholder="e.g. VP of Human Resources"
                    value={form.designation}
                    onChange={(e) => handleChange("designation", e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base mt-2"
                  disabled={!isValid || saving}
                >
                  {saving ? (
                    <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2" /> Saving…</>
                  ) : "Submit Contact Details"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border-emerald-200 bg-white shadow-lg">
            <CardContent className="p-7 md:p-10 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">You're all set!</h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                We've received your contact details. A member of our team will reach out
                to <strong>{form.email}</strong> within <strong>1–2 business days</strong> to
                kick off your onboarding.
              </p>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-left space-y-2 text-sm">
                <p><span className="text-slate-500">Name:</span> <strong>{form.first_name} {form.last_name}</strong></p>
                <p><span className="text-slate-500">Email:</span> <strong>{form.email}</strong></p>
                <p><span className="text-slate-500">Phone:</span> <strong>{form.phone}</strong></p>
                <p><span className="text-slate-500">Designation:</span> <strong>{form.designation}</strong></p>
                <p><span className="text-slate-500">Company:</span> <strong>{proposal.company_name}</strong></p>
              </div>
              <p className="text-xs text-slate-400">
                Questions? Contact us at{" "}
                <a href="mailto:hello@rolecolorfinder.com" className="underline">
                  hello@rolecolorfinder.com
                </a>
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
