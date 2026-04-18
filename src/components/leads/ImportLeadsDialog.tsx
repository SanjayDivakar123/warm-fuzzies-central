import { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parsePastedLeads, type DraftLead } from "@/lib/parse-leads";

interface Props {
  tenantId: string;
  onClose: () => void;
  onImported: () => void;
}

export function ImportLeadsDialog({ tenantId, onClose, onImported }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<{ leads: DraftLead[]; skipped: number } | null>(
    null,
  );

  const handlePreview = () => {
    const result = parsePastedLeads(text);
    setPreview(result);
    if (result.leads.length === 0) {
      toast.error("Couldn't find any valid emails");
    }
  };

  const handleImport = async () => {
    if (!preview || preview.leads.length === 0) {
      toast.error("Nothing to import");
      return;
    }
    setSubmitting(true);
    try {
      const rows = preview.leads.map((l) => ({
        ...l,
        tenant_id: tenantId,
        source: "manual_import",
      }));
      // Upsert on (tenant_id, lower(email)) — DB has a unique partial index
      const { error } = await supabase
        .from("leads")
        .upsert(rows, { onConflict: "tenant_id,email", ignoreDuplicates: true });
      if (error) throw error;
      toast.success(`Imported ${rows.length} lead${rows.length === 1 ? "" : "s"}`);
      onImported();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Import leads</h2>
            <p className="text-xs text-muted-foreground">
              Paste a CSV or one email per line
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <textarea
            rows={10}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPreview(null);
            }}
            placeholder={`email,first_name,last_name,company,title\njane@acme.com,Jane,Doe,Acme,Head of Sales\n\n— or just one per line —\njane@acme.com\nbob@northwind.io`}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {preview && (
            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
              <span className="font-medium">{preview.leads.length}</span>{" "}
              <span className="text-muted-foreground">
                ready to import · {preview.skipped} skipped
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-card px-3.5 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          {!preview ? (
            <button
              type="button"
              disabled={!text.trim()}
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Preview
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || preview.leads.length === 0}
              onClick={handleImport}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {submitting ? "Importing…" : `Import ${preview.leads.length}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
