export type ProductType = "premium" | "pro" | "b2b";

export const USD_PRICES: Record<ProductType, number> = {
  premium: 124.99,
  pro: 199.99,
  b2b: 20,
};

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function getLocalizedPrice(productType: ProductType, _countryCode?: string) {
  const amount = USD_PRICES[productType];
  return {
    countryCode: "US",
    country: "United States",
    displayCurrency: "USD",
    displayAmount: amount,
    displayFormatted: formatCurrency(amount, "USD"),
    stripeCurrency: "usd",
    stripeAmountMinor: Math.round(amount * 100),
    fallbackToUsd: false,
  };
}

export function convertUsdToLocalB2B(usdAmount: number, _countryCode?: string): {
  amountLocal: number;
  currency: string;
  country: string;
} {
  return {
    amountLocal: usdAmount,
    currency: "USD",
    country: "United States",
  };
}

export async function detectCountryCode(): Promise<string> {
  return "US";
}
