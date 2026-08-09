import type { FinanceReleasePlanDefinition } from "./finance-release-plan-data"
import {
  financeDiagramNode,
  type FinancePlanDiagramEdgeDefinition,
  type FinancePlanNavigationTarget,
} from "./finance-plan-diagram-data"

function entityNode(
  id: string,
  title: string,
  summary: string,
  x: number,
  y: number,
  statusLabel = "Private table"
) {
  return financeDiagramNode({
    eyebrow: "Data model",
    id,
    kind: "data",
    statusLabel,
    summary,
    title,
    x,
    y,
  })
}

export const FINANCE_DATA_NODES = [
  entityNode(
    "data-organizations",
    "organizations",
    "Canonical owner for workspace, Finance, and member collections.",
    0,
    0
  ),
  entityNode(
    "data-stripe-accounts",
    "finance_record_sources",
    "Approved external bank, accounting, statement, receipt, or manual source labels.",
    400,
    0
  ),
  entityNode(
    "data-campaigns",
    "fundraising_campaigns",
    "Owns goals, optional external link, state, and visibility.",
    800,
    0
  ),
  entityNode(
    "data-ledger",
    "finance_records",
    "Source-labeled external inflows, fees, reversals, payments, and corrections.",
    1200,
    0
  ),
  entityNode(
    "data-public-aggregates",
    "public_campaign_aggregates",
    "Safe totals projected from reconciled record truth.",
    1600,
    0,
    "Public projection"
  ),
  entityNode(
    "data-programs",
    "programs",
    "Optional program funded by one or more campaigns.",
    400,
    260
  ),
  entityNode(
    "data-private-donors",
    "private_donors",
    "Private donor details referenced only when permitted.",
    1600,
    260
  ),
  entityNode(
    "data-import-batches",
    "finance_import_batches",
    "Tracks uploaded external data and its provenance.",
    400,
    620
  ),
  entityNode(
    "data-external-entries",
    "external_finance_entries",
    "Draft and imported records remain separate until authorized reconciliation.",
    800,
    620
  ),
  entityNode(
    "data-fiscal-projects",
    "fiscal_sponsorship_projects",
    "Canonical sponsored project and operator access boundary.",
    0,
    1040
  ),
  entityNode(
    "data-restricted-funds",
    "fiscal_finance_summaries",
    "One indexed, RLS-isolated recorded summary per organization and approved project; never a bank balance.",
    400,
    1040
  ),
  entityNode(
    "data-restricted-entries",
    "fiscal_finance_records",
    "Source-labeled external activity, decisions, corrections, and evidence.",
    800,
    1040
  ),
  entityNode(
    "data-grant-requests",
    "grant_requests",
    "Requests documented uses under the approved agreement.",
    400,
    1300
  ),
  entityNode(
    "data-disbursements",
    "external_payment_records",
    "Records externally executed bank payments, evidence, and review status.",
    800,
    1300
  ),
  entityNode(
    "data-reporting-periods",
    "reporting_periods",
    "Defines required sponsor and project reports.",
    800,
    1560
  ),
  entityNode(
    "data-opportunities",
    "opportunities",
    "Canonical funding source and requirement record.",
    0,
    1880
  ),
  entityNode(
    "data-opportunity-matches",
    "organization_opportunity_matches",
    "Organization-specific fit, save, and dismissal state.",
    400,
    1880
  ),
  entityNode(
    "data-applications",
    "opportunity_applications",
    "Tracks the reusable seven-stage application workflow.",
    800,
    1880
  ),
  entityNode(
    "data-map-lists",
    "map_lists",
    "Private by default; explicitly shared through a safe slug.",
    400,
    2260
  ),
  entityNode(
    "data-map-items",
    "map_list_items",
    "Typed organization or resource membership with notes.",
    800,
    2260
  ),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_DATA_EDGES = [
  ["organizations-stripe", "data-organizations", "data-stripe-accounts"],
  ["organizations-campaigns", "data-organizations", "data-campaigns"],
  ["programs-campaigns", "data-programs", "data-campaigns"],
  ["stripe-campaigns", "data-stripe-accounts", "data-campaigns"],
  ["campaigns-ledger", "data-campaigns", "data-ledger"],
  ["campaigns-public", "data-campaigns", "data-public-aggregates"],
  ["ledger-donors", "data-ledger", "data-private-donors"],
  ["organizations-imports", "data-organizations", "data-import-batches"],
  ["imports-entries", "data-import-batches", "data-external-entries"],
  ["organizations-restricted", "data-organizations", "data-restricted-funds"],
  ["fiscal-restricted", "data-fiscal-projects", "data-restricted-funds"],
  ["restricted-entries", "data-restricted-funds", "data-restricted-entries"],
  ["fiscal-grants", "data-fiscal-projects", "data-grant-requests"],
  ["grants-disbursements", "data-grant-requests", "data-disbursements"],
  ["grants-reporting", "data-grant-requests", "data-reporting-periods"],
  ["organizations-matches", "data-organizations", "data-opportunity-matches"],
  ["opportunities-matches", "data-opportunities", "data-opportunity-matches"],
  ["matches-applications", "data-opportunity-matches", "data-applications"],
  ["organizations-lists", "data-organizations", "data-map-lists"],
  ["lists-items", "data-map-lists", "data-map-items"],
].map(([id, source, target]) => ({
  id,
  source,
  target,
})) satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_DATA_NAVIGATION = [
  {
    label: "Finance records",
    nodeIds: [
      "data-organizations",
      "data-stripe-accounts",
      "data-campaigns",
      "data-ledger",
      "data-public-aggregates",
      "data-programs",
      "data-private-donors",
    ],
  },
  {
    label: "Imports",
    nodeIds: ["data-import-batches", "data-external-entries"],
  },
  {
    label: "Fiscal",
    nodeIds: [
      "data-fiscal-projects",
      "data-restricted-funds",
      "data-restricted-entries",
      "data-grant-requests",
      "data-disbursements",
      "data-reporting-periods",
    ],
  },
  {
    label: "Opportunities",
    nodeIds: [
      "data-opportunities",
      "data-opportunity-matches",
      "data-applications",
    ],
  },
  {
    label: "Lists",
    nodeIds: ["data-map-lists", "data-map-items"],
  },
] as const satisfies readonly FinancePlanNavigationTarget[]

function journeyNode(
  id: string,
  title: string,
  summary: string,
  x: number,
  y: number,
  kind: FinanceReleasePlanDefinition["kind"],
  statusLabel: string
) {
  return financeDiagramNode({
    eyebrow: "Signup and contact journey",
    id,
    kind,
    statusLabel,
    summary,
    title,
    x,
    y,
  })
}

export const FINANCE_SIGNUP_NODES = [
  journeyNode(
    "signup-guest",
    "Guest",
    "Starts a save, list, note, or protected-contact action.",
    0,
    300,
    "actor",
    "Same visitor"
  ),
  journeyNode(
    "signup-map",
    "Mounted map and drawer",
    "Preserves the selected profile, bounds, filters, and drawer state.",
    420,
    300,
    "surface",
    "Context retained"
  ),
  journeyNode(
    "signup-auth",
    "In-map auth overlay",
    "Collects sign-up or sign-in without replacing the map route.",
    840,
    300,
    "surface",
    "Overlay"
  ),
  journeyNode(
    "signup-server",
    "Authorized replay service",
    "Verifies the session and replays the signed action exactly once.",
    1260,
    300,
    "service",
    "Server checked"
  ),
  journeyNode(
    "signup-db",
    "Session and typed collections",
    "Persists authorized saves, lists, notes, or reveal audit events.",
    1680,
    300,
    "data",
    "Durable result"
  ),
  financeDiagramNode({
    eyebrow: "Privacy boundary",
    height: 220,
    id: "signup-safe-intent",
    kind: "guardrail",
    sections: [
      {
        label: "Never include",
        items: [
          "Contact value or secret URL",
          "Exact location or arbitrary return URL",
        ],
      },
    ],
    statusLabel: "Short lived",
    summary:
      "The signed pending intent contains only safe IDs and coarse UI state.",
    title: "Safe pending intent",
    width: 420,
    x: 840,
    y: 660,
  }),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_SIGNUP_EDGES = [
  {
    id: "guest-map",
    label: "Start action",
    source: "signup-guest",
    target: "signup-map",
  },
  {
    id: "map-auth",
    label: "Open with intent",
    source: "signup-map",
    target: "signup-auth",
  },
  {
    id: "auth-server",
    label: "Sign up/in; replay once",
    sourceStepCount: 2,
    source: "signup-auth",
    target: "signup-server",
  },
  {
    id: "server-db",
    label: "Create session; authorize and persist",
    sourceStepCount: 2,
    source: "signup-server",
    target: "signup-db",
  },
  {
    dashed: true,
    id: "server-authenticated",
    label: "Authenticated",
    source: "signup-server",
    target: "signup-auth",
  },
  {
    dashed: true,
    id: "server-map",
    label: "Result and restored context",
    source: "signup-server",
    target: "signup-map",
  },
  {
    id: "map-guest",
    dashed: true,
    label: "Restore and complete",
    source: "signup-map",
    target: "signup-guest",
  },
  {
    id: "intent-auth",
    dashed: true,
    sourceStepCount: 0,
    source: "signup-safe-intent",
    target: "signup-auth",
  },
  {
    id: "intent-server",
    dashed: true,
    sourceStepCount: 0,
    source: "signup-safe-intent",
    target: "signup-server",
  },
] as const satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_SIGNUP_NAVIGATION = [
  {
    label: "Journey",
    nodeIds: [
      "signup-guest",
      "signup-map",
      "signup-auth",
      "signup-server",
      "signup-db",
    ],
  },
  { label: "Privacy", nodeIds: ["signup-safe-intent"] },
] as const satisfies readonly FinancePlanNavigationTarget[]

function weatherNode(
  id: string,
  title: string,
  summary: string,
  x: number,
  y: number,
  kind: FinanceReleasePlanDefinition["kind"] = "service",
  statusLabel = "Weather path"
) {
  return financeDiagramNode({
    eyebrow: "Cooling centers and weather",
    id,
    kind,
    statusLabel,
    summary,
    title,
    x,
    y,
  })
}

export const FINANCE_WEATHER_NODES = [
  weatherNode(
    "weather-viewport",
    "Coarse map area",
    "Uses a 0.05-degree cell or typed city/ZIP, never an exact-location key.",
    0,
    300,
    "surface",
    "Coarse input"
  ),
  weatherNode(
    "weather-grid",
    "NWS point and forecast grid",
    "Server resolves points, grid data, and alerts with a descriptive User-Agent.",
    420,
    300,
    "external",
    "NWS"
  ),
  weatherNode(
    "weather-forecast",
    "Forecast heat threshold",
    "100°F for two hours within 24 hours is a soft relevance signal, not an alert.",
    840,
    0,
    "external",
    "Signal"
  ),
  weatherNode(
    "weather-alerts",
    "Heat alerts",
    "Uses current Heat Advisory and Extreme Heat Watch or Warning events.",
    840,
    600,
    "external",
    "Signal"
  ),
  weatherNode(
    "weather-cache",
    "Short coarse-area cache",
    "Points 24h, forecast 30m, alerts 2m; bounded stale-if-error only.",
    1260,
    300,
    "data",
    "Short lived"
  ),
  weatherNode(
    "weather-rule",
    "Heat condition?",
    "Requires a valid signal plus an active, provider-verified cooling resource.",
    1680,
    300,
    "decision",
    "Decision"
  ),
  weatherNode(
    "weather-promote",
    "Elevate verified cooling centers",
    "Raises eligible approved centers; production currently has zero eligible rows.",
    2100,
    0,
    "service",
    "Yes"
  ),
  weatherNode(
    "weather-neutral",
    "Normal resource ranking",
    "Keeps standard relevance when conditions are absent or unavailable.",
    2100,
    600,
    "service",
    "No or unavailable"
  ),
  weatherNode(
    "weather-map",
    "Map and list",
    "Keeps approved centers searchable and never claims weather proves open hours.",
    2520,
    300,
    "surface",
    "Safe output"
  ),
] as const satisfies readonly FinanceReleasePlanDefinition[]

export const FINANCE_WEATHER_EDGES = [
  ["viewport-grid", "weather-viewport", "weather-grid"],
  ["grid-forecast", "weather-grid", "weather-forecast"],
  ["grid-alerts", "weather-grid", "weather-alerts"],
  ["forecast-cache", "weather-forecast", "weather-cache"],
  ["alerts-cache", "weather-alerts", "weather-cache"],
  ["cache-rule", "weather-cache", "weather-rule"],
  ["rule-promote", "weather-rule", "weather-promote"],
  ["rule-neutral", "weather-rule", "weather-neutral"],
  ["promote-map", "weather-promote", "weather-map"],
  ["neutral-map", "weather-neutral", "weather-map"],
].map(([id, source, target]) => ({
  id,
  source,
  target,
})) satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_WEATHER_NAVIGATION = [
  {
    label: "Inputs",
    nodeIds: [
      "weather-viewport",
      "weather-grid",
      "weather-forecast",
      "weather-alerts",
    ],
  },
  {
    label: "Decision",
    nodeIds: ["weather-cache", "weather-rule"],
  },
  {
    label: "Output",
    nodeIds: ["weather-promote", "weather-neutral", "weather-map"],
  },
] as const satisfies readonly FinancePlanNavigationTarget[]
