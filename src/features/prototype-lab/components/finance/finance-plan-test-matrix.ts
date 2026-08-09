import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  countFinancePlanEvidence,
  type FinancePlanEvidenceCounts,
} from "./finance-plan-evidence"
import type { FinancePlanEvidenceState } from "./finance-release-plan-data"

export type FinancePlanTestArea = {
  area: string
  id: string
  requiredCases: string
  state: FinancePlanEvidenceState
  target: {
    nodeId: string
    viewId: FinancePlanningViewId
  }
}

const FINANCE_PLAN_TEST_MATRIX_DEFINITIONS = [
  {
    area: "Record entry",
    id: "test-provisioning",
    requiredCases:
      "Retry, double-click, concurrent editors, stale revision, missing source, invalid reference, and partial failure",
    state: "not_started",
    target: { nodeId: "system-stripe-connect", viewId: "system" },
  },
  {
    area: "Imports",
    id: "test-account-links",
    requiredCases:
      "Preview, mapping, duplicate rows, mixed currencies, invalid dates, oversized files, and rollback",
    state: "not_started",
    target: { nodeId: "system-stripe-connect", viewId: "system" },
  },
  {
    area: "Review",
    id: "test-readiness",
    requiredCases:
      "Approve, reject, correct, stale decision, separation of duties, and cross-organization denial",
    state: "not_started",
    target: { nodeId: "system-connected-account", viewId: "system" },
  },
  {
    area: "Campaigns",
    id: "test-campaigns",
    requiredCases:
      "Invalid goal/budget/dates/currency, external link inactive/replaced, and public-summary approval",
    state: "not_started",
    target: { nodeId: "data-campaigns", viewId: "data" },
  },
  {
    area: "Validation",
    id: "test-events",
    requiredCases:
      "Invalid source, duplicate, out of period, timeout, partial database failure, wrong organization/project/currency",
    state: "not_started",
    target: { nodeId: "webhook-inbox", viewId: "webhooks" },
  },
  {
    area: "Finance records",
    id: "test-donations",
    requiredCases:
      "Draft, needs review, reconciled, rejected, corrected, above-goal, and unrelated external activity",
    state: "not_started",
    target: { nodeId: "webhook-ledger", viewId: "webhooks" },
  },
  {
    area: "Corrections",
    id: "test-refunds",
    requiredCases:
      "Partial, multiple, full reversal, replacement, and immutable history",
    state: "not_started",
    target: { nodeId: "data-ledger", viewId: "data" },
  },
  {
    area: "Evidence",
    id: "test-disputes",
    requiredCases:
      "Missing, replaced, hash mismatch, unauthorized download, and retention",
    state: "not_started",
    target: { nodeId: "data-ledger", viewId: "data" },
  },
  {
    area: "Reconciliation",
    id: "test-reconciliation",
    requiredCases:
      "Pagination, duplicate reference, missing evidence, stale source, mixed period/currency, and unrelated activity exclusion",
    state: "not_started",
    target: { nodeId: "assurance-financial-truth", viewId: "assurance" },
  },
  {
    area: "Fiscal funds",
    id: "test-fiscal-funds",
    requiredCases:
      "Project scope, allocation, over-request, approval, rejection, correction, external-payment record, and reporting",
    state: "not_started",
    target: { nodeId: "data-restricted-entries", viewId: "data" },
  },
  {
    area: "Imports/exports",
    id: "test-imports-exports",
    requiredCases:
      "Mapping, duplicate rows, mixed currencies, invalid dates, rollback, formula injection, role denial",
    state: "not_started",
    target: { nodeId: "data-import-batches", viewId: "data" },
  },
  {
    area: "Public data",
    id: "test-public-data",
    requiredCases:
      "Draft leakage, donor/contact PII, stale aggregate, disabled link, cache invalidation, social metadata",
    state: "not_started",
    target: { nodeId: "system-public-projection", viewId: "system" },
  },
  {
    area: "Signup/map",
    id: "test-signup-map",
    requiredCases:
      "Context preservation, one-time replay, expired intent, denied action, guest-save merge, rate limit",
    state: "not_started",
    target: { nodeId: "signup-server", viewId: "signup" },
  },
  {
    area: "Location/weather",
    id: "test-location-weather",
    requiredCases:
      "Permission prompt/deny/revoke/error, NWS timeout/stale data, alert start/end, coarse-cache privacy",
    state: "not_started",
    target: { nodeId: "weather-cache", viewId: "weather" },
  },
  {
    area: "Resource scale",
    id: "test-resource-scale",
    requiredCases:
      "Bbox/cursor correctness, selected/saved override, exact publication counts, payload/performance budgets",
    state: "not_started",
    target: { nodeId: "gate-4-resource-publication", viewId: "roadmap" },
  },
  {
    area: "Resilience",
    id: "test-resilience",
    requiredCases:
      "Import, Supabase, NWS, and Vercel failures; safe retry; no false zero or lost financial history",
    state: "not_started",
    target: { nodeId: "assurance-failure-drills", viewId: "assurance" },
  },
] as const satisfies readonly FinancePlanTestArea[]

export function buildFinancePlanTestMatrix(
  states: Partial<Record<string, FinancePlanEvidenceState>> = {}
): FinancePlanTestArea[] {
  return FINANCE_PLAN_TEST_MATRIX_DEFINITIONS.map((area) => ({
    ...area,
    state: states[area.id] ?? area.state,
  }))
}

export function countFinancePlanTestMatrix(
  areas: readonly FinancePlanTestArea[]
): FinancePlanEvidenceCounts {
  return countFinancePlanEvidence(areas)
}

export const FINANCE_PLAN_TEST_MATRIX = buildFinancePlanTestMatrix()

export const FINANCE_PLAN_TEST_MATRIX_COUNTS = countFinancePlanTestMatrix(
  FINANCE_PLAN_TEST_MATRIX
)
