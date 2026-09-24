import type { BestPracticeArticle } from "../types"

export const COMPLIANCE_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/compliance",
  navigationTitle: "Compliance",
  title: "Build a nonprofit compliance system that survives busy years",
  description:
    "A practical U.S. nonprofit compliance guide covering federal filings, state registration, records, governance, employment responsibilities, and an annual planning rhythm.",
  eyebrow: "Best practices · Compliance",
  answer:
    "Nonprofit compliance is a repeatable system for identifying obligations, assigning owners, meeting federal and state deadlines, preserving evidence, and escalating questions before a missed filing becomes a crisis.",
  readingTime: "12 minute read",
  reviewedDate: "September 1, 2026",
  publishedDate: "2026-09-01",
  modifiedDate: "2026-09-01",
  labels: {
    definition: "What nonprofit compliance includes",
    stages: "Build the system for your current stage",
    example: "Fictional example",
    framework: "A six-part compliance rhythm",
    checklist: "Core compliance checklist",
    mistakes: "Common compliance failures",
    measures: "Evidence that the system works",
  },
  definition:
    "Compliance is the operating discipline used to keep an organization in good standing and consistent with its stated exempt purposes. It can include entity filings, federal information returns, charitable solicitation registration, employment reporting, public disclosure, reliable records, and documented governance. The exact set depends on the organization’s legal form, tax classification, activities, people, funding, and jurisdictions.",
  whyItMatters: [
    "State nonprofit status and federal tax-exempt status are different. State law creates and governs the entity; federal law determines exemption from federal income tax.",
    "Most tax-exempt organizations have an annual IRS filing requirement. Missing required Form 990-series filings or notices for three consecutive years causes automatic revocation of federal tax-exempt status.",
    "Charitable solicitation, employment, sales and use tax, local licensing, and annual entity reports can create separate state or local responsibilities that a federal determination letter does not satisfy.",
    "Good records let the organization support reported revenue, expenses, activities, decisions, and public disclosures when a funder, regulator, auditor, board member, or community member asks.",
  ],
  importantNote:
    "A calendar organizes confirmed obligations; it does not determine what applies. Every item should name its authority and preserve the applicability decision.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "What responsibilities would this structure create?",
      guidance:
        "Compare a new nonprofit with alternatives such as a fiscally sponsored project, partnership, or program inside an existing organization. Identify the states, activities, fundraising methods, and workers the proposed model would involve before choosing the entity.",
      actions: [
        "Separate state entity formation from federal tax-exemption decisions.",
        "List where the organization will operate, solicit contributions, hire, own property, or deliver regulated services.",
        "Estimate the administrative capacity and professional support required to maintain the structure.",
      ],
      checkpoint:
        "You can explain the recurring obligations the proposed structure creates and why the organization has enough capacity to own them.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can every initial filing and record be traced?",
      guidance:
        "Create the record system while formation decisions are still fresh. Preserve signed organizing documents, board approvals, the EIN notice, exemption submissions and correspondence, registrations, policies, and a verified tax-year end.",
      actions: [
        "Create a compliance inventory with the responsible agency, requirement, due date, owner, reviewer, and evidence location.",
        "Confirm the organization’s federal annual-return path and state registration starting points.",
        "Adopt a conflict process, document initial board actions, and record who can sign or submit filings.",
      ],
      checkpoint:
        "A second authorized person can locate the governing records, explain the filing calendar, and continue the work if the founder is unavailable.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Does the calendar match what the organization actually does?",
      guidance:
        "Review obligations whenever activities change—not only at tax time. New employees, fundraising channels, contracts, locations, unrelated revenue, or public grants can change what must be registered, reported, retained, or reviewed.",
      actions: [
        "Reconcile the compliance calendar against payroll, accounting, fundraising, program, and board records each quarter.",
        "Keep filing confirmations and the exact submitted versions with supporting schedules and approvals.",
        "Prepare public-inspection records without exposing contributor information that is not subject to public disclosure.",
      ],
      checkpoint:
        "No required filing depends on one person’s memory, and each completed item has reviewable evidence.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "What changed because the organization expanded?",
      guidance:
        "Growth can create multistate solicitation, employment, audit, licensing, data, lobbying, and contract responsibilities. Add a formal change review before launching a new state, revenue model, workforce arrangement, or regulated service.",
      actions: [
        "Require compliance review in expansion and major-contract decisions.",
        "Track registrations and renewals by jurisdiction, not in one undifferentiated annual reminder.",
        "Set thresholds for obtaining qualified legal, tax, employment, or accounting advice.",
      ],
      checkpoint:
        "Leadership can identify which obligations changed, who reviewed them, and what evidence shows the organization responded.",
    },
  ],
  example: {
    name: "Illustrative example: East Harbor Youth Arts",
    context:
      "A fictional public charity has a calendar-year tax year, one part-time employee, local fundraising events, and online donations that may reach supporters in other states.",
    weakLabel: "Fragile setup",
    weak: "The founder keeps the determination letter in email and remembers that taxes are due sometime in May.",
    strongLabel: "Reliable system",
    strong:
      "The board approves an annual compliance inventory with named owners, nominal and confirmed due dates, state-registration checks, quarterly payroll review, evidence links, and a backup reviewer.",
    reason:
      "The reliable version distinguishes different obligations, connects them to actual activity, and leaves evidence another authorized person can verify. It does not assume the calendar itself determines what the law requires.",
  },
  framework: [
    {
      title: "Identify the organization",
      instruction:
        "Record the legal entity, federal tax classification, tax-year end, governing documents, and responsible agencies.",
      prompt: "What exactly exists, and which records prove its status?",
    },
    {
      title: "Map activities and jurisdictions",
      instruction:
        "List where the organization operates, solicits, employs people, owns property, signs contracts, and earns revenue.",
      prompt: "What do we do, with whom, and where?",
    },
    {
      title: "Inventory obligations",
      instruction:
        "For every possible requirement, record the source, applicability decision, deadline, owner, reviewer, and escalation path.",
      prompt:
        "Which authority creates this responsibility, and why does it apply?",
    },
    {
      title: "Build the calendar",
      instruction:
        "Add preparation, board-review, filing, payment, renewal, and evidence-storage dates—not only the final deadline.",
      prompt: "When must work begin so review can happen before submission?",
    },
    {
      title: "Preserve evidence",
      instruction:
        "Store the submitted version, confirmation, payment record, supporting schedules, approval, and correspondence together.",
      prompt:
        "Could a new board treasurer prove what happened without asking the filer?",
    },
    {
      title: "Review change",
      instruction:
        "Recheck the inventory quarterly and whenever the organization changes geography, people, programs, funding, or revenue models.",
      prompt:
        "What changed since the last review, and what new question does it create?",
    },
  ],
  checklist: [
    "The legal entity, tax classification, tax-year end, and responsible agencies are documented.",
    "The organization has confirmed its current Form 990-series filing path using IRS guidance.",
    "State entity reports and charitable solicitation requirements have been checked for every relevant jurisdiction.",
    "Employment, contractor, payroll, and local obligations are reviewed whenever people are paid.",
    "Required public-inspection records are prepared without publishing protected contributor information.",
    "Board minutes, conflict disclosures, financial records, contracts, and filing evidence have named storage locations.",
    "Every calendar item has an owner, backup, preparation date, review date, due date, and evidence field.",
    "A quarterly change review checks new activities, states, workers, grants, contracts, and revenue sources.",
  ],
  mistakes: [
    {
      mistake: "Treating an EIN as proof of federal tax exemption.",
      correction:
        "An EIN identifies the organization for federal tax administration. Confirm exemption through the applicable determination or classification records.",
    },
    {
      mistake: "Tracking only the federal annual return.",
      correction:
        "Maintain separate federal, state, local, employment, licensing, governance, and contract review lanes based on actual activity.",
    },
    {
      mistake: "Assuming online fundraising happens in only the home state.",
      correction:
        "Document where contributions are solicited and check each relevant state’s current registration rules and exemptions before relying on a general rule.",
    },
    {
      mistake: "Giving one person sole control of the calendar and evidence.",
      correction:
        "Assign an owner and reviewer, grant appropriate access, and make the record understandable to a successor.",
    },
    {
      mistake:
        "Presenting recommended governance practices as universal legal requirements.",
      correction:
        "Label the authority and status of each item. Distinguish law, filing instructions, contract terms, funder conditions, and recommended practice.",
    },
  ],
  measuresIntroduction:
    "Measure whether the system produces timely, reviewable evidence and responds when the organization changes.",
  measures: [
    "On-time completion: required items submitted by the confirmed deadline, with preparation and review completed earlier.",
    "Evidence coverage: completed items with the submitted version, confirmation, approval, and supporting records stored together.",
    "Ownership resilience: obligations with both a primary owner and an authorized backup reviewer.",
    "Change-response time: days between a material organizational change and a documented applicability review.",
    "Open exceptions: unresolved regulator notices, rejected filings, expired registrations, missing records, or overdue corrective actions.",
  ],
  sources: [
    {
      title: "Life Cycle of an Exempt Organization",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/life-cycle-of-an-exempt-organization",
      note: "Federal starting, filing, ongoing-compliance, and significant-event topics by exempt-organization type.",
    },
    {
      title: "Form 990 series: Which forms do exempt organizations file?",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/form-990-series-which-forms-do-exempt-organizations-file",
      note: "Current gross-receipt and asset bands commonly used to identify a Form 990-series filing path.",
    },
    {
      title: "Return due dates for exempt organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/return-due-dates-for-exempt-organizations-annual-return",
      note: "Annual-return due dates by tax-year end, including weekends, holidays, and extension information.",
    },
    {
      title: "State links for tax-exempt organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/state-links",
      note: "State government starting points for charity registration, taxation, employers, and related requirements.",
    },
    {
      title: "Recordkeeping requirements for exempt organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/eo-operational-requirements-recordkeeping-requirements-for-exempt-organizations",
      note: "Records needed to support reported income, expenses, activities, credits, and tax filings.",
    },
    {
      title: "Exempt organization public disclosure requirements",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/exempt-organization-public-disclosure-and-availability-requirements",
      note: "Federal public-inspection and copying responsibilities for exemption applications and annual returns.",
    },
    {
      title: "Employment taxes for exempt organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/exempt-organizations-what-are-employment-taxes",
      note: "Federal employer responsibilities for withholding, FICA, deposits, and applicable employment-tax returns.",
    },
  ],
  disclaimer:
    "Educational planning guidance only. This page does not determine whether a filing, registration, tax, license, audit, disclosure, or policy applies. Confirm current requirements with the responsible federal, state, and local agencies and qualified professionals.",
  previous: {
    title: "Mission",
    href: "/documentation/best-practices/mission",
  },
  next: {
    title: "Fundraising",
    href: "/documentation/best-practices/fundraising",
  },
}
