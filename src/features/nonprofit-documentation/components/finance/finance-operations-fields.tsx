import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { FinancePlanDraft } from "../../finance-types"

type UpdateDraft = <Key extends keyof FinancePlanDraft>(
  key: Key,
  value: FinancePlanDraft[Key]
) => void

type TextKey =
  | "missionCommitments"
  | "fullCostAssumptions"
  | "revenueEvidence"
  | "restrictionTracking"
  | "cashTiming"
  | "budgetOwnership"
  | "purchaseApproval"
  | "paymentReimbursement"
  | "bankReconciliation"
  | "payrollTaxHandoff"
  | "bookkeepingAlignment"
  | "reportingRhythm"
  | "recordsBoundary"
  | "varianceTriggers"

const GROUPS: Array<{
  title: string
  description: string
  fields: Array<{
    key: TextKey
    label: string
    description: string
    placeholder: string
    maximum?: number
  }>
}> = [
  {
    title: "Plan the work and the money",
    description:
      "Connect the mission commitments to full cost, evidence for revenue, restrictions, and actual cash timing.",
    fields: [
      {
        key: "missionCommitments",
        label: "Mission commitments for this period",
        description:
          "Name the work, people served, volume, access commitments, period, and what remains outside this plan.",
        placeholder: "During this period, the organization plans to…",
      },
      {
        key: "fullCostAssumptions",
        label: "Full-cost assumptions",
        description:
          "Include direct delivery, people, shared operations, access, finance, fundraising, insurance, technology, evaluation, risk, and closeout.",
        placeholder: "The plan includes… It does not yet include…",
      },
      {
        key: "revenueEvidence",
        label: "Revenue evidence and status",
        description:
          "Distinguish prospects, applications, conditions, signed commitments, receivables, receipts, deposits, and uncertainties.",
        placeholder: "This amount is supported by… It remains conditional on…",
      },
      {
        key: "restrictionTracking",
        label: "Restriction and award tracking",
        description:
          "Describe how source terms connect to purpose, period, coding, cost review, reporting, release, and remaining balances.",
        placeholder: "Each restricted source is traced from… through…",
      },
      {
        key: "cashTiming",
        label: "Receipt and payment timing",
        description:
          "Name when material cash is expected to enter and leave and how timing changes will be reviewed.",
        placeholder:
          "Payroll occurs… Grant receipts are expected… Review when…",
      },
    ],
  },
  {
    title: "Authorize and safeguard transactions",
    description:
      "Make decision rights, conflicts, payments, custody, recording, reconciliation, and backup visible.",
    fields: [
      {
        key: "budgetOwnership",
        label: "Budget preparation, review, and approval",
        description:
          "Name who prepares, reviews, adopts, monitors, and may amend the budget under current authority.",
        placeholder: "The… prepares; the… reviews; the… approves…",
        maximum: 600,
      },
      {
        key: "purchaseApproval",
        label: "Purchase, contract, and budget-change authority",
        description:
          "Document thresholds, delegated authority, conflicts, exceptions, and retained evidence before commitment.",
        placeholder: "Within the approved budget… Above… requires…",
        maximum: 700,
      },
      {
        key: "paymentReimbursement",
        label: "Receipt, payment, and reimbursement workflow",
        description:
          "Separate or independently review request, approval, custody, payment, recording, and exception follow-up.",
        placeholder: "The requester provides… The approver… The payer…",
        maximum: 700,
      },
      {
        key: "bankReconciliation",
        label: "Bank access and reconciliation",
        description:
          "Cover account access, external statements, reconciliation timing, independent review, exceptions, and backup.",
        placeholder: "The… reconciles by… The independent reviewer…",
        maximum: 700,
      },
    ],
  },
  {
    title: "Record, report, and reforecast",
    description:
      "Connect the working plan to bookkeeping, payroll and tax responsibilities, records, reports, and authorized responses.",
    fields: [
      {
        key: "payrollTaxHandoff",
        label: "Payroll and tax handoff",
        description:
          "Name provider and internal responsibilities, calendars, approvals, deposits, filings, reconciliations, exceptions, and review.",
        placeholder: "The provider… The internal owner… A qualified reviewer…",
        maximum: 700,
      },
      {
        key: "bookkeepingAlignment",
        label: "Budget-to-bookkeeping alignment",
        description:
          "Explain how budget categories map to accounts and program, function, grant, restriction, department, or location reporting.",
        placeholder: "Budget categories map to… Actual reports preserve…",
        maximum: 700,
      },
      {
        key: "reportingRhythm",
        label: "Close and reporting rhythm",
        description:
          "Name timing, reports, explanations, staff review, board review, questions, decisions, and follow-up.",
        placeholder: "Close by… Staff reviews… The board receives…",
        maximum: 700,
      },
      {
        key: "recordsBoundary",
        label: "Financial records and access boundary",
        description:
          "Name approved systems, source documents, retention, access, and information that must never enter this planner.",
        placeholder: "Keep… in… with access limited to… Never place… here…",
        maximum: 700,
      },
      {
        key: "varianceTriggers",
        label: "Variance, cash, and reforecast triggers",
        description:
          "Define what prompts review, who owns the response, available options, approval, communication, and follow-up.",
        placeholder: "Return to review when… The authorized response is…",
        maximum: 700,
      },
    ],
  },
]

