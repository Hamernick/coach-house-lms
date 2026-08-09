import { FINANCE_RELEASE_PLAN_BATCHES } from "./finance-release-plan-batches"
import type {
  FinancePlanBatchWorkItem,
  FinancePlanBatchReadinessState,
  FinancePlanDecisionItemState,
  FinancePlanEvidenceState,
  FinancePlanExecutionState,
  FinancePlanGateEvidence,
  FinancePlanGateState,
  FinancePlanInputState,
  FinancePlanWorkState,
} from "./finance-release-plan-data"
import {
  buildFinancePlanBatchProgress,
  type FinancePlanBatchWorkCounts,
} from "./finance-plan-batch-progress"
import { buildFinancePlanDecisionProgress } from "./finance-plan-decision-progress"
import {
  countFinancePlanEvidence,
  deriveFinancePlanGateState,
  type FinancePlanEvidenceCounts,
} from "./finance-plan-evidence"
import { FINANCE_RELEASE_PLAN_GATES } from "./finance-release-plan-gates"
import { FINANCE_RELEASE_PLAN_RESEARCH } from "./finance-release-plan-research"
import { buildFinancePlanResearchProgress } from "./finance-plan-research-progress"
import { FINANCE_RELEASE_PLAN_SUPPORT_NODES } from "./finance-release-plan-support"

export type { FinancePlanBatchReadinessState } from "./finance-release-plan-data"

export type FinancePlanBatchReadiness = {
  batchId: string
  blockedByPredecessorBatch: boolean
  blockedByPredecessorGate: boolean
  executionState: FinancePlanExecutionState
  openInputIds: string[]
  openInputTitles: string[]
  predecessorBatchId: string | null
  predecessorLabel: string | null
  predecessorGateId: string | null
  predecessorGateLabel: string | null
  readinessState: FinancePlanBatchReadinessState
  sequence: number
  summary: string
  title: string
  workItemCounts: FinancePlanBatchWorkCounts
  workItems: FinancePlanBatchWorkItem[]
}

type FinancePlanReadinessOverrides = {
  decisionItemStates?: Partial<Record<string, FinancePlanDecisionItemState>>
  evidenceStates?: Partial<Record<string, FinancePlanEvidenceState>>
  executionStates?: Partial<Record<string, FinancePlanExecutionState>>
  inputStates?: Partial<Record<string, FinancePlanInputState>>
  researchItemStates?: Partial<Record<string, FinancePlanEvidenceState>>
  workItemStates?: Partial<Record<string, FinancePlanWorkState>>
}

export type FinancePlanGateReadiness = {
  evidence: FinancePlanGateEvidence[]
  evidenceCounts: FinancePlanEvidenceCounts
  gateId: string
  gateState: FinancePlanGateState
  sequence: number
  summary: string
  title: string
}

const FINANCE_RELEASE_PLAN_INPUT_NODES = [
  ...FINANCE_RELEASE_PLAN_SUPPORT_NODES.filter(
    (node) => node.kind === "decision"
  ),
  ...FINANCE_RELEASE_PLAN_RESEARCH,
]

const FINANCE_RELEASE_PLAN_INPUT_NODE_INDEX = new Map(
  FINANCE_RELEASE_PLAN_INPUT_NODES.map((node) => [node.id, node])
)

export function buildFinancePlanGateReadiness(
  overrides: Pick<FinancePlanReadinessOverrides, "evidenceStates"> = {}
): FinancePlanGateReadiness[] {
  return FINANCE_RELEASE_PLAN_GATES.map((gate, index) => {
    const evidence = (gate.gateEvidence ?? []).map((item) => ({
      ...item,
      state: overrides.evidenceStates?.[item.id] ?? item.state,
    }))

    return {
      evidence,
      evidenceCounts: countFinancePlanEvidence(evidence),
      gateId: gate.id,
      gateState: deriveFinancePlanGateState(evidence),
      sequence: gate.sequence ?? index + 1,
      summary: gate.summary,
      title: gate.title,
    }
  })
}

