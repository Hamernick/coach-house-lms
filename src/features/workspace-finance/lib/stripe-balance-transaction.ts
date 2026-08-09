import type Stripe from "stripe"

import type { WorkspaceFinanceSourceKind } from "../types"

export type WorkspaceFinanceStripeIncomeType =
  | "donation"
  | "grant"
  | "earned_revenue"
  | "other_income"

export type WorkspaceFinanceStripeClassification = {
  recordType: WorkspaceFinanceStripeIncomeType
  sourceLabel?: string | null
}

export type WorkspaceFinanceStripeRecordImport = {
  effective_at: string
  record_type: WorkspaceFinanceStripeIncomeType | "fee" | "reversal"
  direction: "in" | "out"
  source_kind: WorkspaceFinanceSourceKind | null
  source_label: string
  amount_cents: number
  currency_code: string
  status: "recorded"
  external_provider: "stripe_balance_transaction"
  external_record_id: string
  created_source: "stripe"
}

const INCOME_SOURCE_KINDS: Record<
  WorkspaceFinanceStripeIncomeType,
  WorkspaceFinanceSourceKind
> = {
  donation: "donations",
  grant: "grants",
  earned_revenue: "earned_revenue",
  other_income: "other",
}

const CLASSIFIABLE_INCOME_TYPES = new Set<Stripe.BalanceTransaction.Type>([
  "charge",
  "contribution",
  "payment",
])

const FEE_TYPES = new Set<Stripe.BalanceTransaction.Type>([
  "stripe_fee",
  "stripe_fx_fee",
  "tax_fee",
])

const REVERSAL_TYPES = new Set<Stripe.BalanceTransaction.Type>([
  "payment_failure_refund",
  "payment_refund",
  "payment_reversal",
  "refund",
])

export function mapStripeBalanceTransactionToFinanceRecord(
  transaction: Stripe.BalanceTransaction,
  classification?: WorkspaceFinanceStripeClassification | null
): WorkspaceFinanceStripeRecordImport | null {
  const currencyCode = transaction.currency.trim().toUpperCase()
  if (
    !transaction.id ||
    !Number.isSafeInteger(transaction.amount) ||
    transaction.amount === 0 ||
    !Number.isSafeInteger(transaction.created) ||
    transaction.created <= 0 ||
    !/^[A-Z]{3}$/.test(currencyCode)
  ) {
    return null
  }

  const effectiveAt = new Date(transaction.created * 1000).toISOString()
  const amountCents = Math.abs(transaction.amount)
  const sourceLabel = classification?.sourceLabel?.trim() || "Stripe"

  if (
    transaction.amount > 0 &&
    CLASSIFIABLE_INCOME_TYPES.has(transaction.type) &&
    classification
  ) {
    return {
      effective_at: effectiveAt,
      record_type: classification.recordType,
      direction: "in",
      source_kind: INCOME_SOURCE_KINDS[classification.recordType],
      source_label: sourceLabel,
      amount_cents: amountCents,
      currency_code: currencyCode,
      status: "recorded",
      external_provider: "stripe_balance_transaction",
      external_record_id: transaction.id,
      created_source: "stripe",
    }
  }

  if (transaction.amount < 0 && FEE_TYPES.has(transaction.type)) {
    return {
      effective_at: effectiveAt,
      record_type: "fee",
      direction: "out",
      source_kind: null,
      source_label: "Stripe fee",
      amount_cents: amountCents,
      currency_code: currencyCode,
      status: "recorded",
      external_provider: "stripe_balance_transaction",
      external_record_id: transaction.id,
      created_source: "stripe",
    }
  }

  if (transaction.amount < 0 && REVERSAL_TYPES.has(transaction.type)) {
    return {
      effective_at: effectiveAt,
      record_type: "reversal",
      direction: "out",
      source_kind: null,
      source_label: sourceLabel === "Stripe" ? "Stripe refund" : sourceLabel,
      amount_cents: amountCents,
      currency_code: currencyCode,
      status: "recorded",
      external_provider: "stripe_balance_transaction",
      external_record_id: transaction.id,
      created_source: "stripe",
    }
  }

  return null
}
