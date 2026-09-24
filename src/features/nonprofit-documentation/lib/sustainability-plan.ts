import type {
  DocumentationStageId,
  SustainabilityDirectionId,
  SustainabilityHorizonMonths,
  SustainabilityPlanAction,
  SustainabilityPlanDraft,
  SustainabilityPlanSummary,
} from "../types"

export const SUSTAINABILITY_PLAN_STORAGE_KEY =
  "coach-house:documentation:sustainability-plan:v1"

export const SUSTAINABILITY_DIRECTIONS: Array<{
  id: SustainabilityDirectionId
  label: string
  description: string
}> = [
  {
    id: "maintain",
    label: "Maintain",
    description:
      "Protect the current scope and quality without planned growth.",
  },
  {
    id: "stabilize",
    label: "Stabilize",
    description:
      "Reduce fragility, close gaps, and make delivery more reliable.",
  },
  {
    id: "transition",
    label: "Transition or transfer",
    description:
      "Change ownership, delivery model, leadership, or partnership.",
  },
  {
    id: "grow",
    label: "Grow intentionally",
    description:
      "Expand reach, depth, geography, staffing, or programs in stages.",
  },
  {
    id: "responsible-close",
    label: "Conclude responsibly",
    description: "Plan an orderly program or organizational closeout.",
  },
]

export const SUSTAINABILITY_HORIZONS: SustainabilityHorizonMonths[] = [
  6, 12, 18, 24, 36,
]