export function buildFinancePlanBatchReadiness(
  overrides: FinancePlanReadinessOverrides = {}
): FinancePlanBatchReadiness[] {
  const gateReadinessIndex = new Map(
    buildFinancePlanGateReadiness(overrides).map((gate) => [gate.gateId, gate])
  )
  const researchProgressIndex = new Map(
    buildFinancePlanResearchProgress(overrides.researchItemStates).map(
      (research) => [research.nodeId, research]
    )
  )
  const decisionProgressIndex = new Map(
    buildFinancePlanDecisionProgress(overrides.decisionItemStates).map(
      (decision) => [decision.nodeId, decision]
    )
  )
  const batchProgressIndex = new Map(
    buildFinancePlanBatchProgress(
      overrides.workItemStates,
      overrides.executionStates
    ).map((batch) => [batch.batchId, batch])
  )

  return FINANCE_RELEASE_PLAN_BATCHES.map((batch, index) => {
    const predecessor = FINANCE_RELEASE_PLAN_BATCHES[index - 1] ?? null
    const predecessorGate = FINANCE_RELEASE_PLAN_GATES[index - 1] ?? null
    const batchProgress = batchProgressIndex.get(batch.id)
    const executionState = batchProgress?.executionState ?? "not_started"
    const predecessorExecutionState = predecessor
      ? (batchProgressIndex.get(predecessor.id)?.executionState ??
        "not_started")
      : null
    const predecessorGateState = predecessorGate
      ? (gateReadinessIndex.get(predecessorGate.id)?.gateState ?? "not_started")
      : null
    const openInputs = (batch.inputNodeIds ?? []).flatMap((inputNodeId) => {
      const inputNode = FINANCE_RELEASE_PLAN_INPUT_NODE_INDEX.get(inputNodeId)
      if (!inputNode) return []
      const inputState =
        inputNode.kind === "research"
          ? (researchProgressIndex.get(inputNodeId)?.inputState ?? "open")
          : (decisionProgressIndex.get(inputNodeId)?.inputState ?? "open")
      return inputState === "open" ? [inputNode] : []
    })
    const isBlockedByPredecessorBatch = Boolean(
      predecessor && predecessorExecutionState !== "merged"
    )
    const isBlockedByPredecessorGate = Boolean(
      predecessorGate && predecessorGateState !== "proven"
    )
    const readinessState: FinancePlanBatchReadinessState =
      executionState === "merged"
        ? "merged"
        : executionState === "in_progress"
          ? "in_progress"
          : openInputs.length > 0 ||
              isBlockedByPredecessorBatch ||
              isBlockedByPredecessorGate
            ? "blocked"
            : "ready"

    return {
      batchId: batch.id,
      blockedByPredecessorBatch: isBlockedByPredecessorBatch,
      blockedByPredecessorGate: isBlockedByPredecessorGate,
      executionState,
      openInputIds: openInputs.map((input) => input.id),
      openInputTitles: openInputs.map((input) => input.title),
      predecessorBatchId: predecessor?.id ?? null,
      predecessorLabel: predecessor
        ? `After Batch ${predecessor.sequence}`
        : null,
      predecessorGateId: predecessorGate?.id ?? null,
      predecessorGateLabel: predecessorGate
        ? `Gate ${predecessorGate.sequence ?? index} not proven`
        : null,
      readinessState,
      sequence: batch.sequence ?? index + 1,
      summary: batch.summary,
      title: batch.title,
      workItemCounts: batchProgress?.workItemCounts ?? {
        complete: 0,
        inProgress: 0,
        notStarted: 0,
        total: 0,
      },
      workItems: batchProgress?.items ?? [],
    }
  })
}

export const FINANCE_PLAN_GATE_READINESS: FinancePlanGateReadiness[] =
  buildFinancePlanGateReadiness()

export const FINANCE_PLAN_BATCH_READINESS = buildFinancePlanBatchReadiness()

export const FINANCE_PLAN_BATCH_READINESS_COUNTS = {
  blocked: FINANCE_PLAN_BATCH_READINESS.filter(
    (batch) => batch.readinessState === "blocked"
  ).length,
  inProgress: FINANCE_PLAN_BATCH_READINESS.filter(
    (batch) => batch.readinessState === "in_progress"
  ).length,
  merged: FINANCE_PLAN_BATCH_READINESS.filter(
    (batch) => batch.readinessState === "merged"
  ).length,
  ready: FINANCE_PLAN_BATCH_READINESS.filter(
    (batch) => batch.readinessState === "ready"
  ).length,
  total: FINANCE_PLAN_BATCH_READINESS.length,
} as const

export const FINANCE_PLAN_GATE_EVIDENCE_COUNTS = countFinancePlanEvidence(
  FINANCE_PLAN_GATE_READINESS.flatMap((gate) => gate.evidence)
)

export const FINANCE_PLAN_GATE_READINESS_COUNTS = {
  collecting: FINANCE_PLAN_GATE_READINESS.filter(
    (gate) => gate.gateState === "collecting"
  ).length,
  notStarted: FINANCE_PLAN_GATE_READINESS.filter(
    (gate) => gate.gateState === "not_started"
  ).length,
  proven: FINANCE_PLAN_GATE_READINESS.filter(
    (gate) => gate.gateState === "proven"
  ).length,
  total: FINANCE_PLAN_GATE_READINESS.length,
} as const
