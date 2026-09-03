import type { BestPracticeArticle } from "../types"

export const CAMPAIGNS_ARTICLE: BestPracticeArticle = {
  slug: "tools/campaigns",
  navigationTitle: "Campaigns",
  title: "Plan a nonprofit campaign from decision to learning",
  description:
    "A U.S.-wide, stage-specific guide and device-local campaign brief builder for nonprofit awareness, service, fundraising, advocacy, civic, volunteer, event, and partnership efforts.",
  eyebrow: "Tools · Campaigns",
  answer:
    "A strong nonprofit campaign connects one mission-aligned objective to a specific audience need, one observable action, a truthful message, an accessible destination, accountable owners, sufficient delivery and response capacity, and a decision the evidence will inform. Build that chain before adding channels, volume, or spending.",
  readingTime: "20 minute read",
  reviewedDate: "September 3, 2026",
  publishedDate: "2026-09-03",
  modifiedDate: "2026-09-03",
  labels: {
    definition: "What nonprofit campaign operations include",
    stages: "Build the campaign system your stage needs",
    example: "Fictional worked campaign",
    framework: "A seven-part campaign system",
    checklist: "Campaign review checklist",
    mistakes: "Common campaign mistakes",
    measures: "Evidence for campaign decisions",
  },
  definition:
    "A nonprofit campaign is a bounded, coordinated effort to help a defined audience take or support a mission-aligned action during a stated period. Campaign operations include listening, objective and audience definition, claim and source control, message and offer design, accessibility and language access, consent and privacy, channel roles, budgeting, authority and approvals, delivery, response, correction, measurement, and a closeout decision. A campaign may support public education, service access, fundraising, advocacy, nonpartisan civic participation, volunteer recruitment, an event, or a partnership. The label does not determine the legal or tax treatment; the organization, activity, audience, content, funding, jurisdiction, and facts do.",
  whyItMatters: [
    "A campaign concentrates attention and resources. If the objective, audience, action, or owner is unclear, additional content and spending can magnify confusion rather than results.",
    "People may use campaign information to decide whether a service, event, donation, volunteer role, or public action is relevant, safe, accessible, affordable, and available to them. Material facts and destinations must stay current.",
    "A message can lose meaning when it moves across email, text, social, print, events, media, partners, and paid distribution. Shared source material and explicit channel roles preserve the decision while allowing useful adaptation.",
    "Stories, images, contact information, donation data, service requests, petitions, registrations, and tracking can expose people or collect more information than the campaign needs. Permission and data minimization belong in the brief.",
    "Fundraising, lobbying, candidate-related communications, calls and texts, commercial email, endorsements, intellectual property, accessibility, and state solicitation can require specialized review before launch.",
    "Delivery creates response work. Questions, registrations, service requests, volunteer applications, gifts, complaints, corrections, opt-outs, access needs, safety concerns, and partner handoffs need owners and capacity.",
    "Attention is not impact. Reach and engagement can describe distribution, while verified downstream actions, audience feedback, cost, workload, access conditions, and limitations support better decisions.",
  ],
  importantNote:
    "Do not treat every campaign as the same activity. Section 501(c)(3) organizations are prohibited from participating or intervening in campaigns for or against candidates for public office. Some lobbying and nonpartisan public-policy or civic activity may be permitted, but classification, limits, reporting, funding, and state rules depend on the organization and facts. Other exempt entities, fiscally sponsored projects, coalitions, funders, contractors, and platforms may have different requirements. Obtain qualified legal and tax review before candidate-related, lobbying, ballot-measure, fundraising, paid, highly targeted, or sensitive-data activity.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "What is the smallest responsible campaign test?",
      guidance:
        "Choose one mission-aligned objective, one primary audience, one observable action, one useful destination, and one learning question. Listen before naming the campaign. Draft claims from current sources, test the message and access path with relevant people, and set a short boundary that the team can deliver and answer.",
      actions: [
        "Write the objective as a change the campaign can reasonably support, not a broad social outcome it cannot establish.",
        "Record what the team knows about the audience, how it knows, what remains assumed, and who has not been heard.",
        "Run a small message, destination, access, and response test before paying for reach or adding channels.",
      ],
      checkpoint:
        "Proceed when a named owner can explain the audience need, desired action, source, destination, safeguards, response path, and decision the test will inform.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "What practices must exist before campaigns repeat?",
      guidance:
        "Turn the first brief into a reusable operating pattern. Define naming, source review, permissions, accessibility, approvals, budgets, channel access, list and suppression handling, response, correction, recordkeeping, and closeout. Separate organization voice from personal voice and create alternate approval paths for conflicts or absences.",
      actions: [
        "Assign accountable owners for the objective, content, source, access, budget, distribution, destination, response, measurement, and stop decision.",
        "Create one source-of-truth brief and an archive of approved final versions, material changes, permissions, disclosures, and decisions.",
        "Review the organization’s tax status, jurisdictions, grant and sponsor terms, platform rules, and campaign type before launch.",
      ],
      checkpoint:
        "Proceed when campaign work can continue safely without depending on one person’s memory, account, device, approval, or informal contact list.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "How does each campaign support an operating decision?",
      guidance:
        "Connect every campaign to a program, access, fundraising, advocacy, volunteer, event, or partnership decision. Use a bounded calendar, capacity assumptions, service and response thresholds, consistent measurement definitions, and a formal closeout. Compare evidence only when objectives, audiences, channels, destinations, periods, and attribution limits are comparable.",
      actions: [
        "Set delivery and response capacity before launch, including who can pause promotion when demand exceeds safe or useful service.",
        "Review live destinations, material facts, dates, access, consent, permissions, spending, and response demand throughout the campaign.",
        "Close with a maintain, revise, repeat, expand, pause, archive, or stop decision and name the next owner and review date.",
      ],
      checkpoint:
        "A campaign is operational when delivery, response, cost, access, corrections, outcomes, limitations, and the resulting decision are visible together.",
    },
    {
      id: "growing",
      label: "Growing",
      question:
        "How can more teams and partners campaign without losing control?",
      guidance:
        "Manage campaigns as a portfolio. Use common definitions, campaign identifiers, evidence and permission records, delegated authority, partner terms, approval tiers, list governance, budget controls, service-capacity thresholds, incident paths, and stop rules. Preserve local audience knowledge and review differences instead of forcing one message everywhere.",
      actions: [
        "Map campaign dependencies across programs, finance, fundraising, communications, legal, accessibility, privacy, technology, vendors, coalitions, and service teams.",
        "Audit who can create audiences, access data, approve claims, commit money, send messages, publish through partner channels, and change destinations.",
        "Review portfolio overlap, audience fatigue, repeated asks, exclusions, equity, capacity, cost, and retired campaigns before adding volume.",
      ],
      checkpoint:
        "Growth is responsible when each campaign remains traceable to evidence, authority, access, capacity, cost, response, learning, and an explicit stop decision.",
    },
  ],
  example: {
    name: "Willow Street Family Resource Network",
    context:
      "This fictional operating nonprofit offers free bilingual benefits-navigation appointments in three ZIP codes. Current program records show unused weekday appointment capacity, while listening sessions found that many eligible residents expect a fee and do not know telephone interpretation is available. The team plans a six-week service-access campaign.",
    weakLabel: "Activity-led brief",
    weak: "Post daily on every channel about our services. Ask partners to share. Boost the best post and report impressions, clicks, and new followers.",
    strongLabel: "Decision-led brief",
    strong:
      "During six weeks, help Spanish- and English-speaking adults in three named ZIP codes understand that appointments are free and interpretation is available, then complete the mobile appointment request or call the published number. Use a reviewed program page as the source and destination; give partner flyers, local email, social, and two tabling events distinct roles; cap promotion when the response queue reaches the service threshold; record access questions, completed requests, kept appointments, source limits, staff time, and cost; then decide whether to revise the message, destination, channel mix, or appointment capacity.",
    reason:
      "The stronger brief connects an observed barrier to a specific audience and action, uses a current source, assigns channel roles, protects service capacity, measures downstream use, and ends with a decision. It does not claim that distribution caused community impact.",
  },
  framework: [
    {
      title: "1. Frame the decision",
      instruction:
        "Name the mission-aligned objective, campaign type, primary action, working period, accountable owner, boundaries, and decision the evidence will inform. Distinguish what the campaign can support from the wider outcome it cannot establish alone.",
      prompt:
        "What should a defined audience be able to understand or do, and what will the organization decide after the campaign?",
    },
    {
      title: "2. Listen and define the audience",
      instruction:
        "Use recent listening, program evidence, relationship knowledge, access information, and direct participation to define the primary audience. Record assumptions, exclusions, missing voices, language, disability access, technology, geography, trust, cost, safety, and response conditions.",
      prompt:
        "What evidence supports this audience definition, whose perspective is missing, and what barrier is the campaign designed to reduce?",
    },
    {
      title: "3. Build message, proof, offer, and channel roles",
      instruction:
        "Write one clear main message, the supporting sources and limits, and one useful action or offer. Make the destination complete and current. Give each channel a job based on audience evidence and capacity rather than copying one asset everywhere.",
      prompt:
        "What must be understood, what supports it, where can a person verify it, and what should each channel help them do?",
    },
    {
      title: "4. Review authority, rights, access, and requirements",
      instruction:
        "Confirm claims, citations, quotes, stories, permissions, intellectual-property rights, accessibility, language access, privacy, list source, consent, disclosures, approvals, tax status, solicitation, lobbying, election, grant, contract, sponsor, vendor, and platform questions as applicable.",
      prompt:
        "Who must review what before launch, which current sources govern, and what would require revision, escalation, or a stop?",
    },
    {
      title: "5. Launch within capacity",
      instruction:
        "Set milestones, final checks, budget authority, delivery owners, destination monitoring, response capacity, service or event limits, partner timing, backups, and pause thresholds. Do not buy distribution the team cannot responsibly answer or fulfill.",
      prompt:
        "What work, money, access, approvals, people, inventory, service capacity, and contingency are required from launch through response?",
    },
    {
      title: "6. Respond, correct, and escalate",
      instruction:
        "Route routine questions, access needs, opt-outs, registrations, applications, gifts, sensitive requests, complaints, misinformation, corrections, safety issues, press, partner concerns, and incidents to named channels. Keep public replies from collecting unnecessary personal information.",
      prompt:
        "Who answers, how quickly, through which channel, and what triggers correction, private handoff, pause, incident response, or qualified review?",
    },
    {
      title: "7. Learn and close",
      instruction:
        "Review delivery, verified actions, access, feedback, cost, workload, corrections, unintended effects, attribution limits, and what the evidence cannot show. Record the maintain, revise, repeat, expand, pause, archive, or stop decision and preserve the evidence behind it.",
      prompt:
        "What happened after distribution, for whom, at what cost and workload, with what limits, and what will change because of the review?",
    },
  ],
  checklist: [
    "The campaign has one primary mission-aligned objective, audience, observable action, working period, accountable owner, and post-campaign decision.",
    "Audience definition cites recent evidence, distinguishes facts from assumptions, identifies missing voices, and considers language, disability, technology, geography, trust, cost, and safety.",
    "The main message, material facts, dates, eligibility, costs, benefits, risks, quotes, statistics, and outcome statements trace to current reviewed sources with limitations.",
    "The action or offer is specific, useful, and proportionate; the destination is current, accessible, mobile-usable, privacy-conscious, and complete enough to act.",
    "Every channel has an audience reason, distinct role, owner, approved format, maintainable schedule, destination, response plan, and retirement plan.",
    "Names, stories, images, voices, testimonials, lists, contact information, tracking, and sensitive details have an appropriate permission, consent, privacy, security, and withdrawal review.",
    "Images, audio, video, documents, forms, events, calls, texts, email, print, language versions, and response paths receive relevant accessibility and effective-communication review.",
    "Material relationships, sponsorships, gifts, discounts, paid placements, endorsements, and partner roles receive clear disclosures and current review where required.",
    "Tax status, campaign type, candidate and ballot context, lobbying, fundraising solicitation, gift disclosure, grant and sponsor terms, contracts, intellectual property, channel rules, and jurisdictions are reviewed before use.",
    "Budget, spending authority, procurement, staff and volunteer time, service or event capacity, partner dependencies, and contingency are visible.",
    "Approval, publishing, account access, backup, response, correction, opt-out, archive, pause, escalation, incident, and stop responsibilities are assigned.",
    "The campaign avoids collecting unnecessary personal information; sensitive questions move to an approved channel with minimum necessary access.",
    "Measures distinguish distribution, response, destination use, completed action, service or program evidence, cost, workload, and longer-term outcomes; attribution limits are explicit.",
    "Closeout records final materials, material changes, delivery, feedback, access issues, corrections, costs, results, limits, decision, next owner, and review date.",
  ],
  mistakes: [
    {
      mistake: "Starting with a slogan, channel, or content calendar.",
      correction:
        "Start with the audience need, objective, desired action, evidence, destination, owner, and decision; build content only after those connect.",
    },
    {
      mistake: "Calling everyone the audience.",
      correction:
        "Choose one primary audience for the campaign, state the evidence and exclusions, and create separate paths when needs or actions differ materially.",
    },
    {
      mistake: "Making a confident claim from weak or indirect evidence.",
      correction:
        "Use current sources, preserve definitions and limitations, distinguish organization evidence from external evidence, and obtain subject-owner review.",
    },
    {
      mistake: "Treating a contact list as permission to use every channel.",
      correction:
        "Record list source, relationship, consent, purpose, channel, suppression, opt-out, sharing, security, and applicable legal or platform review.",
    },
    {
      mistake: "Assuming a nonprofit campaign is exempt from marketing rules.",
      correction:
        "Review the actual message, activity, entity, tax status, audience, channel, relationship, funding, jurisdiction, and partner arrangement with qualified people.",
    },
    {
      mistake: "Buying reach without funding response or fulfillment.",
      correction:
        "Set service, event, inventory, moderation, fundraising, volunteer, partner, and response thresholds before launch, with a clear pause path.",
    },
    {
      mistake:
        "Changing the destination or terms without updating the campaign.",
      correction:
        "Monitor material facts and every live destination, record changes and corrections, update distributed material where possible, and stop stale promotion.",
    },
    {
      mistake:
        "Reporting impressions, clicks, signatures, or gifts as community impact.",
      correction:
        "Name each measure accurately, connect it cautiously to verified downstream evidence, explain attribution limits, and record the decision it informed.",
    },
  ],
  measuresIntroduction:
    "Use evidence that helps the team decide what to maintain, revise, repeat, expand, pause, archive, or stop. Campaign metrics describe different points in a pathway; no single count establishes audience understanding, consent, access, causality, service quality, policy change, fundraising sustainability, or community impact.",
  measures: [
    "Source integrity: material claims, dates, eligibility, offers, disclosures, citations, limitations, destinations, and corrections remain current and traceable.",
    "Accessible delivery: language versions, alternative text, captions, transcripts, descriptive links, document and form access, event access, and effective-communication requests are reviewed and resolved.",
    "Distribution: delivered email or text, print placement, partner distribution, event contact, media placement, paid reach, and platform reach are reported by channel without being called outcomes.",
    "Audience response: questions, replies, access requests, opt-outs, complaints, corrections, misinformation themes, trust signals, and response time inform revision.",
    "Destination use: visits, resource use, form starts, completed registrations, applications, appointments, donations, volunteer steps, partner inquiries, or other defined actions are interpreted with attribution and duplication limits.",
    "Capacity and cost: staff and volunteer time, production, translation, access, tools, media, partner support, service load, response demand, cost per defined action, and opportunity cost remain visible.",
    "Program or mission evidence: verified service access, participation, stewardship, volunteer placement, partner action, or policy-process evidence is analyzed separately from campaign distribution and with appropriate evaluation methods.",
    "Decision use: closeout produces a documented maintain, revise, repeat, expand, pause, archive, or stop decision with evidence, limitations, owner, and next review date.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal learning sequence behind this guide: audience, annual communications rhythm, 90-day focus, key messages, invitations, channels, sustainable cadence, and human-reviewed AI assistance.",
    },
    {
      title: "How to Use the Clear Communication Index",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/ccindex/tool/how-to-use.html",
      note: "Federal research-based guidance for developing and assessing public materials around an intended audience, communication objective, main message, action, clarity, and review.",
    },
    {
      title:
        "Restriction of Political Campaign Intervention by Section 501(c)(3) Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/restriction-of-political-campaign-intervention-by-section-501c3-tax-exempt-organizations",
      note: "Federal tax guidance on the prohibition against section 501(c)(3) participation or intervention in campaigns for or against candidates and the facts-and-circumstances review of nonpartisan activity.",
    },
    {
      title: "Lobbying",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/lobbying",
      note: "Federal overview of lobbying, public-policy education, and the substantial-part and expenditure tests for eligible section 501(c)(3) public charities.",
    },
    {
      title: "Instructions for Schedule C (Form 990)",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/instructions/i990sc",
      note: "Current reporting instructions for political campaign and lobbying activity across covered exempt organizations; classification depends on status, activity, and facts.",
    },
    {
      title: "Substantiation and Disclosure Requirements",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-organizations-substantiation-and-disclosure-requirements",
      note: "Federal guidance on written acknowledgments and disclosures connected to charitable contributions, including quid pro quo contributions.",
    },
    {
      title: "State Charity Regulators",
      publisher: "National Association of State Charity Officials",
      url: "https://www.nasconet.org/",
      note: "Directory for state charity regulators and state-specific charitable solicitation, registration, reporting, and enforcement information.",
    },
    {
      title: "CAN-SPAM Act: A Compliance Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
      note: "Federal guidance for determining whether email is commercial and reviewing sender identity, subject lines, disclosures, postal address, opt-out, vendor, and monitoring requirements.",
    },
    {
      title: "Targeting and Eliminating Unlawful Text Messages",
      publisher: "Federal Communications Commission",
      url: "https://docs.fcc.gov/public/attachments/DA-24-859A1_Rcd.pdf",
      note: "Small-entity compliance guidance for businesses, nonprofits, and small governments on FCC rules addressing unlawful text messages; review current rules for the proposed use.",
    },
    {
      title: "Endorsements, Influencers, and Reviews",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews",
      note: "Current federal business guidance on truthful endorsements, material connections, reviews, testimonials, and clear disclosures.",
    },
    {
      title: "ADA Requirements: Effective Communication",
      publisher: "U.S. Department of Justice",
      url: "https://www.ada.gov/resources/effective-communication/",
      note: "Federal guidance on effective communication and auxiliary aids and services for covered state and local entities and nonprofits serving the public.",
    },
    {
      title: "How to Meet WCAG 2.2",
      publisher: "World Wide Web Consortium",
      url: "https://www.w3.org/WAI/WCAG22/quickref/",
      note: "Filterable reference for Web Content Accessibility Guidelines success criteria, techniques, and failures across campaign pages, forms, documents, images, audio, and video.",
    },
    {
      title: "Protecting Personal Information: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business",
      note: "Federal guidance to inventory personal information, keep only what is needed, protect it, dispose of it securely, and prepare for incidents.",
    },
    {
      title: "Copyright Basics",
      publisher: "U.S. Copyright Office",
      url: "https://www.copyright.gov/circs/circ01.pdf",
      note: "Federal overview of copyrightable works, ownership, exclusive rights, registration, duration, and common boundaries relevant to campaign materials.",
    },
  ],
  disclaimer:
    "This educational guide and planning tool do not create, approve, publish, send, target, segment, purchase, fund, process, monitor, or evaluate a campaign; connect to an audience, channel, CRM, donation system, advertising account, petition, event, service, or analytics platform; verify facts, claims, outcomes, sources, permissions, consent, list provenance, suppression, intellectual-property rights, accessibility, language access, effective communication, privacy, security, tax status, charitable solicitation, gift disclosure, lobbying, political campaign intervention, ballot activity, grant or sponsor terms, contracts, endorsements, email, calling, texting, platform rules, authority, budget, capacity, or legal requirements; calculate a compliance or readiness score; predict reach, response, donations, participation, policy change, or impact; or replace current source, audience, program, accessibility, fundraising, finance, privacy, security, communications, board, legal, or tax review. Requirements vary by organization, status, sponsor, activity, audience, relationship, message, channel, data, funding, jurisdiction, and facts.",
  previous: {
    title: "Legal",
    href: "/documentation/tools/legal",
  },
  next: {
    title: "CRM",
    href: "/documentation/tools/crm",
  },
}
