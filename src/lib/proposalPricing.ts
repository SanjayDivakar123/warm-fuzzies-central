const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function parseProposalFeeToCents(value: string): number | null {
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
  return USD_FORMATTER.format(cents / 100);
}

export function formatDeploymentFeeLabel(value: string): string {
  const cents = parseProposalFeeToCents(value);
  return cents === 0 ? "Platform Deployment Fee Waived" : cents === null ? value : formatCentsAsUsd(cents);
}

export function ensureDollarSignForAmount(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("$")) {
    return value;
  }

  return value.replace(/(^|[+\s(])(\d[\d,]*(?:\.\d{1,2})?)/, (_match, prefix: string, amount: string) => {
    return `${prefix}$${amount}`;
  });
}
