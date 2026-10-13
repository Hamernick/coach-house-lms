import type {
  ComplianceAssetsBand,
  ComplianceRhythmDraft,
  ComplianceTask,
  ComplianceReceiptsBand,
} from "../types"

export const COMPLIANCE_RHYTHM_STORAGE_KEY =
  "coach-house:documentation:compliance-rhythm:v1"

export const DEFAULT_COMPLIANCE_RHYTHM: ComplianceRhythmDraft = {
  version: 1,
  stateCode: "",
  taxYearEnd: "",
  receiptsBand: "normally-50k-or-less",
  assetsBand: "under-500k",
  solicitsContributions: true,
  hasEmployees: false,
}

export const US_STATE_OPTIONS = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["PR", "Puerto Rico"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VI", "U.S. Virgin Islands"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
] as const

const RECEIPTS_BANDS = new Set<ComplianceReceiptsBand>([
  "normally-50k-or-less",
  "under-200k",
  "200k-or-more",
])
const ASSETS_BANDS = new Set<ComplianceAssetsBand>([
  "under-500k",
  "500k-or-more",
])
const STATE_CODES = new Set<string>(US_STATE_OPTIONS.map(([code]) => code))

export function sanitizeComplianceRhythm(
  value: unknown
): ComplianceRhythmDraft {
  if (!value || typeof value !== "object") return DEFAULT_COMPLIANCE_RHYTHM
  const record = value as Record<string, unknown>
  const stateCode =
    typeof record.stateCode === "string" && STATE_CODES.has(record.stateCode)
      ? record.stateCode
      : ""
  const taxYearEnd =
    typeof record.taxYearEnd === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.taxYearEnd)
      ? record.taxYearEnd
      : ""
  const receiptsBand = RECEIPTS_BANDS.has(
    record.receiptsBand as ComplianceReceiptsBand
  )
    ? (record.receiptsBand as ComplianceReceiptsBand)
    : DEFAULT_COMPLIANCE_RHYTHM.receiptsBand
  const assetsBand = ASSETS_BANDS.has(record.assetsBand as ComplianceAssetsBand)
    ? (record.assetsBand as ComplianceAssetsBand)
    : DEFAULT_COMPLIANCE_RHYTHM.assetsBand

  return {
    version: 1,
    stateCode,
    taxYearEnd,
    receiptsBand,
    assetsBand,
    solicitsContributions: record.solicitsContributions !== false,
    hasEmployees: record.hasEmployees === true,
  }
}

export function stateNameFor(code: string) {
  return US_STATE_OPTIONS.find(([stateCode]) => stateCode === code)?.[1] ?? ""
}

export function commonFederalFilingPath(
  receiptsBand: ComplianceReceiptsBand,
  assetsBand: ComplianceAssetsBand
) {
  if (receiptsBand === "normally-50k-or-less") {
    return {
      form: "Form 990-N may be available",
      explanation:
        "Organizations with gross receipts normally $50,000 or less can commonly satisfy the annual requirement with Form 990-N, subject to exceptions.",
    }
  }
  if (receiptsBand === "under-200k" && assetsBand === "under-500k") {
    return {
      form: "Form 990-EZ or Form 990",
      explanation:
        "Organizations below both the $200,000 gross-receipts and $500,000 total-assets thresholds can commonly file Form 990-EZ or choose Form 990, subject to exceptions.",
    }
  }
  return {
    form: "Form 990",
    explanation:
      "Organizations at or above either the $200,000 gross-receipts or $500,000 total-assets threshold commonly file Form 990, subject to exceptions.",
  }
}

export function nominalAnnualReturnDueDate(taxYearEnd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(taxYearEnd)) return null
  const [year, month] = taxYearEnd.split("-").map(Number)
  if (!year || !month || month < 1 || month > 12) return null
  const dueDate = new Date(Date.UTC(year, month + 4, 15))
  const iso = dueDate.toISOString().slice(0, 10)
  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(dueDate)
  return { iso, label }
}

export function buildComplianceTasks(
  draft: ComplianceRhythmDraft
): ComplianceTask[] {
  const stateName = stateNameFor(draft.stateCode)
  const dueDate = nominalAnnualReturnDueDate(draft.taxYearEnd)
  const tasks: ComplianceTask[] = [
    {
      id: "federal-annual-return",
      category: "Federal",
      status: "Common requirement",
      task: "Confirm and file the applicable Form 990-series return or notice",
      timing: dueDate
        ? `Nominal planning date: ${dueDate.label}. Confirm weekends, holidays, extensions, and exceptions with the IRS.`
        : "Generally due on the 15th day of the fifth month after the tax year ends; confirm the actual date with the IRS.",
      evidence:
        "Submitted return or notice, schedules, approval, transmission receipt, and IRS correspondence",
    },
    {
      id: "state-entity-report",
      category: "State",
      status: "Conditional",
      task: `Check entity reports, tax registrations, and good standing${stateName ? ` in ${stateName}` : " in the formation and operating states"}`,
      timing:
        "Use the responsible state agencies to confirm frequency and due dates.",
      evidence:
        "Filed report, confirmation, payment record, and current status",
    },
    {
      id: "records-review",
      category: "Records",
      status: "Common requirement",
      task: "Reconcile reported revenue, expenses, and activities to source records",
      timing: "Quarterly, and again before every annual filing",
      evidence:
        "General ledger, bank records, receipts, contracts, grant records, and activity support",
    },
    {
      id: "public-disclosure-file",
      category: "Records",
      status: "Common requirement",
      task: "Prepare the federal public-inspection file and protect contributor information",
      timing:
        "After each applicable filing and whenever exemption records change",
      evidence: "Current inspection copies and a documented response process",
    },
    {
      id: "conflict-review",
      category: "Governance",
      status: "Recommended practice",
      task: "Collect conflict disclosures and document how conflicts are handled",
      timing: "At least annually and whenever a potential conflict arises",
      evidence:
        "Signed disclosures, minutes, recusals, and supporting comparison records",
    },
  ]

  if (draft.solicitsContributions) {
    tasks.splice(2, 0, {
      id: "charitable-solicitation",
      category: "State",
      status: "Conditional",
      task: "Check charitable solicitation registration and renewal requirements",
      timing:
        "Before soliciting and at each jurisdiction’s renewal date; rules and exemptions vary by state.",
      evidence:
        "Applicability decision, registrations, exemptions, renewals, confirmations, and campaign review",
    })
  }

  if (draft.hasEmployees) {
    tasks.push({
      id: "employment-taxes",
      category: "Employment",
      status: "Conditional",
      task: "Review payroll withholding, deposits, returns, worker status, and state employer obligations",
      timing:
        "Each payroll cycle, with applicable deposit, quarterly, and annual reviews",
      evidence:
        "Payroll register, Forms W-4, deposits, returns, wage statements, and state confirmations",
    })
  }

  return tasks
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export function buildComplianceCsv(draft: ComplianceRhythmDraft) {
  const headers = ["Category", "Status", "Task", "Timing", "Evidence"]
  const rows = buildComplianceTasks(draft).map((task) => [
    task.category,
    task.status,
    task.task,
    task.timing,
    task.evidence,
  ])
  return [headers, ...rows]
    .map((row) => row.map((value) => csvCell(value)).join(","))
    .join("\n")
}
