import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Onboarding — OutreachOS" }] }),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [icp, setIcp] = useState("");
  const [calendly, setCalendly] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error: tErr } = await supabase.from("tenants").insert({
        owner_id: user.id,
        name,
        website: website || null,
        icp_description: icp || null,
        calendly_url: calendly || null,
      });
      if (tErr) throw tErr;

      await supabase
        .from("profiles")
        .update({ onboarded: true })
        .eq("id", user.id);

      toast.success("Workspace created");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">Step 1 of 1</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tell us about your company</h1>
          <p className="mt-2 text-muted-foreground">
            Jax uses this to find buyers and write outreach in your voice.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5 rounded-xl border border-border bg-card p-8">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Company name *
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <label htmlFor="website" className="text-sm font-medium">
              Website
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://acme.com"
            />
          </div>
          <div>
            <label htmlFor="icp" className="text-sm font-medium">
              Who do you sell to? (ICP)
            </label>
            <textarea
              id="icp"
              rows={4}
              value={icp}
              onChange={(e) => setIcp(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Series A SaaS founders in the US, 10–50 employees, building dev tools"
            />
          </div>
          <div>
            <label htmlFor="calendly" className="text-sm font-medium">
              Calendly URL
            </label>
            <input
              id="calendly"
              type="url"
              value={calendly}
              onChange={(e) => setCalendly(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://calendly.com/you/intro"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "Creating workspace…" : "Continue to dashboard"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
