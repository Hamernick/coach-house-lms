import type { FinancePlanningViewId } from "./finance-plan-diagram-data"

export type FinancePlanDiagramTraceabilityEntry = {
  label: string
  sourceConnectionCount: number
  sourceKind: "entity relationship" | "flowchart" | "sequence"
  sourceSection: string
  viewId: FinancePlanningViewId
}

export const FINANCE_PLAN_DIAGRAM_TRACEABILITY = [
  {
    label: "System architecture",
    sourceConnectionCount: 16,
    sourceKind: "flowchart",
    sourceSection: "System Architecture",
    viewId: "system",
  },
  {
    label: "External banking and record ownership",
    sourceConnectionCount: 9,
    sourceKind: "flowchart",
    sourceSection: "External record flow",
    viewId: "custody",
  },
  {
    label: "External records and review",
    sourceConnectionCount: 8,
    sourceKind: "sequence",
    sourceSection: "Finance Records Design",
    viewId: "webhooks",
  },
  {
    label: "Data ownership",
    sourceConnectionCount: 20,
    sourceKind: "entity relationship",
    sourceSection: "Data Model",
    viewId: "data",
  },
  {
    label: "Signup and protected action replay",
    sourceConnectionCount: 9,
    sourceKind: "sequence",
    sourceSection: "Public Signup And Contact Flow",
    viewId: "signup",
  },
  {
    label: "Cooling-center relevance",
    sourceConnectionCount: 10,
    sourceKind: "flowchart",
    sourceSection: "Cooling Centers And Weather",
    viewId: "weather",
  },
  {
    label: "Historical seven-batch dependencies",
    sourceConnectionCount: 10,
    sourceKind: "flowchart",
    sourceSection: "Historical Seven Merge Batches",
    viewId: "dependencies",
  },
] as const satisfies readonly FinancePlanDiagramTraceabilityEntry[]

export const FINANCE_PLAN_DIAGRAM_TRACEABILITY_COUNT =
  FINANCE_PLAN_DIAGRAM_TRACEABILITY.length
