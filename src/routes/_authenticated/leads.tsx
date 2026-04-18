import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Search, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const STATUS_OPTIONS: Array<LeadStatus | "all"> = [
  "all",
  "new",
  "contacted",
  "replied",
  "qualified",
  "meeting_booked",
  "closed_won",
  "closed_lost",
  "unsubscribed",
];

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
  head: () => ({ meta: [{ title: "Leads — OutreachOS" }] }),
});

function LeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [minScore, setMinScore] = useState(0);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1);
    const t = tenants?.[0];
    if (!t) {
      navigate({ to: "/onboarding" });
      return;
    }
    setTenantId(t.id);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("tenant_id", t.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setLeads(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (minScore > 0 && (l.icp_score ?? 0) < minScore) return false;
      if (q) {
        const hay = [
          l.email,
          l.first_name,
          l.last_name,
          l.company,
          l.title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter, minScore]);

  const refresh = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setLeads(data ?? []);
    if (activeLead) {
      const updated = data?.find((l) => l.id === activeLead.id);
      if (updated) setActiveLead(updated);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? "Loading…" : `${leads.length} total · ${filtered.length} shown`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Import leads
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <label className="text-xs text-muted-foreground">Min score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-20 rounded-md border border-input bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState onImport={() => setImportOpen(true)} hasAnyLeads={leads.length > 0} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setActiveLead(lead)}
                  className="cursor-pointer border-b border-border/40 transition hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">{lead.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{lead.company ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{lead.title ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ScoreBadge score={lead.icp_score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {importOpen && tenantId && (
        <ImportLeadsDialog
          tenantId={tenantId}
          onClose={() => setImportOpen(false)}
          onImported={refresh}
        />
      )}
      {activeLead && (
        <LeadDrawer
          lead={activeLead}
          onClose={() => setActiveLead(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  const map: Record<LeadStatus, string> = {
    new: "bg-muted text-foreground",
    contacted: "bg-primary/10 text-primary",
    replied: "bg-accent/10 text-accent-foreground",
    qualified: "bg-primary/10 text-primary",
    meeting_booked: "bg-emerald-500/10 text-emerald-500",
    closed_won: "bg-emerald-500/10 text-emerald-500",
    closed_lost: "bg-muted text-muted-foreground",
    unsubscribed: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const tone =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-500"
      : score >= 50
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${tone}`}>
      {score}
    </span>
  );
}

function EmptyState({ onImport, hasAnyLeads }: { onImport: () => void; hasAnyLeads: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {hasAnyLeads ? "No leads match your filters" : "No leads yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAnyLeads
          ? "Try clearing the search or status filter."
          : "Paste a CSV or a list of emails to get started."}
      </p>
      {!hasAnyLeads && (
        <button
          type="button"
          onClick={onImport}
          className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Import leads
        </button>
      )}
    </div>
  );
}