export const DEFAULT_SUSTAINABILITY_PLAN: SustainabilityPlanDraft = {
  version: 1,
  organizationName: "",
  initiativeName: "",
  stage: "exploring",
  direction: "stabilize",
  horizonMonths: 12,
  unrestrictedCash: 0,
  expectedUnrestrictedRevenue: 0,
  restrictedFunds: 0,
  monthlyCoreCosts: 0,
  monthlyProgramCosts: 0,
  weeklyAvailableHours: 0,
  weeklyCommittedHours: 0,
  missionPriority: "",
  essentialCommitments: "",
  fundingAssumptions: "",
  peopleDependencies: "",
  systemsDependencies: "",
  adaptationTriggers: "",
  continuityOwner: "",
  reviewRhythm: "",
  hasBoardFinancialReview: false,
  hasRestrictionReview: false,
  hasContinuityPlan: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const DIRECTIONS = SUSTAINABILITY_DIRECTIONS.map(({ id }) => id)
const DRAFTED_KEYS: Array<keyof SustainabilityPlanDraft> = [
  "missionPriority",
  "essentialCommitments",
  "fundingAssumptions",
  "peopleDependencies",
  "systemsDependencies",
  "adaptationTriggers",
  "continuityOwner",
  "reviewRhythm",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

function safeNumber(value: unknown, maximum: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(maximum, Math.max(0, Math.round(parsed * 100) / 100))
}

export function sanitizeSustainabilityPlan(
  value: unknown
): SustainabilityPlanDraft {
  if (!isRecord(value)) return DEFAULT_SUSTAINABILITY_PLAN
  const horizon = Number(value.horizonMonths) as SustainabilityHorizonMonths
  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    initiativeName: safeText(value.initiativeName, 120),
    stage: STAGES.includes(value.stage as DocumentationStageId)
      ? (value.stage as DocumentationStageId)
      : DEFAULT_SUSTAINABILITY_PLAN.stage,
    direction: DIRECTIONS.includes(value.direction as SustainabilityDirectionId)
      ? (value.direction as SustainabilityDirectionId)
      : DEFAULT_SUSTAINABILITY_PLAN.direction,
    horizonMonths: SUSTAINABILITY_HORIZONS.includes(horizon) ? horizon : 12,
    unrestrictedCash: safeNumber(value.unrestrictedCash, 1_000_000_000),
    expectedUnrestrictedRevenue: safeNumber(
      value.expectedUnrestrictedRevenue,
      1_000_000_000
    ),
    restrictedFunds: safeNumber(value.restrictedFunds, 1_000_000_000),
    monthlyCoreCosts: safeNumber(value.monthlyCoreCosts, 100_000_000),
    monthlyProgramCosts: safeNumber(value.monthlyProgramCosts, 100_000_000),
    weeklyAvailableHours: safeNumber(value.weeklyAvailableHours, 100_000),
    weeklyCommittedHours: safeNumber(value.weeklyCommittedHours, 100_000),
    missionPriority: safeText(value.missionPriority, 800),
    essentialCommitments: safeText(value.essentialCommitments, 1000),
    fundingAssumptions: safeText(value.fundingAssumptions, 1000),
    peopleDependencies: safeText(value.peopleDependencies, 1000),
    systemsDependencies: safeText(value.systemsDependencies, 1000),
    adaptationTriggers: safeText(value.adaptationTriggers, 1000),
    continuityOwner: safeText(value.continuityOwner, 300),
    reviewRhythm: safeText(value.reviewRhythm, 500),
    hasBoardFinancialReview: value.hasBoardFinancialReview === true,
    hasRestrictionReview: value.hasRestrictionReview === true,
    hasContinuityPlan: value.hasContinuityPlan === true,
  }
}

export function sustainabilityDirectionLabel(
  direction: SustainabilityDirectionId
) {
  return (
    SUSTAINABILITY_DIRECTIONS.find(({ id }) => id === direction)?.label ??
    "Stabilize"
  )
}

export function summarizeSustainabilityPlan(
  draft: SustainabilityPlanDraft
): SustainabilityPlanSummary {
  const monthlyPlannedCost = draft.monthlyCoreCosts + draft.monthlyProgramCosts
  const horizonPlannedCost = monthlyPlannedCost * draft.horizonMonths
  const flexibleResources =
    draft.unrestrictedCash + draft.expectedUnrestrictedRevenue
  const startingRunwayMonths = monthlyPlannedCost
    ? Math.round((draft.unrestrictedCash / monthlyPlannedCost) * 10) / 10
    : 0
  const draftedAreaCount = DRAFTED_KEYS.filter((key) =>
    String(draft[key]).trim()
  ).length
  return {
    monthlyPlannedCost,
    horizonPlannedCost,
    flexibleResources,
    projectedFlexibleBalance: flexibleResources - horizonPlannedCost,
    startingRunwayMonths,
    weeklyCapacityBalance:
      draft.weeklyAvailableHours - draft.weeklyCommittedHours,
    draftedAreaCount,
    totalAreaCount: DRAFTED_KEYS.length,
    hasReviewableScenario: Boolean(
      draft.missionPriority &&
      draft.essentialCommitments &&
      draft.fundingAssumptions &&
      draft.adaptationTriggers &&
      draft.continuityOwner
    ),
  }
}

const STAGE_ACTIONS: Record<
  DocumentationStageId,
  Omit<SustainabilityPlanAction, "id">
> = {
  exploring: {
    phase: "Mission",
    action:
      "Test the mission benefit and smallest responsible commitment before building permanent cost or infrastructure.",
    evidence:
      "Keep community input, need evidence, the pilot scope, full-cost estimate, assumptions, and the continue or stop decision gate.",
  },
  forming: {
    phase: "Governance",
    action:
      "Connect the program scenario to organization-wide cash timing, shared costs, roles, systems, and early continuity practices.",
    evidence:
      "Keep program and organizational budgets, restrictions, cash assumptions, owners, review cadence, and temporary coverage.",
  },
  operating: {
    phase: "Mission",
    action:
      "Compare actual mission value, demand, delivery, outcomes, cash, workload, and context with the scenario and record one decision.",
    evidence:
      "Keep variance, participant input, finding, limitation, authorized action, owner, communications, and follow-up date.",
  },
  growing: {
    phase: "Continuity",
    action:
      "Stress-test constrained and expansion scenarios before adding locations, staff, contracts, systems, or participant promises.",
    evidence:
      "Keep full-cost scenarios, capacity assumptions, revenue restrictions, site differences, decision gates, and exit obligations.",
  },
}

export function buildSustainabilityActions(
  draft: SustainabilityPlanDraft
): SustainabilityPlanAction[] {
  const summary = summarizeSustainabilityPlan(draft)
  const actions: SustainabilityPlanAction[] = [
    { id: `stage-${draft.stage}`, ...STAGE_ACTIONS[draft.stage] },
  ]
  if (summary.projectedFlexibleBalance < 0) {
    actions.push({
      id: "flexible-gap",
      phase: "Money",
      action:
        "Resolve the projected flexible-resource gap or change the timing, scope, or commitments before treating the scenario as funded.",
      evidence:
        "Keep a cash-flow forecast, source restrictions, receipt timing, probabilities, updated costs, approved response, and actuals.",
    })
  }
  if (summary.weeklyCapacityBalance < 0) {
    actions.push({
      id: "capacity-gap",
      phase: "People",
      action:
        "Reduce commitments, add supported capacity, or redesign the work instead of relying on hidden overtime or unpaid labor.",
      evidence:
        "Keep workload estimates, staff and volunteer input, role changes, supervision, compensation, hiring timing, and approval.",
    })
  }
  if (draft.restrictedFunds > 0 && !draft.hasRestrictionReview) {
    actions.push({
      id: "restriction-review",
      phase: "Money",
      action:
        "Confirm the purpose, timing, documentation, and allowable use of restricted resources before assigning them to obligations.",
      evidence:
        "Keep the executed agreement or donor documentation, accounting classification, current balance, allowable costs, and qualified review.",
    })
  }
  if (!draft.adaptationTriggers || !draft.continuityOwner) {
    actions.push({
      id: "continuity-ownership",
      phase: "Continuity",
      action:
        "Define material triggers, one continuity owner, decision authority, response options, communications, and the next review.",
      evidence:
        "Keep thresholds, responsible and backup roles, board authority, response playbook, contact list, and review record.",
    })
  }
  if (!draft.hasBoardFinancialReview || !draft.hasContinuityPlan) {
    actions.push({
      id: "governance-review",
      phase: "Governance",
      action:
        "Schedule proportionate board financial oversight and document succession or emergency continuity for essential functions.",
      evidence:
        "Keep the board packet and minutes, current financial reports, interim authority, critical-function procedures, and test results.",
    })
  }
  return actions
}

function safeCsvCell(value: string | number | boolean) {
  const text = String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function buildSustainabilityCsv(draft: SustainabilityPlanDraft) {
  const summary = summarizeSustainabilityPlan(draft)
  const rows: Array<[string, string | number | boolean]> = [
    ["Organization", draft.organizationName],
    ["Program or initiative", draft.initiativeName],
    ["Organization stage", draft.stage],
    ["Direction", sustainabilityDirectionLabel(draft.direction)],
    ["Planning horizon in months", draft.horizonMonths],
    ["Mission benefit to protect", draft.missionPriority],
    ["Essential commitments", draft.essentialCommitments],
    ["Unrestricted cash at start", draft.unrestrictedCash],
    ["Expected unrestricted revenue", draft.expectedUnrestrictedRevenue],
    ["Restricted funds shown separately", draft.restrictedFunds],
    ["Monthly core costs", draft.monthlyCoreCosts],
    ["Monthly program costs", draft.monthlyProgramCosts],
    ["Monthly planned cost", summary.monthlyPlannedCost],
    ["Horizon planned cost", summary.horizonPlannedCost],
    ["Flexible resources", summary.flexibleResources],
    ["Projected flexible balance", summary.projectedFlexibleBalance],
    ["Starting cash runway in months", summary.startingRunwayMonths],
    ["Weekly available hours", draft.weeklyAvailableHours],
    ["Weekly committed hours", draft.weeklyCommittedHours],
    ["Weekly capacity balance", summary.weeklyCapacityBalance],
    ["Funding assumptions", draft.fundingAssumptions],
    ["People and leadership dependencies", draft.peopleDependencies],
    ["Systems and partner dependencies", draft.systemsDependencies],
    ["Adaptation and continuity triggers", draft.adaptationTriggers],
    ["Continuity owner", draft.continuityOwner],
    ["Review rhythm", draft.reviewRhythm],
    ["Board financial review planned", draft.hasBoardFinancialReview],
    ["Funding restrictions reviewed", draft.hasRestrictionReview],
    ["Continuity plan documented", draft.hasContinuityPlan],
  ]
  return [
    '"Area","Working scenario"',
    ...rows.map((row) => row.map(safeCsvCell).join(",")),
  ].join("\n")
}

export function buildSustainabilityReviewPrompt(
  draft: SustainabilityPlanDraft
) {
  const summary = summarizeSustainabilityPlan(draft)
  return `You are reviewing a nonprofit sustainability scenario. Treat every entry and calculation below as an unverified planning assumption, not established fact or professional advice.

Do not invent revenue, expenses, cash timing, restrictions, funder commitments, capacity, outcomes, legal duties, board approvals, benchmarks, reserve targets, or probabilities. Mark missing information as [NEEDS HUMAN INPUT]. Do not count restricted funds as flexible resources.

Organization: ${draft.organizationName || "[NEEDS HUMAN INPUT]"}
Program or initiative: ${draft.initiativeName || "[NEEDS HUMAN INPUT]"}
Stage: ${draft.stage}
Direction: ${sustainabilityDirectionLabel(draft.direction)}
Planning horizon: ${draft.horizonMonths} months
Mission benefit to protect: ${draft.missionPriority || "[NEEDS HUMAN INPUT]"}
Essential commitments: ${draft.essentialCommitments || "[NEEDS HUMAN INPUT]"}
Unrestricted cash at start: $${draft.unrestrictedCash}
Expected unrestricted revenue over horizon: $${draft.expectedUnrestrictedRevenue}
Restricted funds shown separately: $${draft.restrictedFunds}
Monthly core costs: $${draft.monthlyCoreCosts}
Monthly program costs: $${draft.monthlyProgramCosts}
Projected flexible balance: $${summary.projectedFlexibleBalance}
Starting cash runway: ${summary.startingRunwayMonths} months, excluding future revenue
Weekly capacity balance: ${summary.weeklyCapacityBalance} hours
Funding assumptions: ${draft.fundingAssumptions || "[NEEDS HUMAN INPUT]"}
People dependencies: ${draft.peopleDependencies || "[NEEDS HUMAN INPUT]"}
Systems and partner dependencies: ${draft.systemsDependencies || "[NEEDS HUMAN INPUT]"}
Adaptation and continuity triggers: ${draft.adaptationTriggers || "[NEEDS HUMAN INPUT]"}
Continuity owner: ${draft.continuityOwner || "[NEEDS HUMAN INPUT]"}
Review rhythm: ${draft.reviewRhythm || "[NEEDS HUMAN INPUT]"}
Board financial review planned: ${draft.hasBoardFinancialReview ? "yes" : "no"}
Funding restrictions reviewed: ${draft.hasRestrictionReview ? "yes" : "no"}
Continuity plan documented: ${draft.hasContinuityPlan ? "yes" : "no"}

Return:
1. A concise restatement of the scenario without strengthening any assumption.
2. Missing cash-timing, restriction, full-cost, workload, evidence, or governance information.
3. Mission, participant, staff, partner, continuity, and responsible-transition risks for human review.
4. Base, constrained, and decision-gate questions without inventing values.
5. Five questions for a board and staff review meeting and one smallest responsible next action.

End with: This review does not validate sustainability, solvency, liquidity, restrictions, capacity, governance, legal compliance, or readiness to grow, transition, or close.`
}
