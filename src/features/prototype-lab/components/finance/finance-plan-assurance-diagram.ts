import {
  financeDiagramNode,
  type FinancePlanDiagramEdgeDefinition,
  type FinancePlanNavigationTarget,
} from "./finance-plan-diagram-data"

export const FINANCE_ASSURANCE_NODES = [
  financeDiagramNode({
    eyebrow: "Required boundary",
    height: 340,
    id: "assurance-security-boundary",
    kind: "guardrail",
    sections: [
      {
        label: "Must prove",
        items: [
          "RLS on every table plus repeated server-side authorization",
          "No role escalation, cross-organization account reuse, or browser financial writes",
          "Record scope, source evidence, forbidden bank fields, and server-side authorization",
          "Public redaction, contact-reveal audit, risk-based rate limits, and CSV formula neutralization",
        ],
      },
    ],
    statusLabel: "Security gate",
    summary:
      "UI visibility never substitutes for authorization, event verification, or tenant isolation.",
    title: "Authorization and RLS",
    width: 360,
    x: 0,
    y: 0,
  }),
  financeDiagramNode({
    eyebrow: "Required boundary",
    height: 310,
    id: "assurance-financial-truth",
    kind: "data",
    sections: [
      {
        label: "Must prove",
        items: [
          "Validated source, organization/project scope, and immutable review history",
          "Corrections, reversals, unrelated activity, wrong currency, and wrong period remain explicit",
          "Reconciliation detects drift and preserves the last verified display",
        ],
      },
    ],
    statusLabel: "Truth gate",
    summary:
      "Reconciled, sponsored-project, draft/imported, and legacy values remain separate truth layers.",
    title: "Financial record truth",
    width: 360,
    x: 0,
    y: 360,
  }),
  financeDiagramNode({
    eyebrow: "Required boundary",
    height: 340,
    id: "assurance-public-resilience",
    kind: "surface",
    sections: [
      {
        label: "Must prove",
        items: [
          "Anonymous payloads exclude donor PII, protected contacts, exact location, and raw candidates",
          "Auth replay, weather failure, public-detail retry, and stale-cache states preserve context",
          "Keyboard, screen-reader, reduced-motion, touch, list-equivalent, and responsive behavior",
        ],
      },
    ],
    statusLabel: "Public gate",
    summary:
      "The public map stays private, complete, truthful, and recoverable when dependencies fail.",
    title: "Public privacy and resilience",
    width: 360,
    x: 0,
    y: 720,
  }),
  financeDiagramNode({
    eyebrow: "Verification family 1",
    height: 360,
    id: "assurance-contract-tests",
    kind: "gate",
    sections: [
      {
        label: "Required cases",
        items: [
          "Record-entry concurrency, stale revisions, import readiness, campaign constraints, and role denial",
          "Invalid evidence, duplicate/out-of-order records, partial failures, and organization/project/currency scope",
          "RLS, idempotency, corrections, reconciliation, fiscal requests, and import/export safety",
        ],
      },
    ],
    statusLabel: "Automated proof",
    summary:
      "Unit, schema, authorization, final-RLS, and integration suites prove the domain contracts.",
    title: "Contract and security tests",
    width: 390,
    x: 500,
    y: 0,
  }),
  financeDiagramNode({
    eyebrow: "Verification family 2",
    height: 360,
    id: "assurance-journey-tests",
    kind: "gate",
    sections: [
      {
        label: "Required cases",
        items: [
          "Zero, delayed, stale, disconnected, unavailable, denied, retry, and repair states",
          "Signup replay, map/list parity, location permissions, weather, resource scale, and cache behavior",
          "Desktop/mobile, keyboard, screen reader, dark mode, reduced motion, visual, and performance budgets",
        ],
      },
    ],
    statusLabel: "Journey proof",
    summary:
      "Authenticated and anonymous Playwright journeys verify the user-visible safety contract.",
    title: "Journey and quality tests",
    width: 390,
    x: 500,
    y: 410,
  }),
  financeDiagramNode({
    eyebrow: "Verification family 3",
    height: 340,
    id: "assurance-failure-drills",
    kind: "gate",
    sections: [
      {
        label: "Required cases",
        items: [
          "Import, Supabase, NWS, and Vercel failure with safe retry and no false zero",
          "Synthetic record entry, review, correction, reconciliation, and missing-evidence repair",
          "No lost financial history, correction record, context, or approved resource",
        ],
      },
    ],
    statusLabel: "Resilience proof",
    summary:
      "Failure drills prove recovery paths before any live organization depends on them.",
    title: "Fixture and resilience drills",
    width: 390,
    x: 500,
    y: 820,
  }),
  financeDiagramNode({
    eyebrow: "Release evidence 1",
    height: 320,
    id: "assurance-approval-record",
    kind: "decision",
    sections: [
      {
        label: "Must be recorded",
        items: [
          "Seven-merge and incident-release scope",
          "Counsel-approved document, records-only boundary, external payments, and immutable audit history",
          "Finance information architecture and three-pass screenshot review",
        ],
      },
    ],
    statusLabel: "Approved",
    summary:
      "Implementation assumptions cannot silently replace product, fiscal, release, or visual approval.",
    title: "Approval record complete",
    width: 390,
    x: 1030,
    y: 0,
  }),
  financeDiagramNode({
    eyebrow: "Release evidence 2",
    height: 370,
    id: "assurance-clean-artifact",
    kind: "gate",
    sections: [
      {
        label: "Must be green",
        items: [
          "Seven sequential clean branches, focused PRs, previews, and merge verification",
          "Full pnpm check:quality, final-schema RLS, build, accessibility, visual, and performance gates",
          "Database, browser, cache, monitoring, support, and rollback evidence agree",
        ],
      },
    ],
    statusLabel: "Not yet proven",
    summary:
      "Only a clean release artifact can become the canary candidate; the dirty snapshot remains read-only.",
    title: "Clean release candidate",
    width: 390,
    x: 1030,
    y: 390,
  }),
  financeDiagramNode({
    eyebrow: "Release evidence 3",
    height: 380,
    id: "assurance-operations-ready",
    kind: "research",
    sections: [
      {
        label: "Operational proof",
        items: [
          "Dashboards for import health, review age, reconciliation, public aggregate age, and map budgets",
          "Alerts for import failures, overdue review, reconciliation drift, stale totals, and publication failures",
          "Support owner, additive environment changes, rollback runbook, and financial-history preservation",
        ],
      },
    ],
    statusLabel: "Before canary",
    summary:
      "Monitoring must detect unsafe state, identify an owner, and support recovery before exposure grows.",
    title: "Monitoring and rollback ready",
    width: 390,
    x: 1030,
    y: 810,
  }),
  financeDiagramNode({
    eyebrow: "Production proof 1",
    height: 300,
    id: "assurance-staff-canary",
    kind: "batch",
    sections: [
      {
        label: "Observe",
        items: [
          "Internal records-only and representative public-map journeys",
          "Record, review, reconciliation, cache, alert, support, and rollback behavior",
        ],
      },
    ],
    statusLabel: "Not started",
    summary:
      "Staff exercise the integrated artifact before any external organization receives it.",
    title: "Staff canary",
    width: 360,
    x: 1550,
    y: 190,
  }),
  financeDiagramNode({
    eyebrow: "Production proof 2",
    height: 320,
    id: "assurance-organization-canary",
    kind: "batch",
    sections: [
      {
        label: "Observe",
        items: [
          "One approved organization with explicit support and rollback ownership",
          "Gradual enablement only while financial, privacy, map, and service signals remain healthy",
        ],
      },
    ],
    statusLabel: "After staff proof",
    summary:
      "A monitored organization canary proves the real integration before broader enablement.",
    title: "Organization canary and gradual release",
    width: 360,
    x: 1550,
    y: 590,
  }),
  financeDiagramNode({
    eyebrow: "Verified end state",
    height: 430,
    id: "assurance-production-ready",
    kind: "finish",
    sections: [
      {
        label: "Definition of done",
        items: [
          "Approvals recorded, seven PRs merged in order, and onboarding recovery proven for two affected users",
          "External records, approved fiscal workflow, privacy, auth replay, weather, and resource gates reconcile",
          "Quality, fixtures, canary, monitoring, support, and rollback evidence all pass from the clean artifact",
        ],
      },
    ],
    statusLabel: "Not yet achieved",
    summary:
      "Production is complete only when code, data, services, policy, user journeys, and operations agree.",
    title: "Release evidence agrees",
    width: 400,
    x: 2070,
    y: 390,
  }),
] as const

