import type { FinancePlanningViewId } from "./finance-plan-diagram-data"

export type FinancePrdCoverageEvidence = {
  nodeIds: readonly string[]
  viewId: FinancePlanningViewId
}

export type FinancePrdCoverageEntry = {
  evidence: readonly FinancePrdCoverageEvidence[]
  section: string
}

export const FINANCE_PRD_SECTION_COVERAGE = [
  {
    section: "Decision Summary",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["non-negotiable-guardrails", "production-ready"],
      },
    ],
  },
  {
    section: "Approved Scope Boundary",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "approval-release-sequence",
          "approval-fiscal-custody",
          "approval-finance-information-architecture",
        ],
      },
    ],
  },
  {
    section: "Visual Reference Protocol",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["approval-visual-references", "research-7-visual-cutover"],
      },
    ],
  },
  {
    section: "Current-State Audit",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["unsafe-tree-start", "batch-1-baseline-onboarding"],
      },
    ],
  },
  {
    section: "Goals",
    evidence: [{ viewId: "roadmap", nodeIds: ["production-ready"] }],
  },
  {
    section: "Non-Goals",
    evidence: [{ viewId: "roadmap", nodeIds: ["non-negotiable-guardrails"] }],
  },
  {
    section: "Product Principles",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["non-negotiable-guardrails", "production-ready"],
      },
    ],
  },
  {
    section: "Personas And Permissions",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-6-finance-stripe-connect",
          "gate-7-production-cutover",
        ],
      },
    ],
  },
  {
    section: "Recommended Information Architecture",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-2-organization-workspace",
          "batch-5-find-signup-location-weather",
          "batch-7-finance-experience-cutover",
        ],
      },
    ],
  },
  {
    section: "System Architecture",
    evidence: [
      {
        viewId: "system",
        nodeIds: ["system-finance-api", "system-postgres", "system-find"],
      },
    ],
  },
  {
    section: "Finance Records Design",
    evidence: [
      {
        viewId: "system",
        nodeIds: ["system-stripe-connect", "system-connected-account"],
      },
      {
        viewId: "webhooks",
        nodeIds: ["webhook-hook", "webhook-inbox", "webhook-ledger"],
      },
    ],
  },
  {
    section: "Fiscal Sponsorship Records",
    evidence: [
      {
        viewId: "custody",
        nodeIds: [
          "custody-sponsor-account",
          "custody-restricted-ledger",
          "custody-disbursement",
        ],
      },
    ],
  },
  {
    section: "Data Model",
    evidence: [
      {
        viewId: "data",
        nodeIds: [
          "data-organizations",
          "data-campaigns",
          "data-fiscal-projects",
        ],
      },
    ],
  },
  {
    section: "Security, Privacy, And RLS",
    evidence: [
      { viewId: "system", nodeIds: ["system-postgres"] },
      { viewId: "signup", nodeIds: ["signup-safe-intent", "signup-server"] },
      {
        viewId: "assurance",
        nodeIds: [
          "assurance-security-boundary",
          "assurance-financial-truth",
          "assurance-public-resilience",
        ],
      },
    ],
  },
  {
    section: "Public Signup And Contact Flow",
    evidence: [
      {
        viewId: "signup",
        nodeIds: ["signup-map", "signup-auth", "signup-server", "signup-db"],
      },
    ],
  },
  {
    section: "Lists, Saves, And Lightweight Progress",
    evidence: [
      { viewId: "data", nodeIds: ["data-map-lists", "data-map-items"] },
    ],
  },
  {
    section: "Location Permission Repair",
    evidence: [
      { viewId: "weather", nodeIds: ["weather-viewport"] },
      { viewId: "roadmap", nodeIds: ["research-5-map-privacy-weather"] },
    ],
  },
  {
    section: "Cooling Centers And Weather",
    evidence: [
      {
        viewId: "weather",
        nodeIds: ["weather-grid", "weather-rule", "weather-map"],
      },
    ],
  },
  {
    section: "Resource Publication And 5,000-Record Path",
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
    section: "Caching And Consistency",
    evidence: [
      { viewId: "system", nodeIds: ["system-weather-cache"] },
      { viewId: "webhooks", nodeIds: ["webhook-ui"] },
    ],
  },
  {
    section: "Opportunity Data And Future AI",
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
    section: "Failure And Empty States",
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
        nodeIds: ["assurance-public-resilience", "assurance-failure-drills"],
      },
    ],
  },
  {
    section: "Accessibility And Responsive Behavior",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "gate-5-find-signup-location-weather",
          "approval-visual-references",
        ],
      },
      {
        viewId: "assurance",
        nodeIds: ["assurance-public-resilience", "assurance-journey-tests"],
      },
    ],
  },
  {
    section: "Observability And Operations",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["research-7-visual-cutover", "gate-7-production-cutover"],
      },
      {
        viewId: "assurance",
        nodeIds: ["assurance-operations-ready"],
      },
    ],
  },
  {
    section: "Planned Repository Ownership",
    evidence: [
      { viewId: "roadmap", nodeIds: ["research-2-workspace-foundation"] },
    ],
  },
  {
    section: "Rejected Payment-Rail Research",
    evidence: [{ viewId: "roadmap", nodeIds: ["research-6-stripe-connect"] }],
  },
  {
    section: "Test And Edge-Case Matrix",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "gate-5-find-signup-location-weather",
          "gate-6-finance-stripe-connect",
          "gate-7-production-cutover",
        ],
      },
      {
        viewId: "assurance",
        nodeIds: [
          "assurance-contract-tests",
          "assurance-journey-tests",
          "assurance-failure-drills",
        ],
      },
    ],
  },
  {
    section: "Exactly Seven Merge Batches",
    evidence: [
      {
        viewId: "dependencies",
        nodeIds: ["dependency-batch-1", "dependency-batch-7"],
      },
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-1-baseline-onboarding",
          "batch-7-finance-experience-cutover",
        ],
      },
    ],
  },
  {
    section: "Production Cutover Rules",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: ["gate-7-production-cutover", "production-ready"],
      },
      {
        viewId: "assurance",
        nodeIds: [
          "assurance-clean-artifact",
          "assurance-operations-ready",
          "assurance-staff-canary",
          "assurance-organization-canary",
          "assurance-production-ready",
        ],
      },
    ],
  },
  {
    section: "Objective Traceability",
    evidence: [
      { viewId: "roadmap", nodeIds: ["production-ready"] },
      { viewId: "assurance", nodeIds: ["assurance-production-ready"] },
    ],
  },
  {
    section: "Definition Of Done",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "batch-1-baseline-onboarding",
          "gate-4-resource-publication",
          "production-ready",
        ],
      },
      {
        viewId: "custody",
        nodeIds: ["custody-org-charge", "custody-restricted-ledger"],
      },
      { viewId: "data", nodeIds: ["data-public-aggregates"] },
      { viewId: "signup", nodeIds: ["signup-server"] },
      { viewId: "weather", nodeIds: ["weather-rule"] },
      {
        viewId: "assurance",
        nodeIds: [
          "assurance-approval-record",
          "assurance-clean-artifact",
          "assurance-public-resilience",
          "assurance-journey-tests",
          "assurance-production-ready",
        ],
      },
    ],
  },
  {
    section: "Decision Log",
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
    section: "Primary References",
    evidence: [
      {
        viewId: "roadmap",
        nodeIds: [
          "research-5-map-privacy-weather",
          "research-6-stripe-connect",
        ],
      },
    ],
  },
] as const satisfies readonly FinancePrdCoverageEntry[]

export const FINANCE_PRD_SECTION_COVERAGE_COUNT =
  FINANCE_PRD_SECTION_COVERAGE.length
