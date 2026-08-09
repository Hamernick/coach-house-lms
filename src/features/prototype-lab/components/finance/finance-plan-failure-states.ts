import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  countFinancePlanEvidence,
  type FinancePlanEvidenceCounts,
} from "./finance-plan-evidence"
import type { FinancePlanEvidenceState } from "./finance-release-plan-data"

export type FinancePlanFailureState = {
  id: string
  state: FinancePlanEvidenceState
  target: {
    nodeId: string
    viewId: FinancePlanningViewId
  }
  title: string
}

const FINANCE_PLAN_FAILURE_STATE_DEFINITIONS = [
  {
    id: "failure-not-connected",
    state: "not_started",
    target: { nodeId: "system-connected-account", viewId: "system" },
    title:
      "No records: show Add record or Import records, never a fabricated $0.00",
  },
  {
    id: "failure-account-creating",
    state: "not_started",
    target: { nodeId: "system-stripe-connect", viewId: "system" },
    title:
      "Importing records: disable repeat submission and show durable progress",
  },
  {
    id: "failure-onboarding-required",
    state: "not_started",
    target: { nodeId: "system-connected-account", viewId: "system" },
    title:
      "Missing source or evidence: keep the record in Draft or Needs review",
  },
  {
    id: "failure-account-requirements",
    state: "not_started",
    target: { nodeId: "system-connected-account", viewId: "system" },
    title:
      "Review overdue or evidence invalid: show the exact issue and recovery action",
  },
  {
    id: "failure-verified-zero",
    state: "not_started",
    target: { nodeId: "assurance-financial-truth", viewId: "assurance" },
    title: "Reconciled zero: show $0.00 with source and as-of time",
  },
  {
    id: "failure-payment-link",
    state: "not_started",
    target: { nodeId: "webhook-link", viewId: "webhooks" },
    title:
      "External campaign URL missing/inactive: omit the public action and show an internal repair action",
  },
  {
    id: "failure-campaign-state",
    state: "not_started",
    target: { nodeId: "data-campaigns", viewId: "data" },
    title:
      "Campaign active, ended, funded, paused, or archived: show distinct public and private states",
  },
  {
    id: "failure-stripe-unavailable",
    state: "not_started",
    target: { nodeId: "assurance-failure-drills", viewId: "assurance" },
    title:
      "Import source unavailable: retain the last reconciled state without claiming freshness",
  },
  {
    id: "failure-no-transactions",
    state: "not_started",
    target: { nodeId: "assurance-journey-tests", viewId: "assurance" },
    title: "No transactions: show campaign readiness, not an empty chart",
  },
  {
    id: "failure-no-opportunities",
    state: "not_started",
    target: { nodeId: "data-opportunities", viewId: "data" },
    title:
      "No opportunities: explain filters and profile fields that improve matching",
  },
  {
    id: "failure-webhook-delayed",
    state: "not_started",
    target: { nodeId: "webhook-ui", viewId: "webhooks" },
    title:
      "Import delayed: show “Updating” with last successful import, not a false zero",
  },
  {
    id: "failure-reconciliation-mismatch",
    state: "not_started",
    target: { nodeId: "assurance-financial-truth", viewId: "assurance" },
    title:
      "Reconciliation mismatch: freeze the affected summary, flag operators, and retain the previous reconciled display with timestamp",
  },
  {
    id: "failure-weather-unavailable",
    state: "not_started",
    target: { nodeId: "weather-neutral", viewId: "weather" },
    title:
      "Weather unavailable: keep centers normally ranked and show no weather claim",
  },
  {
    id: "failure-public-detail",
    state: "not_started",
    target: { nodeId: "assurance-public-resilience", viewId: "assurance" },
    title: "Public detail failure: retain list/map context with Retry",
  },
  {
    id: "failure-auth-replay",
    state: "not_started",
    target: { nodeId: "signup-safe-intent", viewId: "signup" },
    title:
      "Auth replay failure: keep the user signed in and present Retry without losing the selected object",
  },
] as const satisfies readonly FinancePlanFailureState[]

export function buildFinancePlanFailureStates(
  states: Partial<Record<string, FinancePlanEvidenceState>> = {}
): FinancePlanFailureState[] {
  return FINANCE_PLAN_FAILURE_STATE_DEFINITIONS.map((failureState) => ({
    ...failureState,
    state: states[failureState.id] ?? failureState.state,
  }))
}

export function countFinancePlanFailureStates(
  failureStates: readonly FinancePlanFailureState[]
): FinancePlanEvidenceCounts {
  return countFinancePlanEvidence(failureStates)
}

export const FINANCE_PLAN_FAILURE_STATES = buildFinancePlanFailureStates()

export const FINANCE_PLAN_FAILURE_STATE_COUNTS = countFinancePlanFailureStates(
  FINANCE_PLAN_FAILURE_STATES
)
