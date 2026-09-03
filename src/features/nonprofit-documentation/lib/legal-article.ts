import type { BestPracticeArticle } from "../types"

export const LEGAL_ARTICLE: BestPracticeArticle = {
  slug: "tools/legal",
  navigationTitle: "Legal",
  title: "Turn a nonprofit legal question into a responsible next step",
  description:
    "A U.S.-wide guide to spotting nonprofit legal matters, protecting people and records, mapping authority and jurisdiction, and preparing a useful referral to qualified counsel.",
  eyebrow: "Nonprofit legal guide",
  answer:
    "A nonprofit legal process should help the right people act on the right facts at the right time. Define the decision, protect people and evidence, separate facts from assumptions, identify every relevant jurisdiction and governing document, review authority and conflicts, then bring a focused question to qualified counsel before a consequential action.",
  readingTime: "22 minute read",
  reviewedDate: "September 3, 2026",
  publishedDate: "2026-09-03",
  modifiedDate: "2026-09-03",
  labels: {
    definition: "What nonprofit legal operations include",
    stages: "Stage-specific legal practices",
    example: "Worked referral example",
    framework: "A seven-part legal matter system",
    checklist: "Legal matter checklist",
    mistakes: "Common legal-process mistakes",
    measures: "Useful legal-operations measures",
  },
  definition:
    "Nonprofit legal operations are the repeatable practices used to recognize a matter, protect people and records, collect reliable facts, identify authority and conflicts, map applicable documents and jurisdictions, obtain qualified advice, make an authorized decision, and follow through. Matters can involve formation, governance, tax exemption, fundraising, people, contracts, programs, licensing, safety, accessibility, civil rights, privacy, cybersecurity, intellectual property, property, insurance, disputes, investigations, transactions, or charitable assets. Legal operations organize the work; they do not replace a licensed attorney’s judgment.",
  whyItMatters: [
    "Nonprofit status does not create one uniform body of law. Legal form, tax classification, activities, funding, people, property, data, contracts, and location can bring different federal, state, Tribal, territorial, and local requirements into the same decision.",
    "The legal question often begins before a dispute. A new program, employee, fundraiser, facility, data flow, vendor, partnership, public statement, grant, or state can change obligations and risk.",
    "Governing documents and recorded delegations matter. A good idea, verbal approval, or staff title may not provide authority to sign, spend, share information, change a program, settle a claim, or bind the organization.",
    "Conflicts do not disappear when everyone trusts each other. Related-party benefits, family or business relationships, competing duties, and personal interests require timely disclosure and an authorized process.",
    "Early preservation protects reliable decision-making. Messages, agreements, policies, minutes, logs, financial records, physical evidence, and first-hand accounts can become harder to recover or interpret after routine deletion, editing, forwarding, or retelling.",
    "Access and safety are part of the matter, not an afterthought. A response can affect participants, workers, volunteers, reporters, witnesses, people with disabilities, language access, privacy, retaliation risk, and continued service.",
    "A concise referral brief reduces time spent reconstructing context and helps counsel identify missing facts, urgent steps, relevant expertise, likely sources, options, and who has authority to decide.",
  ],
  importantNote:
    "If someone may be in immediate danger, a child or vulnerable person may need protection, systems or sensitive data are actively compromised, evidence may be lost, a government notice or court paper was received, or a stated deadline is near, do not rely on this page. Use the organization’s emergency, safeguarding, incident-response, insurer, regulator, and qualified legal channels as appropriate. Do not assume this tool creates confidentiality or attorney-client privilege, and do not place sensitive facts or attorney communications into it.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "What should be reviewed before we create something new?",
      guidance:
        "Start with the proposed activity and people affected, not incorporation paperwork. Test whether an existing nonprofit, fiscal sponsor, partner, or limited pilot can responsibly carry the work. Identify likely locations, funding, data, property, people, professional services, and regulated activities before making public claims or commitments.",
      actions: [
        "Describe the mission need, proposed activity, intended beneficiaries, decision, alternatives, limits, and facts still being tested.",
        "List where services, fundraising, work, data collection, contracts, and property would occur, including remote and online activity.",
        "Identify licenses, credentials, safeguarding, accessibility, privacy, insurance, funding, and professional-boundary questions that need qualified review.",
        "Document who may authorize the next test and what cannot proceed until a sponsor, board, agency, insurer, or attorney reviews it.",
      ],
      checkpoint:
        "The team can explain the proposed work, people and places affected, alternatives considered, authority for the next step, material unknowns, and the qualified reviews needed before forming or committing.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Do our legal form, governance, and records match the work?",
      guidance:
        "Connect entity formation under state law with the appropriate federal tax classification, governing documents, board composition, conflict process, delegations, banking and contract authority, fiscal year, registrations, initial policies, records, insurance, and planned activities. Filing an organizing document and receiving an IRS determination are different steps with different consequences.",
      actions: [
        "Retain approved organizing documents, bylaws or governing rules, EIN evidence, exemption application and determination records, state registrations, good-standing evidence, tax records, and board actions in named systems.",
        "Record board and officer authority, delegations, signature limits, recusals, minutes, fiscal sponsor responsibilities, and who can receive legal advice for the organization.",
        "Review planned fundraising, employment, contracting, facilities, programs, data, communications, intellectual property, and insurance in every relevant jurisdiction.",
        "Create an issue and renewal calendar with responsible owners, source links, retained evidence, review dates, and escalation paths rather than copying generic deadlines.",
      ],
      checkpoint:
        "A qualified reviewer can trace the organization’s legal form, exemption path, governing authority, conflicts, activities, locations, registrations, records, contracts, insurance, and unresolved questions to current sources and recorded decisions.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Can we identify, route, decide, and close matters reliably?",
      guidance:
        "Use one intake process for questions, notices, incidents, complaints, proposed agreements, related-party transactions, program changes, and government contact. Protect people and evidence first, then assign a matter owner, preserve the original material, record dates, map authority and conflicts, obtain the right advice, document the decision, and follow up.",
      actions: [
        "Provide clear internal paths for urgent safety, safeguarding, accessibility, discrimination, retaliation, privacy, cybersecurity, ethics, financial, and authority concerns, with alternatives when the usual contact is involved.",
        "Keep the matter brief separate from privileged advice, personnel or participant records, investigation files, medical information, identity documents, and credentials unless counsel directs otherwise.",
        "Review material contracts and changes for scope, authority, deliverables, payment, funding restrictions, privacy and security, intellectual property, accessibility, insurance, indemnity, termination, records, and dispute terms.",
        "Record advice received, options considered, authorized decision, recusals, communications, required filings or notices, responsible owner, completion evidence, and the next review date.",
      ],
      checkpoint:
        "The organization can show how a matter moved from intake through protection, facts, sources, authority, conflicts, referral, decision, communication, implementation, and closure without exposing unnecessary sensitive information.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "What changes when we add scale, states, systems, or partners?",
      guidance:
        "Growth multiplies legal interfaces. New states, facilities, workers, services, professional practices, fundraising channels, technology, data sharing, grants, vendors, chapters, affiliates, mergers, and joint work can change jurisdiction, registration, licensing, insurance, authority, records, and oversight. Add a formal change review before launch rather than after a problem appears.",
      actions: [
        "Maintain a current map of entities, exemptions, activities, services, people, property, fundraising, contracts, data flows, registrations, licenses, insurance, counsel, and governing jurisdictions.",
        "Set review gates for new locations, regulated services, material agreements, data uses, public funding, related parties, intellectual property, debt, property, structural transactions, and closure.",
        "Build counsel and specialist capacity by subject and jurisdiction, with engagement scope, conflict checks, approved fees, backups, secure communication, and response expectations.",
        "Review recurring matters and near misses for system changes while protecting reporters, participants, workers, confidential information, legal strategy, and fair process.",
      ],
      checkpoint:
        "Expansion decisions have current jurisdiction and activity maps, source documents, affected-person review, authority, conflicts, risk and insurance review, qualified counsel, explicit decision gates, and responsible implementation evidence.",
    },
  ],
  example: {
    name: "Willow Street Family Resource Network",
    context:
      "This fictional operating nonprofit is considering a below-market storefront lease offered by a company owned by its board chair. The space would host benefits-navigation appointments and evening workshops. Staff hope to sign within ten days. The draft agreement is one page and says little about repairs, accessibility, insurance, data, signage, early termination, or responsibility for improvements.",
    weakLabel: "Weak legal request",
    weak: "Our board chair found us a cheap space and everyone agrees it is a great deal. Can you make the lease legal today? We need to sign Friday so we can announce the new center.",
    strongLabel: "Stronger matter and referral brief",
    strong:
      "Decision: whether the organization should lease and operate the proposed storefront, and on what reviewed terms. Known facts: the owner is the board chair’s company; the proposed term, rent, address, intended hours, services, and ten-day request are documented. Unknowns: market comparison, title and authority, permitted use, occupancy and program requirements, accessibility and effective communication, repairs and improvements, utilities, insurance, indemnity, security, participant privacy, signage, funding restrictions, termination, and local approvals. People affected: participants, staff, volunteers, neighboring tenants, the board chair, and the organization. Process: preserve the original proposal and communications; pause announcement and signature; disclose the relationship; identify the disinterested decision-makers and governing documents; request facility, insurance, tax, accessibility, program, and local-law review; send qualified counsel the draft, facts, unknowns, dates, authority records, conflict information, funding terms, and desired options; then record the authorized decision, recusal, conditions, communications, owners, and follow-up.",
    reason:
      "The stronger brief does not call the deal good, bad, legal, or illegal. It makes the decision, relationship, facts, unknowns, people, timing, source documents, authority, conflicts, review needs, and next actions visible. Counsel must still determine what applies and how to proceed.",
  },
  framework: [
    {
      title: "1. Define the decision and desired outcome",
      instruction:
        "State the precise question, the action being considered, who raised it, who would decide, and what responsible outcome is sought. Separate the matter from adjacent questions and avoid embedding a preferred conclusion in the request.",
      prompt:
        "What decision or response is actually needed, by whom, and what must remain undecided until qualified review?",
    },
    {
      title: "2. Protect people, rights, access, and operations",
      instruction:
        "Identify immediate danger, safeguarding, health, retaliation, discrimination, accessibility, cybersecurity, property, service-continuity, insurer, regulator, and emergency questions. Use established qualified channels promptly; do not wait for the brief to be complete.",
      prompt:
        "What could worsen while we gather information, and who is authorized and qualified to stabilize it now?",
    },
    {
      title: "3. Separate facts and preserve evidence",
      instruction:
        "Record first-hand facts, attributed statements, source documents, dates, and unknowns without rewriting uncertain details as truth. Protect original records and ask counsel what preservation is required before routine deletion or alteration continues.",
      prompt:
        "What do we know, how do we know it, what is only alleged or assumed, and what original material could be lost?",
    },
    {
      title: "4. Map people, authority, and conflicts",
      instruction:
        "Identify affected people, decision-makers, delegated authority, board or sponsor roles, counterparties, reporters, witnesses, related parties, competing duties, personal interests, recusals, and alternate reporting paths.",
      prompt:
        "Who is affected, who may speak or act for the organization, and whose interest or role requires disclosure or separation?",
    },
    {
      title: "5. Map sources, locations, dates, and obligations",
      instruction:
        "Inventory organizing documents, bylaws, policies, resolutions, contracts, grants, licenses, insurance, agency material, and current law for every place where people, services, work, solicitation, property, or data are located. Record received dates and stated deadlines exactly.",
      prompt:
        "Which documents and jurisdictions may govern, what dates are stated, and which current primary sources need verification?",
    },
    {
      title: "6. Refer the matter to the right expertise",
      instruction:
        "Select a licensed attorney for the relevant jurisdiction and subject, confirm engagement scope and conflicts, authorize fees, use an approved secure channel, and provide a focused brief. Add tax, accounting, HR, insurance, accessibility, safety, privacy, security, or program specialists where needed.",
      prompt:
        "What expertise is required, who represents the organization, what should be shared, and which questions must counsel answer?",
    },
    {
      title: "7. Decide, document, implement, and revisit",
      instruction:
        "Keep advice distinct from the board or staff decision. Record authority, recusals, options, conditions, notices, owners, completion evidence, and follow-up while preserving confidentiality and access boundaries directed by counsel.",
      prompt:
        "What was advised, what was authorized, what happens next, what evidence closes the loop, and what change reopens review?",
    },
  ],
  checklist: [
    "The brief states one decision or response question, the desired responsible outcome, the person who raised it, the matter owner, and what is outside scope.",
    "Immediate safety, safeguarding, retaliation, accessibility, cybersecurity, property, service-continuity, insurer, regulator, and emergency questions have qualified owners and prompt routing where applicable.",
    "Known first-hand facts, attributed statements, allegations, assumptions, unknowns, and legal questions remain visibly separate.",
    "Original documents, messages, records, logs, physical evidence, dates, custodians, storage, access, routine deletion, and preservation instructions are documented without alteration or broad redistribution.",
    "Affected participants, workers, volunteers, reporters, witnesses, counterparties, community members, and decision-makers are identified with language, disability, privacy, safety, and retaliation considerations.",
    "Federal, state, Tribal, territorial, local, online, remote-work, service, solicitation, property, and data locations are mapped rather than reduced to the organization’s mailing address.",
    "Received dates, stated response dates, renewal dates, meetings, launches, payments, filings, and other timing facts are copied exactly; no unstated deadline is invented.",
    "Organizing documents, bylaws, policies, resolutions, minutes, delegations, contracts, grants, donor restrictions, licenses, permits, insurance, filings, and agency sources are collected in current versions.",
    "Signing, spending, communication, investigation, settlement, filing, data-sharing, program, and board authority are confirmed; actual or potential conflicts are disclosed and handled through the governing process.",
    "The counsel referral identifies the relevant jurisdiction and subject, engagement scope, conflicts check, approved fee path, secure channel, documents, timeline, desired output, and precise questions.",
    "The matter brief excludes unnecessary personal, health, identity, participant, worker, donor, reporter, witness, credential, investigation, and attorney-communication details.",
    "Advice, authorized decision, recusals, rationale, conditions, communications, filings or notices, implementation owners, completion evidence, review date, and closure criteria are recorded in the correct systems.",
  ],
  mistakes: [
    {
      mistake:
        "Asking counsel to make a document legal without stating the decision or facts.",
      correction:
        "Provide the decision, known facts, unknowns, people, jurisdictions, dates, governing documents, authority, conflicts, desired options, and precise questions.",
    },
    {
      mistake:
        "Waiting for a complete intake before addressing immediate harm.",
      correction:
        "Use emergency, safeguarding, incident-response, insurer, regulator, and qualified legal channels promptly while preserving only the minimum necessary working record.",
    },
    {
      mistake: "Treating memory, consensus, or a summary as the source record.",
      correction:
        "Preserve originals, attribute statements, record dates and custodians, and keep facts, allegations, assumptions, and legal conclusions distinct.",
    },
    {
      mistake:
        "Assuming an executive, founder, chair, or funder can authorize any action.",
      correction:
        "Check state law, governing documents, resolutions, delegations, contract terms, grant conditions, conflicts, recusals, and required approvals.",
    },
    {
      mistake: "Using a template from another nonprofit as the final answer.",
      correction:
        "Use templates only to identify questions; adapt through current source, fact, jurisdiction, authority, accessibility, insurance, and qualified legal review.",
    },
    {
      mistake: "Sharing every detail with every reviewer.",
      correction:
        "Use minimum necessary information, role-based access, approved channels, separate sensitive records, and counsel-directed confidentiality and privilege practices.",
    },
    {
      mistake:
        "Assuming federal tax exemption resolves state and local obligations.",
      correction:
        "Review formation, registration, solicitation, employment, tax, licensing, property, privacy, accessibility, and program requirements in every relevant jurisdiction.",
    },
    {
      mistake: "Closing the matter when advice is received.",
      correction:
        "Record the authorized decision, conditions, communications, filings, owners, completion evidence, follow-up, renewed-review triggers, and responsible closure.",
    },
  ],
  measuresIntroduction:
    "Measure whether the organization can route and resolve matters reliably, not whether it can produce a high count of legal reviews. Process measures can show access, timeliness, source quality, follow-through, and recurring system gaps; they cannot establish compliance, privilege, accuracy, fairness, safety, risk, liability, or legal success.",
  measures: [
    "Intake access: people know how to raise routine and urgent matters, have an alternative when the usual contact is involved, and can use the path across relevant language, disability, privacy, and technology needs.",
    "Protection response: urgent safety, safeguarding, retaliation, cybersecurity, evidence, insurer, regulator, and service-continuity questions reach named qualified owners without waiting for a complete brief.",
    "Fact quality: briefs distinguish first-hand facts, attributed statements, source documents, allegations, assumptions, unknowns, and legal questions, with corrections retained where appropriate.",
    "Source coverage: each matter identifies current governing documents, contracts, grants, licenses, insurance, agency sources, and every relevant jurisdiction, with review dates and limitations.",
    "Referral quality: counsel receives a bounded question, relevant facts, dates, authority, conflicts, documents, desired options, response need, secure contact, and authorized fee scope.",
    "Decision follow-through: authorized decisions, recusals, conditions, notices, filings, communications, owners, completion evidence, review dates, and closure criteria are recorded and completed.",
    "System learning: recurring questions, near misses, preventable delays, inaccessible paths, unclear delegations, weak contracts, missing records, and concentrated knowledge lead to reviewed operating changes.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal learning sequence behind this guide: organizational documents, governance, board authority, conflicts, operating systems, finance, program design, risk, growth, and review.",
    },
    {
      title: "Life Cycle of an Exempt Organization",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/life-cycle-of-an-exempt-organization",
      note: "Federal overview of starting, exemption, required filings, ongoing compliance, and significant events across exempt-organization types.",
    },
    {
      title: "Exempt Organizations: Organizing Documents",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/exempt-organizations-organizing-documents",
      note: "Federal explanation of organizing-document requirements and the separate role of state law in entity creation.",
    },
    {
      title: "Instructions for Form 990",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/instructions/i990",
      note: "Current Form 990 instructions describing governing bodies, delegations, conflicts, whistleblower practices, document retention, and related governance reporting.",
    },
    {
      title: "Recordkeeping Requirements for Exempt Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/eo-operational-requirements-recordkeeping-requirements-for-exempt-organizations",
      note: "Federal guidance on retaining books and records that support activities, receipts, expenditures, returns, and tax compliance.",
    },
    {
      title: "State Links for Tax-Exempt Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/state-links",
      note: "Federal directory to state government information on charity registration, taxation, employer responsibilities, and related requirements.",
    },
    {
      title: "State Charity Regulators",
      publisher: "National Association of State Charity Officials",
      url: "https://www.nasconet.org/",
      note: "State-regulator directory and reminder that formation, registration, filing, and solicitation rules differ by state.",
    },
    {
      title: "ADA Requirements: Effective Communication",
      publisher: "U.S. Department of Justice",
      url: "https://www.ada.gov/resources/effective-communication/",
      note: "Federal guidance on communication access for covered state and local entities and nonprofits serving the public.",
    },
    {
      title: "Data Breach Response: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/data-breach-response-guide-business",
      note: "Federal response guidance covering system protection, evidence, multidisciplinary response, counsel, law enforcement, affected parties, and communications.",
    },
    {
      title: "Copyright Basics",
      publisher: "U.S. Copyright Office",
      url: "https://www.copyright.gov/circs/",
      note: "Authoritative public circulars on copyrightable works, ownership, registration, notices, transfers, and common distinctions.",
    },
    {
      title: "Trademark Basics",
      publisher: "United States Patent and Trademark Office",
      url: "https://www.uspto.gov/trademarks/basics",
      note: "Official guidance on identifying, searching, applying for, maintaining, and understanding the scope of trademarks.",
    },
    {
      title: "2 CFR § 200.303: Internal Controls",
      publisher: "Electronic Code of Federal Regulations",
      url: "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/section-200.303",
      note: "Current federal-award requirements on controls, compliance, evaluation, corrective action, safeguarding protected information, and cybersecurity practices.",
    },
    {
      title: "Bar Directories and Lawyer Finders",
      publisher: "American Bar Association",
      url: "https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/",
      note: "A nationwide starting point for state bar directories and lawyer-finding resources; users must still evaluate licensing, jurisdiction, subject expertise, conflicts, scope, and fees.",
    },
    {
      title: "Good Governance Policies for Nonprofits",
      publisher: "National Council of Nonprofits",
      url: "https://www.councilofnonprofits.org/running-nonprofit/governance-leadership/good-governance-policies-nonprofits",
      note: "Sector guidance connecting conflicts, whistleblower protection, document retention, gifts, joint ventures, disclosure, and board practice, with an explicit professional-advice limitation.",
    },
  ],
  disclaimer:
    "This educational guide and planning tool do not provide legal advice, create an attorney-client relationship, establish privilege or confidentiality, perform a conflicts check, engage or recommend counsel, or create a contract, policy, resolution, filing, notice, report, legal hold, investigation record, waiver, admission, or legal opinion. They do not identify every issue; determine rights, duties, authority, conflicts, fiduciary obligations, legal status, tax exemption, private benefit, lobbying or political limits, registration, licensing, employment status, accessibility, discrimination, retaliation, safeguarding, mandatory reporting, privacy, cybersecurity, intellectual-property ownership, insurance coverage, liability, breach, damages, jurisdiction, venue, applicable law, deadline, preservation scope, disclosure, admissibility, merits, outcome, or compliance; direct an emergency or investigation; or replace affected-person participation and qualified legal, tax, governance, HR, accessibility, safety, safeguarding, insurance, privacy, security, accounting, program, regulator, fiscal-sponsor, or board review. Requirements and options vary by organization, legal form, exemption, activity, people, funding, property, data, agreement, event, jurisdiction, and time. Verify current primary sources and obtain advice from a licensed attorney qualified for the relevant jurisdiction and subject before consequential action.",
  previous: { title: "Finance", href: "/documentation/tools/finance" },
  next: { title: "Campaigns", href: "/documentation/tools/campaigns" },
}
