import type { BestPracticeArticle } from "../types"

export const MARKETING_ARTICLE: BestPracticeArticle = {
  slug: "best-practices/marketing",
  navigationTitle: "Marketing",
  title: "Build nonprofit marketing around audience access and trust",
  description:
    "A practical U.S. nonprofit marketing guide covering audience strategy, clear messages, ethical storytelling, accessible content, sustainable channels, campaign measurement, and responsible AI use.",
  eyebrow: "Best practices · Marketing",
  answer:
    "Nonprofit marketing is the disciplined work of helping a specific audience understand, access, trust, or participate in mission-aligned work through truthful messages, appropriate invitations, accessible channels, and a repeatable learning system.",
  readingTime: "15 minute read",
  reviewedDate: "September 2, 2026",
  publishedDate: "2026-09-02",
  modifiedDate: "2026-09-02",
  labels: {
    definition: "What a complete nonprofit marketing system includes",
    stages: "Build for the organization you have now",
    example: "Fictional example",
    framework: "A seven-part communications cycle",
    checklist: "Core nonprofit marketing checklist",
    mistakes: "Common marketing failures",
    measures: "Evidence that communication is helping",
  },
  definition:
    "Nonprofit marketing includes listening to people, defining an audience and communication objective, maintaining accurate source messages, creating and distributing accessible content, managing rights and permissions, responding to the public, measuring meaningful next actions, and improving the system. Branding, social media, email, websites, events, public relations, and advertising are channels or disciplines inside that system—not the strategy by themselves.",
  whyItMatters: [
    "People cannot use a service, attend a program, support a cause, or build a partnership when eligibility, location, timing, expectations, and next steps are unclear or inaccessible.",
    "Public communication creates promises. Program facts, statistics, testimonials, images, endorsements, deadlines, and calls to action need sources, appropriate permission, review, and correction paths.",
    "Different audiences need different context and invitations. Adapting a reviewed source message is useful; changing facts, overstating results, or flattening community voice is not.",
    "Attention is not impact. Reach, views, and clicks may help diagnose distribution, but the mission question is whether the intended audience understood or completed a useful next step.",
  ],
  importantNote:
    "A content calendar is a delivery plan, not proof of audience understanding or mission impact. Keep planned outputs, delivered content, audience response, completed actions, service access, and outcomes in distinct evidence states.",
  stages: [
    {
      id: "exploring",
      label: "Exploring",
      question: "Whose understanding or access would this communication serve?",
      guidance:
        "Begin with listening rather than a logo, channel, or campaign name. Test how people closest to the issue describe the need, which information is missing, which language creates barriers, and what next step would actually help.",
      actions: [
        "Interview or listen with intended participants, community members, partners, and people who may be excluded by the current language or channel.",
        "Name one primary audience, one communication need, and one appropriate action for a short test period.",
        "Record which statements are community language, organizational assumptions, sourced facts, unresolved questions, and language approved for public use.",
      ],
      checkpoint:
        "You can explain who the communication is for, what they need, what they should understand, and what useful action is available without claiming the audience agrees.",
    },
    {
      id: "forming",
      label: "Forming",
      question: "Can the organization publish one accurate source message?",
      guidance:
        "Connect mission, program facts, eligibility, evidence, voice, rights, consent, accessibility, and review ownership before multiplying content. A durable source message makes channel adaptation faster and safer.",
      actions: [
        "Create a source brief covering audience, objective, main message, supporting proof, limits, invitation, contact, and review date.",
        "Define who approves program facts, images, stories, statistics, public positions, partner references, and higher-risk claims.",
        "Establish story permission, asset rights, accessibility, email preference, public response, correction, and archive practices appropriate to the work.",
      ],
      checkpoint:
        "The organization can show where each important claim came from, who approved it, which assets may be used, and how the audience can complete the promised next step.",
    },
    {
      id: "operating",
      label: "Operating",
      question: "Can the team sustain a useful communications rhythm?",
      guidance:
        "Plan around mission moments and audience needs, not the pressure to remain constantly visible. Use a focused 90-day period, choose channels the team can maintain, reuse reviewed source content, and assign publication and response ownership.",
      actions: [
        "Map annual program seasons, service deadlines, reporting milestones, community moments, fundraising periods, and natural opportunities to inform, inspire, or invite.",
        "Maintain a calendar with audience, objective, source, channel, owner, reviewer, publish date, destination, response plan, and status.",
        "Review accessibility, permissions, current facts, disclosures, link tracking, audience questions, completed actions, and follow-up at a predictable cadence.",
      ],
      checkpoint:
        "Published content has a source, owner, accessible format, real destination, response path, and evidence state; no critical step depends on one person’s memory.",
    },
    {
      id: "growing",
      label: "Growing",
      question:
        "Can more communication improve access without weakening trust?",
      guidance:
        "Growth requires shared governance, segment definitions, permissions, records, consistent campaign naming, crisis escalation, and capacity decisions. Add channels only when the organization can maintain quality and public response.",
      actions: [
        "Maintain a source library with owners, citations, permissions, review dates, approved uses, archive rules, and correction history.",
        "Compare audience segments and channels using consistent definitions, downstream actions, access outcomes, full costs, and qualitative feedback.",
        "Set escalation paths for safety, privacy, misinformation, political activity, media inquiries, complaints, accessibility barriers, and public corrections.",
      ],
      checkpoint:
        "Leadership can explain which audiences are being served, which channels help, which risks require review, what the system costs, and what evidence justifies the next expansion.",
    },
  ],
  example: {
    name: "Illustrative example: Willow Street Family Resource Network",
    context:
      "A fictional operating nonprofit wants more neighborhood families to use free legal-navigation appointments during a 90-day enrollment period. Community partners report that people are unsure whether the service is free, confidential, or available without an existing court case.",
    weakLabel: "Reactive campaign",
    weak: "Post every day on every platform about our life-changing services and ask people to share.",
    strongLabel: "Reviewable campaign",
    strong:
      "Prioritize adults in the three service ZIP codes who have a housing or benefits question. Repeat one plain-language message about cost, confidentiality, eligibility, and appointment steps; use a reviewed service page, two partner updates per month, one email per month, and two social posts per week; track completed appointment requests and recurring questions.",
    reason:
      "The reviewable version connects a real audience barrier to sourced information, a usable invitation, maintainable channels, a response owner, and downstream evidence. It does not promise a legal result or treat views as service access.",
  },
  framework: [
    {
      title: "Listen and define the audience",
      instruction:
        "Use community language, access barriers, relationship context, and the decisions people face to define a priority audience without stereotyping it.",
      prompt:
        "Who needs what information or access, and what have they told us?",
    },
    {
      title: "Choose one objective",
      instruction:
        "Name the understanding, access, participation, relationship, or support decision this communication should enable.",
      prompt:
        "What should become clearer or easier because this communication exists?",
    },
    {
      title: "Maintain the source message",
      instruction:
        "Keep current mission language, program facts, eligibility, evidence, limits, dates, contacts, and citations in one reviewed source.",
      prompt: "Which statements can we prove, and when must they be reviewed?",
    },
    {
      title: "Inform, inspire, and invite",
      instruction:
        "Separate what the audience needs to know, what can build truthful connection, and what voluntary next action is available.",
      prompt:
        "What should they understand, what earns attention or belief, and what can they do?",
    },
    {
      title: "Choose sustainable channels",
      instruction:
        "Select channels by audience use, accessibility, relationship context, team capacity, cost, response expectations, and ability to maintain them.",
      prompt: "Which small channel mix can we publish and steward well?",
    },
    {
      title: "Review and distribute",
      instruction:
        "Check facts, permissions, rights, accessibility, disclosures, political or legal risk, links, and response ownership before publication.",
      prompt: "What must be true, approved, usable, and ready before release?",
    },
    {
      title: "Measure the next step and learn",
      instruction:
        "Connect delivery metrics to audience questions, completed actions, service access, partner response, cost, and documented changes.",
      prompt: "What happened after attention, and what should the team change?",
    },
  ],
  checklist: [
    "The campaign names one primary audience and the access, understanding, participation, or relationship need being served.",
    "The main message and invitation are specific, plain-language, current, and connected to a real destination.",
    "Important facts, statistics, outcomes, quotes, dates, eligibility statements, and partner claims have reviewable sources.",
    "Stories, images, audio, testimonials, and community details have appropriate permission, rights, context, and withdrawal or correction paths.",
    "Content provides text alternatives, captions, semantic structure, keyboard access, clear instructions, sufficient contrast, and nonvisual status cues.",
    "Email, endorsements, sponsorships, public policy content, and child-directed activity receive the legal or policy review appropriate to the organization and context.",
    "The channel mix and cadence fit actual staff capacity, audience habits, accessibility needs, and public response expectations.",
    "Every item has a source, audience, objective, owner, reviewer, date, destination, response path, and archive location.",
    "Campaign measurement distinguishes delivery, attention, engagement, completed actions, access, outcomes, costs, and qualitative learning.",
    "AI-assisted work preserves source meaning, marks missing information, receives human review, and never manufactures permission or evidence.",
  ],
  mistakes: [
    {
      mistake: "Starting with platforms or posting frequency.",
      correction:
        "Define the audience need, objective, source message, invitation, and capacity first. A channel is useful only when it helps the intended audience complete a useful next step.",
    },
    {
      mistake: "Trying to speak to everyone in one message.",
      correction:
        "Keep the underlying facts consistent, then adapt context, language, detail, channel, and invitation for a defined audience.",
    },
    {
      mistake: "Treating a participant story as organizational property.",
      correction:
        "Use a permission process that explains purpose, audience, channels, duration, sensitive details, editing, withdrawal, and alternatives to public identification.",
    },
    {
      mistake: "Using inaccessible graphics as the only source of information.",
      correction:
        "Publish equivalent text, meaningful alternatives, captions or transcripts, semantic structure, readable contrast, and a keyboard-usable destination.",
    },
    {
      mistake: "Counting reach, impressions, or followers as impact.",
      correction:
        "Use attention metrics to diagnose distribution, then examine audience understanding, completed actions, access, cost, outcomes, and feedback separately.",
    },
    {
      mistake: "Asking AI to fill gaps in the organization’s story.",
      correction:
        "Give AI reviewed source material and explicit constraints. Require missing information to be marked for human input and verify every claim, quote, date, permission, and destination before use.",
    },
  ],
  measuresIntroduction:
    "Measure the pathway from delivery to useful action. Define each measure before comparing campaigns, and interpret quantitative signals with audience feedback and access conditions.",
  measures: [
    "Delivery reliability: planned communications published accurately, accessibly, and on time, with working destinations and response ownership.",
    "Audience relevance: feedback, questions, search terms, partner observations, and comprehension checks showing what the intended audience understood or could not use.",
    "Invitation completion: registrations, service requests, subscriptions, volunteer applications, donations, referrals, or partner conversations attributable to a defined campaign path.",
    "Access quality: completion, abandonment, accommodation requests, language needs, device barriers, eligibility confusion, and time required to reach the promised next step.",
    "Channel efficiency: downstream actions and learning reviewed with direct cost, staff time, response workload, and audience fit—not gross reach alone.",
    "Trust and governance: permissions current, corrections resolved, preferences honored, complaints answered, sources reviewed, and risky exceptions escalated on time.",
  ],
  sources: [
    {
      title: "Coach House Accelerator",
      publisher: "Coach House",
      url: "https://coachhouse.app/accelerator",
      note: "The internal sequence behind this guide: audience, Inform–Inspire–Invite, annual rhythm, 90-day focus, sustainable cadence, and reviewed AI assistance.",
    },
    {
      title: "CDC Clear Communication Index",
      publisher: "Centers for Disease Control and Prevention",
      url: "https://www.cdc.gov/ccindex/ccindex.html",
      note: "A research-based framework for audience, communication objective, main message, call to action, numbers, and risk communication.",
    },
    {
      title: "Guidance on Web Accessibility and the ADA",
      publisher: "U.S. Department of Justice",
      url: "https://www.ada.gov/resources/web-guidance/",
      note: "Federal guidance on common web barriers, effective communication, keyboard access, captions, forms, contrast, and accessibility review.",
    },
    {
      title: "Web Content Accessibility Guidelines 2.2",
      publisher: "World Wide Web Consortium",
      url: "https://www.w3.org/TR/WCAG22/",
      note: "The current technical accessibility recommendation referenced for perceivable, operable, understandable, and robust web content.",
    },
    {
      title: "CAN-SPAM Act: A Compliance Guide for Business",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
      note: "Official starting point for commercial-email sender identity, subjects, address, opt-out, vendor oversight, and message classification.",
    },
    {
      title: "Disclosures 101 for Social Media Influencers",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers",
      note: "Plain-language guidance for clear disclosure of material connections and truthful endorsement claims.",
    },
    {
      title: "What is Copyright?",
      publisher: "U.S. Copyright Office",
      url: "https://www.copyright.gov/what-is-copyright/",
      note: "A federal overview of protected works, ownership, exclusive rights, agreements, exceptions, and limitations.",
    },
    {
      title: "Restriction of political campaign intervention",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/charitable-organizations/restriction-of-political-campaign-intervention-by-section-501c3-tax-exempt-organizations",
      note: "Federal tax guidance on the section 501(c)(3) prohibition against participating or intervening in campaigns for public office.",
    },
    {
      title: "Lobbying",
      publisher: "Internal Revenue Service",
      url: "https://www.irs.gov/charities-non-profits/lobbying",
      note: "A starting point for distinguishing educational public-policy communication from attempts to influence legislation and for understanding applicable limits.",
    },
    {
      title: "Collect campaign data with custom URLs",
      publisher: "Google Analytics Help",
      url: "https://support.google.com/analytics/answer/10917952",
      note: "Documentation for consistent source, medium, campaign, and content parameters in trackable campaign links.",
    },
  ],
  disclaimer:
    "This guide provides general educational information for U.S. nonprofit communications. It does not determine whether a message is commercial email, advertising, lobbying, political campaign intervention, subject to a privacy rule, accessible under a particular law, properly licensed, or permitted for publication. Requirements depend on entity type, jurisdiction, audience, content, channel, funding, relationship, and facts. Confirm current law, contracts, platform terms, funder restrictions, and professional advice for the specific communication.",
  previous: {
    title: "Fundraising",
    href: "/documentation/best-practices/fundraising",
  },
  next: { title: "Frameworks" },
}
