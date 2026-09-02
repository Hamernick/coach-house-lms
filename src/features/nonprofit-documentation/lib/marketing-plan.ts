import type {
  DocumentationStageId,
  MarketingChannelId,
  MarketingObjectiveId,
  MarketingPlanAction,
  MarketingPlanDraft,
  MarketingPlanSummary,
} from "../types"

export const MARKETING_PLAN_STORAGE_KEY =
  "coach-house:documentation:marketing-plan:v1"

export const MARKETING_OBJECTIVES: Array<{
  id: MarketingObjectiveId
  label: string
  description: string
}> = [
  {
    id: "service-access",
    label: "Help people access a service",
    description: "Make eligibility, timing, location, and next steps clear.",
  },
  {
    id: "community-awareness",
    label: "Build community understanding",
    description: "Explain the need, response, evidence, and limits.",
  },
  {
    id: "event-participation",
    label: "Invite event participation",
    description: "Reach the right attendees with accessible logistics.",
  },
  {
    id: "volunteer-recruitment",
    label: "Recruit volunteers",
    description: "Clarify the role, commitment, support, and application path.",
  },
  {
    id: "donor-engagement",
    label: "Engage donors",
    description: "Connect a truthful case with an appropriate next action.",
  },
  {
    id: "partner-development",
    label: "Develop partnerships",
    description: "Show shared value, roles, and a concrete conversation path.",
  },
]

export const MARKETING_CHANNELS: Array<{
  id: MarketingChannelId
  label: string
  description: string
}> = [
  {
    id: "email",
    label: "Email",
    description: "Newsletters, appeals, service updates, and sequences.",
  },
  {
    id: "website",
    label: "Website or long-form",
    description: "Landing pages, program pages, articles, and reports.",
  },
  {
    id: "social",
    label: "Social media",
    description:
      "Platform-native posts, video, stories, and community replies.",
  },
  {
    id: "partners",
    label: "Partner outreach",
    description: "Toolkits, referral messages, shared updates, and briefings.",
  },
  {
    id: "events",
    label: "Events and presentations",
    description: "Information sessions, community events, and speaking.",
  },
  {
    id: "media",
    label: "Earned media",
    description: "Press outreach, interviews, opinion pieces, and podcasts.",
  },
]

export const DEFAULT_MARKETING_PLAN: MarketingPlanDraft = {
  version: 1,
  organizationName: "",
  campaignName: "",
  stage: "exploring",
  objective: "community-awareness",
  primaryAudience: "",
  mainMessage: "",
  proofPoint: "",
  invitation: "",
  channelCadence: {
    email: 0,
    website: 0,
    social: 0,
    partners: 0,
    events: 0,
    media: 0,
  },
  hasStoryPermissionProcess: false,
  hasContentReviewProcess: false,
  hasLinkTrackingConvention: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const OBJECTIVES = MARKETING_OBJECTIVES.map(({ id }) => id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function safeCadence(value: unknown) {
  const cadence = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(cadence)) return 0
  return Math.min(100, Math.max(0, Math.round(cadence)))
}

export function sanitizeMarketingPlan(value: unknown): MarketingPlanDraft {
  if (!isRecord(value)) return DEFAULT_MARKETING_PLAN
  const rawCadence = isRecord(value.channelCadence) ? value.channelCadence : {}
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_MARKETING_PLAN.stage
  const objective = OBJECTIVES.includes(value.objective as MarketingObjectiveId)
    ? (value.objective as MarketingObjectiveId)
    : DEFAULT_MARKETING_PLAN.objective

  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    campaignName: safeText(value.campaignName, 120),
    stage,
    objective,
    primaryAudience: safeText(value.primaryAudience, 280),
    mainMessage: safeText(value.mainMessage, 500),
    proofPoint: safeText(value.proofPoint, 500),
    invitation: safeText(value.invitation, 280),
    channelCadence: Object.fromEntries(
      MARKETING_CHANNELS.map(({ id }) => [id, safeCadence(rawCadence[id])])
    ) as MarketingPlanDraft["channelCadence"],
    hasStoryPermissionProcess: value.hasStoryPermissionProcess === true,
    hasContentReviewProcess: value.hasContentReviewProcess === true,
    hasLinkTrackingConvention: value.hasLinkTrackingConvention === true,
  }
}

export function summarizeMarketingPlan(
  draft: MarketingPlanDraft
): MarketingPlanSummary {
  const cadences = Object.values(draft.channelCadence)
  const monthlyOutputs = cadences.reduce((total, cadence) => total + cadence, 0)
  const ninetyDayOutputs = monthlyOutputs * 3
  return {
    activeChannelCount: cadences.filter((cadence) => cadence > 0).length,
    monthlyOutputs,
    ninetyDayOutputs,
    weeklyPace: ninetyDayOutputs / 13,
    hasCoreBrief: Boolean(
      draft.primaryAudience && draft.mainMessage && draft.invitation
    ),
  }
}

