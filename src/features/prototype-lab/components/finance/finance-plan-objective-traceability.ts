import type { FinancePrdCoverageEvidence } from "./finance-plan-prd-coverage"

export type FinancePlanObjectiveTraceabilityEntry = {
  evidence: readonly FinancePrdCoverageEvidence[]
  outcome: string
  plannedEvidence: string
}

export const FINANCE_PLAN_OBJECTIVE_TRACEABILITY = [
  {
    outcome: "Talk before acting",
    plannedEvidence: "Approved scope recorded before implementation",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "approval-release-sequence",
          "approval-fiscal-custody",
          "approval-finance-information-architecture",
          "approval-visual-references",
        ],
      },
    ],
  },
  {
    outcome: "Seven clean merges",
    plannedEvidence:
      "Exactly seven batches with dependencies, gates, and rollback",
    evidence: [
      {
        viewId: "dependencies",
        nodeIds: ["dependency-batch-1", "dependency-batch-7"],
      },
      {
        viewId: "roadmap",
        nodeIds: ["batch-1-baseline-onboarding", "gate-7-production-cutover"],
      },
    ],
  },
  {
    outcome: "Explain hard-push damage",
    plannedEvidence:
      "Current-state Git, migration, cache, feature, and test audit",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["unsafe-tree-start", "non-negotiable-guardrails"],
      },
    ],
  },
  {
    outcome: "Improve onboarding",
    plannedEvidence:
      "Batch 1 durable completion, reconciliation, backfill, browser proof",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["batch-1-baseline-onboarding", "gate-1-baseline-onboarding"],
      },
    ],
  },
  {
    outcome: "Finance drawer and canvas node",
    plannedEvidence:
      "Separate Finance card plus the approved Finance drawer architecture",
    evidence: [
      { viewId: "system", nodeIds: ["system-workspace"] },
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-2-organization-workspace",
          "batch-7-finance-experience-cutover",
        ],
      },
    ],
  },
  {
    outcome: "Minimal `$0.00`, In/Out, graph",
    plannedEvidence:
      "Explicit disconnected/loading/verified/stale states and metric definitions",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-7-finance-experience-cutover",
          "gate-7-production-cutover",
        ],
      },
      {
        viewId: "assurance",
        nodeIds: ["assurance-public-resilience", "assurance-journey-tests"],
      },
    ],
  },
  {
    outcome: "To-do/status pills and opportunity node",
    plannedEvidence: "Derived next actions plus one reusable progression node",
    evidence: [
      {
        viewId: "data",
        nodeIds: [
          "data-opportunities",
          "data-opportunity-matches",
          "data-applications",
        ],
      },
      {
        viewId: "roadmap",
        nodeIds: ["batch-7-finance-experience-cutover"],
      },
    ],
  },
  {
    outcome: "External banking boundary",
    plannedEvidence:
      "No bank setup or money movement in the application; external records only",
    evidence: [
      {
        viewId: "system",
        nodeIds: ["system-stripe-connect", "system-connected-account"],
      },
      { viewId: "roadmap", nodeIds: ["research-6-stripe-connect"] },
    ],
  },
  {
    outcome: "App transaction tracking",
    plannedEvidence:
      "Source-labeled external records, review, corrections, and reconciliation",
    evidence: [
      {
        viewId: "webhooks",
        nodeIds: [
          "webhook-hook",
          "webhook-inbox",
          "webhook-ledger",
          "webhook-ui",
        ],
      },
    ],
  },
  {
    outcome: "Fundraiser profile, progress, Donate",
    plannedEvidence:
      "Canonical public campaign route and sanitized aggregate projection",
    evidence: [
      {
        viewId: "data",
        nodeIds: ["data-campaigns", "data-public-aggregates"],
      },
      { viewId: "system", nodeIds: ["system-find"] },
    ],
  },
  {
    outcome: "Reporting plus other data",
    plannedEvidence:
      "Separate reconciled, sponsored-project, draft/imported, and legacy layers with CSV",
    evidence: [
      {
        viewId: "data",
        nodeIds: [
          "data-ledger",
          "data-restricted-entries",
          "data-external-entries",
          "data-reporting-periods",
        ],
      },
    ],
  },
  {
    outcome: "Segmented source bar and public switch",
    plannedEvidence:
      "Source composition with one contextual visibility control",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["batch-7-finance-experience-cutover"],
      },
      {
        viewId: "data",
        nodeIds: [
          "data-public-aggregates",
          "data-ledger",
          "data-restricted-entries",
          "data-external-entries",
        ],
      },
    ],
  },
  {
    outcome: "Finance subtabs without clutter",
    plannedEvidence: "Overview, Opportunities, Fundraising, Reporting",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "approval-finance-information-architecture",
          "batch-7-finance-experience-cutover",
        ],
      },
    ],
  },
  {
    outcome: "Images revisited",
    plannedEvidence:
      "Three-pass visual protocol; currently blocked because none were attached",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["approval-visual-references", "research-7-visual-cutover"],
      },
    ],
  },
  {
    outcome: "Scalable backend and stale-cache safety",
    plannedEvidence:
      "Transactional ledger, tagged invalidation, bbox/index/detail split",
    evidence: [
      {
        viewId: "system",
        nodeIds: [
          "system-event-inbox",
          "system-ledger",
          "system-weather-cache",
        ],
      },
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-4-resource-publication",
          "batch-5-find-signup-location-weather",
        ],
      },
    ],
  },
  {
    outcome: "Future AI funding matches",
    plannedEvidence: "Deterministic first, cited async AI later, human review",
    evidence: [
      {
        viewId: "data",
        nodeIds: [
          "data-opportunities",
          "data-opportunity-matches",
          "data-applications",
        ],
      },
    ],
  },
  {
    outcome: "Weather-aware cooling centers",
    plannedEvidence: "NWS coarse cache; weather changes relevance only",
    evidence: [
      {
        viewId: "weather",
        nodeIds: [
          "weather-grid",
          "weather-cache",
          "weather-rule",
          "weather-promote",
          "weather-map",
        ],
      },
    ],
  },
  {
    outcome: "Circle profile button and map signup",
    plannedEvidence:
      "Left-side avatar, in-map auth overlay, one-time action replay",
    evidence: [
      {
        viewId: "signup",
        nodeIds: ["signup-map", "signup-auth", "signup-server"],
      },
    ],
  },
  {
    outcome: "Sensitive-contact protection",
    plannedEvidence:
      "Server payload redaction, auth, rate limit, audit, no false guarantees",
    evidence: [
      {
        viewId: "signup",
        nodeIds: ["signup-safe-intent", "signup-server"],
      },
      {
        viewId: "assurance",
        nodeIds: ["assurance-security-boundary", "assurance-public-resilience"],
      },
    ],
  },
  {
    outcome: "Member collections and light progress",
    plannedEvidence:
      "Typed saves/lists, private profile, explicit sharing, ethical milestones",
    evidence: [
      { viewId: "data", nodeIds: ["data-map-lists", "data-map-items"] },
    ],
  },
  {
    outcome: "Rich social/text previews",
    plannedEvidence:
      "Canonical routes and server-rendered branded Open Graph metadata",
    evidence: [
      {
        viewId: "system",
        nodeIds: ["system-public-projection", "system-find"],
      },
      {
        viewId: "roadmap",
        nodeIds: ["batch-5-find-signup-location-weather"],
      },
    ],
  },
  {
    outcome: "Location permission repair",
    plannedEvidence:
      "Browser permission state machine and no default exact-location storage",
    evidence: [
      { viewId: "weather", nodeIds: ["weather-viewport"] },
      { viewId: "roadmap", nodeIds: ["research-5-map-privacy-weather"] },
    ],
  },
  {
    outcome: "Path to 5,000 public resources",
    plannedEvidence:
      "Verified source cohorts and exact gate counts; no raw candidates",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-4-resource-publication",
          "research-4-resource-inventory",
        ],
      },
    ],
  },
  {
    outcome: "Fiscal sponsorship journey",
    plannedEvidence:
      "Approved document, requests, decisions, external-payment records, reporting",
    evidence: [
      {
        viewId: "custody",
        nodeIds: [
          "custody-sponsor-account",
          "custody-restricted-ledger",
          "custody-grant-request",
          "custody-approval",
          "custody-disbursement",
        ],
      },
      {
        viewId: "roadmap",
        nodeIds: ["batch-3-fiscal-operations"],
      },
    ],
  },
  {
    outcome: "Allocation tracking and coach/user CSV",
    plannedEvidence:
      "Record-linked allocations, role-scoped exports, formula neutralization",
    evidence: [
      {
        viewId: "custody",
        nodeIds: ["custody-restricted-ledger", "custody-disbursement"],
      },
      { viewId: "data", nodeIds: ["data-restricted-entries"] },
      { viewId: "assurance", nodeIds: ["assurance-security-boundary"] },
    ],
  },
  {
    outcome: "Full logic and loose-end scan",
    plannedEvidence:
      "Routes, schema, RLS, security, failure states, observability, setup, cutover",
    evidence: [
      {
        viewId: "assurance",
        nodeIds: [
          "assurance-security-boundary",
          "assurance-financial-truth",
          "assurance-public-resilience",
          "assurance-contract-tests",
          "assurance-journey-tests",
          "assurance-failure-drills",
          "assurance-operations-ready",
        ],
      },
    ],
  },
  {
    outcome: "Shadcn-style Mermaid PRD",
    plannedEvidence:
      "Neutral Geist Mermaid theme and seven architecture/journey diagrams",
    evidence: [
      { viewId: "dependencies", nodeIds: ["dependency-batch-1"] },
      { viewId: "system", nodeIds: ["system-finance-api"] },
      { viewId: "custody", nodeIds: ["custody-campaign"] },
      { viewId: "webhooks", nodeIds: ["webhook-hook"] },
      { viewId: "data", nodeIds: ["data-organizations"] },
      { viewId: "signup", nodeIds: ["signup-map"] },
      { viewId: "weather", nodeIds: ["weather-grid"] },
    ],
  },
] as const satisfies readonly FinancePlanObjectiveTraceabilityEntry[]

export const FINANCE_PLAN_OBJECTIVE_TRACEABILITY_COUNT =
  FINANCE_PLAN_OBJECTIVE_TRACEABILITY.length
