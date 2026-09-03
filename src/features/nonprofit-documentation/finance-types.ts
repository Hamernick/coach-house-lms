import type { DocumentationStageId } from "./types"

export type FinancePeriodMonths = 3 | 6 | 12 | 18

export type FinancePlanDraft = {
  version: 1
  organizationName: string
  stage: DocumentationStageId
  periodMonths: FinancePeriodMonths
  beginningUnrestrictedCash: number
  beginningRestrictedCash: number
  plannedUnrestrictedInflows: number
  plannedRestrictedInflows: number
  plannedUnrestrictedOutflows: number
  plannedRestrictedOutflows: number
  missionCommitments: string
  fullCostAssumptions: string
  revenueEvidence: string
  restrictionTracking: string
  cashTiming: string
  budgetOwnership: string
  purchaseApproval: string
  paymentReimbursement: string
  bankReconciliation: string
  payrollTaxHandoff: string
  bookkeepingAlignment: string
  reportingRhythm: string
  recordsBoundary: string
  varianceTriggers: string
  hasApprovedAuthorityReview: boolean
  hasRestrictionAwardReview: boolean
  hasAccountingPayrollTaxReview: boolean
  hasIndependentReconciliationReview: boolean
}

export type FinancePlanSummary = {
  totalBeginningCash: number
  totalPlannedInflows: number
  totalPlannedOutflows: number
  projectedUnrestrictedCash: number
  projectedRestrictedCash: number
  projectedTotalCash: number
  averageMonthlyUnrestrictedOutflow: number
  unrestrictedCoverageMonths: number
  draftedAreaCount: number
  totalAreaCount: number
  safeguardCount: number
  totalSafeguardCount: number
  cycleStepCount: number
  totalCycleStepCount: number
}

export type FinancePlanAction = {
  id: string
  phase:
    | "Plan"
    | "Approve"
    | "Record"
    | "Reconcile"
    | "Report"
    | "Reforecast"
    | "Safeguards"
  action: string
  evidence: string
}
