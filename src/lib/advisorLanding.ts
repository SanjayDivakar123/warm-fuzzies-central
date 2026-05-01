export type AdvisorAssessmentType = "premium" | "pro";

export interface AdvisorLandingPage {
  id: string;
  title: string;
  slug: string;
  assessmentType: AdvisorAssessmentType;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  advisorName?: string | null;
  advisorCompanyName?: string | null;
  discountPercent: number;
  commissionPercent?: number;
  requiresAccessCode?: boolean;
  accessCodeStatus?: "inactive" | "active" | "used" | string;
  originalAmountMinor: number;
  discountedAmountMinor: number;
  originalPriceFormatted: string;
  discountedPriceFormatted: string;
  productName: string;
  productDescription: string;
}

export const formatMinorCurrency = (amountMinor: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format((amountMinor || 0) / 100);
  } catch {
    return `${currency} ${((amountMinor || 0) / 100).toFixed(2)}`;
  }
};

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const colorLabel = (color?: string | null) =>
  color ? color.charAt(0).toUpperCase() + color.slice(1) : "Not available";
