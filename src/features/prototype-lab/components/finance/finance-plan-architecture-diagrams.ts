import type { FinanceReleasePlanDefinition } from "./finance-release-plan-data"
import {
  financeDiagramNode,
  type FinancePlanDiagramEdgeDefinition,
  type FinancePlanNavigationTarget,
} from "./finance-plan-diagram-data"

function architectureNode(
  id: string,
  title: string,
  summary: string,
  x: number,
  y: number,
  kind: FinanceReleasePlanDefinition["kind"] = "service",
  statusLabel = "System"
) {
  return financeDiagramNode({
    eyebrow: "System architecture",
    id,
    kind,
    statusLabel,
    summary,
    title,
    x,
    y,
  })
}

export const FINANCE_SYSTEM_NODES = [
  architectureNode(
    "system-member",
    "Organization member",
    "Uses the existing workspace Finance surface.",
    0,
    300,
    "actor",
    "Private actor"
  ),
  architectureNode(
    "system-workspace",
    "Workspace Finance",
    "Separate Finance card and the approved Finance drawer.",
    400,
    300,
    "surface",
    "Private UI"
  ),
  architectureNode(
    "system-finance-api",
    "Finance server boundary",
    "Server actions and APIs enforce capability checks.",
    800,
    300,
    "service",
    "Server only"
  ),
  architectureNode(
    "system-stripe-connect",
    "External banking systems",
    "Move money outside the application.",
    1200,
    300,
    "external",
    "External service"
  ),
  architectureNode(
    "system-connected-account",
    "Bank or accounting source",
    "Owns the external transaction and balance truth.",
    1600,
    300,
    "external",
    "External truth"
  ),
  architectureNode(
    "system-connect-webhook",
    "Authorized entry or import",
    "Captures source-labeled external activity and evidence.",
    1600,
    620,
    "service",
    "Authorized input"
  ),
  architectureNode(
    "system-event-inbox",
    "Validation and review",
    "Rejects duplicates, invalid scope, unsafe files, and stale edits.",
    2000,
    620,
    "data",
    "Idempotent"
  ),
  architectureNode(
    "system-ledger",
    "Finance activity records",
    "Stores reconciled external activity and linked corrections.",
    2400,
    620,
    "data",
    "Recorded truth"
  ),
  architectureNode(
    "system-aggregates",
    "Source-labeled summaries",
    "Derives private and approved public totals from reconciled records.",
    2800,
    620,
    "data",
    "Derived"
  ),
  architectureNode(
    "system-public-projection",
    "Public aggregate projection",
    "Exposes safe campaign totals without donor details.",
    3200,
    620,
    "service",
    "Redacted"
  ),
  architectureNode(
    "system-visitor",
    "Public visitor",
    "Browses public resources, organizations, and campaigns.",
    3200,
    0,
    "actor",
    "Public actor"
  ),
  architectureNode(
    "system-find",
    "Find and public profiles",
    "Loads minimal lists and safe details on demand.",
    3600,
    300,
    "surface",
    "Public UI"
  ),
  architectureNode(
    "system-postgres",
    "Supabase Postgres and RLS",
    "Stores private truth and enforces final-schema policies.",
    1200,
    940,
    "data",
    "Protected data"
  ),
  architectureNode(
    "system-nws",
    "NWS weather API",
    "Supplies coarse US forecast and alert data.",
    0,
    940,
    "external",
    "External service"
  ),
  architectureNode(
    "system-weather-cache",
    "Coarse weather cache",
    "Caches area-level weather without exact user location.",
    400,
    940,
    "data",
    "Short lived"
  ),
  architectureNode(
    "system-relevance",
    "Map relevance",
    "Promotes verified resources; never changes publication truth.",
    1600,
    940,
    "service",
    "Ranking only"
  ),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_SYSTEM_EDGES = [
  ["member-workspace", "system-member", "system-workspace"],
  ["workspace-api", "system-workspace", "system-finance-api"],
  ["stripe-account", "system-stripe-connect", "system-connected-account"],
  ["stripe-webhook", "system-connected-account", "system-connect-webhook"],
  ["entry-api", "system-connect-webhook", "system-finance-api"],
  ["webhook-inbox", "system-connect-webhook", "system-event-inbox"],
  ["inbox-ledger", "system-event-inbox", "system-ledger"],
  ["ledger-aggregates", "system-ledger", "system-aggregates"],
  ["aggregates-projection", "system-aggregates", "system-public-projection"],
  ["projection-find", "system-public-projection", "system-find"],
  ["visitor-find", "system-visitor", "system-find"],
  ["api-postgres", "system-finance-api", "system-postgres"],
  ["nws-cache", "system-nws", "system-weather-cache"],
  ["cache-relevance", "system-weather-cache", "system-relevance"],
  ["postgres-relevance", "system-postgres", "system-relevance"],
  ["relevance-find", "system-relevance", "system-find"],
].map(([id, source, target]) => ({
  id,
  source,
  target,
})) satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_SYSTEM_NAVIGATION = [
  {
    label: "Member",
    nodeIds: ["system-member", "system-workspace", "system-finance-api"],
  },
  {
    label: "Records",
    nodeIds: [
      "system-stripe-connect",
      "system-connected-account",
      "system-connect-webhook",
      "system-event-inbox",
      "system-ledger",
      "system-aggregates",
    ],
  },
  {
    label: "Public",
    nodeIds: ["system-public-projection", "system-visitor", "system-find"],
  },
  {
    label: "Weather",
    nodeIds: ["system-nws", "system-weather-cache", "system-relevance"],
  },
] as const satisfies readonly FinancePlanNavigationTarget[]

function custodyNode(
  id: string,
  title: string,
  summary: string,
  x: number,
  y: number,
  statusLabel: string,
  kind: FinanceReleasePlanDefinition["kind"] = "service"
) {
  return financeDiagramNode({
    eyebrow: "External record flow",
    id,
    kind,
    statusLabel,
    summary,
    title,
    x,
    y,
  })
}

export const FINANCE_CUSTODY_NODES = [
  custodyNode(
    "custody-campaign",
    "Record scope",
    "Every record belongs to an organization and, when applicable, one sponsored project.",
    0,
    360,
    "Decision",
    "decision"
  ),
  custodyNode(
    "custody-org-account",
    "Organization banking process",
    "The organization handles money through its external bank and accounting systems.",
    440,
    0,
    "Independent"
  ),
  custodyNode(
    "custody-org-charge",
    "External transaction",
    "The transaction occurs outside Coach House.",
    880,
    0,
    "External"
  ),
  custodyNode(
    "custody-org-ledger",
    "Organization finance records",
    "Tracks source-labeled external activity and reconciliation state.",
    1320,
    0,
    "Private truth",
    "data"
  ),
  custodyNode(
    "custody-sponsor-account",
    "Sponsor banking process",
    "The sponsor handles money through its external bank and accounting systems.",
    440,
    720,
    "Sponsored"
  ),
  custodyNode(
    "custody-sponsor-charge",
    "External sponsored transaction",
    "The sponsored-project transaction occurs outside Coach House software.",
    880,
    720,
    "External"
  ),
  custodyNode(
    "custody-restricted-ledger",
    "Sponsored-project finance records",
    "Isolates source-labeled records by organization and project without claiming a bank balance.",
    1320,
    720,
    "Restricted",
    "data"
  ),
  custodyNode(
    "custody-grant-request",
    "Grant request",
    "Project requests approval for a documented use.",
    1760,
    720,
    "Requested"
  ),
  custodyNode(
    "custody-approval",
    "Sponsor approval",
    "Authorized operator approves or rejects the request.",
    2200,
    720,
    "Controlled",
    "decision"
  ),
  custodyNode(
    "custody-disbursement",
    "Recorded external payment",
    "Authorized staff records the bank payment only after it occurs externally.",
    2640,
    720,
    "Auditable",
    "data"
  ),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_CUSTODY_EDGES = [
  {
    id: "campaign-org-account",
    label: "Independent organization",
    source: "custody-campaign",
    target: "custody-org-account",
  },
  {
    id: "campaign-sponsor-account",
    label: "Fiscally sponsored project",
    source: "custody-campaign",
    target: "custody-sponsor-account",
  },
  ["org-account-charge", "custody-org-account", "custody-org-charge"],
  ["org-charge-ledger", "custody-org-charge", "custody-org-ledger"],
  [
    "sponsor-account-charge",
    "custody-sponsor-account",
    "custody-sponsor-charge",
  ],
  [
    "sponsor-charge-ledger",
    "custody-sponsor-charge",
    "custody-restricted-ledger",
  ],
  ["restricted-grant", "custody-restricted-ledger", "custody-grant-request"],
  ["grant-approval", "custody-grant-request", "custody-approval"],
  ["approval-disbursement", "custody-approval", "custody-disbursement"],
].map((definition) =>
  Array.isArray(definition)
    ? { id: definition[0], source: definition[1], target: definition[2] }
    : definition
) satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_CUSTODY_NAVIGATION = [
  {
    label: "Decision",
    nodeIds: ["custody-campaign"],
  },
  {
    label: "Independent",
    nodeIds: [
      "custody-org-account",
      "custody-org-charge",
      "custody-org-ledger",
    ],
  },
  {
    label: "Sponsored",
    nodeIds: [
      "custody-sponsor-account",
      "custody-sponsor-charge",
      "custody-restricted-ledger",
      "custody-grant-request",
      "custody-approval",
      "custody-disbursement",
    ],
  },
] as const satisfies readonly FinancePlanNavigationTarget[]

export const FINANCE_WEBHOOK_NODES = [
  custodyNode(
    "webhook-donor",
    "Authorized staff or importer",
    "Starts a record from external evidence.",
    0,
    300,
    "Actor",
    "actor"
  ),
  custodyNode(
    "webhook-link",
    "Source evidence",
    "Statement row, receipt, award notice, or external payment reference.",
    420,
    300,
    "Private evidence",
    "data"
  ),
  custodyNode(
    "webhook-stripe",
    "External bank or accounting system",
    "Remains the source of actual money movement.",
    840,
    300,
    "External service",
    "external"
  ),
  custodyNode(
    "webhook-hook",
    "Record entry or import",
    "Validates scope, source, amount, currency, date, and evidence.",
    1260,
    300,
    "Authorized input"
  ),
  custodyNode(
    "webhook-inbox",
    "Review queue",
    "Detects duplicates and holds records until authorized review.",
    1680,
    300,
    "Idempotent",
    "data"
  ),
  custodyNode(
    "webhook-ledger",
    "Reconciled finance record",
    "Preserves source, review state, and linked corrections.",
    2100,
    300,
    "Recorded truth",
    "data"
  ),
  custodyNode(
    "webhook-ui",
    "Finance and approved public summary",
    "Recomputes source-labeled summaries and invalidates tagged caches.",
    2520,
    300,
    "Derived UI",
    "surface"
  ),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_WEBHOOK_EDGES = [
  {
    id: "donor-link",
    label: "Attach evidence",
    source: "webhook-donor",
    target: "webhook-link",
  },
  {
    id: "link-stripe",
    label: "References external activity",
    source: "webhook-stripe",
    target: "webhook-link",
  },
  {
    id: "stripe-donor",
    dashed: true,
    label: "Review result",
    source: "webhook-inbox",
    target: "webhook-donor",
  },
  {
    id: "stripe-hook",
    label: "Enter or import",
    source: "webhook-link",
    target: "webhook-hook",
  },
  {
    dashed: true,
    id: "hook-stripe-ack",
    label: "Correction request",
    source: "webhook-inbox",
    target: "webhook-hook",
  },
  {
    id: "hook-inbox",
    label: "Validate and stage",
    source: "webhook-hook",
    target: "webhook-inbox",
  },
  {
    id: "inbox-ledger",
    label: "Approve and reconcile",
    source: "webhook-inbox",
    target: "webhook-ledger",
  },
  {
    id: "ledger-ui",
    label: "Aggregate and invalidate",
    source: "webhook-ledger",
    target: "webhook-ui",
  },
] as const satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_WEBHOOK_NAVIGATION = [
  {
    label: "Source",
    nodeIds: ["webhook-donor", "webhook-link", "webhook-stripe"],
  },
  {
    label: "Review",
    nodeIds: ["webhook-hook", "webhook-inbox", "webhook-ledger"],
  },
  { label: "Projection", nodeIds: ["webhook-ui"] },
] as const satisfies readonly FinancePlanNavigationTarget[]
