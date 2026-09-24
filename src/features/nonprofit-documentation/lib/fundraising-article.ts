import type { BestPracticeArticle } from "../types"

export const FUNDRAISING_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/fundraising",
  navigationTitle: "Fundraising",
  title: "Build a fundraising system around relationships and stewardship",
  description:
    "A practical U.S. nonprofit fundraising guide covering funding need, case for support, relationship development, channel planning, ethical asks, gift handling, stewardship, and measurable learning.",
  eyebrow: "Best practices · Fundraising",
  answer:
    "Nonprofit fundraising is the disciplined work of connecting a documented mission and financial need with people and institutions that may choose to support it, then honoring every promise, restriction, privacy preference, and reporting responsibility that follows.",
  readingTime: "14 minute read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "What a complete fundraising system includes",
    stages: "Build for the organization you have now",
    example: "Fictional example",
    framework: "A seven-part fundraising cycle",
    checklist: "Core fundraising checklist",
    mistakes: "Common fundraising failures",
    measures: "Evidence that the system is learning",
  },
  definition:
    "Fundraising includes defining the financial need, developing a truthful case for support, identifying and understanding audiences, cultivating relationships, making clear invitations, processing gifts accurately, honoring restrictions and privacy, reporting results, and stewarding supporters over time. Grant applications, events, digital appeals, major gifts, sponsorships, and peer campaigns are different channels inside that larger system—not substitutes for it.",
  whyItMatters: [
    "A program budget establishes the need. A prospect list, application, conversation, or verbal expression of interest is not committed revenue and should not be presented as cash available to spend.",
    "Different funding channels have different lead times, eligibility rules, costs, restrictions, reporting duties, decision makers, and relationship expectations. A durable plan makes those differences visible.",
    "Fundraising can create federal acknowledgment and disclosure responsibilities and state charitable-solicitation registration or reporting obligations. The rules depend on the gift, activity, organization, and jurisdiction.",
    "Trust continues after the gift. Accurate records, donor privacy, restriction tracking, timely acknowledgment, responsible use, and clear reporting are part of fundraising—not administrative work added later.",
  ],
  importantNote:
    "A fundraising target is a planning need, not a prediction. Keep committed funds, qualified opportunities, early relationships, and broad audiences in distinct evidence states.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Is there a credible need and a responsible way to fund it?",
      guidance:
        "Start with community listening, a rough cost model, and a structural choice. A fiscally sponsored project, partnership, or program inside an existing organization may offer a faster and more credible fundraising path than forming a new entity.",
      actions: [
        "Describe the community need, proposed response, people affected, evidence, and financial assumptions without promising results that have not been tested.",
        "Map people and institutions already connected to the issue; ask for perspective and introductions before asking for money.",
        "Compare entity, fiscal-sponsorship, and partnership options, including who accepts funds, approves materials, acknowledges gifts, and controls spending.",
      ],
      checkpoint:
        "You can explain the need, funding structure, first test, and next five listening conversations without treating goodwill as revenue.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can the organization make and keep a clear promise?",
      guidance:
        "Connect the mission, program design, budget, case for support, board roles, and gift-handling system. Confirm solicitation requirements and who is authorized to represent the organization before publishing donation pages or proposals.",
      actions: [
        "Build the funding goal from an approved budget that includes program, operating, and fundraising costs.",
        "Write the case for support in the organization’s own voice, then adapt it for specific audiences and channels.",
        "Establish review, acceptance, acknowledgment, restriction, privacy, deposit, accounting, and stewardship responsibilities.",
      ],
      checkpoint:
        "The organization can receive a contribution, record it correctly, honor its terms, thank the supporter, and show how the funds connect to the approved work.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Does every active opportunity have a truthful next step?",
      guidance:
        "Use a relationship and opportunity pipeline to organize work, not inflate forecasts. Segment audiences, match the invitation to relationship stage, and reconcile development records with accounting and program commitments on a predictable cadence.",
      actions: [
        "Track relationship stage, owner, next action, decision timing, amount, confidence evidence, restrictions, and communication preferences.",
        "Choose a small set of channels the team can execute and steward consistently; document full cost and staff time.",
        "Review acknowledgments, deposits, restrictions, reports, renewals, and donor questions with finance and program owners.",
      ],
      checkpoint:
        "The pipeline shows evidence and next actions, the books reconcile to gift records, and no promised follow-up depends on one person’s memory.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Can the system grow without weakening trust or delivery?",
      guidance:
        "Growth requires portfolio ownership, shared records, revenue-risk review, stronger gift acceptance, reliable reporting, and explicit capacity decisions. More channels are useful only when the organization can manage their costs and obligations.",
      actions: [
        "Review revenue concentration, renewal exposure, restricted funding, reporting workload, and cash timing with the board.",
        "Define relationship portfolios, backup ownership, access controls, data-retention practices, and approval thresholds.",
        "Evaluate channel performance using net revenue, retention, mission fit, staff capacity, donor experience, and reporting quality—not gross dollars alone.",
      ],
      checkpoint:
        "Leadership can explain which revenue is dependable, which is restricted, which relationships need attention, and what capacity limits the next stage of growth.",
    },
  ],
  example: {
    name: "Illustrative example: East Harbor Youth Arts",
    context:
      "A fictional operating nonprofit needs $90,000 beyond committed funds to run a twelve-month youth arts program. It has engaged families, several local supporters, two foundation prospects, and a small annual showcase.",
    weakLabel: "Fragile plan",
    weak: "We need $90,000, so we will apply for grants, go viral, and hold a gala.",
    strongLabel: "Reviewable plan",
    strong:
      "We will validate a $35,000 individual-giving plan through ten priority relationships, screen two foundations against eligibility and timing before assigning $25,000, test $10,000 each in corporate and government pathways, and cap the showcase at a $10,000 net target with a documented follow-up plan.",
    reason:
      "The reviewable version still contains uncertainty, but it names assumptions, evidence, channel owners, amounts, costs, and next actions. It can be revised as real decisions arrive.",
  },
  framework: [
    {
      title: "Define the need",
      instruction:
        "Start from an approved budget, subtract committed resources, include fundraising costs, and identify when cash is needed.",
      prompt: "What work must be funded, how much remains, and by when?",
    },
    {
      title: "Build the case",
      instruction:
        "Explain the need, people affected, organizational response, evidence, financial use, and invitation in accurate human language.",
      prompt:
        "Why this work, why this organization, why now, and what can support make possible?",
    },
    {
      title: "Map relationships",
      instruction:
        "Surface existing contacts, community ties, institutions, public audiences, and long-term supporters before buying lists or chasing cold opportunities.",
      prompt:
        "Who already has a reason to care, and who can credibly introduce the work?",
    },
    {
      title: "Identify the journey stage",
      instruction:
        "Distinguish people being identified, introduced, cultivated, asked, and stewarded so the next action fits the relationship.",
      prompt:
        "What has this person or institution actually seen, said, or agreed to?",
    },
    {
      title: "Choose channels",
      instruction:
        "Select channels based on audience fit, eligibility, lead time, cost, team capacity, restrictions, and stewardship requirements.",
      prompt:
        "Which small mix can we execute well enough to earn trust and learn?",
    },
    {
      title: "Make a clear ask",
      instruction:
        "Match the amount, purpose, timing, format, and next step to the relationship and give the prospective supporter a genuine choice.",
      prompt:
        "What are we inviting, what will happen next, and what limits must we disclose?",
    },
    {
      title: "Receive and steward",
      instruction:
        "Record the gift, preserve terms, acknowledge it, protect information, report use and results, and plan the next relationship step.",
      prompt: "Can we prove that we kept the promise attached to this support?",
    },
  ],
  checklist: [
    "The fundraising need reconciles to an approved budget and cash timeline.",
    "Committed revenue is separated from proposals, prospects, conversations, and broad audiences.",
    "The case for support is truthful, specific, evidence-aware, and written in the organization’s own voice before AI adaptation.",
    "Priority audiences are segmented by relationship, motivation, communication preference, and appropriate next action.",
    "Every active opportunity has an owner, stage, amount, evidence, next action, and decision date.",
    "Selected channels have documented eligibility, lead time, full cost, staff capacity, restrictions, and reporting requirements.",
    "Solicitation registration, required disclosures, gift acceptance, donor privacy, and acknowledgment practices have been reviewed.",
    "Development and accounting records reconcile contributions, restrictions, pledges, fees, refunds, and reports.",
    "Stewardship commitments have owners and dates, including thanks, impact updates, reports, renewals, and donor preferences.",
  ],
  mistakes: [
    {
      mistake: "Starting with grant searches instead of a funded plan.",
      correction:
        "Define the work, budget, evidence, eligibility, and capacity first. Screen opportunities against the plan rather than reshaping the mission around every deadline.",
    },
    {
      mistake: "Counting the entire pipeline as expected revenue.",
      correction:
        "Separate committed, submitted, qualified, cultivated, and unidentified amounts. Cash decisions should use the evidence state, timing, restrictions, and downside case.",
    },
    {
      mistake: "Making the same appeal to every audience.",
      correction:
        "Keep one truthful core case, then adapt the evidence, detail, invitation, channel, and next step to the audience and relationship stage.",
    },
    {
      mistake: "Treating events as free money or awareness as a result.",
      correction:
        "Budget direct costs and staff time, define the relationship purpose, measure net results, obtain appropriate consent, and plan follow-up before launch.",
    },
    {
      mistake:
        "Promising restricted outcomes the program cannot reliably deliver.",
      correction:
        "Review restrictions and reporting duties before acceptance. Decline or renegotiate terms that conflict with mission, capacity, law, or the approved program.",
    },
    {
      mistake: "Paying a fundraiser a percentage of contributions raised.",
      correction:
        "Use fair, pre-agreed compensation based on scope, expertise, time, and appropriate performance measures; the AFP ethical standards reject percentage-based compensation and finder’s fees.",
    },
  ],
  measuresIntroduction:
    "Measure the work from relationship development through responsible use. No single rate proves effectiveness, and comparisons require consistent definitions.",
  measures: [
    "Funding-plan coverage: committed funds and planned channel amounts compared with the documented need, without presenting planned amounts as secured.",
    "Relationship activity: priority relationships with an evidence-based stage, owner, next action, and current communication preference.",
    "Decision movement: qualified opportunities that advance, pause, decline, or close, with reasons captured for learning.",
    "Net channel contribution: revenue less direct cost and material staff time, reviewed alongside mission fit and donor experience.",
    "Stewardship reliability: gifts acknowledged, restrictions recorded, reports delivered, preferences honored, and exceptions resolved on time.",
    "Renewal and concentration: retained support and dependence on the largest sources, interpreted with gift restrictions, timing, and relationship context.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal learning sequence behind this guide: fundraising mindset, audience segmentation, relationship mapping, donor journey, channels, case for support, and systems.",
    },
    {
      title:
        "Charitable contribution substantiation and disclosure requirements",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-organizations-substantiation-and-disclosure-requirements",
      note: "Federal acknowledgment, noncash contribution, auction, and quid pro quo disclosure starting points.",
    },
    {
      title: "Charitable solicitation state requirements",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-solicitation-state-requirements",
      note: "State registration, reporting, paid-solicitor, and local requirement overview with regulator links.",
    },
    {
      title: "The Grant Lifecycle",
      publisher: "Grants.gov",
      url: "https://grants.gov/learn-grants/grants-101/the-grant-lifecycle",
      note: "Federal grant opportunity, registration, application, award, reporting, oversight, and closeout stages.",
    },
    {
      title: "Entity Registration",
      publisher: "SAM.gov",
      url: "https://sam.gov/entity-registration",
      note: "Current federal entity-registration starting point for organizations seeking federal awards.",
    },
    {
      title: "Code of Ethical Standards",
      publisher: "Association of Fundraising Professionals",
      url: "https://afpglobal.org/ethics/code-ethical-standards",
      note: "Ethical guidance for truthful communications, donor intent, privacy, stewardship, conflicts, and compensation.",
    },
    {
      title: "Ethical Fundraising",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/fundraising-and-resource-development/ethical-fundraising",
      note: "Operational guidance on transparency, donor accountability, restrictions, acknowledgments, and gift acceptance.",
    },
    {
      title: "Board Roles and Responsibilities",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/governance-leadership/board-roles-and-responsibilities",
      note: "Board responsibility for sustainable resources, financial oversight, advocacy, and mission stewardship.",
    },
  ],
  disclaimer:
    "Educational planning guidance only. This page does not determine fundraising registration, tax treatment, gift restrictions, disclosure, privacy, grant, accounting, or reporting requirements. Confirm current rules and agreement terms with the responsible agencies, funders, fiscal sponsor, and qualified professionals.",
  previous: {
    title: "Compliance",
    href: "/documentation/best-practices/compliance",
  },
  next: {
    title: "Marketing",
    href: "/documentation/best-practices/marketing",
  },
}
