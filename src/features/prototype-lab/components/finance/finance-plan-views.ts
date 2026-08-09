import {
  FINANCE_CUSTODY_EDGES,
  FINANCE_CUSTODY_NAVIGATION,
  FINANCE_CUSTODY_NODES,
  FINANCE_SYSTEM_EDGES,
  FINANCE_SYSTEM_NAVIGATION,
  FINANCE_SYSTEM_NODES,
  FINANCE_WEBHOOK_EDGES,
  FINANCE_WEBHOOK_NAVIGATION,
  FINANCE_WEBHOOK_NODES,
} from "./finance-plan-architecture-diagrams"
import {
  FINANCE_ASSURANCE_EDGES,
  FINANCE_ASSURANCE_NAVIGATION,
  FINANCE_ASSURANCE_NODES,
} from "./finance-plan-assurance-diagram"
import {
  buildFinanceDiagramEdges,
  buildFinanceDiagramNodes,
  type FinancePlanningView,
  type FinancePlanningViewId,
} from "./finance-plan-diagram-data"
import {
  FINANCE_DEPENDENCY_EDGES,
  FINANCE_DEPENDENCY_NAVIGATION,
  FINANCE_DEPENDENCY_NODES,
} from "./finance-plan-dependency-diagram"
import {
  FINANCE_DATA_EDGES,
  FINANCE_DATA_NAVIGATION,
  FINANCE_DATA_NODES,
  FINANCE_SIGNUP_EDGES,
  FINANCE_SIGNUP_NAVIGATION,
  FINANCE_SIGNUP_NODES,
  FINANCE_WEATHER_EDGES,
  FINANCE_WEATHER_NAVIGATION,
  FINANCE_WEATHER_NODES,
} from "./finance-plan-domain-diagrams"
import {
  buildFinanceReleasePlanEdges,
  buildFinanceReleasePlanNodes,
  FINANCE_RELEASE_PLAN_NAVIGATION,
} from "./finance-release-plan-model"

export const FINANCE_PLANNING_VIEWS = [
  {
    id: "roadmap",
    label: "Roadmap",
    title: "Seven-batch release roadmap",
    summary:
      "Approvals, research, merge order, proof gates, rollback, and production readiness.",
    sourceSection: "Exactly Seven Merge Batches",
    buildNodes: buildFinanceReleasePlanNodes,
    buildEdges: buildFinanceReleasePlanEdges,
    initialNodeIds: ["unsafe-tree-start", "batch-1-baseline-onboarding"],
    navigation: FINANCE_RELEASE_PLAN_NAVIGATION,
  },
  {
    id: "dependencies",
    label: "Dependencies",
    title: "Cross-batch dependency map",
    summary:
      "Shows which domain foundations must be proven before public Find and final Finance cutover.",
    sourceSection: "Exactly Seven Merge Batches",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_DEPENDENCY_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_DEPENDENCY_EDGES),
    initialNodeIds: FINANCE_DEPENDENCY_NAVIGATION[0].nodeIds,
    navigation: FINANCE_DEPENDENCY_NAVIGATION,
  },
  {
    id: "system",
    label: "System",
    title: "System ownership and data flow",
    summary:
      "Private Finance records, source-labeled projections, public Find, and weather relevance.",
    sourceSection: "System Architecture",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_SYSTEM_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_SYSTEM_EDGES),
    initialNodeIds: FINANCE_SYSTEM_NAVIGATION[0].nodeIds,
    navigation: FINANCE_SYSTEM_NAVIGATION,
  },
  {
    id: "custody",
    label: "Fiscal flow",
    title: "External banking and fiscal record flow",
    summary:
      "Money moves externally; the application records scoped evidence, requests, decisions, and completed bank payments.",
    sourceSection: "External record flow",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_CUSTODY_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_CUSTODY_EDGES),
    initialNodeIds: [
      "custody-campaign",
      "custody-org-account",
      "custody-org-charge",
      "custody-org-ledger",
    ],
    navigation: FINANCE_CUSTODY_NAVIGATION,
  },
  {
    id: "webhooks",
    label: "Records",
    title: "External record-to-report sequence",
    summary:
      "Authorized external evidence becomes reviewed records and source-labeled summaries.",
    sourceSection: "Finance Records Design",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_WEBHOOK_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_WEBHOOK_EDGES),
    initialNodeIds: FINANCE_WEBHOOK_NAVIGATION[0].nodeIds,
    navigation: FINANCE_WEBHOOK_NAVIGATION,
  },
  {
    id: "data",
    label: "Data",
    title: "Data ownership and truth boundaries",
    summary:
      "Reconciled records, imports, sponsored projects, opportunities, and map lists use separate canonical records.",
    sourceSection: "Data Model",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_DATA_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_DATA_EDGES),
    initialNodeIds: FINANCE_DATA_NAVIGATION[0].nodeIds,
    navigation: FINANCE_DATA_NAVIGATION,
  },
  {
    id: "signup",
    label: "Signup",
    title: "In-map signup and protected action replay",
    summary:
      "Authentication overlays the mounted map, restores context, and replays one authorized action.",
    sourceSection: "Public Signup And Contact Flow",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_SIGNUP_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_SIGNUP_EDGES),
    initialNodeIds: FINANCE_SIGNUP_NAVIGATION[0].nodeIds,
    navigation: FINANCE_SIGNUP_NAVIGATION,
  },
  {
    id: "weather",
    label: "Weather",
    title: "Cooling-center weather relevance",
    summary:
      "NWS signals may elevate verified cooling centers but never publish, hide, or claim operational truth.",
    sourceSection: "Cooling Centers And Weather",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_WEATHER_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_WEATHER_EDGES),
    initialNodeIds: FINANCE_WEATHER_NAVIGATION[0].nodeIds,
    navigation: FINANCE_WEATHER_NAVIGATION,
  },
  {
    id: "assurance",
    label: "Assurance",
    title: "Security, test, and production assurance",
    summary:
      "Connects required boundaries to test evidence, clean artifacts, monitoring, canaries, rollback, and definition of done.",
    sourceSection: "Test And Edge-Case Matrix",
    buildNodes: () => buildFinanceDiagramNodes(FINANCE_ASSURANCE_NODES),
    buildEdges: () => buildFinanceDiagramEdges(FINANCE_ASSURANCE_EDGES),
    initialNodeIds: FINANCE_ASSURANCE_NAVIGATION[0].nodeIds,
    navigation: FINANCE_ASSURANCE_NAVIGATION,
  },
] as const satisfies readonly FinancePlanningView[]

export const FINANCE_PLANNING_VIEW_COUNT = FINANCE_PLANNING_VIEWS.length

const FINANCE_PLANNING_VIEW_NODE_IDS = new Map(
  FINANCE_PLANNING_VIEWS.map((view) => [
    view.id,
    new Set(view.buildNodes().map((node) => node.id)),
  ])
)

export function resolveFinancePlanningViewId(
  viewId: string | null | undefined
): FinancePlanningViewId {
  const matchingView = FINANCE_PLANNING_VIEWS.find((view) => view.id === viewId)
  return matchingView?.id ?? "roadmap"
}

export function resolveFinancePlanningNodeId(
  viewId: FinancePlanningViewId,
  nodeId: string | null | undefined
) {
  if (!nodeId) return null
  return FINANCE_PLANNING_VIEW_NODE_IDS.get(viewId)?.has(nodeId) ? nodeId : null
}

export function getFinancePlanningView(viewId: FinancePlanningViewId) {
  return (
    FINANCE_PLANNING_VIEWS.find((view) => view.id === viewId) ??
    FINANCE_PLANNING_VIEWS[0]
  )
}
