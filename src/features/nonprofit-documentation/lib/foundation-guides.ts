import type { FoundationGuide } from "../types"

const reviewedDate = "August 31, 2026"

export const QUICKSTART_GUIDE: FoundationGuide = {
  slug: "quickstart",
  title: "Choose the next right nonprofit step",
  description:
    "A stage-specific nonprofit quickstart for moving from a community need to a durable operating organization in the United States.",
  eyebrow: "Get started · Quickstart",
  answer:
    "Start with evidence and stage, not incorporation paperwork. Clarify the need, test whether a new organization is necessary, and build only the governance, compliance, money, and measurement systems required for the next responsible decision.",
  readingTime: "8 minute read",
  reviewedDate,
  sections: [
    {
      id: "first-decision",
      title: "First decide whether to start an organization",
      introduction:
        "A nonprofit corporation is one possible vehicle for public-benefit work. It is not the default answer to every good idea.",
      entries: [
        {
          title: "Define the unmet need",
          description:
            "Name the people, place, condition, and evidence that make action necessary.",
          detail:
            "Use interviews, service data, lived experience, and existing provider knowledge—not founder enthusiasm alone.",
        },
        {
          title: "Map existing responses",
          description:
            "Identify organizations, public agencies, informal groups, and funders already working on the issue.",
          detail:
            "Look for a partnership, hosted project, fiscal sponsor, or program extension before adding another institution.",
        },
        {
          title: "Name the distinct contribution",
          description:
            "Explain what this effort will repeatedly do that is missing, inaccessible, or insufficient today.",
          detail:
            "A credible answer should connect the need, intended participants, activities, capacity, and expected change.",
        },
      ],
    },
    {
      id: "operating-system",
      title: "Build the minimum viable operating system",
      introduction:
        "Every stage needs a small set of shared decisions and records. Add complexity only when risk, scale, or law requires it.",
      entries: [
        {
          title: "Purpose and program",
          description:
            "Keep one approved mission, a concrete activity description, and an explicit definition of whom each program serves.",
        },
        {
          title: "Governance and decisions",
          description:
            "Record board authority, conflicts, major approvals, ownership of work, and the next review date.",
        },
        {
          title: "Money and records",
          description:
            "Maintain a realistic budget, approval rules, source documents, restricted-fund records, and a filing calendar.",
        },
        {
          title: "Learning and accountability",
          description:
            "Track reach, access, delivery quality, participant feedback, and the near-term outcomes the work can reasonably influence.",
        },
      ],
    },
  ],
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Is a new nonprofit the best vehicle?",
      guidance:
        "Treat the idea as a testable response to a defined need. Spend before incorporation only when the learning cannot be obtained more simply or through a partner.",
      actions: [
        "Interview intended participants and people already delivering adjacent services.",
        "Compare partnership, fiscal sponsorship, informal project, and independent-organization options.",
        "Draft a one-page need, contribution, participants, activities, assumptions, and evidence brief.",
      ],
      checkpoint:
        "You can show a distinct public-benefit contribution and explain why the chosen structure is proportionate to the work.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can the organization govern and fund its promises?",
      guidance:
        "Coordinate state formation, governing documents, board decisions, federal tax classification, activity plans, and the first operating budget. State nonprofit status and federal tax exemption are separate decisions.",
      actions: [
        "Confirm state formation and charitable-solicitation requirements with the responsible state agencies.",
        "Adopt governing documents, conflict procedures, mission, initial board roles, and documented approvals.",
        "Choose the appropriate federal exemption path and describe planned activities and finances consistently.",
      ],
      checkpoint:
        "The board can trace purpose to activities, authority, costs, funding, records, and required filings.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Can the work be delivered and documented reliably?",
      guidance:
        "Move from founding decisions to repeatable delivery. Keep records that support activities, receipts, expenditures, restrictions, tax filings, and board oversight.",
      actions: [
        "Run a shared compliance calendar with named owners and board visibility.",
        "Review cash, budget variance, program delivery, risks, and participant feedback on a regular cadence.",
        "File the applicable federal return or notice and required state reports on time.",
      ],
      checkpoint:
        "Another responsible person can understand what happened, why decisions were made, and where supporting records live.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Can expansion preserve mission, controls, and quality?",
      guidance:
        "Growth should follow evidence and capacity. Test whether new programs, geographies, funding terms, and staffing models strengthen the same public benefit without exceeding operating controls.",
      actions: [
        "Set expansion gates for mission fit, demand, evidence, full cost, leadership capacity, and risk.",
        "Strengthen delegation, financial controls, data governance, and manager accountability before volume increases.",
        "Report material structural or operational changes through the appropriate federal and state processes.",
      ],
      checkpoint:
        "The organization can absorb growth without weakening participant experience, financial visibility, compliance, or board oversight.",
    },
  ],
  checklist: [
    "The need and intended participants are supported by current evidence.",
    "Existing organizations and partnership options were reviewed.",
    "The chosen legal and operating structure matches the current stage.",
    "Mission, activities, budget, governance, and public claims describe the same work.",
    "Every required filing and review has an owner, due date, and record location.",
    "The organization tracks access, delivery quality, participant feedback, and reasonable outcomes.",
  ],
  sources: [
    {
      title: "Life cycle of a public charity/private foundation",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/life-cycle-of-a-public-charity-private-foundation",
      note: "Official federal lifecycle references for formation, exemption, filings, and significant events.",
    },
    {
      title: "Applying for tax-exempt status",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/applying-for-tax-exempt-status",
      note: "Current application paths and federal exemption resources.",
    },
    {
      title: "Annual filing and forms",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/annual-filing-and-forms",
      note: "Annual return, notice, electronic filing, and automatic-revocation information.",
    },
    {
      title: "Recordkeeping requirements for exempt organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/eo-operational-requirements-recordkeeping-requirements-for-exempt-organizations",
      note: "Records needed to support activities, receipts, expenditures, and returns.",
    },
  ],
}

