import type { BestPracticeArticle } from "../types"

export const CRM_ARTICLE: BestPracticeArticle = {
  slug: "tools/crm",
  navigationTitle: "CRM",
  title: "Build a nonprofit CRM around responsible relationships",
  description:
    "A U.S.-wide, stage-specific guide and device-local field planner for nonprofit relationship records, preferences, access, data quality, retention, security, and vendor decisions.",
  eyebrow: "Tools · CRM",
  answer:
    "A useful nonprofit CRM is a governed relationship record, not a large contact list. Define the decisions it supports, collect only the fields those decisions need, preserve source and communication preferences, assign ownership and access, maintain accuracy, prepare for incidents, and remove or archive information through a reviewed process.",
  readingTime: "22 minute read",
  reviewedDate: "September 3, 2026",
  publishedDate: "2026-09-03",
  modifiedDate: "2026-09-03",
  labels: {
    definition: "What nonprofit CRM work includes",
    stages: "Build the CRM practice your stage needs",
    example: "Fictional worked CRM plan",
    framework: "A seven-part relationship-record lifecycle",
    checklist: "CRM data-stewardship checklist",
    mistakes: "Common nonprofit CRM mistakes",
    measures: "Evidence for CRM operating decisions",
  },
  definition:
    "CRM commonly means customer or constituent relationship management. For a nonprofit, it is the people, definitions, practices, records, and technology used to support appropriate relationships with donors, participants, volunteers, members, partners, advocates, event attendees, and other stakeholders. The operating work includes purpose, field definitions, source and provenance, notice and consent where applicable, communication preferences, identity and duplicate handling, relationship stages, access, correction, retention, integrations, security, incident response, accessibility, migration, reporting, and system exit. A spreadsheet can be a CRM; purchasing software does not create a responsible practice.",
  whyItMatters: [
    "Relationship records shape real interactions. A stale preference, unsupported assumption, duplicate record, missing source, or open commitment can lead to confusing, inaccessible, repetitive, or harmful contact.",
    "Nonprofits often hold information across donation tools, email, event forms, program systems, volunteer files, spreadsheets, phones, paper, and personal memory. A CRM plan must trace those flows instead of treating one application as the whole system.",
    "More data is not automatically more useful. Each additional field creates collection, explanation, access, correction, security, integration, retention, migration, and deletion work.",
    "Different relationships create different purposes and boundaries. Fundraising, program service, volunteering, employment, education, health, advocacy, membership, and partnership records should not be combined or reused merely because the software allows it.",
    "Communication preferences are operational data. An opt-out, pause, language choice, accessible-format request, or preferred channel must reach every relevant sending path and responsible person.",
    "Narrative notes can quietly become unverified profiles. Separate facts, sources, quotations, assumptions, and staff judgments; avoid unnecessary sensitive detail and provide a correction process.",
    "Vendors, consultants, integrations, exports, backups, automations, and former users can all retain access or copies. Contracts and settings matter only when owners also test the real data flow and system exit.",
    "CRM activity is not community impact. Records created, emails sent, meetings held, and follow-ups completed can describe operations; they do not establish relationship quality, consent, service results, donor intent, or mission outcomes.",
  ],
  importantNote:
    "Do not enter real names, contact details, donor or payment information, participant or case notes, health information, education records, demographic details, identity documents, credentials, protected reports, or other personal or sensitive information into the planner on this page or an external AI prompt. Privacy, communications, fundraising, records, breach-notification, health, education, employment, child-related, biometric, consumer, and other requirements vary by entity, activity, data, person, promise, contract, funding, sector, and jurisdiction. HIPAA and FERPA apply only in defined circumstances; do not assume either law applies—or does not apply—without qualified review.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "What is the smallest useful relationship record?",
      guidance:
        "Inventory where relationship information lives and choose one real decision that a shared record should improve. Define the minimum generic fields, one owner, and one review rhythm before selecting a platform. Test the workflow with fictional records so the team can change it without exposing people.",
      actions: [
        "List current record locations, responsible people, repeated work, missed commitments, conflicting preferences, and the decision the first shared view should improve.",
        "Draft a generic field dictionary with purpose, source, sensitivity, access, correction, and retention questions for every proposed field.",
        "Run the full workflow with fictional data: collect, update, suppress, deduplicate, export, restore, correct, close, and remove a record.",
      ],
      checkpoint:
        "Proceed when the team can explain one bounded use, the people affected, the minimum fields, excluded data, owner, access boundary, test evidence, and the next decision without naming a vendor.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can our first shared system be operated responsibly?",
      guidance:
        "Turn the pilot into an approved operating practice. Document sources, notice and permission, communication preferences, field definitions, role access, corrections, retention, integrations, backups, incidents, vendor terms, migration, training, and exit before importing scattered contacts.",
      actions: [
        "Approve field definitions and relationship stages with program, fundraising, community, accessibility, operations, legal, privacy, security, and records input as applicable.",
        "Quarantine unknown-source and conflicting records during migration; reconcile counts, duplicates, owners, communication suppressions, and rejected rows before use.",
        "Create individual accounts, minimum permissions, administrator backups, training, review cadence, incident routing, export controls, and offboarding steps.",
      ],
      checkpoint:
        "A reviewer can trace each active field and data flow to a purpose, source, notice or authority, owner, access role, correction path, retention review, safeguard, and tested migration or exit step.",
    },
    {
      id: "operating",
      label: "Operating",
      question:
        "Are the records current enough to support responsible follow-through?",
      guidance:
        "Treat CRM maintenance as relationship work. Review open commitments, overdue follow-ups, communication changes, bounces, duplicates, stale sources, correction requests, integration failures, access drift, exports, and retention actions on a reliable cadence. Pause questionable use instead of filling gaps with inference.",
      actions: [
        "Assign every active relationship and open commitment to a responsible role with a dated next action, review trigger, and respectful pause or close path.",
        "Reconcile communication preferences and suppressions across the CRM, email, events, fundraising, forms, and other connected systems before campaigns.",
        "Review data quality, access, integrations, backups, incidents, field use, deletion work, staff burden, and unresolved issues at the stated operating interval.",
      ],
      checkpoint:
        "The organization can show current ownership, preference propagation, corrections, duplicate decisions, access reviews, failed-flow handling, retention actions, incident readiness, and decisions made from appropriately limited records.",
    },
    {
      id: "growing",
      label: "Growing",
      question:
        "How do we scale without collapsing different purposes together?",
      guidance:
        "Growth adds teams, programs, geographies, campaigns, vendors, data sources, privileges, exports, and legal contexts. Use a shared taxonomy and governance process while separating purpose-specific views, sensitive systems, permissions, and retention. Require change review before a new field, integration, automated decision, enrichment source, or secondary use goes live.",
      actions: [
        "Maintain a data-flow and vendor inventory covering collection points, systems, integrations, exports, backups, subprocessors, owners, contracts, incidents, retention, and exit evidence.",
        "Use delegated role access, recurring administrator and former-user review, environment and export controls, tested recovery, and incident exercises across teams.",
        "Review segmentation, enrichment, automation, predictive tools, AI use, cross-program sharing, research, and public reporting for necessity, bias, explainability, access, authority, and harm before use.",
      ],
      checkpoint:
        "Every material expansion has an affected-person review, stated purpose, approved field and flow changes, qualified jurisdiction and sector review, access model, vendor evidence, retention decision, rollback, owner, and measurable operating decision.",
    },
  ],
  example: {
    name: "Willow Street Family Resource Network",
    context:
      "This fictional forming nonprofit has donor contacts in a giving platform, volunteer names in a spreadsheet, event registrations in email, partner notes in personal documents, and program inquiries in a protected service system. Staff want one CRM before a fall campaign, but the records use different definitions and several contacts have conflicting email preferences.",
    weakLabel: "Weak CRM plan",
    weak: "Import every contact into the most popular nonprofit CRM, add as much information as possible, tag promising people, automate follow-ups, and let the whole team use the database so nothing gets lost.",
    strongLabel: "Stronger CRM operating plan",
    strong:
      "Purpose: support appropriate follow-up, shared commitments, communication preferences, and named operating decisions; do not store service case details or rank people. People: a resident advisor, program, fundraising, volunteer, accessibility, operations, and executive owners review the design. Boundary: keep protected service records separate. Fields: approve only a record ID, relationship role, source, owner, current stage, next agreed action, review date, and channel-specific preference unless another field has a documented need. Migration: inventory sources, quarantine unknown records, preserve original exports, test with fictional data, reconcile counts and suppressions, then import in reviewed batches. Operations: individual accounts, minimum role access, correction and duplicate queues, quarterly access and field review, incident routing, tested export, and exit deletion. Campaigns use only records with an appropriate source and current channel status; uncertainty pauses outreach.",
    reason:
      "The stronger plan starts with decisions, people, boundaries, field definitions, source, preferences, access, maintenance, migration, and exit. It does not assume a vendor, import permission, relationship value, legal compliance, or appropriate secondary use.",
  },
  framework: [
    {
      title: "1. Define the purpose, people, and decisions",
      instruction:
        "Name the relationship work and specific decisions the system should support, who is affected, who shapes the practice, who owns it, and which uses are prohibited. Separate fundraising, programs, volunteers, members, partners, advocacy, and other contexts when their purposes or safeguards differ.",
      prompt:
        "Which decision becomes safer or more reliable because this record exists, and who should be able to challenge the design?",
    },
    {
      title: "2. Collect the minimum useful record",
      instruction:
        "Inventory existing sources before adding fields. For each proposed field, document purpose, source, notice or authority, sensitivity, less-invasive alternatives, owner, access, correction, and retention review. Test collection and migration with fictional records.",
      prompt:
        "What would stop working if this field did not exist, and can the same decision be made with less or no personal information?",
    },
    {
      title: "3. Preserve preferences, participation, and access",
      instruction:
        "Record communication choices by channel and purpose, including pauses and suppressions. Provide accessible, language-appropriate ways to understand collection, make a choice, request support, correct a record, or stop contact without requiring unnecessary disclosure.",
      prompt:
        "How can a person understand, change, correct, limit, or end this use through every connected path?",
    },
    {
      title: "4. Maintain identity, provenance, and relationship work",
      instruction:
        "Use stable internal identifiers and human review for uncertain duplicates. Keep source, date, owner, and status visible; distinguish facts, direct statements, assumptions, and staff notes. Define neutral relationship stages around agreed work, not human value or predicted generosity.",
      prompt:
        "How will the team resolve a conflict, duplicate, stale value, unsupported note, missed commitment, or correction request without guessing?",
    },
    {
      title: "5. Use records for bounded decisions",
      instruction:
        "Build views and reports around current work: open commitments, preferences, corrections, access needs, stale records, failed flows, and follow-up. Review segmentation, automation, enrichment, prediction, AI, research, and public reporting as new uses rather than harmless features.",
      prompt:
        "What action will this report change, what could it misrepresent, and which people or records should be excluded?",
    },
    {
      title: "6. Protect access, flows, vendors, and incidents",
      instruction:
        "Use individual accounts, minimum permissions, strong authentication, current administrators, limited exports, approved devices, vendor and integration review, tested backups, offboarding, incident ownership, evidence preservation, and qualified notification and communication review.",
      prompt:
        "Who can see, change, export, combine, restore, or delete each field today, and what happens when access or the system fails?",
    },
    {
      title: "7. Retire fields, records, integrations, and systems",
      instruction:
        "Create purpose- and source-aware retention reviews with qualified legal, tax, grant, contract, insurance, dispute, and sector input. Distinguish archive, suppression, preservation, deletion, backup expiry, vendor exit, and proof of completion.",
      prompt:
        "What ends the need for this information, what may require preservation, and how will the organization verify every copy or downstream flow was handled?",
    },
  ],
  checklist: [
    "The CRM has a written purpose, named operating decisions, affected-person input, accountable owner, backup, prohibited uses, and a stated review interval.",
    "Current spreadsheets, forms, donation systems, email tools, event platforms, program systems, devices, paper, exports, backups, service providers, and personal files are inventoried.",
    "Every proposed field has a plain-language label, purpose, source, notice or authority, sensitivity review, minimum access role, correction path, retention review, and less-sensitive-alternative question.",
    "The CRM excludes passwords, payment credentials, identity documents, protected case files, health or education detail, and unnecessary sensitive narrative; approved purpose-specific systems hold information that must remain separate.",
    "Collection points explain relevant purpose and choices in accessible language and formats; imported or partner-supplied records retain source, terms, date, limits, and review status.",
    "Email, text, phone, mail, event, fundraising, program, language, format, pause, and do-not-contact preferences have definitions, owners, timestamps, sources, and propagation tests.",
    "Identity matching does not rely on name alone; uncertain duplicates are reviewed, source records remain traceable, merge decisions are recorded, and incorrect merges can be repaired.",
    "Relationship stages describe current agreed work, next action, owner, date, commitment, pause, decline, or closure without scoring worth, generosity, trust, need, eligibility, or risk.",
    "Individual accounts, least-necessary roles, administrator coverage, multifactor authentication where supported, approved devices, export limits, shared-account prohibition, and offboarding are reviewed.",
    "Corrections, bounces, returned mail, stale records, conflicting preferences, unsupported notes, failed integrations, and open commitments enter named queues with completion evidence.",
    "Retention distinguishes operational need, tax and grant records, contracts, disputes, legal holds, sector duties, suppression, archive, deletion, backup expiry, and vendor copies through qualified review.",
    "Every integration and export documents fields, purpose, direction, frequency, access, owner, failure alert, preference behavior, service provider, contract, backup, and exit path.",
    "The incident plan names internal and external contacts, immediate containment, evidence, insurer and counsel routing, current jurisdiction review, affected-person communication, recovery, and lessons learned.",
    "Reports name definitions, missingness, duplicates, exclusions, time window, source, access, limitations, owner, and decision; operational activity is not labeled relationship quality or impact.",
    "Migration and vendor selection test accessibility, permissions, security, exports, integrations, support, cost, capacity, reconciliation, rollback, training, deletion, and system exit with fictional records first.",
  ],
  mistakes: [
    {
      mistake: "Choosing software before defining the work.",
      correction:
        "Define decisions, people, fields, access, maintenance, integrations, retention, capacity, and exit first; compare vendors against those requirements.",
    },
    {
      mistake:
        "Importing every contact because the organization already has it.",
      correction:
        "Inventory source, relationship, notice, permission, purpose, age, preferences, restrictions, and quality; quarantine uncertainty and exclude records that lack a responsible use.",
    },
    {
      mistake: "Treating one unsubscribe as an email-only cleanup task.",
      correction:
        "Define channel- and purpose-specific preferences, preserve necessary suppression evidence, and test propagation across every relevant sending system and owner.",
    },
    {
      mistake: "Giving the whole team full access for convenience.",
      correction:
        "Map tasks to minimum roles, use individual accounts and strong authentication, constrain exports, review administrators and former users, and document exceptions.",
    },
    {
      mistake: "Writing subjective personal judgments in open notes.",
      correction:
        "Use bounded factual notes with source, date, purpose, access, correction, and retention; keep sensitive detail out and prohibit labels that rank human value or infer protected traits.",
    },
    {
      mistake: "Merging duplicates automatically on a weak match.",
      correction:
        "Use stable identifiers, preserve source records, review uncertain matches, record the merge decision, and maintain a repair path.",
    },
    {
      mistake: "Calling an integration complete when data moves once.",
      correction:
        "Test direction, field mapping, preferences, updates, deletions, errors, retries, ownership, access, reconciliation, backup, and vendor exit.",
    },
    {
      mistake:
        "Reporting contact count or pipeline size as relationship strength.",
      correction:
        "Report the operational fact accurately and use direct feedback, fulfilled commitments, process evidence, and appropriate program or fundraising measures for other questions.",
    },
  ],
  measuresIntroduction:
    "Use measures that help the team maintain a useful, bounded, and accountable system. CRM measures describe records and operations; they do not establish consent, trust, relationship quality, donor intent, service eligibility, causality, or community impact.",
  measures: [
    "Purpose and field discipline: active fields have current definitions, owners, uses, source expectations, access roles, retention reviews, and evidence of actual use in named decisions.",
    "Preference integrity: channel choices, pauses, suppressions, language and format needs, corrections, and source dates propagate accurately across connected systems within the reviewed process.",
    "Data quality: duplicate candidates, confirmed merges, repaired merges, missing sources, stale records, bounces, returned mail, unsupported notes, correction requests, and time to resolution remain visible.",
    "Relationship operations: open and completed commitments, follow-up age, responsible owner, voluntary pauses, declines, closures, and unresolved handoffs are reviewed without scoring people.",
    "Access and security: active users, administrators, role changes, former-user removals, multifactor-authentication coverage where supported, exports, shared-account exceptions, incidents, recovery tests, and unresolved risks are tracked.",
    "Data flows and vendors: integrations, failed runs, reconciliation differences, service-provider access, contract reviews, backups, exit tests, and verified deletion or return actions are current.",
    "Retention work: records and fields reviewed, archived, preserved, suppressed, deleted, awaiting qualified review, or found in downstream copies are counted by defined category and source.",
    "Decision use and burden: the team records which operating decision changed, supporting evidence, limitations, staff time, training needs, manual work, user feedback, and whether a field, flow, report, or tool should be maintained, revised, replaced, or stopped.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal learning sequence behind this guide: current-system inventory, relationship mapping, donor journey stages, next-action ownership, follow-up cadence, and tools-and-systems planning.",
    },
    {
      title: "Protecting Personal Information: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business",
      note: "Federal guidance to inventory personal information, keep only what is needed, protect it, dispose of it securely, and prepare for incidents.",
    },
    {
      title: "Start with Security: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/start-security-guide-business",
      note: "Federal security guidance on necessary collection, retention, access, authentication, service providers, secure storage, disposal, and current practices.",
    },
    {
      title: "Data Breach Response: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/data-breach-response-guide-business",
      note: "Federal incident-response guidance covering containment, evidence, affected systems and people, qualified notification review, communication, and remediation.",
    },
    {
      title: "Using Privacy Framework 1.1",
      publisher: "National Institute of Standards and Technology",
      url: "https://www.nist.gov/privacy-framework/using-privacy-framework-11",
      note: "A voluntary federal framework for identifying and managing privacy risk across organizational roles and the wider data-processing ecosystem.",
    },
    {
      title: "Secure Our World",
      publisher: "Cybersecurity and Infrastructure Security Agency",
      url: "https://www.cisa.gov/secure-our-world",
      note: "Federal public guidance on multifactor authentication, strong passwords and password managers, software updates, and recognizing and reporting phishing.",
    },
    {
      title: "Recordkeeping Requirements for Exempt Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/eo-operational-requirements-recordkeeping-requirements-for-exempt-organizations",
      note: "Federal tax guidance on records needed to support activities, income, expenses, credits, returns, and tax compliance; CRM retention must align with the actual record and purpose.",
    },
    {
      title: "CAN-SPAM Act: A Compliance Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
      note: "Federal guidance for reviewing commercial-email classification, sender information, subject lines, disclosures, opt-out handling, vendors, and monitoring.",
    },
    {
      title: "Targeting and Eliminating Unlawful Text Messages",
      publisher: "Federal Communications Commission",
      url: "https://docs.fcc.gov/public/attachments/DA-24-859A1_Rcd.pdf",
      note: "Small-entity guidance for businesses, nonprofits, and small governments on FCC text-message rules; confirm current classification and requirements for each proposed use.",
    },
    {
      title: "Covered Entities and Business Associates",
      publisher: "U.S. Department of Health and Human Services",
      url: "https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html",
      note: "Federal guidance on which defined entities and business associates are covered by HIPAA; nonprofit status alone does not answer applicability.",
    },
    {
      title: "Frequently Asked Questions about FERPA",
      publisher: "U.S. Department of Education",
      url: "https://studentprivacy.ed.gov/frequently-asked-questions",
      note: "Federal guidance on FERPA applicability and education records; applicability depends on the educational institution, funding, record, disclosure, and facts.",
    },
    {
      title: "ADA Requirements: Effective Communication",
      publisher: "U.S. Department of Justice",
      url: "https://www.ada.gov/resources/effective-communication/",
      note: "Federal guidance on effective communication and auxiliary aids and services for covered public entities and businesses or nonprofits serving the public.",
    },
    {
      title: "How to Meet WCAG 2.2",
      publisher: "World Wide Web Consortium",
      url: "https://www.w3.org/WAI/WCAG22/quickref/",
      note: "A filterable reference for web accessibility criteria, techniques, and failures relevant to CRM forms, notices, preference centers, tables, and connected tools.",
    },
    {
      title: "State Attorneys General",
      publisher: "USAGov",
      url: "https://www.usa.gov/state-attorney-general",
      note: "Official directory for state and territorial attorneys general, whose offices may publish current privacy, breach, consumer-protection, and charitable guidance.",
    },
  ],
  disclaimer:
    "This educational guide and planning tool do not collect, import, identify, enrich, merge, deduplicate, segment, rank, score, contact, message, solicit, disclose, export, synchronize, back up, preserve, archive, delete, or verify constituent records; connect to a CRM, spreadsheet, email, text, donation, event, volunteer, program, health, education, employment, accounting, identity, analytics, AI, or other system; create a privacy notice, consent, suppression, retention schedule, legal hold, security program, incident response, contract, business associate agreement, policy, filing, or legal opinion; determine whether a field is necessary, accurate, accessible, safe, authorized, permitted, protected, retained, or fit for use; determine whether HIPAA, FERPA, CAN-SPAM, FCC rules, state privacy or breach law, tax records, fundraising rules, grant terms, contracts, insurance, or other requirements apply; approve a vendor or migration; predict relationship quality, donations, participation, eligibility, risk, or impact; or replace affected-person, accessibility, program, fundraising, records, privacy, security, vendor, insurer, board, legal, tax, or other qualified review. Requirements vary by organization, tax status, sponsor, relationship, activity, data, promise, source, use, channel, system, contract, funding, sector, person, location, jurisdiction, and facts.",
  previous: {
    title: "Campaigns",
    href: "/documentation/tools/campaigns",
  },
  next: {
    title: "Marketplace",
    href: "/documentation/marketplace",
  },
}
