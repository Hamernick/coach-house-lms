import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  buildFinancePlanCutover,
  countFinancePlanCutover,
} from "./finance-plan-cutover"
import {
  buildFinancePlanFailureStates,
  countFinancePlanFailureStates,
} from "./finance-plan-failure-states"
import type { FinancePlanEvidenceState } from "./finance-release-plan-data"
import {
  buildFinancePlanTestMatrix,
  countFinancePlanTestMatrix,
} from "./finance-plan-test-matrix"
import {
  buildFinancePlanSecurityControls,
  countFinancePlanSecurityControls,
} from "./finance-plan-security-controls"

export type FinancePlanCompletionCriterion = {
  id: string
  state: FinancePlanEvidenceState
  target: {
    nodeId: string
    viewId: FinancePlanningViewId
  }
  title: string
}

const FINANCE_PLAN_COMPLETION_DEFINITIONS = [
  {
    id: "completion-approvals-recorded",
    state: "not_started",
    target: {
      nodeId: "assurance-approval-record",
      viewId: "assurance",
    },
    title: "All four approval decisions are recorded",
  },
  {
    id: "completion-seven-prs",
    state: "not_started",
    target: {
      nodeId: "assurance-clean-artifact",
      viewId: "assurance",
    },
    title: "Seven PRs merge in the stated order without force-pushes",
  },
  {
    id: "completion-onboarding-recovery",
    state: "not_started",
    target: {
      nodeId: "batch-1-baseline-onboarding",
      viewId: "roadmap",
    },
    title:
      "Karissa and a second preexisting affected user advance past organization setup without losing organization data",
  },
  {
    id: "completion-direct-charges",
    state: "not_started",
    target: {
      nodeId: "custody-org-charge",
      viewId: "custody",
    },
    title: "The application never moves money or stores bank credentials",
  },
  {
    id: "completion-finance-reconciliation",
    state: "not_started",
    target: {
      nodeId: "data-public-aggregates",
      viewId: "data",
    },
    title: "Finance summaries reconcile to source-labeled external records",
  },
  {
    id: "completion-public-privacy",
    state: "not_started",
    target: {
      nodeId: "assurance-public-resilience",
      viewId: "assurance",
    },
    title:
      "No donor PII or private contact data appears in anonymous responses",
  },
  {
    id: "completion-sponsor-policy",
    state: "not_started",
    target: {
      nodeId: "custody-restricted-ledger",
      viewId: "custody",
    },
    title:
      "The counsel-approved document remains canonical; fiscal records, requests, decisions, and externally executed payments remain isolated by organization/project and never imply in-app disbursement",
  },
  {
    id: "completion-finance-states",
    state: "not_started",
    target: {
      nodeId: "assurance-journey-tests",
      viewId: "assurance",
    },
    title:
      "Finance is useful and truthful at zero and under delayed/error states",
  },
  {
    id: "completion-map-auth-replay",
    state: "not_started",
    target: {
      nodeId: "signup-server",
      viewId: "signup",
    },
    title:
      "Map auth preserves context and replays one authorized pending action",
  },
  {
    id: "completion-weather-relevance",
    state: "not_started",
    target: {
      nodeId: "weather-rule",
      viewId: "weather",
    },
    title: "Cooling centers stay searchable and weather only adjusts relevance",
  },
  {
    id: "completion-resource-publication",
    state: "not_started",
    target: {
      nodeId: "gate-4-resource-publication",
      viewId: "roadmap",
    },
    title:
      "Resource publication reports exact gate counts and includes no raw candidates",
  },
  {
    id: "completion-clean-canary",
    state: "not_started",
    target: {
      nodeId: "assurance-production-ready",
      viewId: "assurance",
    },
    title:
      "Full repository quality, visual, performance, RLS, and production canary gates pass from a clean release artifact",
  },
] as const satisfies readonly FinancePlanCompletionCriterion[]

export function buildFinancePlanCompletion(
  states: Partial<Record<string, FinancePlanEvidenceState>> = {},
  cutoverStates: Partial<Record<string, FinancePlanEvidenceState>> = {},
  testAreaStates: Partial<Record<string, FinancePlanEvidenceState>> = {},
  securityControlStates: Partial<Record<string, FinancePlanEvidenceState>> = {},
  failureStateStates: Partial<Record<string, FinancePlanEvidenceState>> = {}
): FinancePlanCompletionCriterion[] {
  const cutoverCounts = countFinancePlanCutover(
    buildFinancePlanCutover(cutoverStates)
  )
  const cutoverProven =
    cutoverCounts.total > 0 && cutoverCounts.verified === cutoverCounts.total
  const testCounts = countFinancePlanTestMatrix(
    buildFinancePlanTestMatrix(testAreaStates)
  )
  const testsProven =
    testCounts.total > 0 && testCounts.verified === testCounts.total
  const securityCounts = countFinancePlanSecurityControls(
    buildFinancePlanSecurityControls(securityControlStates)
  )
  const securityProven =
    securityCounts.total > 0 && securityCounts.verified === securityCounts.total
  const failureCounts = countFinancePlanFailureStates(
    buildFinancePlanFailureStates(failureStateStates)
  )
  const failuresProven =
    failureCounts.total > 0 && failureCounts.verified === failureCounts.total

  return FINANCE_PLAN_COMPLETION_DEFINITIONS.map((criterion) => {
    const requestedState = states[criterion.id] ?? criterion.state
    const state =
      criterion.id === "completion-clean-canary" &&
      requestedState === "verified" &&
      (!cutoverProven || !testsProven || !securityProven || !failuresProven)
        ? "collecting"
        : requestedState

    return {
      ...criterion,
      state,
    }
  })
}

export const FINANCE_PLAN_COMPLETION = buildFinancePlanCompletion()

export const FINANCE_PLAN_COMPLETION_COUNTS = {
  collecting: FINANCE_PLAN_COMPLETION.filter(
    (criterion) => criterion.state === "collecting"
  ).length,
  notStarted: FINANCE_PLAN_COMPLETION.filter(
    (criterion) => criterion.state === "not_started"
  ).length,
  total: FINANCE_PLAN_COMPLETION.length,
  verified: FINANCE_PLAN_COMPLETION.filter(
    (criterion) => criterion.state === "verified"
  ).length,
} as const
