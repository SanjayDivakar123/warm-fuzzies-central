import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { JaxChat } from "@/components/jax/JaxChat";

export const Route = createFileRoute("/_authenticated/jax")({
  component: JaxPage,
  head: () => ({ meta: [{ title: "Jax — OutreachOS" }] }),
});

function JaxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      const t = data?.[0];
      if (!t) {
        navigate({ to: "/onboarding" });
        return;
      }
      setTenantId(t.id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  if (loading || !tenantId) {
    return (
      <div className="container mx-auto px-6 py-12 text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] max-w-4xl px-4 py-4">
      <div className="h-full overflow-hidden rounded-xl border border-border bg-card">
        <JaxChat tenantId={tenantId} />
      </div>
    </div>
  );
}
