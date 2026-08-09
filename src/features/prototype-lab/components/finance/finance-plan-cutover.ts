import type { FinancePlanningViewId } from "./finance-plan-diagram-data"
import {
  countFinancePlanEvidence,
  type FinancePlanEvidenceCounts,
} from "./finance-plan-evidence"
import type { FinancePlanEvidenceState } from "./finance-release-plan-data"

export type FinancePlanCutoverRule = {
  id: string
  state: FinancePlanEvidenceState
  target: {
    nodeId: string
    viewId: FinancePlanningViewId
  }
  title: string
}

const FINANCE_PLAN_CUTOVER_DEFINITIONS = [
  {
    id: "cutover-never-force-push-main",
    state: "not_started",
    target: { nodeId: "assurance-clean-artifact", viewId: "assurance" },
    title: "Never force-push main",
  },
  {
    id: "cutover-never-deploy-stale-branch",
    state: "not_started",
    target: { nodeId: "unsafe-tree-start", viewId: "roadmap" },
    title: "Never deploy from the current stale branch",
  },
  {
    id: "cutover-corrective-migrations-only",
    state: "not_started",
    target: { nodeId: "batch-1-baseline-onboarding", viewId: "roadmap" },
    title:
      "Never alter an already-applied migration; add a new corrective migration",
  },
  {
    id: "cutover-clean-artifact-every-pr",
    state: "not_started",
    target: { nodeId: "assurance-clean-artifact", viewId: "assurance" },
    title: "Use a clean worktree and clean release artifact for every PR",
  },
  {
    id: "cutover-additive-environment",
    state: "not_started",
    target: { nodeId: "assurance-operations-ready", viewId: "assurance" },
    title: "Keep environment changes additive until rollback is proven",
  },
  {
    id: "cutover-separate-connect-webhooks",
    state: "not_started",
    target: { nodeId: "webhook-hook", viewId: "webhooks" },
    title:
      "Validate record imports in preview fixtures before any production import",
  },
  {
    id: "cutover-compatible-migration-order",
    state: "not_started",
    target: { nodeId: "batch-1-baseline-onboarding", viewId: "roadmap" },
    title:
      "Apply migrations before code only when the old code safely tolerates the new schema. Remove old paths only after the new path is verified",
  },
  {
    id: "cutover-canary-sequence",
    state: "not_started",
    target: { nodeId: "assurance-staff-canary", viewId: "assurance" },
    title:
      "Run staff canary, one approved organization canary, gradual enablement, then broader release",
  },
  {
    id: "cutover-production-proof",
    state: "not_started",
    target: { nodeId: "assurance-production-ready", viewId: "assurance" },
    title:
      "Do not claim production success until CI, preview, deployment, database, browser, monitoring, and rollback checks are all verified",
  },
] as const satisfies readonly FinancePlanCutoverRule[]

export function buildFinancePlanCutover(
  states: Partial<Record<string, FinancePlanEvidenceState>> = {}
): FinancePlanCutoverRule[] {
  return FINANCE_PLAN_CUTOVER_DEFINITIONS.map((rule) => ({
    ...rule,
    state: states[rule.id] ?? rule.state,
  }))
}

export function countFinancePlanCutover(
  rules: readonly FinancePlanCutoverRule[]
): FinancePlanEvidenceCounts {
  return countFinancePlanEvidence(rules)
}

export const FINANCE_PLAN_CUTOVER = buildFinancePlanCutover()

export const FINANCE_PLAN_CUTOVER_COUNTS =
  countFinancePlanCutover(FINANCE_PLAN_CUTOVER)
