import type {
  FinancePeriodMonths,
  FinancePlanAction,
  FinancePlanDraft,
  FinancePlanSummary,
} from "../finance-types"
import type { DocumentationStageId } from "../types"

export const FINANCE_PLAN_STORAGE_KEY =
  "coach-house:documentation:finance-plan:v1"

export const FINANCE_PERIODS: FinancePeriodMonths[] = [3, 6, 12, 18]

export const FINANCE_CYCLE = [
  {
    id: "plan",
    label: "Plan",
    description:
      "Connect mission commitments, full cost, revenue evidence, and cash timing.",
    fields: [
      "missionCommitments",
      "fullCostAssumptions",
      "revenueEvidence",
      "cashTiming",
    ] as const,
  },
  {
    id: "approve",
    label: "Approve",
    description:
      "Document budget ownership, authority, thresholds, and conflicts.",
    fields: ["budgetOwnership", "purchaseApproval"] as const,
  },
  {
    id: "record",
    label: "Record",
    description:
      "Align restrictions, source documents, accounts, payroll, and taxes.",
    fields: [
      "restrictionTracking",
      "payrollTaxHandoff",
      "bookkeepingAlignment",
      "recordsBoundary",
    ] as const,
  },
  {
    id: "reconcile",
    label: "Reconcile",
    description:
      "Separate custody, approval, recording, and independent review where practical.",
    fields: ["paymentReimbursement", "bankReconciliation"] as const,
  },
  {
    id: "report",
    label: "Report",
    description:
      "Give staff and the board timely, decision-useful financial information.",
    fields: ["reportingRhythm"] as const,
  },
  {
    id: "reforecast",
    label: "Reforecast",
    description:
      "Use material variance and timing changes to trigger an authorized response.",
    fields: ["varianceTriggers"] as const,
  },
] as const

export const DEFAULT_FINANCE_PLAN: FinancePlanDraft = {
  version: 1,
  organizationName: "",
  stage: "exploring",
  periodMonths: 12,
  beginningUnrestrictedCash: 0,
  beginningRestrictedCash: 0,
  plannedUnrestrictedInflows: 0,
  plannedRestrictedInflows: 0,
  plannedUnrestrictedOutflows: 0,
  plannedRestrictedOutflows: 0,
  missionCommitments: "",
  fullCostAssumptions: "",
  revenueEvidence: "",
  restrictionTracking: "",
  cashTiming: "",
  budgetOwnership: "",
  purchaseApproval: "",
  paymentReimbursement: "",
  bankReconciliation: "",
  payrollTaxHandoff: "",
  bookkeepingAlignment: "",
  reportingRhythm: "",
  recordsBoundary: "",
  varianceTriggers: "",
  hasApprovedAuthorityReview: false,
  hasRestrictionAwardReview: false,
  hasAccountingPayrollTaxReview: false,
  hasIndependentReconciliationReview: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maximum = 900) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

function safeMoney(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(amount)) return 0
  return Math.min(1_000_000_000, Math.max(0, amount))
}

export function sanitizeFinancePlan(value: unknown): FinancePlanDraft {
  if (!isRecord(value)) return DEFAULT_FINANCE_PLAN
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_FINANCE_PLAN.stage
  const periodMonths = FINANCE_PERIODS.includes(
    value.periodMonths as FinancePeriodMonths
  )
    ? (value.periodMonths as FinancePeriodMonths)
    : DEFAULT_FINANCE_PLAN.periodMonths

  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    stage,
    periodMonths,
    beginningUnrestrictedCash: safeMoney(value.beginningUnrestrictedCash),
    beginningRestrictedCash: safeMoney(value.beginningRestrictedCash),
    plannedUnrestrictedInflows: safeMoney(value.plannedUnrestrictedInflows),
    plannedRestrictedInflows: safeMoney(value.plannedRestrictedInflows),
    plannedUnrestrictedOutflows: safeMoney(value.plannedUnrestrictedOutflows),
    plannedRestrictedOutflows: safeMoney(value.plannedRestrictedOutflows),
    missionCommitments: safeText(value.missionCommitments),
    fullCostAssumptions: safeText(value.fullCostAssumptions),
    revenueEvidence: safeText(value.revenueEvidence),
    restrictionTracking: safeText(value.restrictionTracking),
    cashTiming: safeText(value.cashTiming),
    budgetOwnership: safeText(value.budgetOwnership, 600),
    purchaseApproval: safeText(value.purchaseApproval, 700),
    paymentReimbursement: safeText(value.paymentReimbursement, 700),
    bankReconciliation: safeText(value.bankReconciliation, 700),
    payrollTaxHandoff: safeText(value.payrollTaxHandoff, 700),
    bookkeepingAlignment: safeText(value.bookkeepingAlignment, 700),
    reportingRhythm: safeText(value.reportingRhythm, 700),
    recordsBoundary: safeText(value.recordsBoundary, 700),
    varianceTriggers: safeText(value.varianceTriggers, 700),
    hasApprovedAuthorityReview: value.hasApprovedAuthorityReview === true,
    hasRestrictionAwardReview: value.hasRestrictionAwardReview === true,
    hasAccountingPayrollTaxReview: value.hasAccountingPayrollTaxReview === true,
    hasIndependentReconciliationReview:
      value.hasIndependentReconciliationReview === true,
  }
}

