import Stripe from "https://esm.sh/stripe@14.21.0";

export const CORE_PLATFORM_MONTHLY_DOLLARS = 500.0;
export const HIRING_INTELLIGENCE_MONTHLY_DOLLARS = 1000.0;
export const INCLUDED_ACTIVE_JOB_ROLES = 10;
export const ACTIVE_ROLE_SCALE_BLOCK_SIZE = 10;
export const ACTIVE_ROLE_SCALE_BLOCK_MONTHLY_DOLLARS = 1000.0;
export const OUTCOME_PRICE_PER_SUCCESSFUL_HIRE_DOLLARS = 20.0;
// Backward compatibility for older imports.
export const MONTHLY_RATE_DOLLARS = CORE_PLATFORM_MONTHLY_DOLLARS;
export const MIN_PORTAL_SEATS = 2;

const normalizeCompanyName = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

export const isUnlimitedCompany = (companyName: string | null | undefined) =>
  normalizeCompanyName(companyName) === "rolecolorfinderllc";

const daysInMonthUtc = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export const toMoney = (amount: number) => Number(amount.toFixed(2));

export const getPortalSeatBaseline = (_storedSeats: number | null | undefined) =>
  MIN_PORTAL_SEATS;

export interface CompanyBillingConfig {
  portal_core_monthly_dollars?: number | null;
  portal_hiring_monthly_dollars?: number | null;
  portal_included_active_job_roles?: number | null;
  portal_active_role_scale_block_size?: number | null;
  portal_active_role_scale_block_monthly_dollars?: number | null;
  portal_outcome_price_per_hire_dollars?: number | null;
}

const numberOrDefault = (value: number | null | undefined, fallback: number) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};

export const getCorePlatformMonthlyDollars = (company?: CompanyBillingConfig | null) =>
  numberOrDefault(company?.portal_core_monthly_dollars, CORE_PLATFORM_MONTHLY_DOLLARS);

export const getHiringIntelligenceMonthlyDollars = (company?: CompanyBillingConfig | null) =>
  numberOrDefault(company?.portal_hiring_monthly_dollars, HIRING_INTELLIGENCE_MONTHLY_DOLLARS);

export const getBillablePortalUsers = (
  activeUsers: number | null | undefined,
  storedSeats: number | null | undefined,
) => Math.max(Math.max(0, Number(activeUsers || 0)), getPortalSeatBaseline(storedSeats));

export const getAdditionalActiveRoleBlocks = (
  activeRoleCount: number | null | undefined,
  company?: CompanyBillingConfig | null,
) => {
  const activeRoles = Math.max(0, Number(activeRoleCount || 0));
  const includedRoles = company?.portal_included_active_job_roles;
  if (includedRoles === null) return 0;

  const effectiveIncludedRoles = numberOrDefault(includedRoles, INCLUDED_ACTIVE_JOB_ROLES);
  const blockSize = Math.max(1, numberOrDefault(company?.portal_active_role_scale_block_size, ACTIVE_ROLE_SCALE_BLOCK_SIZE));
  const additionalRoles = Math.max(0, activeRoles - effectiveIncludedRoles);
  return Math.ceil(additionalRoles / blockSize);
};

export const getActiveRoleScalingCharge = (
  activeRoleCount: number | null | undefined,
  company?: CompanyBillingConfig | null,
) => {
  const blocks = getAdditionalActiveRoleBlocks(activeRoleCount, company);
  const blockPrice = numberOrDefault(company?.portal_active_role_scale_block_monthly_dollars, ACTIVE_ROLE_SCALE_BLOCK_MONTHLY_DOLLARS);
  return toMoney(blocks * blockPrice);
};

export const getOutcomeBasedCharge = (
  successfulHireCount: number | null | undefined,
  company?: CompanyBillingConfig | null,
) => {
  const hires = Math.max(0, Number(successfulHireCount || 0));
  const outcomePrice = numberOrDefault(company?.portal_outcome_price_per_hire_dollars, OUTCOME_PRICE_PER_SUCCESSFUL_HIRE_DOLLARS);
  return toMoney(hires * outcomePrice);
};

