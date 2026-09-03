"use client"

import { useCallback, useEffect, useState } from "react"

import type { FinancePlanDraft } from "../finance-types"
import {
  DEFAULT_FINANCE_PLAN,
  FINANCE_PLAN_STORAGE_KEY,
  sanitizeFinancePlan,
} from "../lib/finance-plan"

const EXAMPLE_FINANCE_PLAN: FinancePlanDraft = {
  version: 1,
  organizationName: "Willow Street Family Resource Network",
  stage: "operating",
  periodMonths: 12,
  beginningUnrestrictedCash: 48_000,
  beginningRestrictedCash: 72_000,
  plannedUnrestrictedInflows: 164_000,
  plannedRestrictedInflows: 210_000,
  plannedUnrestrictedOutflows: 188_000,
  plannedRestrictedOutflows: 204_000,
  missionCommitments:
    "Provide 720 scheduled English and Spanish benefits-navigation appointments, maintain current referral information, offer effective communication and access support, close agreed follow-ups, and protect continuity for current participants during the twelve-month period.",
  fullCostAssumptions:
    "The operating view includes navigators, supervision, payroll costs and benefits review, interpretation, accessibility, technology, insurance, travel and reimbursement, referral maintenance, evaluation, finance, fundraising, leadership, occupancy, administration, training, and closeout. It excludes a proposed second location until a separate approval gate.",
  revenueEvidence:
    "Restricted: one signed twelve-month grant paid in two installments, with the second payment conditional on an accepted interim report. Unrestricted: cash gifts received, recurring donors supported by current records, a conservative earned-revenue forecast, and a foundation renewal shown as forecast rather than committed until signed.",
  restrictionTracking:
    "Maintain each award and donor restriction from source document through account and program coding, allowable period and purpose, cost review, reporting, release or closeout, and remaining balance. The bookkeeper prepares detail; program and finance owners verify activity; qualified accounting or grant review resolves uncertainty.",
  cashTiming:
    "Model payroll twice monthly, taxes and benefits on their due schedules, rent and technology monthly, interpretation and reimbursement after service, and grant installments in months one and seven. Review a rolling thirteen-week cash view monthly and weekly when an expected receipt changes by more than ten business days.",
  budgetOwnership:
    "The executive director prepares the forecast with program and fundraising owners; the bookkeeper aligns actual reports; the finance committee reviews assumptions and variance; the full board approves the annual budget and material amendments under the bylaws and current resolutions.",
  purchaseApproval:
    "Documented thresholds separate routine approved-budget purchases, contracts, unbudgeted commitments, related-party matters, borrowing, and material budget changes. Requesters disclose conflicts; authorized reviewers confirm budget, purpose, terms, restrictions, and evidence before commitment.",
  paymentReimbursement:
    "A requester provides purpose and source documents; an authorized person who did not incur the expense approves it; a second role releases payment where practical; the bookkeeper records it; exceptions and reimbursements receive documented follow-up. No one approves their own payment.",
  bankReconciliation:
    "The bookkeeper reconciles bank, card, and payment-platform accounts to independent statements monthly. A finance-committee reviewer without transaction authority reviews reconciliations, payees, transfers, unusual items, stale checks, and exceptions; another authorized officer provides backup access.",
  payrollTaxHandoff:
    "The payroll provider processes approved payroll and federal filings under a written calendar. The executive director verifies approved people and amounts; the bookkeeper reconciles payroll reports, bank activity, liabilities, and the ledger; a qualified payroll or tax reviewer confirms federal, state, and local duties and exceptions.",
  bookkeepingAlignment:
    "Budget categories map to the chart of accounts and to program, function, grant, restriction, and location tracking needed for internal reports and filings. The bookkeeper documents mappings and period-close entries; leaders ask questions rather than editing accounting records to force a budget result.",
  reportingRhythm:
    "Close and reconcile by the fifteenth business day. Staff review statements of financial position and activities, budget-to-actual results, cash, restrictions, receivables, payables, payroll liabilities, grant deadlines, and forecast monthly. The finance committee reviews monthly and the board receives the packet quarterly before its meeting.",
  recordsBoundary:
    "Keep approvals, contracts, invoices, receipts, deposits, award terms, payroll records, tax filings, reconciliations, reports, minutes, and retention evidence in approved role-limited systems. The working planner contains no bank credentials, account numbers, tax identifiers, donor payment data, payroll detail, participant records, or vendor banking information.",
  varianceTriggers:
    "Return to review when a material receipt is late or reduced, a restriction changes, unrestricted ending cash falls below the board-approved trigger, a cost category varies beyond its documented threshold, payroll or reporting may be late, a control fails, or a new commitment is proposed. Protect current participants and staff, document options, obtain authority, and set follow-up.",
  hasApprovedAuthorityReview: true,
  hasRestrictionAwardReview: true,
  hasAccountingPayrollTaxReview: true,
  hasIndependentReconciliationReview: true,
}

export function useFinancePlan() {
  const [draft, setDraft] = useState(DEFAULT_FINANCE_PLAN)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FINANCE_PLAN_STORAGE_KEY)
      if (stored) setDraft(sanitizeFinancePlan(JSON.parse(stored)))
    } catch {
      // Keep the safe default when browser storage is unavailable or invalid.
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(
        FINANCE_PLAN_STORAGE_KEY,
        JSON.stringify(draft)
      )
    } catch {
      // The tool remains usable when browser storage is unavailable.
    }
  }, [draft, storageReady])

  const updateDraft = useCallback(
    <Key extends keyof FinancePlanDraft>(
      key: Key,
      value: FinancePlanDraft[Key]
    ) => setDraft((current) => ({ ...current, [key]: value })),
    []
  )

  return {
    draft,
    storageReady,
    updateDraft,
    loadExample: useCallback(() => setDraft(EXAMPLE_FINANCE_PLAN), []),
    reset: useCallback(() => setDraft(DEFAULT_FINANCE_PLAN), []),
  }
}
