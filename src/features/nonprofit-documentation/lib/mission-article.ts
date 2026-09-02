import type { BestPracticeArticle } from "../types"

export const MISSION_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/mission",
  navigationTitle: "Mission",
  title: "Write a mission that guides real decisions",
  description:
    "A practical, stage-specific guide to defining a nonprofit mission that connects purpose, people, activities, and measurable change.",
  eyebrow: "Best practices · Mission",
  answer:
    "A useful nonprofit mission names who the organization serves, the change it exists to create, and the distinctive work it will do—clearly enough to guide programs, budgets, partnerships, and what the organization declines.",
  readingTime: "9 minute read",
  reviewedDate: "August 31, 2026",
  publishedDate: "2026-08-31",
  modifiedDate: "2026-08-31",
  labels: {
    definition: "What a mission is",
    stages: "Use the mission differently as you mature",
    example: "Fictional example",
    framework: "A five-step mission framework",
    checklist: "Mission quality checklist",
    mistakes: "Common mistakes",
    measures: "What to measure",
  },
  definition:
    "A mission is the organization’s durable reason for acting. It is broader than a program but more specific than a vision. A vision describes the future you hope to see; the mission defines your organization’s contribution to that future.",
  whyItMatters: [
    "A clear mission gives a board and staff a shared test for choosing programs, funding opportunities, and partnerships.",
    "For organizations seeking recognition under section 501(c)(3), the IRS evaluates both exempt purposes and the activities used to advance them. A slogan alone does not establish that connection.",
    "Specificity makes measurement possible: you can identify the people reached, the work delivered, and the change the work is intended to support.",
  ],
  importantNote:
    "A public mission statement supports clarity, but it does not replace purpose clauses, activity descriptions, or state-specific legal review.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Is a new organization the right response?",
      guidance:
        "Treat the mission as a hypothesis. Define the need and intended community, then look for organizations already doing adjacent work. The goal is evidence of a distinct contribution—not a polished sentence.",
      actions: [
        "Interview people closest to the issue, including intended participants.",
        "Map existing services, gaps, and credible partnership options.",
        "Write a one-sentence problem, population, place, and proposed response.",
      ],
      checkpoint:
        "You can explain why this contribution should exist and why a partnership, program inside another organization, or fiscal sponsor is not the better first structure.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can governance and planned activities support the mission?",
      guidance:
        "Translate the mission into an exempt purpose and a concrete activity plan. Your public mission statement, organizing documents, budget, and exemption application can use different levels of detail, but they should describe the same organization.",
      actions: [
        "Confirm that the proposed purpose fits the intended federal tax-exempt category.",
        "Describe what you will do, who will do it, where and when it happens, how it is funded, and how it advances the purpose.",
        "Ask the initial board to approve the mission and record the decision.",
      ],
      checkpoint:
        "A reasonable reader can trace a direct line from purpose to activities, anticipated costs, and public benefit.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Does the mission shape weekly choices?",
      guidance:
        "Use the mission as an operating filter, not wall copy. Program proposals, budgets, grants, hiring, and communications should state how the decision advances the mission and what evidence will show progress.",
      actions: [
        "Add a mission-fit question to program and partnership decisions.",
        "Connect every major budget line to a mission-serving activity or necessary support function.",
        "Review participant feedback and outcome evidence with the board at least annually.",
      ],
      checkpoint:
        "Staff and board members can use the mission to reach similar decisions about what belongs, what needs revision, and what should stop.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "Can the mission hold focus as opportunity expands?",
      guidance:
        "Growth increases pressure to follow available funding or add loosely related programs. Keep the core contribution stable while testing whether new geography, audiences, or delivery models strengthen the intended change.",
      actions: [
        "Score expansion proposals for mission fit, evidence, capacity, and opportunity cost.",
        "Define which parts of the model are essential and which can adapt locally.",
        "Revisit the mission only when the underlying need or contribution has materially changed—not to accommodate a single grant.",
      ],
      checkpoint:
        "The organization can explain how growth deepens or responsibly extends the same public benefit without obscuring accountability.",
    },
  ],
  example: {
    name: "Illustrative example: Riverbend Cooling Network",
    context:
      "A fictional neighborhood coalition is responding to dangerous summer heat among older adults and medically vulnerable residents.",
    weakLabel: "Too broad",
    weak: "We help communities thrive through innovative support.",
    strongLabel: "Decision-ready",
    strong:
      "Riverbend Cooling Network reduces heat-related harm for older and medically vulnerable residents in Riverbend County by coordinating trusted cooling spaces, transportation, and neighbor outreach.",
    reason:
      "The stronger version identifies the intended change, people, place, and core activities. It is specific enough to evaluate a proposed program while leaving room to improve how the work is delivered.",
  },
  framework: [
    {
      title: "Name the change",
      instruction:
        "Describe the condition that should be different because the organization exists.",
      prompt:
        "What meaningful change should participants or the public experience?",
    },
    {
      title: "Define who and where",
      instruction:
        "Identify the people, community, field, or public interest at the center of the work. Add geography when it changes the strategy.",
      prompt: "For whom, and in what context, is this change intended?",
    },
    {
      title: "State the contribution",
      instruction:
        "Name the small set of activities or capabilities that make the organization’s role distinct.",
      prompt:
        "What will this organization repeatedly do to contribute to the change?",
    },
    {
      title: "Test the boundaries",
      instruction:
        "Use real decisions to see whether the statement distinguishes aligned work from attractive distractions.",
      prompt: "What would this mission make us decline, refer, or redesign?",
    },
    {
      title: "Validate and adopt",
      instruction:
        "Ask intended participants, partners, staff, and the board what the statement promises and whether the activities match that promise.",
      prompt:
        "Do the people closest to the work recognize the need and contribution?",
    },
  ],
  checklist: [
    "Names a public benefit or meaningful change.",
    "Identifies the primary people, community, or field served.",
    "States the organization’s core contribution in concrete language.",
    "Can be understood without insider terminology.",
    "Is broad enough to survive a program change but specific enough to guide a budget decision.",
    "Matches planned activities, governance documents, and public communications.",
    "Has been tested with people affected by the work and formally adopted by the board.",
  ],
  mistakes: [
    {
      mistake: "Naming only a value, such as empowerment or equity.",
      correction:
        "Keep the value, then add who should experience what change and how the organization contributes.",
    },
    {
      mistake: "Listing every current program.",
      correction:
        "Describe the durable contribution the programs share. Programs are methods and may change as evidence improves.",
    },
    {
      mistake: "Copying grant language into the mission.",
      correction:
        "Use funding to advance an adopted mission. Do not rewrite organizational purpose around one opportunity.",
    },
    {
      mistake: "Treating the public mission statement as legal advice.",
      correction:
        "Coordinate it with organizing documents and exemption materials, then obtain qualified state-specific counsel when needed.",
    },
  ],
  measuresIntroduction:
    "A mission is useful when it changes choices and connects work to evidence. Start with a small review set.",
  measures: [
    "Mission-fit decisions: the share of proposed programs, grants, and partnerships approved, revised, referred, or declined after review.",
    "Activity alignment: the share of spending and staff time connected to mission-serving activities or necessary support functions.",
    "Reach and access: who participates, who does not, and whether the intended community can use the service.",
    "Outcome evidence: near-term changes that reasonably connect to the organization’s activities, paired with participant feedback.",
    "Understanding: whether board, staff, participants, and partners describe the organization’s role consistently.",
  ],
  sources: [
    {
      title: "Instructions for Form 1023",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/instructions/i1023",
      note: "Exempt-purpose, organizing-document, and activity-description requirements.",
    },
    {
      title: "Publication 557: Tax-Exempt Status for Your Organization",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/publications/p557",
      note: "Federal exemption rules, organizational tests, and operating requirements.",
    },
    {
      title: "Frequently asked questions about Form 1023",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/frequently-asked-questions-about-form-1023",
      note: "Questions used to connect activities, beneficiaries, funding, and exempt purposes.",
    },
  ],
  disclaimer:
    "Educational guidance only. Confirm current federal and state requirements with the responsible agency or a qualified professional.",
  next: {
    title: "Compliance",
    href: "/documentation/best-practices/compliance",
  },
}
