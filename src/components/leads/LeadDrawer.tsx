import { useState, type ReactNode } from "react";
import { ExternalLink, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "replied",
  "qualified",
  "meeting_booked",
  "closed_won",
  "closed_lost",
  "unsubscribed",
];

interface Props {
  lead: Lead;
  onClose: () => void;
  onChanged: () => void;
}

export function LeadDrawer({ lead, onClose, onChanged }: Props) {
  const [scoring, setScoring] = useState(false);
  const [updating, setUpdating] = useState(false);

  const reason =
    typeof lead.metadata === "object" &&
    lead.metadata &&
    "icp_reason" in lead.metadata
      ? String((lead.metadata as Record<string, unknown>).icp_reason)
      : null;

  const handleScore = async () => {
    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-lead", {
        body: { leadId: lead.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Scored: ${data.score}/100`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  };

  const handleStatus = async (status: LeadStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", lead.id);
      if (error) throw error;
      toast.success("Status updated");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lead deleted");
    onChanged();
    onClose();
  };

  const fullName =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email || "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{fullName}</h2>
            {lead.title && (
              <p className="text-sm text-muted-foreground">
                {lead.title}
                {lead.company ? ` · ${lead.company}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <Section title="Contact">
            <Field label="Email" value={lead.email} mono />
            <Field label="Company" value={lead.company} />
            <Field label="Title" value={lead.title} />
            {lead.website && (
              <LinkField label="Website" href={lead.website} />
            )}
            {lead.linkedin_url && (
              <LinkField label="LinkedIn" href={lead.linkedin_url} />
            )}
          </Section>

          <Section title="ICP score">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-semibold tabular-nums">
                {lead.icp_score ?? "—"}
                {lead.icp_score != null && (
                  <span className="text-sm text-muted-foreground">/100</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleScore}
                disabled={scoring}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {scoring ? "Scoring…" : lead.icp_score != null ? "Re-score" : "Score with AI"}
              </button>
            </div>
            {reason && (
              <p className="mt-2 text-sm text-muted-foreground italic">"{reason}"</p>
            )}
          </Section>

          <Section title="Status">
            <select
              value={lead.status}
              disabled={updating}
              onChange={(e) => handleStatus(e.target.value as LeadStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Source">
            <p className="text-sm text-muted-foreground">
              {lead.source ?? "Unknown"} · added {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </Section>
        </div>

        <div className="border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-destructive hover:underline"
          >
            Delete lead
          </button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value ?? "—"}</span>
    </div>
  );
}

function LinkField({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        Open <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
