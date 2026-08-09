import type { AdminOrganizationBillingPlan } from "../types"

export const ADMIN_ORGANIZATION_BILLING_PLAN_LABELS: Record<
  AdminOrganizationBillingPlan,
  string
> = {
  organization: "Organization",
  operations_support: "Operations Support",
}

export function isAdminOrganizationBillingPlan(
  value: unknown
): value is AdminOrganizationBillingPlan {
  return value === "organization" || value === "operations_support"
}

export function resolveAdminOrganizationBillingPlan({
  metadataPlan,
  operationsSupportPriceId,
  organizationPriceId,
  priceId,
}: {
  metadataPlan?: unknown
  operationsSupportPriceId: string | null
  organizationPriceId: string | null
  priceId: string | null
}): AdminOrganizationBillingPlan | "unknown" {
  if (priceId && priceId === organizationPriceId) return "organization"
  if (priceId && priceId === operationsSupportPriceId) {
    return "operations_support"
  }
  return isAdminOrganizationBillingPlan(metadataPlan) ? metadataPlan : "unknown"
}

export function formatAdminOrganizationBillingCurrency({
  amountCents,
  currency,
  locale,
}: {
  amountCents: number
  currency: string
  locale?: string
}) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

export function formatAdminOrganizationBillingDate({
  date,
  locale,
}: {
  date: string
  locale?: string
}) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}
