import type { FinanceReleasePlanDefinition } from "./finance-release-plan-data"
import {
  financeDiagramNode,
  type FinancePlanDiagramEdgeDefinition,
  type FinancePlanNavigationTarget,
} from "./finance-plan-diagram-data"

function dependencyNode(
  sequence: number,
  id: string,
  title: string,
  summary: string,
  x: number,
  y: number
) {
  return financeDiagramNode({
    eyebrow: `Release dependency · Batch ${sequence}`,
    height: 190,
    id,
    kind: "batch",
    statusLabel: `Merge ${sequence}`,
    summary,
    title,
    width: 340,
    x,
    y,
  })
}

export const FINANCE_DEPENDENCY_NODES = [
  dependencyNode(
    1,
    "dependency-batch-1",
    "Baseline and onboarding",
    "Creates the safe release base required by every later domain.",
    0,
    420
  ),
  dependencyNode(
    2,
    "dependency-batch-2",
    "Organization and workspace",
    "Establishes canonical ownership for public Find and final Finance UI.",
    460,
    0
  ),
  dependencyNode(
    3,
    "dependency-batch-3",
    "Fiscal operations",
    "Preserves the approved document, signing, requests, approvals, and external-payment records.",
    460,
    300
  ),
  dependencyNode(
    4,
    "dependency-batch-4",
    "Resource pipeline",
    "Produces verified public resources before Find scales its delivery path.",
    460,
    600
  ),
  dependencyNode(
    6,
    "dependency-batch-6",
    "Finance records foundation",
    "Proves record ownership, imports, review, corrections, and reconciliation before UI cutover.",
    460,
    900
  ),
  dependencyNode(
    5,
    "dependency-batch-5",
    "Public Find and signup",
    "Combines workspace identity with the verified resource publication path.",
    920,
    300
  ),
  dependencyNode(
    7,
    "dependency-batch-7",
    "Finance experience and cutover",
    "Integrates workspace, fiscal, Find, and records-only Finance after each is proven.",
    1380,
    420
  ),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_DEPENDENCY_EDGES = [
  ["dependency-1-2", "dependency-batch-1", "dependency-batch-2"],
  ["dependency-1-3", "dependency-batch-1", "dependency-batch-3"],
  ["dependency-1-4", "dependency-batch-1", "dependency-batch-4"],
  ["dependency-1-6", "dependency-batch-1", "dependency-batch-6"],
  ["dependency-2-5", "dependency-batch-2", "dependency-batch-5"],
  ["dependency-4-5", "dependency-batch-4", "dependency-batch-5"],
  ["dependency-2-7", "dependency-batch-2", "dependency-batch-7"],
  ["dependency-3-7", "dependency-batch-3", "dependency-batch-7"],
  ["dependency-5-7", "dependency-batch-5", "dependency-batch-7"],
  ["dependency-6-7", "dependency-batch-6", "dependency-batch-7"],
].map(([id, source, target]) => ({
  id,
  source,
  target,
})) satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_DEPENDENCY_NAVIGATION = [
  { label: "Baseline", nodeIds: ["dependency-batch-1"] },
  {
    label: "Public path",
    nodeIds: ["dependency-batch-2", "dependency-batch-4", "dependency-batch-5"],
  },
  {
    label: "Finance path",
    nodeIds: ["dependency-batch-3", "dependency-batch-6", "dependency-batch-7"],
  },
  { label: "Cutover", nodeIds: ["dependency-batch-7"] },
] as const satisfies readonly FinancePlanNavigationTarget[]
