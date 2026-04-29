export function parseProposalFeeToCents(value: unknown): number | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .replace(/^\$/, "")
    .replace(/usd$/i, "");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function formatCentsAsUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
