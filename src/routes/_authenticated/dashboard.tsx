import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Inbox, Mail, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — OutreachOS" }] }),
});

interface Tenant {
  id: string;
  name: string;
  status: string;
  website: string | null;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, status, website")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error(error);
      } else {
        setTenants(data ?? []);
        if (!data || data.length === 0) {
          navigate({ to: "/onboarding" });
          return;
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12 text-sm text-muted-foreground">Loading…</div>
    );
  }

  const tenant = tenants[0];

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{tenant?.name ?? "Workspace"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status:{" "}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {tenant?.status ?? "—"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Leads" value="0" />
        <StatCard icon={Mail} label="Emails sent" value="0" />
        <StatCard icon={Inbox} label="Replies" value="0" />
        <StatCard icon={Building2} label="Inboxes" value="0" />
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold">Get started</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Import your first batch of leads. Jax will score them against your ICP.
        </p>
        <Link
          to="/leads"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Go to Leads
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}