export const KEY_CONCEPTS_GUIDE: FoundationGuide = {
  slug: "key-concepts",
  title: "Use nonprofit terms precisely",
  description:
    "Plain-language definitions of the legal, strategic, operating, and impact concepts nonprofit founders and operators use most.",
  eyebrow: "Get started · Key concepts",
  answer:
    "Precise language prevents expensive category errors. Separate state nonprofit status from federal tax exemption, mission from programs, outputs from outcomes, and organizational growth from durable impact.",
  readingTime: "10 minute read",
  reviewedDate,
  sections: [
    {
      id: "structure",
      title: "Organization and tax structure",
      introduction:
        "These terms describe different legal, tax, and operating facts. They are related, but they are not interchangeable.",
      entries: [
        {
          title: "Nonprofit",
          description:
            "An organization formed under applicable state nonprofit law. State formation does not by itself create federal income-tax exemption.",
        },
        {
          title: "Tax-exempt organization",
          description:
            "An organization that meets the requirements of a federal tax-exempt category and, when required, receives IRS recognition.",
        },
        {
          title: "Section 501(c)(3)",
          description:
            "A federal tax category for organizations organized and operated for qualifying exempt purposes, subject to specific limitations and obligations.",
        },
        {
          title: "Public charity",
          description:
            "A 501(c)(3) classification generally associated with broad public support, qualifying institutional status, exempt-purpose revenue, or support of public charities.",
        },
        {
          title: "Private foundation",
          description:
            "A 501(c)(3) classification that commonly has a concentrated funding source and additional operating and tax rules.",
        },
        {
          title: "Fiscal sponsorship",
          description:
            "A documented relationship in which an established tax-exempt sponsor provides defined legal and administrative stewardship for a charitable project. The agreement and model determine responsibilities.",
        },
      ],
    },
    {
      id: "strategy",
      title: "Purpose and strategy",
      introduction:
        "Strategy becomes clearer when the future you seek, your contribution, and your current delivery methods are named separately.",
      entries: [
        {
          title: "Vision",
          description: "The future condition the work helps move toward.",
        },
        {
          title: "Mission",
          description:
            "The durable public-benefit contribution the organization exists to make.",
        },
        {
          title: "Theory of change",
          description:
            "An explicit explanation of how activities are expected to contribute to outcomes, including assumptions and context.",
        },
        {
          title: "Program",
          description:
            "An organized set of activities, people, resources, and delivery choices used to advance the mission.",
        },
        {
          title: "Capacity",
          description:
            "The people, time, systems, money, knowledge, and relationships available to perform work responsibly.",
        },
      ],
    },
    {
      id: "evidence",
      title: "Delivery and evidence",
      introduction:
        "Good measurement distinguishes what the organization did from what changed and from the broader conditions it hopes to influence.",
      entries: [
        {
          title: "Output",
          description:
            "A direct product of activity, such as sessions delivered, grants awarded, meals served, or referrals completed.",
        },
        {
          title: "Outcome",
          description:
            "A change in knowledge, access, behavior, condition, practice, or system that the work may reasonably influence.",
        },
        {
          title: "Impact",
          description:
            "The broader or longer-term difference associated with the work, interpreted with evidence and appropriate caution about attribution.",
        },
        {
          title: "Restricted funds",
          description:
            "Resources whose use is limited by donor terms, grant conditions, or other enforceable requirements and must be tracked accordingly.",
        },
        {
          title: "Compliance",
          description:
            "The recurring work of meeting applicable legal, tax, reporting, governance, employment, fundraising, and contractual obligations.",
        },
      ],
    },
  ],
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Which terms clarify the decision?",
      guidance:
        "Focus on need, intended participants, mission, alternatives, and the difference between a project and an independent organization.",
      actions: [
        "Describe the need without naming a program first.",
        "Separate the desired outcome from proposed activities.",
        "Compare project, partnership, fiscal sponsorship, and independent nonprofit structures.",
      ],
      checkpoint:
        "People can discuss the need and structural options without assuming incorporation is the goal.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Which terms must align across records?",
      guidance:
        "Use nonprofit, tax-exempt, 501(c)(3), public charity, private foundation, mission, and program precisely in board and application materials.",
      actions: [
        "Record the intended state entity and federal tax classification separately.",
        "Align governing purpose, activities, budget, and exemption materials.",
        "Document any fiscal-sponsorship responsibilities in a written agreement.",
      ],
      checkpoint:
        "Board members can explain the organization’s state status, federal status, classification, purpose, and activities without conflating them.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Which terms improve management?",
      guidance:
        "Distinguish outputs, outcomes, impact, capacity, restrictions, and compliance so reports describe both delivery and obligations honestly.",
      actions: [
        "Label measures as output, outcome, or broader impact.",
        "Track restricted resources separately from unrestricted operating money.",
        "Assign owners and evidence to recurring compliance obligations.",
      ],
      checkpoint:
        "Internal and public reports use the same definitions and do not overstate what the evidence proves.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Which terms keep expansion honest?",
      guidance:
        "Use mission, program, capacity, outcomes, and impact to distinguish responsible scale from more activity alone.",
      actions: [
        "Define whether growth means reach, depth, geography, influence, or organizational size.",
        "State the capacity and assumptions required for expansion.",
        "Separate evidence of delivery volume from evidence of participant or system change.",
      ],
      checkpoint:
        "Leaders can explain what is growing, why it matters, what it costs, and what evidence will test the claim.",
    },
  ],
  checklist: [
    "State nonprofit status and federal tax exemption are described separately.",
    "Mission, vision, theory of change, and programs have distinct roles.",
    "Outputs, outcomes, and impact are not used as synonyms.",
    "Restricted resources and compliance obligations have explicit owners and records.",
    "Growth claims specify reach, depth, geography, influence, or organizational scale.",
    "Public claims match the strength and limits of available evidence.",
  ],
  sources: [
    {
      title: "Frequently asked questions about applying for tax exemption",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/frequently-asked-questions-about-applying-for-tax-exemption",
      note: "Official distinction between state nonprofit status and federal tax exemption.",
    },
    {
      title: "Life cycle of a public charity/private foundation",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/life-cycle-of-a-public-charity-private-foundation",
      note: "Public-charity and private-foundation classifications and lifecycle references.",
    },
    {
      title: "Publication 557: Tax-Exempt Status for Your Organization",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/publications/p557",
      note: "Federal exemption categories, organizational tests, and operating requirements.",
    },
  ],
}
