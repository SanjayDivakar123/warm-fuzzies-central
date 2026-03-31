type ExportValue = string | number | boolean | null | undefined;

function normalizeValue(value: ExportValue | Record<string, unknown> | unknown[]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) {
    downloadBlob(new Blob([""], { type: "text/csv;charset=utf-8;" }), filename);
    return;
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${normalizeValue((row as Record<string, unknown>)[header]).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function exportToJSON(rows: Record<string, unknown>[], filename: string) {
  const json = JSON.stringify(rows, null, 2);
  downloadBlob(new Blob([json], { type: "application/json;charset=utf-8;" }), filename);
}
