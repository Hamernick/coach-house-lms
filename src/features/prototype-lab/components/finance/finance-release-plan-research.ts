import { deriveFinancePlanResearchInputState } from "./finance-plan-evidence"
import {
  FINANCE_RELEASE_PLAN_NODE_IDS,
  type FinancePlanEvidenceState,
  type FinancePlanResearchItem,
  type FinancePlanResearchItemKind,
  type FinanceReleasePlanDefinition,
} from "./finance-release-plan-data"

const RESEARCH_Y = 1300

type FinancePlanResearchItemInput =
  | string
  | readonly [title: string, state: FinancePlanEvidenceState]

function defineResearchItems(
  sequence: number,
  kind: FinancePlanResearchItemKind,
  inputs: readonly FinancePlanResearchItemInput[]
): FinancePlanResearchItem[] {
  return inputs.map((input, index) => ({
    id: `research-${sequence}-${kind}-${index + 1}`,
    kind,
    state: typeof input === "string" ? "not_started" : input[1],
    title: typeof input === "string" ? input : input[0],
  }))
}

function defineResearch(
  definition: Omit<
    FinanceReleasePlanDefinition,
    "inputState" | "researchItems" | "sections"
  >,
  questions: readonly FinancePlanResearchItemInput[],
  evidence: readonly FinancePlanResearchItemInput[]
): FinanceReleasePlanDefinition {
  const researchItems = [
    ...defineResearchItems(definition.sequence ?? 0, "question", questions),
    ...defineResearchItems(definition.sequence ?? 0, "evidence", evidence),
  ]

  return {
    ...definition,
    inputState: deriveFinancePlanResearchInputState(researchItems),
    researchItems,
    sections: [
      {
        label: "Answer",
        items: researchItems
          .filter((item) => item.kind === "question")
          .map((item) => item.title),
      },
      {
        label: "Evidence required",
        items: researchItems
          .filter((item) => item.kind === "evidence")
          .map((item) => item.title),
      },
    ],
  }
}

export const FINANCE_RELEASE_PLAN_RESEARCH: FinanceReleasePlanDefinition[] = [
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research1,
      sequence: 1,
      x: 540,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research due before Batch 1",
      title: "Release baseline and onboarding cohort",
      statusLabel: "Verified",
      summary:
        "The 2026-08-04 audit is directional; branch, CI, migrations, and affected-user evidence must be refreshed.",
    },
    [
      [
        "What changed on origin/main, in remote migrations, and in required checks since the audit?",
        "verified",
      ],
      [
        "How many saved organizations lack durable organization-setup progress?",
        "verified",
      ],
    ],
    [
      [
        "Fresh divergence/conflict report and clean-worktree extraction map",
        "verified",
      ],
      ["PII-safe cohort query plus new/recovered browser fixtures", "verified"],
    ]
  ),
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research2,
      sequence: 2,
      x: 1480,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research due before Batch 2",
      title: "Canonical workspace and Finance ownership",
      statusLabel: "Verified",
      summary:
        "Current ownership, donor extraction, forward-compatible layout migration, drawer fallback, RLS, and public projection boundaries are documented.",
    },
    [
      [
        "Which current organization/workspace changes remain valid after upstream reconciliation?",
        "verified",
      ],
      [
        "Where should the separate Finance card identity, drawer state, and explicit finance capabilities live without modifying economic-engine?",
        "verified",
      ],
    ],
    [
      [
        "Owner map for composition, persistence, RLS, and public projection boundaries",
        "verified",
      ],
      [
        "State migration and rollback matrix for saved layouts and drawer routes",
        "verified",
      ],
    ]
  ),
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research3,
      sequence: 3,
      x: 2420,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research for Batches 3 and 7",
      title: "Fiscal document and external-record workflow",
      statusLabel: "Resolved",
      summary:
        "Counsel approved the document, and the product records external activity without moving money.",
    },
    [
      [
        "Which document, request, approval, external-payment, and reporting records does the workflow require?",
        "verified",
      ],
      [
        "Where does money move, and what must the application never do?",
        "verified",
      ],
    ],
    [
      ["Product-owner confirmation of counsel-approved document", "verified"],
      [
        "Records-only boundary: external banking, no payment processing or automated disbursement",
        "verified",
      ],
    ]
  ),
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research4,
      sequence: 4,
      x: 3360,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research due before Batch 4",
      title: "Resource inventory, evidence, and scale",
      statusLabel: "Research complete; release gated",
      summary:
        "Inventory and performance budgets are measured. Batch 4 remains gated by Batch 3 and the live 500/853 parity defect.",
    },
    [
      ["What are the exact discovery-to-public counts?", "verified"],
      [
        "Which balanced cohorts and bbox/vector-tile thresholds come next?",
        "verified",
      ],
    ],
    [
      ["Provider gaps plus duplicate/freshness sample", "verified"],
      [
        "Payload, latency, search, marker, bbox, and pagination budgets",
        "verified",
      ],
    ]
  ),
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research5,
      sequence: 5,
      x: 4300,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research due before Batch 5",
      title: "Map privacy, auth replay, location, and heat",
      statusLabel: "Verified",
      summary:
        "Contact, auth replay, location, coarse-cache, NWS, and cooling-center rules are measured and implementation-ready.",
    },
    [
      [
        "Which contacts remain public, which require auth, and what evidence-based rate limit is justified?",
        "verified",
      ],
      [
        "What pending-intent expiry, location storage, NWS threshold, cache TTL, and cooling-center freshness rules apply?",
        "verified",
      ],
    ],
    [
      ["Threat model and payload-redaction audit", "verified"],
      [
        "NWS terms/User-Agent, alert/forecast test corpus, provider-hours policy, and coarse-cache privacy review",
        "verified",
      ],
    ]
  ),
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research6,
      sequence: 6,
      x: 5240,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research due before Batch 6",
      title: "External finance record and import contract",
      statusLabel: "Scope approved; mapping next",
      summary:
        "The application stores source-labeled records, evidence, review state, corrections, and summaries without connecting to bank or payment rails.",
    },
    [
      [
        "Which manual-entry and CSV fields, source labels, evidence types, and reconciliation states are required?",
        "verified",
      ],
      [
        "Which bank/accounting export formats need first-class import mappings?",
        "not_started",
      ],
    ],
    [
      [
        "Synthetic record fixtures with forbidden bank-credential assertions",
        "verified",
      ],
      [
        "Manual entry, import, review, correction, reconciliation, grant decision, and external-payment test plan",
        "collecting",
      ],
    ]
  ),
  defineResearch(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.research7,
      sequence: 7,
      x: 6180,
      y: RESEARCH_Y,
      width: 520,
      height: 440,
      kind: "research",
      eyebrow: "Research due before Batch 7",
      title: "Visual references, operations, and cutover",
      statusLabel: "UI direction approved; proof pending",
      summary:
        "The existing Coach House design system is the approved baseline; browser, operational, and cutover proof remain open.",
    },
    [
      [
        "Which hierarchy, density, progress, and status patterns best support the records-only workflow?",
        "verified",
      ],
      [
        "What SLOs, alerts, canary accounts, support owners, rollback drills, and public-cache age are acceptable?",
        "verified",
      ],
    ],
    [
      "Browser review across wireframe, deduplication, responsive, records, and error states",
      [
        "Canary checklist, incident playbook, monitoring dashboard, support matrix, and signed rollout approval",
        "collecting",
      ],
    ]
  ),
]
