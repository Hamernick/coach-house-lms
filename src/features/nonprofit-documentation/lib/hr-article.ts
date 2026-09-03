import type { BestPracticeArticle } from "../types"

export const HR_ARTICLE: BestPracticeArticle = {
  slug: "tools/hr",
  navigationTitle: "HR",
  title: "Build a nonprofit people system that supports the work",
  description:
    "A U.S.-wide guide to defining roles, reviewing working relationships, recruiting fairly, onboarding clearly, supporting people, protecting records, and planning transitions.",
  eyebrow: "Nonprofit HR guide",
  answer:
    "A useful nonprofit people system starts with necessary work, not a title or a person. Define the mission need and essential functions; review the actual working relationship, full cost, authority, and jurisdiction; then use a fair and accessible process to recruit, onboard, supervise, protect, learn with, and transition the people doing the work.",
  readingTime: "21 minute read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "What nonprofit HR includes",
    stages: "Stage-specific people practices",
    example: "Worked role example",
    framework: "A seven-part people system",
    checklist: "People-practices checklist",
    mistakes: "Common HR mistakes",
    measures: "Useful people-system measures",
  },
  definition:
    "Nonprofit human resources is the system for defining necessary work and managing the relationships through which people perform it. It includes employees, volunteers, independent contractors, interns or fellows, and board members, while recognizing that each relationship has different facts, authority, support, and legal considerations. The system covers role design, relationship and compensation review, recruitment, selection, onboarding, supervision, access, safety, records, feedback, learning, change, and transition.",
  whyItMatters: [
    "Mission delivery depends on people having clear outcomes, realistic workload, enough resources, usable authority, supervision, and safe ways to raise concerns.",
    "A nonprofit label does not remove employment responsibilities. Federal coverage can depend on the organization, activity, and individual work, while state and local rules may be more protective or add requirements.",
    "Employee, volunteer, contractor, board, and learning relationships cannot be chosen only to fit a budget. The actual facts, duties, direction, compensation, expectations, and applicable tests matter.",
    "Fair and accessible recruitment begins with essential functions and job-related criteria. Consistent processes and reviewable evidence help reduce arbitrary decisions and hidden barriers.",
    "Full cost includes more than salary or a fee: payroll and taxes, benefits, insurance, equipment, technology, workspace, accessibility, training, supervision, administration, travel, safety, and transition can all require resources.",
    "People records can contain identity, pay, immigration, health, accommodation, background, performance, and incident information. Collecting, separating, securing, retaining, and deleting those records requires deliberate controls.",
    "A role is not sustainable when the organization relies on unpaid labor, unclear authority, inaccessible systems, uncompensated hidden work, one overextended supervisor, or knowledge held by one person.",
  ],
  importantNote:
    "Use this guide to organize questions and evidence, not to decide legal status or an employment outcome. Worker classification, wages, hours, overtime, leave, benefits, taxes, immigration verification, unemployment, workers’ compensation, insurance, background checks, accommodations, workplace safety, safeguarding, privacy, personnel records, collective activity, discipline, and separation can depend on federal, state, Tribal, territorial, and local law plus the actual facts. Review current requirements for every place where work occurs and obtain qualified advice before acting when the answer matters.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "What work is truly needed, and should a new role exist?",
      guidance:
        "Begin with the community or program need, the work required to respond, and the limits of current capacity. Separate a recurring role from a short project, board responsibility, community advisory work, peer contribution, or a service that should remain with a qualified provider. Do not recruit a specific person and design the role around them afterward.",
      actions: [
        "Describe the need, the people affected, the intended result, the essential work, and the evidence that the work should be done.",
        "Estimate workload, timing, location, tools, access, supervision, risk, direct cost, indirect cost, and funding durability before choosing a relationship label.",
        "Identify decision authority, professional or safeguarding boundaries, conflicts, and work that must remain with the board, an employee, or another qualified role.",
        "Ask people closest to the work what knowledge, language, access, schedule, compensation, safety, and accountability the role requires.",
      ],
      checkpoint:
        "The team can explain why the work is necessary, what outcome it should support, which functions are essential, what resources and supervision it requires, what risks it carries, and what remains unknown before anyone is recruited.",
    },
    {
      id: "forming",
      label: "Forming",
      question:
        "Can we create a fair, supportable relationship around the work?",
      guidance:
        "Translate the work into a role brief, review the actual relationship and jurisdiction, budget the full cost, and design recruitment and selection before publishing. Use job-related qualifications, accessible participation, consistent questions, documented decision roles, conflict handling, and a path for accommodation requests.",
      actions: [
        "Document outcomes, essential functions, workload, schedule, location, direction, authority, qualifications, compensation or reimbursement, resources, and review timing.",
        "Have a qualified reviewer assess classification, pay, tax, benefits, insurance, leave, immigration, background-check, safety, and state or local questions that apply.",
        "Choose recruitment channels that can reach qualified people beyond the organization’s immediate network and make the application and interview process accessible.",
        "Prepare a consistent selection rubric, questions, reviewers, conflict process, decision evidence, communication plan, and records boundary before accepting applications.",
      ],
      checkpoint:
        "A reviewer can trace the opportunity to a necessary role, approved resources, relationship review, job-related criteria, accessible process, authorized decision, protected records, and a real onboarding and supervision plan.",
    },
    {
      id: "operating",
      label: "Operating",
      question:
        "Do people have what they need to do the work and raise concerns?",
      guidance:
        "Treat onboarding as the beginning of an operating relationship. Provide required forms, timely pay or reimbursement, role boundaries, systems access, safety and safeguarding information, training, contacts, supervision, feedback, accommodation and reporting paths, and a scheduled review. Apply expectations consistently while considering individual requests and circumstances through the appropriate process.",
      actions: [
        "Complete required documentation and payroll, tax, authorization, benefit, insurance, and record steps through the responsible systems without copying sensitive data into informal tools.",
        "Give the person a role brief, work priorities, decision limits, policies, tools, access, safety information, reporting paths, supervisor, backup, and first review date.",
        "Use regular check-ins to compare workload, results, barriers, support, access, safety, role clarity, learning, and changing conditions—not personality or proximity to leadership.",
        "Respond promptly to pay, accommodation, discrimination, harassment, retaliation, safety, safeguarding, conflict, workload, data, and authority concerns through the correct confidential or protected channel.",
      ],
      checkpoint:
        "The organization can show what the role is expected to accomplish, how work and pay are recorded where required, what training and access were provided, how support and concerns are handled, and when the relationship will be reviewed or changed.",
    },
    {
      id: "growing",
      label: "Growing",
      question:
        "Can the people system expand without multiplying risk and inequity?",
      guidance:
        "Growth changes manager capacity, role consistency, compensation, benefits, leave, safety, data access, employment thresholds, state coverage, and decision authority. Build a coherent role architecture without erasing local needs. Review every new work location, relationship, provider, and handoff; distribute knowledge and create transitions before a key person leaves.",
      actions: [
        "Compare similar roles by essential work, scope, authority, workload, location, and total compensation using documented, conflict-aware governance rather than individual negotiation alone.",
        "Review manager spans, supervision time, backup coverage, training, language and disability access, reporting channels, payroll and HR capacity, safety, insurance, and record systems before adding roles.",
        "Apply location-specific wage, hour, leave, tax, unemployment, workers’ compensation, notice, posting, record, background, and separation review whenever work expands geographically.",
        "Use worker and community feedback to identify hidden labor, inconsistent opportunity, inaccessible practices, recurring safety issues, weak handoffs, knowledge concentration, and roles that need redesign or closure.",
      ],
      checkpoint:
        "Growth decisions are supported by current role architecture, approved full-cost scenarios, manager capacity, location-specific review, accessible and consistent practices, protected records, worker feedback, backups, and responsible transition plans.",
    },
  ],
  example: {
    name: "Willow Street Family Resource Network",
    context:
      "This fictional operating nonprofit provides bilingual benefits navigation in three ZIP codes. Demand has increased, and the executive director proposes a part-time Community Navigation Coordinator. The work includes scheduled participant appointments, documentation in the organization’s case system, referral follow-up, weekly team meetings, and some evening outreach. Funding is confirmed for twelve months but may not continue.",
    weakLabel: "Weak role posting",
    weak: "Passionate nonprofit seeks a rockstar contractor to help whenever needed. Must be energetic, able-bodied, tech savvy, bilingual, and willing to wear many hats. Stipend based on experience. Send a photo and tell us about your family. Volunteers welcome to apply.",
    strongLabel: "Stronger working role brief",
    strong:
      "Community Navigation Coordinator under review as a part-time employee relationship. Purpose: help adults complete accurate benefits-navigation steps and receive current referral follow-up. Essential work: scheduled English and Spanish appointments, accessible communication, approved case-system records, referral updates, weekly supervision, and two planned evening outreach events each month. The organization will publish the pay range and schedule after wage, classification, budget, and board-authority review; provide required technology and training; offer an accessible application and accommodation contact; use the same job-related questions and rubric for every candidate; and review workload, outcomes, support, access, and safety after 30, 60, and 90 days.",
    reason:
      "The stronger brief describes the work, working relationship under review, outcomes, schedule, systems, supervision, access, selection process, and human approvals. It avoids coded preferences, irrelevant personal questions, vague compensation, unpaid substitution, and a contractor label that conflicts with the described direction. The organization still must verify every legal, pay, tax, benefit, safety, data, and local requirement before recruiting or engaging anyone.",
  },
  framework: [
    {
      title: "1. Define necessary work and outcomes",
      instruction:
        "Start with the mission need, the people affected, observable results, essential functions, workload, decision boundaries, and work that belongs elsewhere. Describe the role before considering a particular person.",
      prompt:
        "What must be true because this role exists, and which tasks are genuinely essential to that result?",
    },
    {
      title: "2. Review the actual working relationship",
      instruction:
        "Document direction and control, independence, schedule, location, duration, tools, integration, financial arrangement, supervision, authority, and expectations. Review applicable tests and do not rely on a title, invoice, stipend, grant, waiver, or written contract alone.",
      prompt:
        "What facts describe how the work will really happen, and who is qualified to review the relationship in every relevant jurisdiction?",
    },
    {
      title: "3. Budget full cost and approve authority",
      instruction:
        "Include pay or fees, payroll taxes, benefits, leave, insurance, equipment, workspace, technology, accessibility, training, supervision, administration, travel, reimbursement, safety, and transition. Confirm who may create, fund, compensate, supervise, and end the role.",
      prompt:
        "What will this work cost the organization and the person, and which authorized body must approve the arrangement?",
    },
    {
      title: "4. Recruit and select fairly",
      instruction:
        "Use essential and job-related qualifications, accessible channels and materials, consistent questions, a reviewable rubric, trained decision-makers, conflict handling, accommodation options, timely communication, and minimum necessary applicant records.",
      prompt:
        "Could every qualified applicant understand, access, complete, and be evaluated through the same relevant process?",
    },
    {
      title: "5. Onboard for clarity, access, and safety",
      instruction:
        "Complete required forms and systems through approved channels. Provide the role brief, priorities, boundaries, policies, tools, training, access, safety and safeguarding expectations, reporting paths, supervisor, backup, and first review date.",
      prompt:
        "What must this person know, receive, practice, and be able to question before working independently?",
    },
    {
      title: "6. Support, learn, and respond",
      instruction:
        "Use regular two-way check-ins, clear evidence, reasonable workload, timely pay or reimbursement, effective access, relevant training, prompt concern response, protected reporting, and documented decisions. Separate personnel, medical, immigration, incident, and program records as appropriate.",
      prompt:
        "What evidence shows the work is supported, where barriers or harm are emerging, and how will the organization respond without retaliation?",
    },
    {
      title: "7. Change or close the relationship responsibly",
      instruction:
        "Plan role changes, renewal, succession, and separation before urgency. Confirm authority, fair process, communication, final pay or reimbursement, benefits and notices, access removal, property, records, participant continuity, handoff, and learning through qualified review.",
      prompt:
        "If the role changes or ends tomorrow, what protects the person, participants, organization, information, and continuity of the work?",
    },
  ],
  checklist: [
    "The role begins with a documented mission or program need, community input where relevant, observable outcomes, essential functions, realistic workload, boundaries, and alternatives considered.",
    "The working relationship is described through actual facts and reviewed under current federal, state, Tribal, territorial, and local requirements rather than selected for convenience or budget alone.",
    "The full cost includes compensation or fees, payroll taxes, benefits, leave, insurance, equipment, technology, workspace, accessibility, training, supervision, administration, travel, reimbursement, safety, and transition as applicable.",
    "The authorized manager, executive, board, committee, fiscal sponsor, funder, or other decision-maker is identified; conflicts are disclosed and handled before compensation or related-party decisions.",
    "The role brief uses essential functions and job-related qualifications, states schedule and location honestly, distinguishes required from preferred criteria, and avoids unsupported physical, cultural, credential, or personality proxies.",
    "Recruitment reaches relevant communities, explains the relationship and compensation clearly, offers accessible formats and an accommodation contact, and does not request unnecessary protected or sensitive information.",
    "Selection uses consistent questions and evidence, trained reviewers, declared conflicts, an accessible process, authorized decisions, timely communication, and a defined applicant-record boundary.",
    "Onboarding covers required forms, pay or reimbursement, policies, role expectations, authority, systems, tools, access, safety, safeguarding, confidentiality, reporting, supervision, backup, and the first review.",
    "Work time, wages, expenses, leave, benefits, training, incidents, performance, accommodations, immigration documents, and other records are handled through appropriate systems with accurate records and separated access where required.",
    "People can request access or accommodations and report pay, discrimination, harassment, retaliation, safety, safeguarding, ethics, conflict, privacy, workload, or authority concerns through clear and protected routes.",
    "Feedback connects to stated outcomes and behavior, includes worker input and context, distinguishes coaching from formal action, records decisions proportionately, and routes sensitive matters to qualified review.",
    "Role change, renewal, and separation have an authorized and fair process for communication, required pay or reimbursement, benefits and notices, system access, equipment, records, participant continuity, handoff, and learning.",
  ],
  mistakes: [
    {
      mistake: "Designing a role around a person already chosen.",
      correction:
        "Define the necessary work, outcomes, essential functions, relationship facts, resources, and selection process first; separately manage conflicts and prior relationships.",
    },
    {
      mistake:
        "Calling recurring directed work a contract or volunteer role to save money.",
      correction:
        "Document how the work will actually occur and obtain qualified classification, wage, tax, insurance, and jurisdiction review before deciding or paying.",
    },
    {
      mistake:
        "Using passion, culture fit, age-coded language, physical traits, or broad credentials as shortcuts.",
      correction:
        "Use essential functions, job-related evidence, accessible alternatives, consistent questions, and a reviewable rubric tied to the work.",
    },
    {
      mistake: "Budgeting only salary, stipend, or contractor fee.",
      correction:
        "Model the full cost of the relationship, including taxes, benefits, insurance, leave, tools, access, training, supervision, administration, safety, and transition.",
    },
    {
      mistake: "Treating an employee handbook as the people system.",
      correction:
        "Connect written policies to trained owners, usable reporting paths, timely pay, accessible practices, supervision, evidence, response, and periodic review.",
    },
    {
      mistake:
        "Storing sensitive people information in shared notes or program records.",
      correction:
        "Collect only what is needed, use the correct system, separate record types, restrict access, follow retention duties, and dispose securely when permitted.",
    },
    {
      mistake: "Waiting for an annual review to discuss workload or concerns.",
      correction:
        "Use regular two-way check-ins and prompt protected response paths; do not delay pay, safety, accommodation, discrimination, harassment, or retaliation issues.",
    },
    {
      mistake:
        "Planning transitions only after funding or a relationship ends.",
      correction:
        "Define decision authority, notice and pay review, access removal, records, equipment, handoff, participant continuity, backups, and learning in advance.",
    },
  ],
  measuresIntroduction:
    "Use evidence to understand whether the people system supports the work fairly and reliably. Counts can describe activity, timeliness, access, coverage, or retention; they cannot establish legal compliance, classification, fairness, belonging, performance, safety, equity, satisfaction, or mission impact on their own.",
  measures: [
    "Role clarity: workers and supervisors can explain the role’s outcomes, essential functions, priorities, authority, boundaries, workload, support, review rhythm, and current changes.",
    "Process access: recruitment, application, interview, onboarding, training, systems, communication, meetings, feedback, reporting, and advancement are usable across relevant language, disability, schedule, location, and technology needs.",
    "Selection consistency: decisions use job-related criteria, consistent evidence, trained reviewers, declared conflicts, documented authority, and timely communication, with limitations recorded.",
    "Operational support: required pay or reimbursement, tools, training, access, supervision, workload review, safety controls, reporting paths, and response owners are available when needed.",
    "Concern response: pay, access, safety, safeguarding, discrimination, harassment, retaliation, conflict, workload, data, and authority concerns receive protected routing, prompt acknowledgment, qualified review, documented action, and follow-up.",
    "Role results and learning: evidence connects work to intended outputs or outcomes while documenting external factors, hidden labor, participant feedback, worker insight, barriers, unintended effects, and decisions to change the role or system.",
    "Continuity: important knowledge, relationships, credentials, records, equipment, and system access have current owners, backups, transfer rules, and responsible closeout without relying on one person.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal learning sequence behind this guide: program roles and qualifications, staff and volunteer capacity, direct and indirect costs, leadership, systems, growth, governance, and review.",
    },
    {
      title: "Fact Sheet #14A: Non-Profit Organizations and the FLSA",
      publisher: "U.S. Department of Labor",
      url: "https://www.dol.gov/agencies/whd/fact-sheets/14a-flsa-non-profits",
      note: "Federal overview of FLSA coverage for nonprofit organizations and the fact-specific boundary for charitable volunteers.",
    },
    {
      title: "Independent Contractors vs. Employees",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/exempt-organizations-independent-contractors-vs-employees",
      note: "Tax-exempt organization guidance on examining the business relationship and the employment-tax consequences of misclassification.",
    },
    {
      title: "Publication 15-A: Employer’s Supplemental Tax Guide",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/publications/p15a",
      note: "Current federal tax guidance on worker relationships, exempt-organization employees, and related employment-tax rules.",
    },
    {
      title: "Prohibited Employment Policies and Practices",
      publisher: "U.S. Equal Employment Opportunity Commission",
      url: "https://www.eeoc.gov/prohibited-employment-policiespractices",
      note: "Federal guidance spanning advertisements, recruitment, hiring, pay, assignments, training, discipline, discharge, accommodations, harassment, and pre-employment inquiries.",
    },
    {
      title: "Disability Accommodations Tips",
      publisher: "U.S. Equal Employment Opportunity Commission",
      url: "https://www.eeoc.gov/employers/small-business/disability-accommodations-tips",
      note: "Plain-language guidance on recognizing requests, individualized review, effective accommodations, alternatives, and prompt response.",
    },
    {
      title: "Safety Management: Worker Participation",
      publisher: "Occupational Safety and Health Administration",
      url: "https://www.osha.gov/safety-management/worker-participation",
      note: "Federal safety-program guidance on worker input, hazard reporting, access to information, non-retaliation, participation, and follow-up.",
    },
    {
      title: "Fact Sheet #21: FLSA Recordkeeping Requirements",
      publisher: "U.S. Department of Labor",
      url: "https://www.dol.gov/agencies/whd/fact-sheets/21-flsa-recordkeeping?lang=en",
      note: "Federal summary of wage-and-hour records, accuracy, retention, and permissible timekeeping methods for covered employers.",
    },
    {
      title: "Form I-9 Instructions",
      publisher: "U.S. Citizenship and Immigration Services",
      url: "https://www.uscis.gov/sites/default/files/document/forms/i-9instr.pdf",
      note: "Official instructions for completing, retaining, securing, and using employment-eligibility verification records.",
    },
    {
      title: "State Labor Laws and Labor Offices",
      publisher: "U.S. Department of Labor",
      url: "https://www.dol.gov/agencies/whd/state",
      note: "Federal directory for state labor offices and state wage, child-labor, break, payday, and related labor-law topics that may add protections or duties.",
    },
  ],
  disclaimer:
    "This educational guide and planning tool do not create a job description, policy, handbook, contract, offer, evaluation, personnel record, or legal advice; decide worker classification, employee or volunteer status, exemption, wage, hours, overtime, benefits, leave, tax, immigration, unemployment, workers’ compensation, insurance, collective-activity, background-check, accommodation, discrimination, harassment, retaliation, safety, safeguarding, privacy, record, discipline, or separation questions; verify funding, authority, credentials, references, identity, eligibility, performance, conduct, consent, access, safety, compliance, or fairness; rank, score, screen, recommend, approve, reject, hire, supervise, discipline, or terminate a person; predict retention, performance, satisfaction, equity, culture, safety, compliance, or impact; or replace worker and community participation and qualified HR, legal, tax, payroll, benefits, immigration, labor, accessibility, safety, safeguarding, insurance, privacy, governance, or board review. Requirements vary by organization, exemption, activity, funding, role, relationship, compensation, work, workforce size, location, jurisdiction, and time.",
  previous: {
    title: "Networking",
    href: "/documentation/tools/networking",
  },
  next: { title: "Finance" },
}