const SAFEGUARDS: Array<{
  key:
    | "hasApprovedAuthorityReview"
    | "hasRestrictionAwardReview"
    | "hasAccountingPayrollTaxReview"
    | "hasIndependentReconciliationReview"
  label: string
}> = [
  {
    key: "hasApprovedAuthorityReview",
    label:
      "Current governing documents and authorized people will review the budget, bank access, spending, contracting, conflicts, and amendment authority.",
  },
  {
    key: "hasRestrictionAwardReview",
    label:
      "Donor, grant, contract, federal-award, board, and other restrictions will be reconciled to source documents and current records by qualified reviewers.",
  },
  {
    key: "hasAccountingPayrollTaxReview",
    label:
      "A qualified bookkeeper, accountant, payroll provider, and tax or grant professional will review the responsibilities that apply.",
  },
  {
    key: "hasIndependentReconciliationReview",
    label:
      "Material accounts, transactions, reconciliations, reports, and exceptions will receive timely independent review appropriate to the organization.",
  },
]

export function FinanceOperationsFields({
  draft,
  updateDraft,
}: {
  draft: FinancePlanDraft
  updateDraft: UpdateDraft
}) {
  return (
    <>
      {GROUPS.map((group) => (
        <section key={group.title} className="grid gap-6 border-t p-5 sm:p-6">
          <div>
            <h3 className="font-semibold">{group.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {group.description}
            </p>
          </div>
          {group.fields.map((field) => {
            const id = `finance-${field.key}`
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <p
                  id={`${id}-description`}
                  className="text-muted-foreground text-xs leading-5"
                >
                  {field.description}
                </p>
                <Textarea
                  id={id}
                  value={draft[field.key]}
                  onChange={(event) =>
                    updateDraft(field.key, event.target.value)
                  }
                  aria-describedby={`${id}-description`}
                  maxLength={field.maximum ?? 900}
                  rows={4}
                  placeholder={field.placeholder}
                  className="min-h-32 resize-y text-base"
                />
              </div>
            )
          })}
        </section>
      ))}

      <fieldset className="space-y-3 border-t p-5 sm:p-6">
        <legend className="px-1 text-sm font-semibold">
          Human-review safeguards
        </legend>
        <p className="text-muted-foreground text-sm leading-6">
          Select only reviews the organization will actually complete. A
          selected item is not verification or approval.
        </p>
        {SAFEGUARDS.map((safeguard) => (
          <Label
            key={safeguard.key}
            htmlFor={`finance-${safeguard.key}`}
            className="flex min-h-14 cursor-pointer items-start gap-3 border p-4 text-sm leading-6"
          >
            <Checkbox
              id={`finance-${safeguard.key}`}
              checked={draft[safeguard.key]}
              onCheckedChange={(checked) =>
                updateDraft(safeguard.key, checked === true)
              }
              className="mt-0.5"
            />
            <span>{safeguard.label}</span>
          </Label>
        ))}
      </fieldset>
    </>
  )
}
