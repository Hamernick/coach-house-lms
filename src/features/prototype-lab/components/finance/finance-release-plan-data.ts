export type FinanceReleasePlanNodeKind =
  | "lane"
  | "start"
  | "guardrail"
  | "decision"
  | "batch"
  | "gate"
  | "research"
  | "finish"
  | "actor"
  | "surface"
  | "service"
  | "data"
  | "external"

export type FinanceReleasePlanSection = {
  items: string[]
  label: string
}

export type FinancePlanExecutionState = "in_progress" | "merged" | "not_started"

export type FinancePlanWorkState = "complete" | "in_progress" | "not_started"

export type FinancePlanBatchWorkItem = {
  id: string
  state: FinancePlanWorkState
  title: string
}

export type FinancePlanBatchReadinessState =
  | "blocked"
  | "in_progress"
  | "merged"
  | "ready"

export type FinancePlanGateState = "collecting" | "not_started" | "proven"

export type FinancePlanEvidenceState = "collecting" | "not_started" | "verified"

export type FinancePlanGateEvidence = {
  id: string
  state: FinancePlanEvidenceState
  title: string
}

export type FinancePlanResearchItemKind = "evidence" | "question"

export type FinancePlanResearchItem = {
  id: string
  kind: FinancePlanResearchItemKind
  state: FinancePlanEvidenceState
  title: string
}

export type FinancePlanInputState = "open" | "resolved"

export type FinancePlanDecisionItemState =
  | "approved"
  | "changes_required"
  | "pending"

export type FinancePlanDecisionItem = {
  id: string
  state: FinancePlanDecisionItemState
  title: string
}

export type FinanceReleasePlanNodeData = {
  dependencies?: string[]
  decisionItems?: FinancePlanDecisionItem[]
  diagram?: boolean
  eyebrow: string
  executionState?: FinancePlanExecutionState
  workItems?: FinancePlanBatchWorkItem[]
  footer?: string
  gateEvidence?: FinancePlanGateEvidence[]
  gateState?: FinancePlanGateState
  inputNodeIds?: string[]
  inputState?: FinancePlanInputState
  kind: FinanceReleasePlanNodeKind
  readinessDetails?: string[]
  readinessState?: FinancePlanBatchReadinessState
  researchItems?: FinancePlanResearchItem[]
  sequence?: number
  sections: FinanceReleasePlanSection[]
  statusLabel: string
  summary: string
  title: string
}

export type FinanceReleasePlanDefinition = FinanceReleasePlanNodeData & {
  height: number
  id: string
  width: number
  x: number
  y: number
}

export const FINANCE_RELEASE_PLAN_NODE_IDS = {
  approvalFinance: "approval-finance-information-architecture",
  approvalFiscal: "approval-fiscal-custody",
  approvalRelease: "approval-release-sequence",
  approvalVisual: "approval-visual-references",
  batch1: "batch-1-baseline-onboarding",
  batch2: "batch-2-organization-workspace",
  batch3: "batch-3-fiscal-operations",
  batch4: "batch-4-resource-publication",
  batch5: "batch-5-find-signup-location-weather",
  batch6: "batch-6-finance-stripe-connect",
  batch7: "batch-7-finance-experience-cutover",
  finish: "production-ready",
  gate1: "gate-1-baseline-onboarding",
  gate2: "gate-2-organization-workspace",
  gate3: "gate-3-fiscal-operations",
  gate4: "gate-4-resource-publication",
  gate5: "gate-5-find-signup-location-weather",
  gate6: "gate-6-finance-stripe-connect",
  gate7: "gate-7-production-cutover",
  guardrails: "non-negotiable-guardrails",
  laneApprovals: "lane-approvals",
  laneRelease: "lane-release",
  laneResearch: "lane-research",
  research1: "research-1-release-onboarding",
  research2: "research-2-workspace-foundation",
  research3: "research-3-fiscal-policy",
  research4: "research-4-resource-inventory",
  research5: "research-5-map-privacy-weather",
  research6: "research-6-stripe-connect",
  research7: "research-7-visual-cutover",
  start: "unsafe-tree-start",
} as const
