import type { BestPracticeArticle } from "../types"

export const PARTNERSHIPS_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/partnerships",
  navigationTitle: "Partnerships",
  title: "Build nonprofit partnerships around shared public value",
  description:
    "A practical U.S. nonprofit guide to partner fit, mutual value, community power, roles, resources, decision rights, safeguards, learning, and a free interactive partnership brief builder.",
  eyebrow: "Best practices · Partnerships",
  answer:
    "A nonprofit partnership is a bounded relationship in which two or more parties contribute distinct value toward a shared public purpose. Start with the people and problem, not the organizations' brands. Confirm mutual value, contributions, authority, full cost, data boundaries, accessibility, conflicts, evidence, review timing, and a responsible exit. Put material terms in writing and verify them with the partner and authorized reviewers before anyone represents the relationship as committed.",
  readingTime: "17 min read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "Partnership, collaboration, coalition, and alliance",
    stages: "Stage-specific partnership guidance",
    example: "Worked example · A legal-navigation pathway",
    framework: "A seven-decision partnership framework",
    checklist: "Before you commit",
    mistakes: "Common partnership failures",
    measures: "What to review together",
  },
  definition:
    "Partnership is an umbrella term, not one legal form. It may describe an informal referral relationship, a coalition, co-delivery, shared services, a campaign, a fiscal relationship, a contract, a commercial co-venture, a joint venture, an affiliation, or a merger. The name does not determine the parties' duties. The actual activities, authority, money, data, assets, representations, and governing documents matter. Use the lightest structure that can responsibly support the work, then obtain qualified review when the arrangement affects charitable assets, tax status, regulated activity, employment, professional services, fundraising, personal data, intellectual property, insurance, governance, or control.",
  whyItMatters: [
    "Complex community conditions exceed any one organization's knowledge, trust, reach, authority, and resources. Thoughtful partnerships can coordinate access, combine complementary capabilities, reduce duplication, strengthen learning, and preserve valued services.",
    "A shared goal does not erase differences in power, risk, capacity, funding, professional duties, or community accountability. Hidden labor, vague handoffs, symbolic participation, and unclear authority can shift cost or harm toward the smallest organization or the people the work is meant to serve.",
    "A clear operating agreement helps people act: each party knows what it contributes, what it controls, what it may not promise, how concerns move, what evidence is useful, when the arrangement is reviewed, and how participants and commitments are protected if the relationship changes or ends.",
  ],
  importantNote:
    "Do not use a memorandum of understanding as proof that trust, consent, authority, capacity, accessibility, privacy, or legal compliance exists. A document should record a real process of listening, due diligence, negotiation, approval, delivery, learning, and revision. Some arrangements require contracts, filings, licenses, board action, professional review, or terms beyond a planning brief. Requirements vary by activity and state.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Is joint work useful, and who should shape it?",
      guidance:
        "Map the people affected, existing providers, informal leaders, public agencies, funders, and organizations already working on the issue. Listen for a shared problem and complementary contribution before choosing a partner or structure. Test a small, reversible act such as a coordinated referral, listening session, shared resource list, or one-time event.",
      actions: [
        "Ask affected people what a useful relationship would change, what could make access harder, and how they want to participate in decisions and learning.",
        "Document each potential partner's mission, role, credibility, current capacity, incentives, constraints, conflicts, geography, access practices, and existing relationships.",
        "Define the smallest public benefit that requires collaboration and what each party can contribute without building unsupported permanent cost.",
        "Set a short test, named leads, a feedback route, a stop condition, and a date to decide whether a deeper relationship is warranted.",
      ],
      checkpoint:
        "You can explain why joint work is useful, whose voice shaped the premise, what the smallest test is, what remains unverified, and what would cause you to stop.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "What must be agreed before anyone commits?",
      guidance:
        "Move from enthusiasm to mutual due diligence and explicit terms. Confirm authority, contributions, full costs, restrictions, activities, handoffs, records, data, brand use, intellectual property, accessibility, insurance, professional duties, conflicts, communications, evidence, dispute handling, approval, and exit. Match the written form and professional review to the actual risk and structure.",
      actions: [
        "Draft the shared purpose and community role with the partner; separate confirmed statements from proposals and open questions.",
        "Build one joint work plan and full-cost budget showing paid and in-kind contributions, dependencies, payment timing, restrictions, ownership, and excluded commitments.",
        "Name operational leads, backup contacts, decision rights, reserved board authority, escalation paths, recordkeeping, review cadence, and who may speak publicly for the relationship.",
        "Complete proportionate conflict, legal, tax, finance, privacy, security, insurance, accessibility, employment, fundraising, intellectual-property, and governing-body review before launch.",
      ],
      checkpoint:
        "Both parties and authorized reviewers can distinguish purpose, contributions, authority, safeguards, open questions, approved terms, evidence, review dates, and the renewal or closeout path.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Are the relationship and the work functioning as agreed?",
      guidance:
        "Run the operating rhythm, not just the activities. Confirm partner capacity and handoffs, keep required records, surface exceptions quickly, and review participant experience, access, workload, cost, evidence, and unintended effects together. Make changes through the agreed authority instead of letting work drift through informal promises.",
      actions: [
        "Track commitments, handoffs, wait time, unresolved exceptions, workload, cash and in-kind cost, data access, complaints, and accessibility needs at a cadence proportionate to the work.",
        "Invite affected people to interpret what is working, missing, burdensome, unsafe, or inequitable and document how partners respond.",
        "Use the conflict and escalation path early; protect people who raise concerns and separate operational disagreement from safety, legal, ethical, or governance issues.",
        "At each review, record a maintain, revise, pause, transfer, expand, or end decision with the evidence, limitations, authority, owner, communication, and next date.",
      ],
      checkpoint:
        "Current evidence shows what each party delivered, what participants experienced, where the agreement did not fit reality, what changed through authorized review, and what happens next.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "What must change before the relationship expands?",
      guidance:
        "Expansion changes the partnership. New people, places, volume, funding, vendors, data, staff, and public claims can shift power, cost, quality, risk, and community ownership. Revalidate the shared purpose, local context, capacity, authority, safeguards, evidence, and exit obligations before scaling or choosing a deeper alliance, shared service, affiliation, or merger.",
      actions: [
        "Compare sites or cohorts rather than assuming the original model, relationship, consent, access plan, capacity, or result transfers unchanged.",
        "Model full cost, cash timing, funding restrictions, staff and partner capacity, supervision, systems, insurance, data, and transition obligations under constrained and expansion scenarios.",
        "Revisit governance, control, conflicts, brand, intellectual property, charitable assets, public representations, professional duties, and which decisions require board or external approval.",
        "Fund relationship infrastructure, community participation, evaluation, accessibility, adaptation, and responsible closeout rather than budgeting only for visible delivery.",
      ],
      checkpoint:
        "The expansion decision is based on current local evidence, mutual capacity, community participation, revised written terms, full-cost scenarios, authorized approvals, safeguards, and a credible pause or exit path.",
    },
  ],
  example: {
    name: "Willow Street Family Resource Network",
    context:
      "This fictional neighborhood nonprofit provides bilingual benefits navigation but cannot give legal advice. Residents report housing and benefits issues that sometimes need qualified legal help. A county legal-aid organization is interested in workshops and a clearer referral path, but its case capacity varies.",
    weakLabel: "Weak partnership statement",
    weak: "Partner with legal aid to connect residents to services, share information, and expand impact. Both organizations will promote the program and collaborate as needed.",
    strongLabel: "Stronger working brief",
    strong:
      "For 12 months, Willow Street and Harbor County Legal Aid will test a bilingual navigation and legal-referral pathway. Willow Street provides trusted outreach, accessible space, scheduling, and non-legal navigation. Legal Aid confirms eligibility, conflict-screening, capacity, attorney-approved information, and qualified legal services. A paid resident advisory group reviews access, consent language, and quarterly findings. Each party controls its own staff, professional judgments, and records. No personal case information crosses organizations without a documented purpose, minimum fields, appropriate authority or consent, secure method, and reviewed retention terms. Leads review capacity monthly and both organizations decide at month ten whether to renew, revise, transfer, or close the pathway responsibly.",
    reason:
      "The stronger version remains a proposal, but it makes the public benefit, community role, mutual contributions, professional boundary, data limit, authority, review cadence, and exit visible. It gives both organizations and affected people specific statements to confirm, challenge, cost, approve, and test.",
  },
  framework: [
    {
      title: "1. Define the shared public purpose",
      instruction:
        "Name the people, condition, place, and bounded benefit that joint work can create. Confirm that the collaboration advances each nonprofit's mission and does not exist mainly for funding, visibility, organizational convenience, or a private party's benefit.",
      prompt:
        "What changes for whom, why does that require these parties, and what is outside the partnership?",
    },
    {
      title: "2. Design community role and power",
      instruction:
        "Invite people affected by the work to shape purpose, access, activities, evidence, interpretation, concern routes, and material changes. Plan accessibility, language access, consent, compensation where appropriate, and protection from retaliation or loss of service.",
      prompt:
        "Who is affected, what can they influence or decide, how can they participate, and how will partners respond?",
    },
    {
      title: "3. Make mutual value and limits explicit",
      instruction:
        "List each party's distinct contribution, full cost, dependency, incentive, risk, and exclusion. Separate what has been offered from what is assumed. Mutual does not mean equal inputs; it means the exchange is understood, mission-aligned, and not exploitative.",
      prompt:
        "What does each party contribute, receive, protect, depend on, and explicitly decline?",
    },
    {
      title: "4. Specify work, handoffs, resources, and records",
      instruction:
        "Translate intent into activities, responsible roles, service boundaries, schedule, handoffs, budget, payment, restrictions, assets, insurance, records, intellectual property, brand use, and change control. Include invisible coordination and access work in the cost.",
      prompt:
        "Who does what, for whom, when, with which resources, where does responsibility transfer, and what evidence is kept?",
    },
    {
      title: "5. Establish decision rights and communication",
      instruction:
        "Name who recommends, decides, approves, must be consulted, and must be informed. Distinguish routine operating decisions from scope, money, data, safety, personnel, brand, public statement, legal, and board-reserved decisions. Add backups and an escalation path.",
      prompt:
        "Who has actual authority for each material choice, how is a decision recorded, and what happens when people disagree?",
    },
    {
      title: "6. Review safeguards before commitment",
      instruction:
        "Match review to the actual arrangement. Consider conflicts and private benefit, charitable purpose, governing approval, tax and state requirements, professional duties, fundraising, employment, insurance, accessibility, safety, privacy, data security, consent, intellectual property, and records.",
      prompt:
        "What could harm people, assets, rights, trust, exempt purpose, or either organization, and who is qualified and authorized to review it?",
    },
    {
      title: "7. Learn, adapt, renew, or close",
      instruction:
        "Set a bounded term, review dates, useful measures, community interpretation, amendment process, and decision options. Define notice, open commitments, funds, assets, records, public claims, participant transitions, and lessons before the partnership ends or changes.",
      prompt:
        "What will partners review, when will they decide, who may change the terms, and how will people and obligations be protected at exit?",
    },
  ],
  checklist: [
    "The shared public purpose, intended participants, geography, scope, exclusions, and relationship model are written plainly.",
    "Affected people helped shape the work, with appropriate access, language, consent, compensation, interpretation, feedback, and concern routes.",
    "Each party's mission fit, credibility, authority, current capacity, incentives, constraints, conflicts, dependencies, and representations were verified proportionately.",
    "Each contribution and limitation is specific, including staff time, money, in-kind value, space, systems, relationships, brand, intellectual property, and hidden coordination work.",
    "Activities, service boundaries, handoffs, professional responsibilities, eligibility, schedule, owners, backups, and response times are clear.",
    "The full-cost budget covers coordination, administration, supervision, accessibility, evaluation, technology, insurance, adaptation, and closeout as well as delivery.",
    "Payment, reimbursement, funding restrictions, ownership, asset use, intellectual property, insurance, liability, and procurement or contracting needs are reviewed.",
    "Decision rights distinguish operating authority, joint decisions, reserved board authority, consultation, information, public statements, changes, and emergencies.",
    "Data purpose, minimum fields, authority or consent, access, transfer, security, retention, deletion, incident response, records ownership, and prohibited uses are documented.",
    "Conflicts, related-party interests, private benefit, charitable purpose, recusals, and required legal, tax, state, or governing-body review are addressed.",
    "Communication, documentation, partner-capacity updates, participant feedback, conflict handling, escalation, anti-retaliation, and review cadence are usable in practice.",
    "Measures examine commitments, access, experience, workload, cost, quality, coordination, evidence, limitations, unintended effects, and decisions without overstating attribution.",
    "The agreement identifies term, amendment, renewal, pause, transfer, termination, notice, open commitments, funds, assets, records, public claims, participant transition, and lessons.",
  ],
  mistakes: [
    {
      mistake: "Starting with a logo announcement or funding opportunity.",
      correction:
        "Start with a community-defined problem and bounded public benefit, then identify whether these parties and this structure are useful.",
    },
    {
      mistake: "Treating goodwill or a familiar relationship as due diligence.",
      correction:
        "Verify mission fit, authority, capacity, conflicts, financial and legal conditions, professional duties, safeguards, and the actual proposed terms.",
    },
    {
      mistake:
        "Calling participation equitable because community members attended.",
      correction:
        "State what affected people can influence or decide, remove access barriers, compensate contributions where appropriate, protect concern routes, and document responses.",
    },
    {
      mistake: "Listing joint activities without naming responsibility.",
      correction:
        "Assign owners, handoffs, service boundaries, backups, decision rights, evidence, timelines, costs, and escalation for every material commitment.",
    },
    {
      mistake:
        "Sharing participant information because both parties serve the same people.",
      correction:
        "Define purpose and minimum data first; confirm authority or consent, access, security, retention, deletion, incident response, and professional or legal restrictions before sharing.",
    },
    {
      mistake:
        "Ignoring coordination cost and relying on hidden staff or volunteer labor.",
      correction:
        "Budget the full relationship infrastructure, test workload against supported capacity, and revise scope or resources when commitments exceed it.",
    },
    {
      mistake:
        "Using an MOU as a substitute for an appropriate agreement and approval.",
      correction:
        "Match the instrument, terms, governing action, filings, and qualified review to the real activities, money, data, assets, risk, and legal form.",
    },
    {
      mistake:
        "Letting a pilot continue indefinitely because ending feels relationally difficult.",
      correction:
        "Use bounded terms and decision dates; record whether to maintain, revise, expand, transfer, pause, or close and protect participants and obligations through the transition.",
    },
  ],
  measuresIntroduction:
    "Review whether the partnership improves public value and responsible coordination—not the number of partners, meetings, logos, signed documents, or activities alone. Choose measures with affected people and interpret them in context.",
  measures: [
    "Purpose and reach: intended people can access the joint pathway, and partners examine who is reached, excluded, delayed, referred elsewhere, or burdened.",
    "Community power: affected people participate in agreed decisions and interpretation, can raise concerns safely, and receive documented responses.",
    "Commitment reliability: contributions, activities, handoffs, response times, records, and capacity updates occur as agreed, with exceptions visible.",
    "Relationship quality: partners discuss clarity, trust, influence, conflict, communication, learning, workload, and whether the exchange remains mutually useful without compressing them into one score.",
    "Resource realism: actual staff time, in-kind value, direct and shared cost, cash timing, restrictions, and opportunity cost are compared with the plan.",
    "Safeguard use: access needs, conflicts, data and security questions, professional boundaries, complaints, incidents, and approvals are surfaced and acted on through the agreed process.",
    "Decision use: evidence and community interpretation lead to a documented maintain, revise, pause, transfer, expand, renew, or close decision with authority, owner, and follow-up.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal sequence behind this guide: stakeholder and relationship mapping, partner needs, collaboration opportunities, referral pathways, points of contact, unique value, shared success, capacity, assumptions, budgets, and coaching review.",
    },
    {
      title: "Evaluation Resources — Evaluating Partnerships",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://archive.cdc.gov/www_cdc_gov/sixeighteen/resources/assessment/resources/index.html",
      note: "CDC partnership-evaluation resources covering roles, results, partnership description, evaluation questions, evidence, interpretation, and use.",
    },
    {
      title: "Evaluation of Community Engagement Activities",
      publisher: "Agency for Toxic Substances and Disease Registry",
      url: "https://www.atsdr.cdc.gov/community-engagement-playbook/php/activities/evaluation-activities.html",
      note: "Federal guidance on evaluating how community and partner input was solicited, answered, learned from, and used.",
    },
    {
      title: "Creating and Maintaining Coalitions and Partnerships",
      publisher: "Community Tool Box, University of Kansas",
      url: "https://ctb.ku.edu/en/toolkits",
      note: "A practical community-development toolkit covering stakeholders, shared goals, coalition structure, action, communication, participation, resources, and maintenance.",
    },
    {
      title: "Governance and Related Topics — 501(c)(3) Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/pub/irs-tege/governance_practices.pdf",
      note: "IRS educational guidance on mission, conflicts, financial oversight, documentation, joint-venture policies, transparency, and accountability.",
    },
    {
      title: "Form 1023: Purpose of Conflict of Interest Policy",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/form-1023-purpose-of-conflict-of-interest-policy",
      note: "IRS explanation of actual or potential conflicts, disclosure, governing-body process, recusal, private benefit, and charitable purpose.",
    },
    {
      title: "ADA Requirements: Effective Communication",
      publisher: "U.S. Department of Justice",
      url: "https://www.ada.gov/resources/effective-communication/",
      note: "Federal guidance for covered nonprofits on equally effective communication and appropriate auxiliary aids and services for people with communication disabilities.",
    },
    {
      title: "Protecting Personal Information: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business",
      note: "Plain-language federal guidance to know what personal information is held, keep only what is needed, protect it, dispose of it securely, and plan for incidents.",
    },
    {
      title: "Rising Interest in Nonprofit Dissolutions and Mergers",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/articles/rising-interest-nonprofit-dissolutions-mergers",
      note: "Sector guidance on mission-centered partnerships, shared services, affiliations, mergers, relationships, infrastructure, and the cost of exploration and implementation.",
    },
    {
      title: "Commercial Co-Ventures and Cause-Related Marketing",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/administration-and-financial-management/commercial-co-ventures-and-cause-related",
      note: "U.S. nonprofit guidance on cause-related marketing, written agreements, accountability, state-law variation, and the need to review commercial arrangements before promotion.",
    },
  ],
  disclaimer:
    "This educational guide and planning brief do not recommend or verify a partner; score trust, equity, risk, or readiness; create a memorandum of understanding, contract, joint venture, fiscal relationship, data-sharing agreement, or other legal instrument; establish authority, consent, confidentiality, privilege, insurance, compliance, or tax treatment; or predict community or partnership results. Duties vary by activity, structure, profession, funding, data, people served, and state. Verify facts with the other party and affected people, preserve governing authority, and obtain qualified legal, tax, finance, privacy, security, insurance, accessibility, employment, intellectual-property, fundraising, program, and board review as appropriate before commitment or public representation.",
  previous: {
    title: "Sustainability",
    href: "/documentation/best-practices/sustainability",
  },
  next: {
    title: "Brand identity",
    href: "/documentation/tools/brand-identity",
  },
}