const DRAFT_AREAS: Array<keyof FinancePlanDraft> = [
  "missionCommitments",
  "fullCostAssumptions",
  "revenueEvidence",
  "restrictionTracking",
  "cashTiming",
  "budgetOwnership",
  "purchaseApproval",
  "paymentReimbursement",
  "bankReconciliation",
  "payrollTaxHandoff",
  "bookkeepingAlignment",
  "reportingRhythm",
  "recordsBoundary",
  "varianceTriggers",
]

function hasText(draft: FinancePlanDraft, key: keyof FinancePlanDraft) {
  return typeof draft[key] === "string" && String(draft[key]).trim().length > 0
}

export function summarizeFinancePlan(
  draft: FinancePlanDraft
): FinancePlanSummary {
  const safe = sanitizeFinancePlan(draft)
  const projectedUnrestrictedCash =
    safe.beginningUnrestrictedCash +
    safe.plannedUnrestrictedInflows -
    safe.plannedUnrestrictedOutflows
  const projectedRestrictedCash =
    safe.beginningRestrictedCash +
    safe.plannedRestrictedInflows -
    safe.plannedRestrictedOutflows
  const averageMonthlyUnrestrictedOutflow =
    safe.plannedUnrestrictedOutflows / safe.periodMonths
  const unrestrictedCoverageMonths =
    projectedUnrestrictedCash > 0 && averageMonthlyUnrestrictedOutflow > 0
      ? projectedUnrestrictedCash / averageMonthlyUnrestrictedOutflow
      : 0

  return {
    totalBeginningCash:
      safe.beginningUnrestrictedCash + safe.beginningRestrictedCash,
    totalPlannedInflows:
      safe.plannedUnrestrictedInflows + safe.plannedRestrictedInflows,
    totalPlannedOutflows:
      safe.plannedUnrestrictedOutflows + safe.plannedRestrictedOutflows,
    projectedUnrestrictedCash,
    projectedRestrictedCash,
    projectedTotalCash: projectedUnrestrictedCash + projectedRestrictedCash,
    averageMonthlyUnrestrictedOutflow,
    unrestrictedCoverageMonths,
    draftedAreaCount: DRAFT_AREAS.filter((key) => hasText(safe, key)).length,
    totalAreaCount: DRAFT_AREAS.length,
    safeguardCount: [
      safe.hasApprovedAuthorityReview,
      safe.hasRestrictionAwardReview,
      safe.hasAccountingPayrollTaxReview,
      safe.hasIndependentReconciliationReview,
    ].filter(Boolean).length,
    totalSafeguardCount: 4,
    cycleStepCount: FINANCE_CYCLE.filter(({ fields }) =>
      fields.every((key) => hasText(safe, key))
    ).length,
    totalCycleStepCount: FINANCE_CYCLE.length,
  }
}

const STAGE_ACTIONS: Record<DocumentationStageId, FinancePlanAction> = {
  exploring: {
    id: "stage-exploring",
    phase: "Plan",
    action:
      "Translate the smallest responsible mission test into activities, full cost, timing, funding evidence, and an authorized spending limit before committing money.",
    evidence:
      "Mission scope, activity assumptions, direct and shared cost estimate, revenue status, fiscal structure, responsible owner, approval, and stop date.",
  },
  forming: {
    id: "stage-forming",
    phase: "Approve",
    action:
      "Build one organization-wide budget and financial calendar that connect programs, shared costs, cash timing, restrictions, filings, and board oversight.",
    evidence:
      "Approved budget, assumptions, account structure, restrictions, opening balances, banking authority, payment workflow, tax calendar, reporting rhythm, and professional review.",
  },
  operating: {
    id: "stage-operating",
    phase: "Report",
    action:
      "Close the books on a reliable cadence and compare budget, actual activity, cash, restrictions, receivables, payables, and obligations before making decisions.",
    evidence:
      "Reconciled accounts, current financial statements, budget-to-actual report, cash view, restricted balance detail, open obligations, explanations, and recorded decisions.",
  },
  growing: {
    id: "stage-growing",
    phase: "Reforecast",
    action:
      "Stress-test growth with multi-year full cost, revenue concentration, cash timing, controls, systems, people capacity, funding restrictions, and staged approval gates.",
    evidence:
      "Base and constrained forecasts, indirect and future costs, hiring and facility timing, control ownership, system capacity, funding terms, decision gates, and closeout obligations.",
  },
}

