import type { BestPracticeArticle } from "../types"

export const FINANCE_ARTICLE: BestPracticeArticle = {
  slug: "tools/finance",
  navigationTitle: "Finance",
  title: "Build a nonprofit finance system people can use",
  description:
    "A U.S.-wide guide to nonprofit budgets, cash timing, restricted resources, bookkeeping, internal controls, reporting, reforecasting, and a free operating-finance planner.",
  eyebrow: "Nonprofit finance guide",
  answer:
    "A useful nonprofit finance system connects mission commitments to a board-reviewed organization budget, realistic cash timing, funding restrictions, consistent bookkeeping, proportionate internal controls, timely reporting, and documented decisions. Start with the work and its full cost; separate restricted from unrestricted resources; record and reconcile actual activity; compare results with the plan; and reforecast when material assumptions change.",
  readingTime: "22 minute read",
  reviewedDate: "September 3, 2026",
  publishedDate: "2026-09-03",
  modifiedDate: "2026-09-03",
  labels: {
    definition: "What nonprofit financial management includes",
    stages: "Stage-specific finance practices",
    example: "Worked operating-finance example",
    framework: "A seven-part finance system",
    checklist: "Financial operations checklist",
    mistakes: "Common nonprofit finance mistakes",
    measures: "Useful financial-management measures",
  },
  definition:
    "Nonprofit financial management is the connected practice of planning, authorizing, receiving, safeguarding, spending, recording, reconciling, reporting, and revising the organization’s financial activity in service of its mission. It includes program and organization budgets, cash-flow visibility, revenue evidence, donor and award restrictions, full costs, banking and payment controls, bookkeeping, payroll and tax handoffs, financial statements, records, board oversight, and response to variance. A budget is a forward-looking guide; accounting records describe actual transactions; a cash view tracks timing; and financial statements organize the recorded results. None is a substitute for the others.",
  whyItMatters: [
    "Mission promises create financial obligations. Leaders need to know the full cost, who may authorize the commitment, what money may be used, and when cash must be available before promising delivery.",
    "A program budget alone can omit shared leadership, administration, finance, technology, insurance, facilities, access, evaluation, fundraising, and closeout costs that the organization must still support.",
    "Revenue has different levels of certainty. An application, prospect, verbal interest, conditional award, signed agreement, receivable, and deposited cash should not be treated as the same thing.",
    "Restricted resources are not general operating cash. The organization must understand and track the source terms, allowable purpose, period, reporting duties, releases, and remaining balances.",
    "A positive annual budget can still produce a cash shortage when receipts arrive after payroll, rent, reimbursements, vendor payments, or program delivery.",
    "Internal controls make authority and evidence visible. Even a small organization can separate or independently review requesting, approving, paying, recording, holding assets, and reconciling accounts.",
    "Timely, understandable reports help staff and boards compare plans with actual activity, ask informed questions, document decisions, and respond before a variance becomes a crisis.",
  ],
  importantNote:
    "This guide organizes a working finance conversation; it does not select an accounting method, interpret donor or award terms, determine cost allowability or allocation, set a reserve target, establish internal-control sufficiency, prepare financial statements or filings, or assess liquidity, solvency, audit readiness, or going-concern status. Requirements vary by entity, exemption, activity, state, locality, Tribal or territorial jurisdiction, funding source, award, workforce, transaction, and reporting period. Reconcile consequential decisions with governing documents, source records, current law and guidance, affected program owners, the board, and qualified accounting, tax, payroll, grant, audit, and legal reviewers.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question:
        "What would the smallest responsible financial commitment require?",
      guidance:
        "Translate the proposed mission test into activities, people, volume, timing, direct and shared costs, funding evidence, fiscal structure, and a bounded decision. Do not open accounts, solicit, sign, hire, or spend before authority and the relevant legal, tax, banking, insurance, and fiscal arrangements are clear.",
      actions: [
        "Estimate full cost for one bounded period, including access, administration, finance, insurance, technology, fundraising, evaluation, and closeout.",
        "Separate confirmed resources from prospects and document purpose, restrictions, timing, conditions, and who controls the funds.",
        "Name who may approve the test, commit money, hold funds, pay expenses, maintain records, and review actual activity.",
        "If operating through a fiscal sponsor or another entity, reconcile the project budget, fees, authority, fund ownership, reporting, and exit terms with the written agreement.",
      ],
      checkpoint:
        "The team can explain the proposed work, full cost, funding status, fiscal structure, cash timing, decision owner, spending limit, records, and stop point without describing hoped-for revenue as available cash.",
    },
    {
      id: "forming",
      label: "Forming",
      question:
        "Can the organization connect its budget to real financial operations?",
      guidance:
        "Move from isolated program estimates to an organization-wide view. Connect programs and shared costs to revenue assumptions, cash timing, restrictions, approval authority, bank access, payment and reimbursement steps, payroll, bookkeeping categories, records, filings, and board review.",
      actions: [
        "Build an organization budget with documented assumptions, current opening balances, programs, shared costs, restricted and unrestricted activity, and receipt and payment timing.",
        "Approve banking, purchasing, contracting, expense, reimbursement, payroll, and budget-change authority with proportionate conflict and independent-review steps.",
        "Align the budget with the chart of accounts and any program, class, grant, restriction, department, or location tracking needed for reports.",
        "Create a dated close, reconciliation, payroll, deposit, filing, funder-reporting, staff-review, committee, and board calendar.",
      ],
      checkpoint:
        "An authorized budget can be traced to mission activity, account structure, funding terms, cash timing, transaction controls, source records, responsible people, and a recurring review calendar.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "What do current records say, and what decision follows?",
      guidance:
        "Maintain complete source records, record activity consistently, reconcile accounts promptly, close each period, and review financial position, activity, cash, restrictions, budget variance, receivables, payables, commitments, payroll, taxes, and grant reporting together. Investigate differences rather than forcing reports to match the plan.",
      actions: [
        "Reconcile bank, credit-card, payment-platform, loan, investment, and other material accounts to independent statements with documented review and exception follow-up.",
        "Compare actual results and current cash timing with the approved budget; explain material variances and distinguish timing differences from structural changes.",
        "Give the board reports early enough to review them, ask questions, understand restrictions and obligations, and record authorized decisions.",
        "Update the forecast when revenue, costs, timing, program demand, staffing, restrictions, or obligations materially change.",
      ],
      checkpoint:
        "Current reports reconcile to records, restricted balances can be supported, material differences have explanations and owners, and an authorized next decision is recorded with a follow-up date.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Can finance capacity and controls grow with the commitments?",
      guidance:
        "Expansion adds volume, locations, people, systems, vendors, awards, restrictions, reporting, and fraud or continuity exposure. Use multi-year scenarios and staged gates, then strengthen skills, systems, review, and independence before transactions or promises outgrow the current operating model.",
      actions: [
        "Stress-test base, constrained, and expansion scenarios for revenue concentration, receipt timing, full staffing, benefits, shared costs, facilities, technology, insurance, debt, compliance, evaluation, and closeout.",
        "Map which transaction and reporting duties need separation, independent review, backup access, automation, or qualified outside support at the new volume.",
        "Review federal, state, local, award, audit, registration, payroll, tax, procurement, cybersecurity, and records requirements before entering a new jurisdiction or funding structure.",
        "Preserve program-level clarity while maintaining one organization-wide view for governance, liquidity, restrictions, obligations, and strategy.",
      ],
      checkpoint:
        "Growth gates show full cost, timing, funding evidence, restrictions, systems, people capacity, control ownership, reporting duties, decision authority, and a responsible response if assumptions fail.",
    },
  ],
  example: {
    name: "Illustrative example: Willow Street Family Resource Network",
    context:
      "A fictional operating nonprofit plans twelve months of bilingual benefits-navigation work. It has unrestricted cash, one signed restricted grant paid in two installments, a probable renewal that is not yet committed, and recurring payroll, interpretation, technology, insurance, and shared administration costs.",
    weakLabel: "One total presented as a complete budget",
    weak: "We expect $300,000 and expenses are $275,000, so we have a $25,000 surplus and enough cash to expand.",
    strongLabel: "Reviewable operating-finance plan",
    strong:
      "Separate beginning unrestricted and restricted cash; distinguish signed, conditional, forecast, receivable, and received revenue; map each restriction and payment date; include direct and shared full costs; model payroll and other payment timing; connect categories to bookkeeping; reconcile monthly; review budget-to-actual, cash, restrictions, obligations, and forecast with staff and the board; and set an approval gate before expansion.",
    reason:
      "The stronger plan does not infer availability from a total. It exposes what is known, when cash moves, what money may support, which costs are included, how actual activity is controlled and recorded, and who decides when the facts change.",
  },
  framework: [
    {
      title: "1. Define commitments and full cost",
      instruction:
        "Translate mission work into volume, people, timing, access, direct costs, shared costs, fundraising, administration, evaluation, risk, and closeout.",
      prompt:
        "What are we promising, for how long, and what must the whole organization spend or support to deliver it responsibly?",
    },
    {
      title: "2. Classify revenue evidence",
      instruction:
        "Separate prospects, applications, conditional notices, signed commitments, receivables, receipts, and recorded deposits; document probability without calling a forecast cash.",
      prompt:
        "What evidence supports each amount, what could prevent receipt, and when may the organization use it?",
    },
    {
      title: "3. Separate restrictions and timing",
      instruction:
        "Trace donor, grant, contract, board, legal, and other limits to source documents and model receipt and payment dates separately from the annual total.",
      prompt:
        "Which resources are available for which obligations, during what period, with what reporting or release condition?",
    },
    {
      title: "4. Approve authority and controls",
      instruction:
        "Document who requests, approves, commits, holds, pays, records, reconciles, reviews, and changes financial activity, including thresholds and conflicts.",
      prompt:
        "Where could one person control an entire transaction, and what independent evidence or review is practical?",
    },
    {
      title: "5. Connect budget and bookkeeping",
      instruction:
        "Align budget categories with the chart of accounts and program, grant, restriction, department, or location tracking needed for actual reports.",
      prompt:
        "Can a leader trace a budget line to transactions, source documents, restrictions, and the financial statements without rebuilding the data?",
    },
    {
      title: "6. Reconcile and report",
      instruction:
        "Close on a dependable schedule, reconcile accounts to external evidence, investigate exceptions, and give decision-useful reports to staff and the board.",
      prompt:
        "Are records current, reconciled, understandable, reviewed by the right people, and early enough to change a decision?",
    },
    {
      title: "7. Reforecast and record decisions",
      instruction:
        "Define material variance and cash triggers, evaluate mission and people effects, revise assumptions, obtain needed approval, and preserve the decision trail.",
      prompt:
        "What changed, what choices remain, who decides, who must be informed, and when will the response be reviewed?",
    },
  ],
  checklist: [
    "The budget covers the full organization and reconciles program activity, shared costs, fundraising, administration, access, evaluation, risk, and closeout.",
    "Every material revenue assumption has a status, source, amount, restriction, probability or condition, expected receipt date, and owner.",
    "Unrestricted and restricted beginning cash, inflows, outflows, balances, and source terms are reviewed separately.",
    "A dated cash view shows when payroll, taxes, rent, reimbursements, vendors, debt, grants, and other obligations are expected to move.",
    "The governing body approved the budget and any delegated purchasing, contracting, banking, investment, borrowing, and budget-change authority.",
    "Requesting, approving, paying, recording, holding assets, reconciling, and reviewing are separated or independently reviewed where practical.",
    "Bank, card, payment, loan, investment, and other material accounts reconcile to independent statements with documented exceptions and review.",
    "The budget structure aligns with bookkeeping and required program, award, restriction, department, location, and functional-expense reporting.",
    "Payroll and tax responsibilities, calendars, deposits, filings, records, provider handoffs, access, and backup ownership are documented and reviewed.",
    "Financial records support receipts, expenditures, annual returns, grant reports, restrictions, approvals, and material balances for the required period.",
    "Staff and boards receive current financial statements, budget variance, cash, restrictions, obligations, forecast, explanations, and decision requests.",
    "Material variance and cash triggers have an owner, response options, approval path, communication plan, and follow-up date.",
    "Confidential banking, payroll, donor, vendor, participant, and identity data remain in approved systems with minimum necessary access.",
    "Qualified accounting, tax, payroll, grant, audit, legal, investment, and insurance review is used when the decision exceeds internal knowledge or authority.",
  ],
  mistakes: [
    {
      mistake:
        "Treating an application, forecast, or verbal interest as committed revenue or cash.",
      correction:
        "Name the evidence and status for every material amount and update it when a condition, agreement, receivable, receipt, or deposit changes.",
    },
    {
      mistake:
        "Combining restricted and unrestricted resources into one available balance.",
      correction:
        "Track each source and applicable restriction separately, reconcile it to source documents and records, and obtain qualified review before changing treatment.",
    },
    {
      mistake: "Budgeting only visible program expenses.",
      correction:
        "Include the people, shared systems, administration, finance, fundraising, access, insurance, evaluation, risk, and closeout required to deliver the work.",
    },
    {
      mistake:
        "Using an annual surplus to assume cash will be available throughout the year.",
      correction:
        "Maintain a dated cash view and distinguish timing gaps from annual revenue and expense totals.",
    },
    {
      mistake:
        "Letting one person request, approve, pay, record, reconcile, and review the same activity.",
      correction:
        "Separate duties or add timely independent review and external evidence appropriate to the organization’s size and risks.",
    },
    {
      mistake:
        "Outsourcing bookkeeping or payroll and assuming organizational responsibility moved with it.",
      correction:
        "Document the provider handoff, access, deadlines, review, reconciliations, records, exceptions, and internal owner; verify responsibilities with qualified reviewers.",
    },
    {
      mistake:
        "Sending reports that are late, unexplained, or disconnected from decisions.",
      correction:
        "Set a close and review calendar, explain material variance, identify decisions, and record questions and follow-up.",
    },
    {
      mistake:
        "Treating the adopted budget as fixed when conditions materially change.",
      correction:
        "Use defined triggers to reforecast, consider mission and people effects, obtain required approval, and preserve the version and decision trail.",
    },
    {
      mistake:
        "Adopting a universal reserve ratio or control checklist without context.",
      correction:
        "Use board-approved policies based on cash timing, obligations, restrictions, risks, operating model, funding, and qualified advice rather than an invented universal target.",
    },
  ],
  measuresIntroduction:
    "Use measures to test whether the finance process is timely, traceable, and decision-useful. A favorable number is not proof of financial health, compliance, or good governance; investigate context, definitions, restrictions, timing, and data quality.",
  measures: [
    "Days from period end to reconciled close and delivery of complete internal reports.",
    "Number and age of unreconciled items, unexplained variances, and unresolved review questions.",
    "Budget-to-actual variance by material revenue, expense, program, and shared-cost category with a written explanation and owner.",
    "Unrestricted and restricted cash by source and expected timing, shown separately from receivables and forecast revenue.",
    "Upcoming obligations, receivables, payables, payroll, tax, grant, debt, and reporting dates over a defined cash horizon.",
    "Percentage of sampled transactions with source documentation, required approval, correct coding, restriction support, and independent review.",
    "Timeliness of bank, card, payment-platform, payroll, and other material account reconciliations and exception resolution.",
    "Revenue concentration, renewal exposure, conditional funding, and timing dependence by material source.",
    "Board attendance, questions, decisions, conflicts, and follow-up recorded for financial review items.",
    "Forecast revisions compared with later actuals, including which assumptions caused material differences and what the organization learned.",
  ],
  sources: [
    {
      title: "Coach House Idea to Impact Accelerator",
      publisher: "Coach House",
      url: "/accelerator",
      note: "The internal sequence behind this guide: program and organization budgets, shared and future costs, cash timing, multi-year assumptions, bookkeeping alignment, financial statements, board review, and coaching with finance professionals.",
    },
    {
      title: "Recordkeeping Requirements for Exempt Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/eo-operational-requirements-recordkeeping-requirements-for-exempt-organizations",
      note: "Official explanation that exempt organizations need books and records supporting activities, receipts, expenditures, annual returns, and other tax filings.",
    },
    {
      title: "Instructions for Form 990",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/instructions/i990",
      note: "Current annual-return instructions covering financial, governance, compliance, compensation, recordkeeping, and public-reporting information.",
    },
    {
      title: "Employment Taxes for Exempt Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/exempt-organizations-what-are-employment-taxes",
      note: "Official overview of federal withholding, Social Security, Medicare, unemployment, reporting, and deposit responsibilities for exempt-organization employers.",
    },
    {
      title: "Publication 15: Employer’s Tax Guide",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/pub/irs-pdf/p15.pdf",
      note: "The 2026 federal employer guide, including payroll periods, withholding, tax deposits, returns, records, and third-party payer arrangements.",
    },
    {
      title: "2 CFR 200.302 — Financial management",
      publisher: "Electronic Code of Federal Regulations",
      url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.302",
      note: "Current federal-award financial-management requirements, including identification, reporting, source documentation, effective control, comparison with budget, and written procedures.",
    },
    {
      title: "2 CFR 200.303 — Internal controls",
      publisher: "Electronic Code of Federal Regulations",
      url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.303",
      note: "Current internal-control responsibilities for recipients and subrecipients of federal awards.",
    },
    {
      title: "2 CFR 200.334 — Record retention requirements",
      publisher: "Electronic Code of Federal Regulations",
      url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.334",
      note: "Current baseline retention rule and exceptions for records connected to federal awards.",
    },
    {
      title: "Budgeting for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/budgeting-nonprofits",
      note: "Sector guidance on board and staff budget roles, budget approval, true program costs, periodic review, cash flow, actual expenses, and amendment.",
    },
    {
      title: "Internal Controls for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/internal-controls-nonprofits",
      note: "Practical guidance on authority, access, checks and balances, segregation of duties, reimbursements, cash handling, and vendor review.",
    },
    {
      title: "Financial Literacy for Nonprofit Boards",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/governance-leadership/financial-literacy-nonprofit-boards",
      note: "Resources for board understanding of financial statements, restricted funds, transparency, scenarios, reserves, and financial-management questions.",
    },
    {
      title: "Operating Reserves for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/operating-reserves-nonprofits",
      note: "Guidance explaining that reserve needs are organization-specific and that boards can define purpose, use, approval, replenishment, restrictions, and limits in policy.",
    },
  ],
  disclaimer:
    "This educational guide and simplified planning tool do not provide accounting, audit, tax, payroll, grant, legal, investment, banking, insurance, cybersecurity, or financial advice; create or approve a budget, policy, transaction, reconciliation, financial statement, tax return, grant report, audit evidence, or board decision; determine accounting method or treatment, cost allocation, functional classification, restricted-fund release, federal-award allowability, procurement compliance, employment-tax status, filing duties, internal-control sufficiency, fraud, liquidity, solvency, reserve adequacy, audit readiness, or going-concern status; connect to accounts, move money, pay anyone, file anything, verify records, or predict results; or replace affected program and community input, governing authority, source documents, current federal, state, Tribal, territorial, and local requirements, and qualified accounting, tax, payroll, grant, audit, legal, investment, banking, insurance, cybersecurity, or board review. Facts and duties vary by organization, entity, exemption, fiscal structure, activity, funding, award, workforce, transaction, jurisdiction, and time.",
  previous: { title: "HR", href: "/documentation/tools/hr" },
  next: { title: "Legal" },
}
