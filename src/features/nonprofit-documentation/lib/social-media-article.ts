import type { BestPracticeArticle } from "../types"

export const SOCIAL_MEDIA_ARTICLE: BestPracticeArticle = {
  slug: "tools/social-media",
  navigationTitle: "Social media",
  title: "Build a nonprofit social media system people can trust",
  description:
    "A U.S.-wide, stage-specific nonprofit social media guide and device-local content planning tool for sourced, accessible, permission-aware publishing.",
  eyebrow: "Tools · Social media",
  answer:
    "Effective nonprofit social media connects a specific audience need to a sourced message, an accessible format, a useful next action, and a responsible response process. Choose channels your team can maintain, preserve permission and context, and measure what people do next—not attention alone.",
  readingTime: "18 minute read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "What nonprofit social media includes",
    stages: "Build the system your stage needs",
    example: "Fictional worked example",
    framework: "A seven-part social publishing loop",
    checklist: "Pre-publication and operating checklist",
    mistakes: "Common social media mistakes",
    measures: "Evidence for learning",
  },
  definition:
    "Nonprofit social media is the governed use of social platforms to listen, inform, invite, respond, and learn in service of a charitable mission. The work includes audience definition, source control, story and media permission, accessible production, channel adaptation, disclosures, approvals, moderation, escalation, recordkeeping, measurement, and correction. A post, follower count, or platform account is only one part of the system.",
  whyItMatters: [
    "People may rely on a post to decide whether a service is available, safe, affordable, accessible, or meant for them. Dates, eligibility, locations, costs, and next steps must remain current and verifiable.",
    "Stories and images can strengthen understanding while exposing a person to stigma, unwanted attention, safety concerns, or loss of control when permission and context are weak.",
    "Accessible text, images, audio, video, links, and response paths determine who can receive and act on the message.",
    "Material relationships, endorsements, fundraising claims, copyrighted work, political activity, privacy, and professional duties can create obligations beyond ordinary content review.",
    "A maintainable system protects program capacity. Unanswered questions, broken destinations, and constant production pressure can undermine trust even when reach is high.",
    "Useful measurement connects content to audience understanding, access, participation, stewardship, or another intended action without treating platform activity as community impact.",
  ],
  importantNote:
    "Social media guidance is not a promise that every platform, format, disclosure, consent, tax, fundraising, privacy, accessibility, employment, or copyright requirement has been satisfied. Platform features and rules change. Review the current platform controls and obtain qualified advice when the activity, people, claim, funding, data, or risk requires it.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "What useful communication belongs on social media?",
      guidance:
        "Begin with listening and a bounded purpose, not a handle or posting quota. Learn where the intended audience already seeks information, what language they use, what action would help, and whether another channel is more appropriate. Test a small number of source-backed messages before building a content machine.",
      actions: [
        "Interview or listen with people closest to the issue; separate their language from the organization's assumptions and proposed public wording.",
        "Choose one audience, one objective, one useful next action, and one working destination for a four- to twelve-week test.",
        "Select only channels the audience uses and the team can monitor, update, and respond through responsibly.",
        "Identify early risks involving stories, images, minors, sensitive services, safety, accessibility, comments, political activity, or professional advice.",
      ],
      checkpoint:
        "The team can explain who the communication serves, what that person should understand or do, which source supports it, why a selected channel fits, who will respond, and what will not be published.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can the organization publish consistently and responsibly?",
      guidance:
        "Create a small source library and operating rules before increasing cadence. Define roles for drafting, fact review, permission, accessibility, approval, publishing, moderation, correction, and escalation. Write plain-language standards that staff and volunteers can use without relying on one person's memory.",
      actions: [
        "Maintain approved facts, program details, eligibility, dates, contact paths, evidence limits, source owners, and review dates.",
        "Document context-specific, revocable story and media permission; do not treat a general release as automatic approval for every future use.",
        "Create accessibility, disclosure, copyright, privacy, moderation, correction, recordkeeping, and crisis-escalation checks proportionate to the content.",
        "Build a realistic content rhythm around mission moments and staff capacity, with a named owner and backup for each selected channel.",
      ],
      checkpoint:
        "A reviewer can trace each planned post to a current source, permission or rights record when needed, accessible assets, a working destination, approval ownership, response coverage, and an escalation path.",
    },
    {
      id: "operating",
      label: "Operating",
      question:
        "Does the publishing loop remain accurate, accessible, and useful?",
      guidance:
        "Run a repeatable review and response rhythm. Adapt one approved source message to the audience and platform without losing its meaning, limits, disclosure, or invitation. Monitor questions and access problems, correct material errors visibly, and update or archive time-sensitive content when its source changes.",
      actions: [
        "Review the source, audience, format, permission, rights, accessibility, disclosure, destination, approval, and escalation record before publishing.",
        "Test links and completion paths; confirm that program staff can handle the questions, referrals, registrations, applications, or donations the invitation may create.",
        "Respond through documented boundaries, move sensitive cases to an appropriate private channel, and never request unnecessary personal information in public comments.",
        "Record material edits, corrections, takedowns, incidents, recurring questions, downstream actions, and the decision made at the next review.",
      ],
      checkpoint:
        "The organization can show what was published, why, from which source, with which safeguards, who responded, what people did next, what changed, and whether to maintain, revise, pause, or stop the pattern.",
    },
    {
      id: "growing",
      label: "Growing",
      question: "What governance must expand with reach and complexity?",
      guidance:
        "More channels, staff, locations, partners, paid promotion, creators, automation, and audience volume change the risk and operating model. Revalidate authority, source ownership, access, capacity, review levels, account security, data flows, contracts, disclosures, crisis roles, and local context before expanding.",
      actions: [
        "Use role-based account access, multifactor authentication, recovery controls, onboarding, offboarding, and a current account and asset inventory.",
        "Define which content can use a standard review and which requires program, executive, legal, tax, privacy, accessibility, safety, fundraising, or board review.",
        "Give local teams bounded authority while preserving current source facts, required disclosures, protected information, brand standards, and escalation duties.",
        "Compare channels and audiences using consistent definitions and downstream actions; include staff time, paid cost, access barriers, moderation burden, and unintended effects.",
      ],
      checkpoint:
        "The scaled system has current source owners, permission and rights records, secure access, proportionate approval, local adaptation rules, response capacity, comparable evidence, and a tested correction and crisis path.",
    },
  ],
  example: {
    name: "Willow Street Family Resource Network",
    context:
      "This fictional operating nonprofit offers free bilingual benefits-navigation appointments in three ZIP codes. A reviewed program page confirms current eligibility, languages, appointment length, and the request process. The team is planning an eight-week service-access campaign and has capacity for new requests.",
    weakLabel: "Weak post",
    weak: "Families need us now more than ever. We change lives every day. Click here to get help and share this everywhere.",
    strongLabel: "Stronger working draft",
    strong:
      "Have a housing or public-benefits question? Willow Street offers free, confidential 30-minute navigation appointments in English and Spanish for adults in our three service ZIP codes. A navigator can help you understand available options and identify a next step; the service is not legal advice. Review eligibility and request an appointment at the linked service page.",
    reason:
      "The stronger draft names the audience, service, languages, cost, duration, boundary, and action without inventing an outcome. The publishing brief would still need a current link, accessible media, source and claim review, response coverage, and any required permission or disclosure before use.",
  },
  framework: [
    {
      title: "1. Start with audience need and a real outcome",
      instruction:
        "Describe one audience by its relationship to the mission and the information, access, participation, or stewardship need the communication serves. Choose an objective the organization can support beyond the platform.",
      prompt:
        "Who needs what, what should change after the message, and can the organization support that next step?",
    },
    {
      title: "2. Assign each channel a role",
      instruction:
        "Use evidence from listening, prior results, accessibility, language, geography, moderation needs, and team capacity. A channel may inform, invite, respond, document, or strengthen a relationship; it does not need to do everything.",
      prompt:
        "Why is this audience here, what job will the channel do, and who will maintain it?",
    },
    {
      title: "3. Build from a controlled source",
      instruction:
        "Start with current program facts, approved evidence, consented stories, known limitations, and a source owner. Preserve meaning when shortening or adapting the material and flag anything that needs confirmation.",
      prompt:
        "Which current source supports every material fact, date, quote, eligibility rule, claim, and destination?",
    },
    {
      title: "4. Design accessible content and actions",
      instruction:
        "Use plain language, descriptive links, meaningful alternative text, accurate captions and transcripts, sufficient contrast, readable text in images, and an accessible destination. Review automatic text and captions rather than assuming they are correct.",
      prompt:
        "Can people perceive, understand, navigate, and complete the action across relevant access needs and devices?",
    },
    {
      title: "5. Protect people, rights, and trust",
      instruction:
        "Confirm story and media permission, copyright or license, privacy, confidentiality, required disclosures, political or lobbying boundaries, fundraising accuracy, professional limits, and safeguards for minors or sensitive contexts before publication.",
      prompt:
        "Whose story, identity, work, data, safety, rights, or trust could this use affect, and who is qualified to review it?",
    },
    {
      title: "6. Publish, respond, correct, and escalate",
      instruction:
        "Name the publisher, approval owner, response owner, backup, response boundaries, moderation practice, sensitive-case handoff, correction method, and conditions for pausing or escalating. Keep a reviewable record of material decisions.",
      prompt:
        "Who does what before and after publication, and what happens when a fact, comment, request, or incident exceeds routine handling?",
    },
    {
      title: "7. Measure the next step and adapt",
      instruction:
        "Use platform activity as diagnostic evidence, then connect it carefully to the intended destination and action. Review access, questions, completion, workload, cost, unintended effects, and evidence limitations with the people closest to the work.",
      prompt:
        "What happened after attention, what can the evidence not show, and what will the team maintain, revise, pause, or stop?",
    },
  ],
  checklist: [
    "One primary audience, communication need, objective, desired action, destination, owner, and campaign period are explicit.",
    "Each selected platform has a documented audience reason, channel role, maintainable cadence, response owner, and backup.",
    "Every material fact, statistic, date, quote, eligibility statement, outcome, and limitation traces to a current reviewed source.",
    "Stories, names, images, voices, testimonials, and sensitive details have context-specific permission, rights, safe-use limits, review dates, and a withdrawal path where appropriate.",
    "Material relationships, gifts, discounts, paid arrangements, endorsements, and sponsored content receive clear, conspicuous disclosures when required.",
    "Images have meaningful alternative text when needed; video and audio have reviewed captions or transcripts; link text describes the destination; essential text is not image-only.",
    "The destination is current, mobile-usable, accessible, privacy-conscious, and complete enough for a person to understand eligibility, cost, timing, expectations, and next steps.",
    "Publishing, approval, moderation, response, correction, archive, account access, recovery, and escalation responsibilities are assigned.",
    "Sensitive questions move to an appropriate channel, public replies do not request unnecessary personal information, and crisis or safety issues use a tested escalation path.",
    "Political activity, lobbying, fundraising, copyright, privacy, employment, professional, and state-specific questions receive proportionate qualified review.",
    "Campaign links and evidence definitions are consistent, data collection is minimized, and attention metrics are not presented as service or community impact.",
    "The review closes with a documented maintain, revise, pause, expand, archive, or stop decision and the next owner and date.",
  ],
  mistakes: [
    {
      mistake: "Opening accounts on every platform before defining a purpose.",
      correction:
        "Choose a specific audience, outcome, channel role, owner, response obligation, and maintainable test before adding a platform.",
    },
    {
      mistake: "Posting continuously to satisfy an assumed algorithm.",
      correction:
        "Set a cadence from mission moments, audience needs, content quality, response capacity, and team workload; revise it from evidence.",
    },
    {
      mistake: "Turning a complicated source into a confident claim.",
      correction:
        "Preserve definitions, uncertainty, attribution, eligibility, boundaries, and limitations; ask the source owner to review material adaptations.",
    },
    {
      mistake: "Treating a signed release as unlimited story permission.",
      correction:
        "Use understandable, voluntary, context-specific permission and discuss channels, duration, sensitive details, future reuse, withdrawal, and power differences.",
    },
    {
      mistake:
        "Relying on automatic alternative text or captions without review.",
      correction:
        "Write meaningful alternatives and review generated captions for names, technical terms, accents, sound, timing, and context before publishing.",
    },
    {
      mistake:
        "Putting disclosures, limits, or essential instructions where people are unlikely to see them.",
      correction:
        "Keep material information clear, understandable, and close to the relevant claim or endorsement in every format and language used.",
    },
    {
      mistake: "Answering sensitive service questions in public comments.",
      correction:
        "Acknowledge without exposing information, move the person to the approved private or service channel, collect only what is needed, and escalate when appropriate.",
    },
    {
      mistake: "Reporting followers, views, or likes as impact.",
      correction:
        "Name platform activity accurately and connect it cautiously to verified destination use, service access, participation, stewardship, learning, cost, and limitations.",
    },
  ],
  measuresIntroduction:
    "Use measures that explain whether the system served its intended audience and next step. Platform metrics can help diagnose distribution and response, but they do not by themselves establish understanding, access, behavior change, fundraising results, or community impact.",
  measures: [
    "Source integrity: material facts, dates, claims, quotes, limitations, and destinations remain current and traceable; corrections and archives are documented.",
    "Accessible production: reviewed alternative text, captions, transcripts, descriptive links, readable visual text, language access, and destination checks are completed when relevant.",
    "Audience response: recurring questions, confusion, language needs, access barriers, sentiment themes, moderation issues, and response time inform revisions without exposing personal information.",
    "Destination use: trackable visits, completed registrations or requests, resource downloads, referrals, volunteer steps, donations, or partner inquiries are defined and interpreted with known attribution limits.",
    "Permission and trust: story or asset withdrawal, complaints, consent questions, disclosure issues, takedowns, and participant feedback are handled through documented processes.",
    "Capacity and cost: staff and volunteer time, review load, response demand, paid distribution, production cost, tool cost, and opportunity cost remain visible.",
    "Decision use: reviews result in a recorded maintain, revise, pause, expand, archive, or stop decision with the evidence, limitations, owner, and next date.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal learning sequence behind this guide: audience, annual communications rhythm, 90-day focus, key messages, invitations, sustainable cadence, and human-reviewed AI assistance.",
    },
    {
      title:
        "Restriction of Political Campaign Intervention by Section 501(c)(3) Organizations",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/restriction-of-political-campaign-intervention-by-section-501c3-tax-exempt-organizations",
      note: "Current federal tax guidance on prohibited candidate campaign intervention and the facts-and-circumstances distinction for nonpartisan voter education and participation activities.",
    },
    {
      title: "Endorsements, Influencers, and Reviews",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews",
      note: "Current FTC business guidance and links covering endorsements, material connections, reviews, and clear disclosures across social media.",
    },
    {
      title: "Guidelines to Make Your Social Media Platform Accessible",
      publisher: "World Wide Web Consortium",
      url: "https://www.w3.org/WAI/standards-guidelines/atag/social-media/",
      note: "W3C accessibility guidance emphasizing accessible tools and content, including alternative text, captions, transcripts, and descriptions where appropriate.",
    },
    {
      title: "ADA Requirements: Effective Communication",
      publisher: "U.S. Department of Justice",
      url: "https://www.ada.gov/resources/effective-communication/",
      note: "Federal guidance for covered nonprofits on communicating effectively with people who have communication disabilities and providing appropriate auxiliary aids and services.",
    },
    {
      title: "Protecting Personal Information: A Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business",
      note: "Plain-language federal guidance to know what personal information is held, keep only what is needed, protect it, dispose of it securely, and plan for incidents.",
    },
    {
      title: "Copyright Basics",
      publisher: "U.S. Copyright Office",
      url: "https://www.copyright.gov/circs/circ01.pdf",
      note: "Federal overview of copyright protection, ownership, registration, and limits; use qualified review for specific licenses, fair-use questions, or disputed material.",
    },
    {
      title: "Add Alternative Text to Images for Accessibility",
      publisher: "LinkedIn Help",
      url: "https://www.linkedin.com/help/linkedin/answer/a519856/adding-alternative-text-to-images-for-accessibility?lang=en",
      note: "Current platform instructions for adding author-written alternative text to feed images and article images instead of relying only on automatic text.",
    },
    {
      title: "Add Subtitles and Captions",
      publisher: "YouTube Help",
      url: "https://support.google.com/youtube/answer/2734796?hl=en",
      note: "Current platform instructions for uploading, synchronizing, writing, editing, and publishing subtitles and captions for video content.",
    },
  ],
  disclaimer:
    "This educational guide and planning tool do not publish content; connect to, monitor, secure, or approve a social account; verify an audience, source, fact, claim, quote, outcome, testimonial, destination, permission, right, license, disclosure, accessibility feature, privacy practice, political or lobbying activity, fundraising communication, professional statement, or legal requirement; recommend a universal platform or posting frequency; predict reach, engagement, conversion, participation, donations, or impact; or replace current platform instructions and qualified legal, tax, accessibility, privacy, security, copyright, fundraising, employment, safeguarding, program, communications, or board review. Requirements vary by organization, status, activity, audience, content, relationship, funding, profession, data, platform, and state.",
  previous: {
    title: "Brand identity",
    href: "/documentation/tools/brand-identity",
  },
  next: {
    title: "Networking",
    href: "/documentation/tools/networking",
  },
}
