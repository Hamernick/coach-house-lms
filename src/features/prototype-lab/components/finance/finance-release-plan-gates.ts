import { deriveFinancePlanGateState } from "./finance-plan-evidence"
import {
  FINANCE_RELEASE_PLAN_NODE_IDS,
  type FinancePlanEvidenceState,
  type FinancePlanGateEvidence,
  type FinanceReleasePlanDefinition,
} from "./finance-release-plan-data"

const GATE_Y = 675

type FinancePlanGateEvidenceInput =
  | string
  | readonly [title: string, state: FinancePlanEvidenceState]

function defineGateEvidence(
  sequence: number,
  inputs: readonly FinancePlanGateEvidenceInput[]
): FinancePlanGateEvidence[] {
  return inputs.map((input, index) => ({
    id: `gate-${sequence}-evidence-${index + 1}`,
    state: typeof input === "string" ? "not_started" : input[1],
    title: typeof input === "string" ? input : input[0],
  }))
}

function defineGate(
  definition: Omit<
    FinanceReleasePlanDefinition,
    "gateEvidence" | "gateState" | "sections"
  >,
  gateEvidence: FinancePlanGateEvidence[]
): FinanceReleasePlanDefinition {
  return {
    ...definition,
    gateEvidence,
    gateState: deriveFinancePlanGateState(gateEvidence),
    sections: [
      {
        label: "Proof required",
        items: gateEvidence.map((item) => item.title),
      },
    ],
  }
}

export const FINANCE_RELEASE_PLAN_GATES: FinanceReleasePlanDefinition[] = [
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate1,
      x: 1120,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 1,
      eyebrow: "Merge gate 1",
      title: "Baseline proven",
      statusLabel: "Required",
      summary:
        "Do not start Batch 2 until the release base and onboarding recovery are verified.",
    },
    defineGateEvidence(1, [
      ["Clean diff and install", "verified"],
      ["Supply-chain and large-file checks", "verified"],
      ["All structural guardrails", "verified"],
      [
        "Focused onboarding, organization save, cache, authz, and RLS tests",
        "verified",
      ],
      ["Authenticated browser test for new and recovered users", "verified"],
    ])
  ),
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate2,
      x: 2060,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 2,
      eyebrow: "Merge gate 2",
      title: "Workspace stable",
      statusLabel: "Preview pending",
      summary:
        "Local quality is verified; connected RLS and non-persisting authenticated preview proof remain.",
    },
    defineGateEvidence(2, [
      [
        "Workspace storage, interaction-lock, React Grab, workspace-surface, raw-button, route, feature, structure, boundary, and threshold checks",
        "verified",
      ],
      [
        "Focused Organization, People, canvas, drawer, and optimistic rollback tests",
        "verified",
      ],
      [
        "Desktop/mobile, light/dark, fullscreen, overflow, and reduced-motion browser checks; visual baselines only for intentional changes",
        "collecting",
      ],
    ])
  ),
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate3,
      x: 3000,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 3,
      eyebrow: "Merge gate 3",
      title: "Fiscal workflow proven",
      statusLabel: "Proven",
      summary:
        "The technical workflow is proven, the counsel-approved document remains canonical, and money movement stays outside the application.",
    },
    defineGateEvidence(3, [
      ["Fiscal and member-workspace acceptance suites", "verified"],
      ["Final-schema RLS", "verified"],
      ["PDF render/hash/download verification", "verified"],
      [
        "Applicant, assigned-coach, sponsor-operator, and denied-role browser journeys",
        "verified",
      ],
      [
        "Product confirmation that the counsel-approved document remains canonical and the application does not move money",
        "verified",
      ],
    ])
  ),
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate4,
      x: 3940,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 4,
      eyebrow: "Merge gate 4",
      title: "Publication parity",
      statusLabel: "Required",
      summary:
        "A resource cohort advances only when every private-to-public gate reconciles exactly.",
    },
    defineGateEvidence(4, [
      "Data-engine, enrichment, admin, deduplication, promotion, and RLS tests",
      "Provider verification dry run",
      "Complete/verified/publishable/promoted/public count parity",
      "Migration immutability and remote-history comparison",
      "Canary one source cohort before broader promotion",
    ])
  ),
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate5,
      x: 4880,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 5,
      eyebrow: "Merge gate 5",
      title: "Public journey proven",
      statusLabel: "Required",
      summary:
        "The map must stay complete, private, responsive, and recoverable across auth, location, and weather states.",
    },
    defineGateEvidence(5, [
      "Full public-map, profile metadata, auth replay, privacy, list, location, weather, and caching tests",
      "Anonymous/authenticated browser journeys at desktop/mobile sizes and zooms",
      "Denial/retry/offline/stale-weather scenarios",
      "Payload, marker, LCP/TTI, visual, and accessibility budgets",
    ])
  ),
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate6,
      x: 5820,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 6,
      eyebrow: "Merge gate 6",
      title: "Finance records proven",
      statusLabel: "Security review",
      summary:
        "No Finance UI launches until record ownership, authorization, import safety, correction history, and reconciliation are proven.",
    },
    defineGateEvidence(6, [
      "Source, amount, date, currency, reference, evidence, organization/project scope, and forbidden bank-field tests",
      "Owner/admin/operator allow and all other roles deny",
      "Concurrent edit, duplicate import, stale review, correction, cross-project, mixed-currency, and reconciliation tests",
      "End-to-end manual entry, CSV import, grant request, approval, external-payment record, correction, and reporting journeys",
      "No bank credentials, payment processing, transfers, refunds, or automated disbursement paths",
      "Final-schema RLS and security review",
    ])
  ),
  defineGate(
    {
      id: FINANCE_RELEASE_PLAN_NODE_IDS.gate7,
      x: 6760,
      y: GATE_Y,
      width: 300,
      height: 370,
      kind: "gate",
      sequence: 7,
      eyebrow: "Merge gate 7",
      title: "Cutover approved",
      statusLabel: "Final gate",
      summary:
        "Code completion is not release completion; the integrated artifact must pass every production gate.",
    },
    defineGateEvidence(7, [
      "Empty, draft, importing, needs-review, reconciled, corrected, rejected, and mismatch UI states",
      "Finance role matrix and donor-PII isolation",
      "Fiscal request, decision, external-payment record, and correction-history tests",
      "Public aggregate and cache invalidation tests",
      "Opportunity progression persistence and reduced-motion visuals",
      "CSV formula-neutralization tests",
      "Full pnpm check:quality from a clean release artifact",
      "Production canary with one internal organization, then one approved real organization, followed by monitored gradual enablement",
    ])
  ),
]