export const FINANCE_ASSURANCE_EDGES = [
  {
    id: "assurance-security-to-contracts",
    source: "assurance-security-boundary",
    target: "assurance-contract-tests",
  },
  {
    id: "assurance-finance-to-contracts",
    source: "assurance-financial-truth",
    target: "assurance-contract-tests",
  },
  {
    dashed: true,
    id: "assurance-finance-to-failures",
    source: "assurance-financial-truth",
    target: "assurance-failure-drills",
  },
  {
    id: "assurance-public-to-journeys",
    source: "assurance-public-resilience",
    target: "assurance-journey-tests",
  },
  {
    dashed: true,
    id: "assurance-public-to-failures",
    source: "assurance-public-resilience",
    target: "assurance-failure-drills",
  },
  {
    id: "assurance-contracts-to-artifact",
    source: "assurance-contract-tests",
    target: "assurance-clean-artifact",
  },
  {
    id: "assurance-journeys-to-artifact",
    source: "assurance-journey-tests",
    target: "assurance-clean-artifact",
  },
  {
    id: "assurance-failures-to-artifact",
    source: "assurance-failure-drills",
    target: "assurance-clean-artifact",
  },
  {
    id: "assurance-approvals-to-artifact",
    source: "assurance-approval-record",
    target: "assurance-clean-artifact",
  },
  {
    id: "assurance-artifact-to-staff",
    source: "assurance-clean-artifact",
    target: "assurance-staff-canary",
  },
  {
    dashed: true,
    id: "assurance-operations-to-staff",
    label: "monitor and recover",
    source: "assurance-operations-ready",
    target: "assurance-staff-canary",
  },
  {
    id: "assurance-staff-to-organization",
    source: "assurance-staff-canary",
    target: "assurance-organization-canary",
  },
  {
    id: "assurance-organization-to-ready",
    source: "assurance-organization-canary",
    target: "assurance-production-ready",
  },
  {
    dashed: true,
    id: "assurance-operations-to-ready",
    label: "rollback proven",
    source: "assurance-operations-ready",
    target: "assurance-production-ready",
  },
] as const satisfies readonly FinancePlanDiagramEdgeDefinition[]

export const FINANCE_ASSURANCE_NAVIGATION = [
  {
    label: "Boundaries",
    nodeIds: [
      "assurance-security-boundary",
      "assurance-financial-truth",
      "assurance-public-resilience",
    ],
  },
  {
    label: "Tests",
    nodeIds: [
      "assurance-contract-tests",
      "assurance-journey-tests",
      "assurance-failure-drills",
    ],
  },
  {
    label: "Release evidence",
    nodeIds: [
      "assurance-approval-record",
      "assurance-clean-artifact",
      "assurance-operations-ready",
    ],
  },
  {
    label: "Canaries",
    nodeIds: ["assurance-staff-canary", "assurance-organization-canary"],
  },
  { label: "Done", nodeIds: ["assurance-production-ready"] },
] as const satisfies readonly FinancePlanNavigationTarget[]
