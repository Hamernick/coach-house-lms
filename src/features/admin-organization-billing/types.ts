export type AdminOrganizationBillingPlan = "organization" | "operations_support"

export type AdminOrganizationBillingActionResult =
  | {
      ok: true
      refundAmountCents?: number
      refundStatus?: string
    }
  | { error: string }

export type AdminOrganizationBillingPayment = {
  amountCents: number
  createdAt: string
  currency: string
  refundedAmountCents: number
  refundableAmountCents: number
  status: string
}

export type AdminOrganizationBillingSummary = {
  cancelAtPeriodEnd: boolean
  currency: string
  currentPeriodEnd: string | null
  dashboardUrl: string
  latestPayment: AdminOrganizationBillingPayment | null
  orgId: string
  plan: AdminOrganizationBillingPlan | "unknown"
  priceAmountCents: number | null
  status: string
}

export type AdminOrganizationBillingState =
  | { mode: "ready"; summary: AdminOrganizationBillingSummary }
  | { mode: "none"; orgId: string }
  | { mode: "unavailable"; message: string; orgId: string }

export type ChangeAdminOrganizationBillingPlanAction = (input: {
  orgId: string
  plan: AdminOrganizationBillingPlan
}) => Promise<AdminOrganizationBillingActionResult>

export type RefundLatestAdminOrganizationPaymentAction = (input: {
  orgId: string
}) => Promise<AdminOrganizationBillingActionResult>