export function buildFinanceActions(draft: FinancePlanDraft) {
  const actions: FinancePlanAction[] = [STAGE_ACTIONS[draft.stage]]
  const missing: Array<FinancePlanAction | false> = [
    (!draft.missionCommitments ||
      !draft.fullCostAssumptions ||
      !draft.revenueEvidence ||
      !draft.cashTiming) && {
      id: "missing-plan",
      phase: "Plan",
      action:
        "Complete the mission, full-cost, revenue-evidence, and cash-timing assumptions before treating the figures as an operating plan.",
      evidence:
        "Activities, volume, people, access, shared costs, commitments, restrictions, probability, receipt dates, payment dates, and excluded items.",
    },
    (!draft.budgetOwnership || !draft.purchaseApproval) && {
      id: "missing-approval",
      phase: "Approve",
      action:
        "Document who prepares, reviews, approves, changes, and monitors the budget and who may commit or spend funds at each threshold.",
      evidence:
        "Governing documents, board resolutions, delegated limits, conflicts, procurement rules, contract authority, exceptions, and retained approval evidence.",
    },
    (!draft.restrictionTracking ||
      !draft.payrollTaxHandoff ||
      !draft.bookkeepingAlignment ||
      !draft.recordsBoundary) && {
      id: "missing-recording",
      phase: "Record",
      action:
        "Align the working budget with bookkeeping, restriction, payroll, tax, source-document, access, and retention practices.",
      evidence:
        "Chart of accounts, programs or classes, award terms, payroll calendar, tax responsibilities, source documents, access roles, retention, and qualified review.",
    },
    (!draft.paymentReimbursement || !draft.bankReconciliation) && {
      id: "missing-reconciliation",
      phase: "Reconcile",
      action:
        "Define how receipts, payments, reimbursements, banking access, and account reconciliations receive timely independent review.",
      evidence:
        "Request, approval, custody, payment, recording, bank statement, reconciliation, exception, follow-up, and backup responsibilities.",
    },
    !draft.reportingRhythm && {
      id: "missing-reporting",
      phase: "Report",
      action:
        "Set a reporting rhythm that gives staff and the board current, understandable information tied to decisions.",
      evidence:
        "Close date, financial statements, budget variance, cash, restrictions, obligations, forecast, narrative explanation, reviewer, and meeting record.",
    },
    !draft.varianceTriggers && {
      id: "missing-reforecast",
      phase: "Reforecast",
      action:
        "Define material variance and timing triggers, the authorized response options, and when the budget or forecast returns for approval.",
      evidence:
        "Threshold, affected commitment, owner, options, participant and staff implications, board or funder notice, decision, and follow-up date.",
    },
    (!draft.hasApprovedAuthorityReview ||
      !draft.hasRestrictionAwardReview ||
      !draft.hasAccountingPayrollTaxReview ||
      !draft.hasIndependentReconciliationReview) && {
      id: "remaining-safeguards",
      phase: "Safeguards",
      action:
        "Complete the remaining human reviews before relying on this draft for commitments, transactions, reporting, filings, or grant decisions.",
      evidence:
        "Qualified reviewer, governing or source document, jurisdiction, period, decision, approval, unresolved question, and renewed-review trigger.",
    },
  ]
  actions.push(
    ...missing.filter((item): item is FinancePlanAction => Boolean(item))
  )
  return actions
}

