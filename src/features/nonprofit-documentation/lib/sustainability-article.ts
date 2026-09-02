import type { BestPracticeArticle } from "../types"

export const SUSTAINABILITY_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/sustainability",
  navigationTitle: "Sustainability",
  title:
    "Build nonprofit sustainability around mission, capacity, and continuity",
  description:
    "A practical U.S. nonprofit guide to financial resilience, people, systems, adaptation, succession, continuity, and a free interactive sustainability scenario planner.",
  eyebrow: "Best practices · Sustainability",
  answer:
    "Nonprofit sustainability is the ability to maintain valued mission benefits over time by aligning strategy, people, flexible funding, partnerships, systems, evidence, adaptation, and continuity. It is not permanent growth or a single reserve target. Build a bounded scenario, identify essential commitments and dependencies, test financial and human capacity, define decision triggers, and revisit the plan as conditions change.",
  readingTime: "17 minute read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "What sustainable nonprofit practice protects",
    stages: "Plan for sustainability at every stage",
    example: "Fictional example",
    framework: "A connected sustainability practice",
    checklist: "Sustainability planning checklist",
    mistakes: "Common sustainability failures",
    measures: "Evidence that sustainability capacity is improving",
  },
  definition:
    "Sustainability capacity is the set of structures and processes that helps a program or organization maintain valued benefits over time. Funding stability matters, but so do organizational capacity, partnerships, evaluation, adaptation, communication, environmental support, and strategic planning. Organizational sustainability also requires cash-flow visibility, appropriate governance, realistic workloads, succession and emergency continuity, and choices about what should be maintained, changed, transferred, or responsibly concluded.",
  whyItMatters: [
    "A program can have demand and grant commitments yet remain fragile if cash arrives after expenses, funds are restricted, staff capacity is overcommitted, or essential knowledge sits with one person.",
    "Separating mission benefits from a specific activity helps a team adapt the delivery model without treating every current program feature as permanent.",
    "Scenario planning makes assumptions about revenue, costs, timing, workload, partnerships, and external conditions visible before they become emergencies.",
    "Continuity, succession, and responsible transition planning protect participants, staff, records, obligations, and trusted relationships when leaders, funding, technology, or conditions change.",
  ],
  importantNote:
    "Restricted funds are not interchangeable with unrestricted operating resources. A simple projected balance is not a cash-flow forecast because it does not model the timing, probability, restrictions, or collection of individual receipts and payments. Confirm restrictions and consequential financial decisions with current records and qualified reviewers.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Is the proposed work relevant and supportable enough to test?",
      guidance:
        "Define the benefit worth sustaining before building permanent infrastructure. Test need, community relevance, delivery assumptions, likely costs, available leadership, and the smallest responsible commitment.",
      actions: [
        "Separate the intended mission benefit from the first program idea and identify existing community assets or organizations already doing related work.",
        "Estimate the full cost of a small test, including staff time, access, administration, evaluation, insurance, technology, and closeout obligations.",
        "Name the decision date and evidence that would support continuing, adapting, partnering, transferring, pausing, or stopping.",
      ],
      checkpoint:
        "The team can explain what benefit should persist, what the first test requires, who carries the work, and how it will avoid creating unsupported promises.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can the operating model deliver its commitments reliably?",
      guidance:
        "Connect the program model to an organization-wide budget, cash timing, funding restrictions, roles, systems, governance, and early continuity practices. Treat the first multi-year view as a scenario to revise.",
      actions: [
        "Build program and organization budgets with explicit assumptions about volume, staffing, shared costs, revenue timing, restrictions, and future expenses.",
        "Document recurring work, approval authority, key relationships, record locations, access controls, backups, and temporary coverage for critical roles.",
        "Create a review rhythm for budget-to-actuals, cash position, capacity, program evidence, risks, and changes in participant needs or context.",
      ],
      checkpoint:
        "Essential commitments have plausible resources, owners, systems, review dates, and a fallback if a key assumption or person becomes unavailable.",
    },
    {
      id: "operating",
      label: "Operating",
      question:
        "What should be protected, adapted, or stopped as conditions change?",
      guidance:
        "Review mission value, implementation, outcomes, participant experience, workload, cash flow, restrictions, revenue concentration, systems, and risk together. Do not let sunk costs or reporting volume replace a current decision.",
      actions: [
        "Compare actual revenue, expenses, cash timing, restricted balances, staffing effort, service demand, quality, and outcomes with the assumptions behind the plan.",
        "Set thresholds that trigger a defined response, owner, communication plan, and board or specialist review rather than waiting for a crisis.",
        "Invest in documentation, cross-training, realistic supervision, secure systems, partner agreements, and accessible communications for service disruptions or changes.",
      ],
      checkpoint:
        "The team notices material variance early, understands its mission and operational implications, and records an authorized adaptation with follow-up.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Can the organization expand without scaling fragility?",
      guidance:
        "Expansion should be supported by evidence, full-cost scenarios, leadership and staff capacity, repeatable systems, partner readiness, governance, flexible capital, and explicit decisions about what remains local.",
      actions: [
        "Stress-test base, constrained, and expansion scenarios for timing, restrictions, hiring, supervision, facilities, technology, insurance, compliance, evaluation, and transition costs.",
        "Review revenue and partner concentration, key-person dependencies, decision rights, internal controls, site variation, data access, succession, and emergency continuity.",
        "Use staged commitments and review gates so the organization can learn, adapt, or decline expansion before obligations outpace capacity.",
      ],
      checkpoint:
        "Growth decisions show the full operating model, sources and restrictions of capital, capacity required, evidence limits, local conditions, decision gates, and exit obligations.",
    },
  ],
  example: {
    name: "Illustrative example: Willow Street Family Resource Network",
    context:
      "A fictional nonprofit is deciding whether to continue and modestly expand its bilingual legal-navigation pilot. Demand is strong, but a one-year restricted grant covers navigator time only; supervision, technology, insurance, interpretation, and administration depend on flexible resources and two staff members hold most referral knowledge.",
    weakLabel: "Funding presented as sustainability",
    weak: "The grant was renewed, so the program is sustainable and ready to expand to two more neighborhoods.",
    strongLabel: "Bounded sustainability scenario",
    strong:
      "Before expanding, model receipt timing and allowable uses; confirm the flexible resources required for shared costs; compare staff hours with current commitments; document referral relationships and temporary coverage; review participant outcomes and access; and set a board decision gate before adding locations or promises.",
    reason:
      "The stronger scenario treats funding as one condition among mission value, restrictions, cash timing, workload, systems, relationships, evidence, governance, and continuity.",
  },
  framework: [
    {
      title: "Protect the mission benefit",
      instruction:
        "Define which participant or community benefit should continue and which current activities are only one possible way to support it.",
      prompt:
        "What value must be protected, for whom, and what could change without losing that value?",
    },
    {
      title: "Choose a direction and horizon",
      instruction:
        "State whether the organization intends to maintain, stabilize, transition, grow, or responsibly conclude the work, and over what review period.",
      prompt:
        "What decision are we preparing to make, by when, and what remains outside this scenario?",
    },
    {
      title: "Model flexible resources and full costs",
      instruction:
        "Separate unrestricted and restricted resources, model timing and assumptions, include shared and future costs, and compare scenarios with actuals.",
      prompt:
        "What resources are truly available for which obligations, when will cash move, and what costs are missing?",
    },
    {
      title: "Test people and leadership capacity",
      instruction:
        "Compare available time, skills, supervision, compensation, workload, decision authority, and backup coverage with the commitments in the plan.",
      prompt:
        "Who carries each essential function, what is their real capacity, and what happens if they are unavailable?",
    },
    {
      title: "Strengthen systems and relationships",
      instruction:
        "Document repeatable workflows, controls, records, technology, access, communications, partner agreements, and service-continuity procedures.",
      prompt:
        "Which systems or relationships are essential, how are they maintained, and where is the single point of failure?",
    },
    {
      title: "Use evidence and adapt",
      instruction:
        "Review mission relevance, implementation, outcomes, demand, access, cost, capacity, and context; preserve findings and change the model when warranted.",
      prompt:
        "What evidence would make us continue, redesign, partner, transfer, pause, or stop?",
    },
    {
      title: "Govern continuity and transition",
      instruction:
        "Assign owners, decision rights, board oversight, succession, emergency procedures, communications, closeout duties, and review triggers.",
      prompt:
        "Who decides, who must be protected or informed, and what is the plan if a disruption or transition occurs?",
    },
  ],
  checklist: [
    "The plan identifies the mission benefit to protect, the people affected, the intended direction, the scope, the horizon, and the next decision date.",
    "Program activities are distinguished from the benefit or outcome so delivery can adapt without treating the current model as permanent.",
    "The scenario links the program budget to shared organizational costs, cash timing, future expenses, and budget-to-actual review.",
    "Unrestricted cash and expected unrestricted revenue remain separate from donor-, grant-, contract-, board-, or legally restricted resources.",
    "Revenue assumptions identify source, restriction, probability, timing, concentration, renewal conditions, reporting work, and responsible owner.",
    "Essential commitments identify full costs, staff or volunteer time, skills, supervision, systems, partners, access needs, and closeout obligations.",
    "Workload and capacity are discussed with the people carrying the work; the plan does not treat overtime, vacancies, or unpaid labor as free capacity.",
    "Critical roles, relationships, records, credentials, approvals, vendors, facilities, and technology have documented owners and reasonable backup coverage.",
    "The organization has proportionate succession, emergency continuity, crisis communication, data recovery, and participant-service transition procedures.",
    "Program evidence, participant input, demand, access, unintended effects, context, cost, and operational feasibility inform adaptation decisions.",
    "Decision triggers have thresholds, owners, authority, actions, communications, review dates, and a record of what happened.",
    "Board and staff review the scenario with current financial records and qualified legal, accounting, HR, insurance, technology, or program expertise as needed.",
  ],
  mistakes: [
    {
      mistake: "Treating a grant renewal as proof of sustainability.",
      correction:
        "Confirm allowable uses, timing, shared costs, renewal conditions, reporting burden, flexible-resource needs, and what happens when the grant ends.",
    },
    {
      mistake: "Using one universal reserve target.",
      correction:
        "Develop a board-reviewed reserve policy from the organization’s cash timing, obligations, volatility, risks, restrictions, and recovery plan.",
    },
    {
      mistake: "Planning growth from revenue without modeling capacity.",
      correction:
        "Model full costs, hiring and supervision timing, systems, partner capacity, access, evidence, and decision gates before making new commitments.",
    },
    {
      mistake: "Relying on one person’s memory and relationships.",
      correction:
        "Document critical work and contacts, cross-train proportionately, assign temporary authority, secure records, and maintain succession and emergency coverage.",
    },
    {
      mistake: "Protecting every activity because it already exists.",
      correction:
        "Protect valued mission benefits. Use evidence and participant input to maintain, adapt, partner, transfer, pause, or conclude activities responsibly.",
    },
    {
      mistake: "Waiting for a crisis to define thresholds and communications.",
      correction:
        "Predefine material triggers, decision authority, response options, affected audiences, communication ownership, and review timing.",
    },
    {
      mistake: "Presenting a simple projection as a financial forecast.",
      correction:
        "Label the scenario, show assumptions and exclusions, model cash timing separately, reconcile with current records, and obtain qualified review for consequential decisions.",
    },
  ],
  measuresIntroduction:
    "Judge sustainability work by whether it protects valued benefits and improves timely, responsible decisions—not by growth, cash, or completed policies alone.",
  measures: [
    "Mission continuity: essential participant or community benefits remain relevant, accessible, and supported through change or transition.",
    "Financial visibility: leaders review current cash, restrictions, receivables, obligations, variance, assumptions, concentration, and scenario timing often enough to act.",
    "Capacity realism: commitments reflect actual hours, skills, supervision, compensation, workload, vacancies, and partner capacity rather than hidden labor.",
    "Operational resilience: critical functions have documented workflows, secure records, appropriate controls, backup access, and tested recovery or workaround procedures.",
    "Leadership continuity: decision rights, temporary authority, succession, knowledge transfer, and communication responsibilities are current and understood.",
    "Adaptation quality: program evidence, participant interpretation, context, cost, and feasibility result in recorded maintain, change, transfer, pause, or stop decisions.",
    "Governance use: board and staff review material scenarios and triggers, document authority and dissent, and follow up on assigned actions.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal sequence behind this guide: program and organization budgets, cash timing, multi-year direction, future expenses, capacity, assumptions, and shared review.",
    },
    {
      title:
        "Using the Program Sustainability Assessment Tool to Assess and Plan for Sustainability",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/pcd/issues/2014/13_0185.htm",
      note: "A three-part process for assessing sustainability capacity, prioritizing an action plan, implementing it, and tracking progress across multiple domains.",
    },
    {
      title:
        "The Program Sustainability Assessment Tool: A New Instrument for Public Health Programs",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/pcd/issues/2014/13_0184.htm",
      note: "Research supporting eight sustainability-capacity domains beyond funding alone.",
    },
    {
      title: "Good Governance Practices",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/pub/irs-tege/governance_practices.pdf",
      note: "IRS educational guidance on governance, mission, organizational documents, financial statements, Form 990 reporting, transparency, and accountability.",
    },
    {
      title: "Governance, Management, and Disclosure — Form 990 Part VI",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/exempt-organizations-annual-reporting-requirements-governance-form-990-part-vi",
      note: "Current IRS explanations of Form 990 governance, policy, management, and disclosure questions and their limits.",
    },
    {
      title: "Emergency Plans",
      publisher: "Ready.gov",
      url: "https://www.ready.gov/business/emergency-plans",
      note: "Federal preparedness guidance connecting continuity, crisis communications, emergency response, and IT recovery planning.",
    },
    {
      title: "Operating Reserves for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/operating-reserves-nonprofits",
      note: "Nonprofit guidance emphasizing that no single reserve standard fits every organization and outlining elements of a board reserve policy.",
    },
    {
      title: "Budgeting for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/budgeting-nonprofits",
      note: "Guidance on budgets, board and staff roles, financial review, advance planning, and comparing budgets with actual cash flow and expenses.",
    },
    {
      title: "Succession Planning for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/governance-leadership/succession-planning-nonprofits-managing-leadership",
      note: "Guidance treating succession and unexpected leadership departures as organizational sustainability and risk-management concerns.",
    },
  ],
  disclaimer:
    "This educational guide and simplified scenario planner do not determine sustainability, solvency, liquidity, going-concern status, allowable use of restricted funds, reserve adequacy, program effectiveness, fiduciary compliance, legal compliance, or readiness to grow, transition, or close. Financial position, obligations, restrictions, employment matters, charitable assets, contracts, notice duties, and closure requirements vary. Reconcile decisions with current records and review consequential scenarios with the board, affected people, and qualified accounting, legal, financial, HR, insurance, technology, emergency-planning, and program professionals as appropriate.",
  previous: {
    title: "Measuring impact",
    href: "/documentation/best-practices/measuring-impact",
  },
  next: {
    title: "Partnerships",
    href: "/documentation/best-practices/partnerships",
  },
}