export function marketingObjectiveLabel(objective: MarketingObjectiveId) {
  return (
    MARKETING_OBJECTIVES.find(({ id }) => id === objective)?.label ?? objective
  )
}

const STAGE_ACTIONS: Record<DocumentationStageId, MarketingPlanAction[]> = {
  exploring: [
    {
      id: "exploring-listen",
      phase: "Audience",
      action:
        "Test the language with people closest to the issue before naming a campaign or publishing a broad claim.",
      evidence:
        "Listening notes that separate community language, organization assumptions, unresolved questions, and approved public wording.",
    },
    {
      id: "exploring-path",
      phase: "Foundation",
      action:
        "Choose one audience and one useful next action for this 90-day period.",
      evidence:
        "A named audience, communication need, main message, invitation, and responsible owner.",
    },
  ],
  forming: [
    {
      id: "forming-source",
      phase: "Content",
      action:
        "Create a reviewed source message before adapting it into channel-specific formats.",
      evidence:
        "Mission, program facts, eligibility, dates, approved statistics, limitations, contact path, and version owner.",
    },
    {
      id: "forming-roles",
      phase: "Governance",
      action:
        "Define who may approve facts, stories, images, public responses, and higher-risk communications.",
      evidence:
        "A review matrix with owners, backups, response time, consent records, and escalation conditions.",
    },
  ],
  operating: [
    {
      id: "operating-rhythm",
      phase: "Distribution",
      action:
        "Run a calendar review that protects program capacity and reuses one source message across appropriate channels.",
      evidence:
        "A 90-day calendar with audience, purpose, source, channel, owner, review date, publish date, and status.",
    },
    {
      id: "operating-learn",
      phase: "Measurement",
      action:
        "Review whether the intended audience reached the intended next step, not only whether content received attention.",
      evidence:
        "Consistent campaign links, service or event outcomes, audience questions, qualitative feedback, and documented decisions.",
    },
  ],
  growing: [
    {
      id: "growing-system",
      phase: "Governance",
      action:
        "Maintain a shared source library, permission record, publishing standard, and crisis escalation path across teams.",
      evidence:
        "Current source content, owners, review dates, rights and consent records, channel rules, and archive policy.",
    },
    {
      id: "growing-segments",
      phase: "Measurement",
      action:
        "Compare audience segments and channels using consistent definitions without treating platform reach as community impact.",
      evidence:
        "Segment definitions, comparable campaign tags, downstream actions, access outcomes, costs, and learning notes.",
    },
  ],
}

const CHANNEL_ACTIONS: Record<MarketingChannelId, MarketingPlanAction> = {
  email: {
    id: "channel-email",
    phase: "Distribution",
    action:
      "Confirm sender identity, subject accuracy, postal address, preference or opt-out handling, audience basis, and delivery ownership for email.",
    evidence:
      "Approved template, audience source, send record, suppression handling, tested links, and named reply owner.",
  },
  website: {
    id: "channel-website",
    phase: "Content",
    action:
      "Make the destination page complete, accessible, current, and usable without requiring the visitor to infer the next step.",
    evidence:
      "Page owner, review date, semantic headings, text alternatives, keyboard test, clear instructions, and working completion path.",
  },
  social: {
    id: "channel-social",
    phase: "Distribution",
    action:
      "Adapt the reviewed source to the platform while keeping material relationships, limitations, permissions, and the invitation visible.",
    evidence:
      "Source link, rights and consent record, accessible media, disclosure when applicable, response owner, and archive copy.",
  },
  partners: {
    id: "channel-partners",
    phase: "Audience",
    action:
      "Give partners a compact, accurate toolkit and specify which language may be adapted and which facts must remain unchanged.",
    evidence:
      "Partner brief, audience fit, approved copy, current links, contact, distribution list, and feedback path.",
  },
  events: {
    id: "channel-events",
    phase: "Distribution",
    action:
      "Publish accessible logistics, participation expectations, accommodations, consent practices, and a post-event next step.",
    evidence:
      "Registration flow, accessibility contact, reminder sequence, media notice, attendance record, and follow-up plan.",
  },
  media: {
    id: "channel-media",
    phase: "Content",
    action:
      "Prepare a fact sheet, authorized spokesperson, source citations, boundaries, and correction process before outreach.",
    evidence:
      "Current fact sheet, spokesperson brief, source documents, image rights, inquiry log, and published corrections when needed.",
  },
}