export function buildFinanceReviewPrompt(draft: FinancePlanDraft) {
  const safe = sanitizeFinancePlan(draft)
  return [
    "Review this nonprofit operating-finance draft for human decision-making.",
    "",
    `Organization: ${safe.organizationName || "Not provided"}`,
    `Stage: ${safe.stage}`,
    `Planning period: ${safe.periodMonths} months`,
    `Beginning unrestricted cash: ${safe.beginningUnrestrictedCash}`,
    `Beginning restricted cash: ${safe.beginningRestrictedCash}`,
    `Planned unrestricted inflows: ${safe.plannedUnrestrictedInflows}`,
    `Planned restricted inflows: ${safe.plannedRestrictedInflows}`,
    `Planned unrestricted outflows: ${safe.plannedUnrestrictedOutflows}`,
    `Planned restricted outflows: ${safe.plannedRestrictedOutflows}`,
    `Mission commitments: ${safe.missionCommitments || "Not provided"}`,
    `Full-cost assumptions: ${safe.fullCostAssumptions || "Not provided"}`,
    `Revenue evidence: ${safe.revenueEvidence || "Not provided"}`,
    `Restriction tracking: ${safe.restrictionTracking || "Not provided"}`,
    `Cash timing: ${safe.cashTiming || "Not provided"}`,
    `Budget ownership: ${safe.budgetOwnership || "Not provided"}`,
    `Purchase approval: ${safe.purchaseApproval || "Not provided"}`,
    `Payment and reimbursement: ${safe.paymentReimbursement || "Not provided"}`,
    `Bank access and reconciliation: ${safe.bankReconciliation || "Not provided"}`,
    `Payroll and tax handoff: ${safe.payrollTaxHandoff || "Not provided"}`,
    `Bookkeeping alignment: ${safe.bookkeepingAlignment || "Not provided"}`,
    `Reporting rhythm: ${safe.reportingRhythm || "Not provided"}`,
    `Records boundary: ${safe.recordsBoundary || "Not provided"}`,
    `Variance triggers: ${safe.varianceTriggers || "Not provided"}`,
    "",
    "Requirements:",
    "- Do not determine accounting treatment, tax, payroll, grant allowability, donor restriction, audit, filing, internal-control sufficiency, liquidity, solvency, reserve adequacy, or legal compliance.",
    "- Do not invent transactions, balances, commitments, restrictions, approvals, deadlines, documents, laws, policies, people, vendors, funders, or results.",
    "- Mark every assumption or missing fact as [NEEDS HUMAN INPUT].",
    "- Keep restricted and unrestricted resources separate and distinguish committed, conditional, forecast, received, recorded, and reconciled amounts.",
    "- Identify questions for the board, affected program owners, funders, fiscal sponsor, bookkeeper, accountant, payroll provider, tax professional, auditor, and attorney as applicable.",
    "- Return a review table and options. Do not approve transactions, change the budget, move money, file forms, or recommend a financial product.",
  ].join("\n")
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function buildFinanceCsv(draft: FinancePlanDraft) {
  const safe = sanitizeFinancePlan(draft)
  const summary = summarizeFinancePlan(safe)
  const rows: Array<Array<string | number>> = [
    ["Area", "Working nonprofit operating-finance plan"],
    ["Organization", safe.organizationName],
    ["Stage", safe.stage],
    ["Planning period months", safe.periodMonths],
    ["Beginning unrestricted cash", safe.beginningUnrestrictedCash],
    ["Beginning restricted cash", safe.beginningRestrictedCash],
    ["Planned unrestricted inflows", safe.plannedUnrestrictedInflows],
    ["Planned restricted inflows", safe.plannedRestrictedInflows],
    ["Planned unrestricted outflows", safe.plannedUnrestrictedOutflows],
    ["Planned restricted outflows", safe.plannedRestrictedOutflows],
    ["Projected unrestricted cash", summary.projectedUnrestrictedCash],
    ["Projected restricted cash", summary.projectedRestrictedCash],
    [
      "Unrestricted planning coverage months",
      summary.unrestrictedCoverageMonths,
    ],
    ["Mission commitments", safe.missionCommitments],
    ["Full-cost assumptions", safe.fullCostAssumptions],
    ["Revenue evidence", safe.revenueEvidence],
    ["Restriction tracking", safe.restrictionTracking],
    ["Cash timing", safe.cashTiming],
    ["Budget ownership", safe.budgetOwnership],
    ["Purchase approval", safe.purchaseApproval],
    ["Payment and reimbursement", safe.paymentReimbursement],
    ["Bank access and reconciliation", safe.bankReconciliation],
    ["Payroll and tax handoff", safe.payrollTaxHandoff],
    ["Bookkeeping alignment", safe.bookkeepingAlignment],
    ["Reporting rhythm", safe.reportingRhythm],
    ["Records boundary", safe.recordsBoundary],
    ["Variance triggers", safe.varianceTriggers],
    [
      "Drafted areas",
      `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
    ],
    [
      "Complete finance-cycle steps",
      `${summary.cycleStepCount} of ${summary.totalCycleStepCount}`,
    ],
    [
      "Safeguards selected",
      `${summary.safeguardCount} of ${summary.totalSafeguardCount}`,
    ],
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildFinanceActions(safe).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
