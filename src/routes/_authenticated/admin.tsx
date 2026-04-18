import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { checkIsAdmin, grantUnlimitedAccess } from "@/server/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — OutreachOS" }] }),
});

function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    checkIsAdmin()
      .then((r) => setAuthorized(r.isAdmin))
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return (
      <div className="container mx-auto px-6 py-12 text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container mx-auto max-w-xl px-6 py-16">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="mt-3 text-xl font-semibold">Forbidden</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You need the admin role to view this page.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: import("react").FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const r = await grantUnlimitedAccess({ data: { email } });
      setResult({ ok: true, msg: r.message });
      setEmail("");
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : "Failed to grant access." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
          <p className="text-sm text-muted-foreground">Grant unlimited access to any user.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-xl border border-border bg-card p-6"
      >
        <label htmlFor="email" className="text-sm font-medium">
          User email
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          The user must have already signed up. They'll get the admin role and an active workspace.
        </p>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          maxLength={255}
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !email}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Granting…
            </>
          ) : (
            <>Grant unlimited access</>
          )}
        </button>

        {result && (
          <div
            className={`mt-5 flex items-start gap-2 rounded-md border p-3 text-sm ${
              result.ok
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            <span>{result.msg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
