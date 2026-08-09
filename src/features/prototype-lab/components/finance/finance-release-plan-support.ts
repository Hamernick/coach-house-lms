import {
  FINANCE_RELEASE_PLAN_NODE_IDS,
  type FinancePlanDecisionItem,
  type FinancePlanDecisionItemState,
  type FinanceReleasePlanDefinition,
} from "./finance-release-plan-data"

type FinancePlanDecisionInput =
  | string
  | readonly [title: string, state: FinancePlanDecisionItemState]

function defineDecisionItems(
  decisionId: string,
  inputs: readonly FinancePlanDecisionInput[]
): FinancePlanDecisionItem[] {
  return inputs.map((input, index) => {
    const [title, state] =
      typeof input === "string" ? [input, "pending" as const] : input

    return {
      id: `${decisionId}-criterion-${index + 1}`,
      state,
      title,
    }
  })
}

export const FINANCE_RELEASE_PLAN_SUPPORT_NODES: FinanceReleasePlanDefinition[] =
  [
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.laneApprovals,
      x: -360,
      y: 90,
      width: 280,
      height: 110,
      kind: "lane",
      eyebrow: "Lane 1",
      title: "Guardrails and approvals",
      statusLabel: "Before implementation",
      summary: "Human decisions and constraints that block unsafe work.",
      sections: [],
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.laneRelease,
      x: -360,
      y: 650,
      width: 280,
      height: 110,
      kind: "lane",
      eyebrow: "Lane 2",
      title: "Release sequence",
      statusLabel: "Exactly seven merges",
      summary: "Each merge begins from the newly merged main branch.",
      sections: [],
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.laneResearch,
      x: -360,
      y: 1370,
      width: 280,
      height: 110,
      kind: "lane",
      eyebrow: "Lane 3",
      title: "Research required",
      statusLabel: "Due before each batch",
      summary: "Questions and evidence that must be resolved before coding.",
      sections: [],
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.guardrails,
      x: 0,
      y: 0,
      width: 480,
      height: 420,
      kind: "guardrail",
      eyebrow: "Non-negotiable constraints",
      title: "Do not cross these boundaries",
      statusLabel: "Always enforced",
      summary:
        "These rules apply to every branch, test, environment, and release decision.",
      sections: [
        {
          label: "Release safety",
          items: [
            "Never force-push main or deploy from the stale dirty branch",
            "Never edit an applied migration; extract reviewed changes into clean branches",
            "Do not claim success without CI, preview, browser, data, service, monitoring, and rollback proof",
          ],
        },
        {
          label: "Product safety",
          items: [
            "No payment processing, bank linking, bank credentials, transfers, refunds, or automated disbursement",
            "No donor PII, protected contacts, exact location, or raw resource candidates in public payloads",
          ],
        },
      ],
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.approvalRelease,
      x: 540,
      y: 0,
      width: 480,
      height: 420,
      kind: "decision",
      inputState: "resolved",
      decisionItems: defineDecisionItems("release", [
        ["Approve seven sequential branches from current main", "approved"],
        [
          "Confirm there will be no giant snapshot commit or direct hard push",
          "approved",
        ],
        [
          "Decide whether Batch 1 may ship early as an onboarding incident hotfix",
          "approved",
        ],
      ]),
      eyebrow: "Approval 1",
      title: "Release sequence and incident scope",
      statusLabel: "Approved",
      summary:
        "The seven-merge strategy, safe-history boundary, and early onboarding hotfix are approved.",
      sections: [
        {
          label: "Decide",
          items: [
            "Seven sequential branches from current main",
            "No giant snapshot commit or direct hard push",
            "Batch 1 may ship early only with explicit incident approval",
          ],
        },
      ],
      footer: "Resolved before release work began.",
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.approvalFiscal,
      x: 2420,
      y: 0,
      width: 480,
      height: 420,
      kind: "decision",
      inputState: "resolved",
      decisionItems: defineDecisionItems("fiscal", [
        [
          "Retain the counsel-approved fiscal sponsorship document as the canonical legal source",
          "approved",
        ],
        [
          "Keep all money movement in external bank and accounting systems",
          "approved",
        ],
        [
          "Use the application only for signatures, records, requests, approvals, external-payment evidence, and reporting",
          "approved",
        ],
        [
          "Store no bank credentials and provide no payment, transfer, refund, or automated disbursement controls",
          "approved",
        ],
      ]),
      eyebrow: "Approval 2",
      title: "Fiscal document and records boundary",
      statusLabel: "Approved",
      summary:
        "Counsel approved the document. The application records process and external activity but never moves money.",
      sections: [
        {
          label: "Approved boundary",
          items: [
            "Keep the approved document versioned and immutable after signing",
            "Record externally executed payments with source, date, reference, evidence, and review state",
            "Never imply that the application received, held, transferred, refunded, or disbursed funds",
          ],
        },
      ],
      footer: "A future payment feature requires a separate plan and approval.",
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.approvalFinance,
      x: 5240,
      y: 0,
      width: 480,
      height: 420,
      kind: "decision",
      inputState: "resolved",
      decisionItems: defineDecisionItems("finance", [
        [
          "Create Finance as its own card without reusing economic-engine",
          "approved",
        ],
        [
          "Keep Overview, Opportunities, Fundraising, and Reporting as the Finance drawer views for now",
          "approved",
        ],
        [
          "Keep reconciled records, sponsored-project records, drafts, and legacy estimates visibly separate without letting storage dictate UI",
          "approved",
        ],
      ]),
      eyebrow: "Approval 3",
      title: "Finance information architecture",
      statusLabel: "Approved boundaries",
      summary:
        "Finance has its own identity, current drawer naming may remain, and every amount shows its source and review state.",
      sections: [
        {
          label: "Approved",
          items: [
            "Create a separate Finance card and preserve economic-engine",
            "Keep Overview, Opportunities, Fundraising, and Reporting for now",
            "Keep reconciled, sponsored-project, draft, and legacy values separate without exposing raw evidence by default",
          ],
        },
      ],
      footer: "Approved to build with the existing product system.",
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.approvalVisual,
      x: 6180,
      y: 0,
      width: 480,
      height: 420,
      kind: "decision",
      inputState: "resolved",
      decisionItems: defineDecisionItems("visual", [
        [
          "Use the existing Coach House design system and shadcn patterns as the implementation baseline",
          "approved",
        ],
        [
          "Build records-only Finance UI without payment, bank-setup, transfer, refund, or disbursement controls",
          "approved",
        ],
        [
          "Require desktop/mobile, empty/draft/review/reconciled/error, light/dark, and reduced-motion browser proof before release",
          "approved",
        ],
      ]),
      eyebrow: "Approval 4",
      title: "Finance UI direction",
      statusLabel: "Approved to build",
      summary:
        "Use the existing product system now; reference-driven polish remains optional and cannot expand the records-only scope.",
      sections: [
        {
          label: "Build boundary",
          items: [
            "Prioritize source, as-of time, review state, and next action",
            "Remove duplicated metrics, payment language, and premature controls",
            "Verify responsive, empty, draft, review, reconciled, corrected, error, dark, and reduced-motion states",
          ],
        },
      ],
      footer: "Existing shadcn and Coach House tokens are authoritative.",
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.start,
      x: 0,
      y: 680,
      width: 440,
      height: 360,
      kind: "start",
      eyebrow: "Beginning",
      title: "Unsafe current release tree",
      statusLabel: "Do not push",
      summary:
        "The 2026-08-04 snapshot is not a releasable artifact and must remain a read-only donor.",
      sections: [
        {
          label: "Audit evidence",
          items: [
            "50 commits behind origin/main and 989 staged paths",
            "Hundreds of divergent files, migration rewrites, deleted upstream behavior, and failing quality gates",
            "A hard push would lose staged work or regress production",
          ],
        },
      ],
      footer:
        "Next: approve the sequence, refresh the audit, and extract Batch 1 from current main.",
    },
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.finish,
      x: 7120,
      y: 625,
      width: 480,
      height: 470,
      kind: "finish",
      eyebrow: "End state",
      title: "Verified gradual production release",
      statusLabel: "Definition of done",
      summary:
        "The goal is complete only when product, financial, public-map, policy, and operational evidence agree.",
      sections: [
        {
          label: "Must be true",
          items: [
            "Seven clean PRs merged in order; onboarding recovery proven for Karissa and another affected user",
            "Finance summaries reconcile to authorized external records; donor PII and protected contacts stay private",
            "The approved fiscal document remains canonical; external-payment records and public resources meet their release rules",
          ],
        },
        {
          label: "Release sequence",
          items: [
            "Clean quality artifact and fixture proof",
            "Internal records-only canary",
            "One approved organization canary, monitored gradual enablement, and rollback verification",
          ],
        },
      ],
      footer: "Financial history is never deleted during rollback.",
    },
  ]
