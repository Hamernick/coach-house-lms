import { ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT } from "@/lib/accelerator/billing"

export type AcceleratorBillingMetadata = Record<string, string | undefined>

export function parseInstallmentCount(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

export function isAcceleratorMonthlyMetadata(metadata: AcceleratorBillingMetadata) {
  return metadata.kind === "accelerator" && metadata.accelerator_billing === "monthly"
}

export function resolveInstallmentLimit(
  metadata: AcceleratorBillingMetadata,
  fallbackLimit = ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT,
) {
  return Math.max(1, parseInstallmentCount(metadata.accelerator_installment_limit, fallbackLimit))
}

export function hasCompletedAcceleratorInstallments(
  metadata: AcceleratorBillingMetadata,
  fallbackLimit = ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT,
) {
  const installmentLimit = resolveInstallmentLimit(metadata, fallbackLimit)
  const installmentsPaid = parseInstallmentCount(metadata.accelerator_installments_paid, 0)
  return installmentsPaid >= installmentLimit
}

export function shouldRollToOrganizationPlan(options: {
  eventType: string
  subscriptionStatus: string
  metadata: AcceleratorBillingMetadata
  fallbackLimit?: number
}) {
  const { eventType, subscriptionStatus, metadata, fallbackLimit = ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT } = options
  if (!isAcceleratorMonthlyMetadata(metadata)) return false
  const hasInstallmentMetadata =
    typeof metadata.accelerator_installment_limit === "string" ||
    typeof metadata.accelerator_installments_paid === "string"
  if (hasInstallmentMetadata && !hasCompletedAcceleratorInstallments(metadata, fallbackLimit)) {
    return false
  }

  const canceledByUpdate = eventType === "customer.subscription.updated" && subscriptionStatus === "canceled"
  const canceledByDelete = eventType === "customer.subscription.deleted"
  return canceledByUpdate || canceledByDelete
}

export function resolveNextInstallmentProgress(options: {
  billingReason?: string | null
  metadata: AcceleratorBillingMetadata
  cancelAtPeriodEnd: boolean
  fallbackLimit?: number
}) {
  const {
    billingReason,
    metadata,
    cancelAtPeriodEnd,
    fallbackLimit = ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT,
  } = options
  const eligibleBillingReason = billingReason === "subscription_create" || billingReason === "subscription_cycle"
  const eligible = eligibleBillingReason && isAcceleratorMonthlyMetadata(metadata)
  const installmentLimit = resolveInstallmentLimit(metadata, fallbackLimit)
  const installmentsPaid = parseInstallmentCount(metadata.accelerator_installments_paid, 0)
  const nextInstallmentsPaid = Math.min(installmentLimit, installmentsPaid + 1)
  const shouldSetCancelAtPeriodEnd = eligible && nextInstallmentsPaid >= installmentLimit && !cancelAtPeriodEnd

  return {
    eligible,
    installmentLimit,
    installmentsPaid,
    nextInstallmentsPaid,
    shouldSetCancelAtPeriodEnd,
  }
}
