import { FINANCE_RELEASE_PLAN_BATCHES } from "./finance-release-plan-batches"
import type { FinancePlanDecisionItemCounts } from "./finance-plan-decision-progress"
import { FINANCE_PLAN_DECISION_PROGRESS } from "./finance-plan-decision-progress"
import type { FinancePlanEvidenceCounts } from "./finance-plan-evidence"
import type {
  FinancePlanDecisionItem,
  FinancePlanResearchItem,
  FinanceReleasePlanDefinition,
} from "./finance-release-plan-data"
import { FINANCE_PLAN_RESEARCH_PROGRESS } from "./finance-plan-research-progress"
import { FINANCE_RELEASE_PLAN_RESEARCH } from "./finance-release-plan-research"
import { FINANCE_RELEASE_PLAN_SUPPORT_NODES } from "./finance-release-plan-support"

export type FinancePlanOpenInputKind = "decision" | "research"

export type FinancePlanOpenInput = {
  batchIds: string[]
  batchLabels: string[]
  decisionItemCounts: FinancePlanDecisionItemCounts | null
  decisionItems: FinancePlanDecisionItem[]
  kind: FinancePlanOpenInputKind
  nodeId: string
  researchItemCounts: FinancePlanEvidenceCounts | null
  researchItems: FinancePlanResearchItem[]
  statusLabel: string
  summary: string
  title: string
}

const FINANCE_RELEASE_PLAN_DECISIONS =
  FINANCE_RELEASE_PLAN_SUPPORT_NODES.filter((node) => node.kind === "decision")

const FINANCE_PLAN_DECISION_PROGRESS_INDEX = new Map(
  FINANCE_PLAN_DECISION_PROGRESS.map((decision) => [decision.nodeId, decision])
)

const FINANCE_RELEASE_PLAN_OPEN_DECISIONS =
  FINANCE_RELEASE_PLAN_DECISIONS.filter(
    (node) =>
      FINANCE_PLAN_DECISION_PROGRESS_INDEX.get(node.id)?.inputState === "open"
  )

const FINANCE_PLAN_RESEARCH_PROGRESS_INDEX = new Map(
  FINANCE_PLAN_RESEARCH_PROGRESS.map((research) => [research.nodeId, research])
)

const FINANCE_RELEASE_PLAN_OPEN_RESEARCH = FINANCE_RELEASE_PLAN_RESEARCH.filter(
  (node) =>
    FINANCE_PLAN_RESEARCH_PROGRESS_INDEX.get(node.id)?.inputState === "open"
)

function buildOpenInput(
  node: FinanceReleasePlanDefinition,
  kind: FinancePlanOpenInputKind
): FinancePlanOpenInput {
  const blockedBatches = FINANCE_RELEASE_PLAN_BATCHES.filter((batch) =>
    batch.inputNodeIds?.includes(node.id)
  )
  const researchProgress = FINANCE_PLAN_RESEARCH_PROGRESS_INDEX.get(node.id)
  const decisionProgress = FINANCE_PLAN_DECISION_PROGRESS_INDEX.get(node.id)

  return {
    batchIds: blockedBatches.map((batch) => batch.id),
    batchLabels: blockedBatches.map((batch) => `Batch ${batch.sequence}`),
    decisionItemCounts: decisionProgress?.itemCounts ?? null,
    decisionItems: decisionProgress?.items ?? [],
    kind,
    nodeId: node.id,
    researchItemCounts: researchProgress?.itemCounts ?? null,
    researchItems: researchProgress?.items ?? [],
    statusLabel:
      decisionProgress?.decisionState === "changes_required"
        ? "Changes required"
        : node.statusLabel,
    summary: node.summary,
    title: node.title,
  }
}

export const FINANCE_PLAN_OPEN_DECISIONS =
  FINANCE_RELEASE_PLAN_OPEN_DECISIONS.map((node) =>
    buildOpenInput(node, "decision")
  )

export const FINANCE_PLAN_OPEN_RESEARCH =
  FINANCE_RELEASE_PLAN_OPEN_RESEARCH.map((node) =>
    buildOpenInput(node, "research")
  )

export const FINANCE_PLAN_OPEN_INPUTS = [
  ...FINANCE_PLAN_OPEN_DECISIONS,
  ...FINANCE_PLAN_OPEN_RESEARCH,
]

export const FINANCE_PLAN_OPEN_INPUT_COUNTS = {
  decisions: FINANCE_PLAN_OPEN_DECISIONS.length,
  research: FINANCE_PLAN_OPEN_RESEARCH.length,
  total: FINANCE_PLAN_OPEN_INPUTS.length,
} as const
