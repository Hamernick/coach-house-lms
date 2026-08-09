import {
  FINANCE_RELEASE_PLAN_NODE_IDS,
  type FinancePlanBatchWorkItem,
  type FinancePlanWorkState,
  type FinanceReleasePlanDefinition,
} from "./finance-release-plan-data"

const RELEASE_Y = 580

type FinancePlanBatchWorkInput =
  | string
  | readonly [title: string, state: FinancePlanWorkState]

function defineBatchWorkItems(
  batchSequence: number,
  inputs: readonly FinancePlanBatchWorkInput[]
): FinancePlanBatchWorkItem[] {
  return inputs.map((input, index) => {
    const [title, state] =
      typeof input === "string" ? [input, "not_started" as const] : input

    return {
      id: `batch-${batchSequence}-work-${index + 1}`,
      state,
      title,
    }
  })
}

export const FINANCE_RELEASE_PLAN_BATCHES: FinanceReleasePlanDefinition[] = [
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch1,
    x: 540,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "merged",
    sequence: 1,
    eyebrow: "Merge 1 of 7",
    title: "Baseline reconciliation and onboarding recovery",
    statusLabel: "Merged",
    summary:
      "Create a safe release baseline and permanently recover organization setup progress before new feature work.",
    dependencies: ["Latest origin/main", "Approved incident scope"],
    inputNodeIds: [
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalRelease,
      FINANCE_RELEASE_PLAN_NODE_IDS.research1,
    ],
    workItems: defineBatchWorkItems(1, [
      ["Preserve every current upstream release", "complete"],
      [
        "Restore immutable applied migrations and remove generated artifacts",
        "complete",
      ],
      [
        "Reconcile package, lockfile, tooling, agent docs, and runlog structure",
        "complete",
      ],
      [
        "Ship the Karissa organization-setup durable completion and recovery fix",
        "complete",
      ],
      [
        "Include an idempotent backfill/reconciliation path for other affected users",
        "complete",
      ],
      ["Retain current public-profile cache invalidation", "complete"],
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Reconcile the stale tree without force-pushing or cherry-picking the giant snapshot",
          "Restore migration immutability, tooling, lockfile, agent docs, and cache invalidation",
          "Complete and backfill organization-setup progress for Karissa and other affected users",
        ],
      },
      {
        label: "Outcome",
        items: [
          "A clean donor branch based on current main",
          "New and recovered users advance past Create your organization",
        ],
      },
    ],
    footer:
      "Rollback application logic only; retain append-only corrective progress records.",
  },
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch2,
    x: 1480,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "merged",
    sequence: 2,
    eyebrow: "Merge 2 of 7",
    title: "Organization and workspace foundation",
    statusLabel: "Merged",
    summary:
      "Batch 2 is locally complete: Organization, Workspace, and People are verified, the future Finance identity remains separate, and Prototype Lab code is restricted to its authorized admin route and owned navigation.",
    dependencies: ["Batch 1 merged", "Finance IA approved"],
    inputNodeIds: [
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalFinance,
      FINANCE_RELEASE_PLAN_NODE_IDS.research2,
    ],
    workItems: defineBatchWorkItems(2, [
      [
        "Organization profile, brand kit, MVV, program/primary-object, and deep-link work that remains valid after upstream reconciliation",
        "complete",
      ],
      [
        "Workspace ontology, canvas persistence, drawer geometry, roadmap/calendar, global search, accelerator rail, and a separate future Finance identity",
        "complete",
      ],
      [
        "People segments, tags, links, table sizing, and optimistic persistence where they share the workspace schema and interaction contract",
        "complete",
      ],
      [
        "Exclude prototype/demo work without an owned production acceptance case",
        "complete",
      ],
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Reconcile organization profile, brand, MVV, programs, and deep links",
          "Preserve workspace ontology, drawer geometry, roadmap, accelerator, and saved canvas state",
          "Preserve economic-engine and reserve a separate future Finance card identity",
        ],
      },
      {
        label: "Outcome",
        items: [
          "One canonical workspace composition",
          "Durable optimistic persistence with rollback",
        ],
      },
    ],
    footer:
      "Rollback new surfaces behind flags; preserve saved board, organization, and People rows.",
  },
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch3,
    x: 2420,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "in_progress",
    sequence: 3,
    eyebrow: "Merge 3 of 7",
    title: "Fiscal sponsorship and project operations",
    statusLabel: "Review and merge",
    summary:
      "Native signing, atomic fiscal and project operations, durable audit history, acceptance suites, final-schema RLS, authenticated production-route roles, and PDF integrity are verified. The counsel-approved document remains canonical, and the application never moves money.",
    dependencies: ["Batches 1 and 2 merged", "Counsel-approved document"],
    inputNodeIds: [
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalFiscal,
      FINANCE_RELEASE_PLAN_NODE_IDS.research3,
    ],
    workItems: defineBatchWorkItems(3, [
      [
        "Retain the released fiscal review and native signing behavior from main",
        "complete",
      ],
      [
        "Integrate remaining applicant, coach, project, budget, document, task, Form B, W-9, review, and audit work",
        "complete",
      ],
      [
        "Retain the counsel-approved document and records-only operating boundary",
        "complete",
      ],
      ["Obtain non-author review and merge PR #120", "in_progress"],
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Integrate applicant, coach, project, budget, document, task, Form B, W-9, review, and audit work",
          "Retain released native signing and fiscal review behavior",
          "Record grant decisions and externally executed payments without initiating bank activity",
        ],
      },
      {
        label: "Outcome",
        items: [
          "Signed fiscal workflow with clear role boundaries",
          "No payment processing, bank credentials, transfers, or automated disbursement",
        ],
      },
    ],
    footer:
      "Rollback entry points only; retain signed artifacts, audit events, and completed reviews.",
  },
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch4,
    x: 3360,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "not_started",
    sequence: 4,
    eyebrow: "Merge 4 of 7",
    title: "Resource data and publication pipeline",
    statusLabel: "Verified cohorts",
    summary:
      "Build the evidence, review, promotion, and freshness pipeline needed to scale toward 5,000 useful public resources.",
    dependencies: ["Batch 1 merged", "Remote migration history reconciled"],
    inputNodeIds: [FINANCE_RELEASE_PLAN_NODE_IDS.research4],
    workItems: defineBatchWorkItems(4, [
      "Deterministic source ingestion, evidence, normalization, duplicate review, admin review, atomic promotion, and freshness checks",
      "Append-only schema changes rebuilt after current migrations",
      "Exact cohort count reporting",
      "No raw intake queue, generated corpus, or discovery preview in public output",
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Deterministic ingestion, provenance, normalization, deduplication, and admin review",
          "Atomic promotion with exact gate counts and freshness checks",
          "Keep raw candidates, generated previews, and synthetic seeds off /find",
        ],
      },
      {
        label: "Outcome",
        items: [
          "Publishable cohorts with auditable evidence",
          "Exact discovered-to-public count parity",
        ],
      },
    ],
    footer:
      "Rollback by unpublishing a cohort; retain evidence, decisions, and canonical records.",
  },
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch5,
    x: 4300,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "not_started",
    sequence: 5,
    eyebrow: "Merge 5 of 7",
    title: "Public Find, signup, location, and weather",
    statusLabel: "Public journey",
    summary:
      "Make the map fast, private by default, context-preserving during signup, and weather-aware without hiding resources.",
    dependencies: ["Batches 2 and 4 merged", "Privacy policy approved"],
    inputNodeIds: [FINANCE_RELEASE_PLAN_NODE_IDS.research5],
    workItems: defineBatchWorkItems(5, [
      "Drawer, search, empty/loading/error states, zoom relevance, clustering, saved override, and on-demand detail payloads",
      "Canonical public profile and program/campaign route shells",
      "In-map auth overlay and idempotent pending-action replay",
      "Server-redacted sensitive contact fields",
      "Typed lists/saves migration with safe guest import",
      "Repaired browser location state machine",
      "NWS weather cache and cooling-center promotion",
      "Public resource index/detail split and pagination",
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Index/detail payload split, bbox queries, search states, zoom relevance, and saved overrides",
          "In-map auth overlay, signed one-time action replay, typed lists, and server-redacted contacts",
          "Permission state machine plus NWS-backed cooling-center relevance with stale-if-error",
        ],
      },
      {
        label: "Outcome",
        items: [
          "Map context survives authentication",
          "Complete results remain discoverable at every zoom and weather state",
        ],
      },
    ],
    footer:
      "Disable weather promotion and auth replay independently; preserve normal search and existing saves.",
  },
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch6,
    x: 5240,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "not_started",
    sequence: 6,
    eyebrow: "Merge 6 of 7",
    title: "Finance records and reporting foundation",
    statusLabel: "Records core",
    summary:
      "Create the server-side campaign, external-record, evidence, review, reconciliation, and public-summary foundation without moving money.",
    dependencies: [
      "Batch 1 merged",
      "Finance IA approved",
      "Records-only boundary approved",
    ],
    inputNodeIds: [
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalFinance,
      FINANCE_RELEASE_PLAN_NODE_IDS.research6,
    ],
    workItems: defineBatchWorkItems(6, [
      "Finance capabilities and RLS",
      "Campaign, finance-record, source-evidence, and import persistence",
      "Grant requests, decisions, and externally executed payment records",
      "Review, correction, reconciliation, summaries, donor privacy, and public projections",
      "No bank credentials, payment processing, transfers, refunds, or automated disbursement",
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Finance capabilities, RLS, external records, evidence, imports, and revision-safe review",
          "Grant requests, decisions, external-payment records, corrections, and reconciliation",
          "Source-labeled summaries, privacy, exports, and approved public projections",
        ],
      },
      {
        label: "Outcome",
        items: [
          "Finance workflow with no in-app money movement",
          "Reconciled summaries derived only from authorized external records",
        ],
      },
    ],
    footer:
      "Disable new mutations and entry points; retain records, evidence, corrections, and audit history.",
  },
  {
    id: FINANCE_RELEASE_PLAN_NODE_IDS.batch7,
    x: 6180,
    y: RELEASE_Y,
    width: 520,
    height: 560,
    kind: "batch",
    executionState: "not_started",
    sequence: 7,
    eyebrow: "Merge 7 of 7",
    title: "Finance experience, external records, and cutover",
    statusLabel: "Integrated release",
    summary:
      "Add the visible Finance journey after its records, permissions, public-map, and reporting foundations are proven.",
    dependencies: [
      "Batches 2, 3, 5, and 6 merged",
      "Counsel-approved document retained",
      "Finance IA and visual hierarchy approved",
    ],
    inputNodeIds: [
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalFiscal,
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalFinance,
      FINANCE_RELEASE_PLAN_NODE_IDS.approvalVisual,
      FINANCE_RELEASE_PLAN_NODE_IDS.research3,
      FINANCE_RELEASE_PLAN_NODE_IDS.research7,
    ],
    workItems: defineBatchWorkItems(7, [
      "Create Finance as its own card without changing economic-engine",
      "Add Finance drawer Overview, Opportunities, Fundraising, and Reporting",
      "Add campaigns, source-labeled progress, source composition, public toggle, exports, and rich public sharing",
      "Add opportunity source/match/workflow and reusable opportunity detail node",
      "Add organization/project-isolated finance records, grant requests, approvals, recorded external payments, and reporting periods without letting storage dictate UI",
      "Run production backfills, canary records/campaigns, monitoring, support playbook, and final integrated release verification",
    ]),
    sections: [
      {
        label: "Build",
        items: [
          "Create a separate Finance card with Overview, Opportunities, Fundraising, and Reporting while preserving economic-engine",
          "Add campaigns, verified progress, source composition, public visibility, exports, and opportunity workflow",
          "Add isolated external records, grant decisions, recorded external payments, reporting, and canaries without expanding the approved UI",
        ],
      },
      {
        label: "Outcome",
        items: [
          "Truthful empty, draft, importing, review, reconciled, corrected, and mismatch states",
          "Gradual production enablement with operational ownership",
        ],
      },
    ],
    footer:
      "Disable creation and public Finance UI while preserving records, evidence, decisions, corrections, and audit history.",
  },
]