export const buildAnchoredDate = (anchorAtInput: Date, monthOffset: number) => {
  const anchorAt = new Date(anchorAtInput);
  const anchorYear = anchorAt.getUTCFullYear();
  const anchorMonth = anchorAt.getUTCMonth();
  const anchorDay = anchorAt.getUTCDate();
  const anchorHour = anchorAt.getUTCHours();
  const anchorMinute = anchorAt.getUTCMinutes();
  const anchorSecond = anchorAt.getUTCSeconds();
  const anchorMillisecond = anchorAt.getUTCMilliseconds();

  const totalMonths = anchorMonth + monthOffset;
  const targetYear = anchorYear + Math.floor(totalMonths / 12);
  const normalizedMonth = ((totalMonths % 12) + 12) % 12;
  const targetDay = Math.min(anchorDay, daysInMonthUtc(targetYear, normalizedMonth));

  return new Date(Date.UTC(
    targetYear,
    normalizedMonth,
    targetDay,
    anchorHour,
    anchorMinute,
    anchorSecond,
    anchorMillisecond,
  ));
};

export const getNextRenewalAt = (anchorAtInput: Date, referenceInput: Date) => {
  const anchorAt = new Date(anchorAtInput);
  const reference = new Date(referenceInput);
  let monthOffset = 1;
  let candidate = buildAnchoredDate(anchorAt, monthOffset);

  while (candidate.getTime() <= reference.getTime()) {
    monthOffset += 1;
    candidate = buildAnchoredDate(anchorAt, monthOffset);
  }

  return candidate;
};

export const getPreviousRenewalAt = (anchorAtInput: Date, renewalAtInput: Date) => {
  const anchorAt = new Date(anchorAtInput);
  const renewalAt = new Date(renewalAtInput);
  let previous = anchorAt;
  let monthOffset = 1;
  let candidate = buildAnchoredDate(anchorAt, monthOffset);

  while (candidate.getTime() < renewalAt.getTime()) {
    previous = candidate;
    monthOffset += 1;
    candidate = buildAnchoredDate(anchorAt, monthOffset);
  }

  return previous;
};

export const getProrationAmountCents = (
  renewalAtInput: Date,
  nowInput: Date,
  monthlyRateCents = 2000,
) => {
  const renewalAt = new Date(renewalAtInput);
  const now = new Date(nowInput);
  const periodStart = new Date(renewalAt);
  periodStart.setUTCMonth(periodStart.getUTCMonth() - 1);

  const totalPeriodMs = renewalAt.getTime() - periodStart.getTime();
  const remainingMs = Math.max(renewalAt.getTime() - now.getTime(), 0);

  if (totalPeriodMs <= 0 || remainingMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.ceil((remainingMs / totalPeriodMs) * monthlyRateCents));
};

export const resolveStripeCustomerAndDefaultPaymentMethod = async (
  stripe: Stripe,
  supabase: { from: (table: string) => { update: (values: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> } } },
  company: {
    id: string;
    admin_email: string;
    stripe_customer_id?: string | null;
  },
) => {
  let customerId = company.stripe_customer_id ?? null;

  if (!customerId) {
    const customers = await stripe.customers.list({ email: company.admin_email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", company.id);
    }
  }

  if (!customerId) {
    return { customerId: null, defaultPaymentMethodId: null };
  }

  let paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: "card" });

  if (paymentMethods.data.length === 0) {
    const emailCustomers = await stripe.customers.list({ email: company.admin_email, limit: 10 });
    for (const matchedCustomer of emailCustomers.data) {
      if (matchedCustomer.id === customerId) continue;
      const matchedPaymentMethods = await stripe.paymentMethods.list({ customer: matchedCustomer.id, type: "card" });
      if (matchedPaymentMethods.data.length > 0) {
        customerId = matchedCustomer.id;
        paymentMethods = matchedPaymentMethods;
        await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", company.id);
        break;
      }
    }
  }

  if (paymentMethods.data.length === 0) {
    return { customerId, defaultPaymentMethodId: null };
  }

  let defaultPaymentMethodId: string | null = null;
  try {
    const customerObj = await stripe.customers.retrieve(customerId) as any;
    const invoiceDefault = customerObj?.invoice_settings?.default_payment_method;
    const invoiceDefaultId = typeof invoiceDefault === "string" ? invoiceDefault : invoiceDefault?.id;
    if (typeof invoiceDefaultId === "string" && invoiceDefaultId.startsWith("pm_")) {
      defaultPaymentMethodId = invoiceDefaultId;
    }
  } catch {
    // fall back below
  }

  return {
    customerId,
    defaultPaymentMethodId: defaultPaymentMethodId ?? paymentMethods.data[0].id,
  };
};