export function buildMarketingActions(
  draft: MarketingPlanDraft
): MarketingPlanAction[] {
  const actions = [...STAGE_ACTIONS[draft.stage]]
  const missing: Array<MarketingPlanAction | false> = [
    !draft.primaryAudience && {
      id: "missing-audience",
      phase: "Audience",
      action: "Name one primary audience for this period.",
      evidence:
        "A specific group described by its relationship to the mission and the information or access need this communication serves.",
    },
    !draft.mainMessage && {
      id: "missing-message",
      phase: "Content",
      action: "Write the one message the audience should understand.",
      evidence:
        "One to three short, sourced sentences using language the audience can understand and verify.",
    },
    !draft.proofPoint && {
      id: "missing-proof",
      phase: "Content",
      action:
        "Attach a current proof point or explicitly state the evidence limit.",
      evidence:
        "A cited program fact, current measure, consented story, or transparent statement that evidence is still being developed.",
    },
    !draft.invitation && {
      id: "missing-invitation",
      phase: "Audience",
      action:
        "Choose one appropriate action the audience can actually complete.",
      evidence:
        "A working destination, eligibility or expectation details, responsible owner, and confirmation path.",
    },
    !draft.hasStoryPermissionProcess && {
      id: "story-permission",
      phase: "Governance",
      action:
        "Establish revocable, context-specific permission before publishing identifiable stories, images, audio, or sensitive details.",
      evidence:
        "Permission scope, participant choice, approved uses, expiration or review date, withdrawal path, and asset record.",
    },
    !draft.hasContentReviewProcess && {
      id: "content-review",
      phase: "Governance",
      action:
        "Create a proportionate review step for facts, accessibility, rights, privacy, disclosures, and higher-risk public claims.",
      evidence:
        "Checklist, reviewer, approval date, source links, changes, and escalation notes.",
    },
    !draft.hasLinkTrackingConvention && {
      id: "link-convention",
      phase: "Measurement",
      action:
        "Adopt one lowercase campaign-link naming convention before distributing trackable links.",
      evidence:
        "Documented source, medium, campaign, and content terms that remain consistent across channels.",
    },
  ]
  actions.push(...missing.filter((item): item is MarketingPlanAction => !!item))

  for (const { id } of MARKETING_CHANNELS) {
    if (draft.channelCadence[id] > 0) actions.push(CHANNEL_ACTIONS[id])
  }
  return actions
}

export function buildMarketingAiPrompt(draft: MarketingPlanDraft) {
  const safe = sanitizeMarketingPlan(draft)
  const activeChannels = MARKETING_CHANNELS.filter(
    ({ id }) => safe.channelCadence[id] > 0
  ).map(({ label, id }) => `${label}: ${safe.channelCadence[id]} per month`)
  return [
    "Create a 90-day nonprofit communications outline from the reviewed source brief below.",
    "",
    `Organization: ${safe.organizationName || "Not provided"}`,
    `Campaign: ${safe.campaignName || "Not provided"}`,
    `Objective: ${marketingObjectiveLabel(safe.objective)}`,
    `Primary audience: ${safe.primaryAudience || "Not provided"}`,
    `Main message: ${safe.mainMessage || "Not provided"}`,
    `Supporting proof: ${safe.proofPoint || "Not provided"}`,
    `Primary invitation: ${safe.invitation || "Not provided"}`,
    `Channels and cadence: ${activeChannels.join("; ") || "Not selected"}`,
    "",
    "Requirements:",
    "- Organize ideas into Inform, Inspire, and Invite.",
    "- Preserve the meaning, uncertainty, and limits of the source brief.",
    "- Do not invent facts, statistics, quotes, outcomes, dates, permissions, testimonials, eligibility, or legal conclusions.",
    "- Mark every missing fact or asset as [NEEDS HUMAN INPUT].",
    "- Recommend accessible text alternatives, captions, link labels, and plain-language revisions.",
    "- Keep each invitation specific, voluntary, and connected to a real destination.",
    "- Return outlines for human review, not ready-to-publish claims.",
  ].join("\n")
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function buildMarketingCsv(draft: MarketingPlanDraft) {
  const summary = summarizeMarketingPlan(draft)
  const rows: Array<Array<string | number>> = [
    ["Field", "Value"],
    ["Organization", draft.organizationName || "Untitled organization"],
    ["Campaign", draft.campaignName || "Untitled campaign"],
    ["Stage", draft.stage],
    ["Objective", marketingObjectiveLabel(draft.objective)],
    ["Primary audience", draft.primaryAudience],
    ["Main message", draft.mainMessage],
    ["Supporting proof", draft.proofPoint],
    ["Primary invitation", draft.invitation],
    ["Active channels", summary.activeChannelCount],
    ["Monthly planned outputs", summary.monthlyOutputs],
    ["Ninety-day planned outputs", summary.ninetyDayOutputs],
    ["Weekly planning pace", summary.weeklyPace.toFixed(1)],
    [],
    ["Channel", "Planned outputs per month", "Planned outputs in 90 days"],
    ...MARKETING_CHANNELS.map(({ id, label }) => [
      label,
      draft.channelCadence[id],
      draft.channelCadence[id] * 3,
    ]),
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildMarketingActions(draft).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
