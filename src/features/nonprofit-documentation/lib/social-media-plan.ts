import { documentationCsvCell } from "./csv-cell"
import type {
  DocumentationStageId,
  SocialMediaChannelId,
  SocialMediaObjectiveId,
  SocialMediaPlanAction,
  SocialMediaPlanDraft,
  SocialMediaPlanSummary,
} from "../types"

export const SOCIAL_MEDIA_PLAN_STORAGE_KEY =
  "coach-house:documentation:social-media-plan:v1"

export const SOCIAL_MEDIA_OBJECTIVES: Array<{
  id: SocialMediaObjectiveId
  label: string
  description: string
}> = [
  {
    id: "service-access",
    label: "Help people access a service",
    description: "Clarify fit, timing, cost, location, and the next step.",
  },
  {
    id: "community-education",
    label: "Support community education",
    description: "Share sourced information with context and limitations.",
  },
  {
    id: "event-participation",
    label: "Invite event participation",
    description: "Make purpose, access, logistics, and registration clear.",
  },
  {
    id: "volunteer-recruitment",
    label: "Recruit volunteers",
    description: "Explain the role, commitment, support, and application path.",
  },
  {
    id: "donor-stewardship",
    label: "Steward donor relationships",
    description: "Connect honest progress and limits to an appropriate action.",
  },
  {
    id: "partner-development",
    label: "Develop partnerships",
    description:
      "Show shared relevance and offer a concrete conversation path.",
  },
]

export const SOCIAL_MEDIA_CHANNELS: Array<{
  id: SocialMediaChannelId
  label: string
  description: string
}> = [
  {
    id: "instagram",
    label: "Instagram",
    description: "Image, carousel, short video, stories, and direct replies.",
  },
  {
    id: "facebook",
    label: "Facebook",
    description: "Community updates, events, groups, video, and replies.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description:
      "Professional learning, partnerships, hiring, and stewardship.",
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Short-form video, captions, context, and comment response.",
  },
  {
    id: "youtube",
    label: "YouTube",
    description: "Short- and long-form video, captions, and descriptions.",
  },
  {
    id: "bluesky",
    label: "Bluesky",
    description: "Short public updates, links, conversation, and replies.",
  },
  {
    id: "other",
    label: "Other platform",
    description: "A channel selected from audience evidence and team capacity.",
  },
]

export const SOCIAL_MEDIA_CAMPAIGN_WEEKS = [4, 8, 12] as const

export const DEFAULT_SOCIAL_MEDIA_PLAN: SocialMediaPlanDraft = {
  version: 1,
  organizationName: "",
  campaignName: "",
  stage: "exploring",
  objective: "community-education",
  campaignWeeks: 8,
  primaryAudience: "",
  desiredAction: "",
  destinationUrl: "",
  mainMessage: "",
  sourceEvidence: "",
  storyPermissionContext: "",
  voiceGuidance: "",
  postCopy: "",
  visualDescription: "",
  alternativeText: "",
  captionsPlan: "",
  linkLabel: "",
  responseProtocol: "",
  approvalOwner: "",
  escalationOwner: "",
  previewChannel: "instagram",
  channelCadence: {
    instagram: 0,
    facebook: 0,
    linkedin: 0,
    tiktok: 0,
    youtube: 0,
    bluesky: 0,
    other: 0,
  },
  hasStoryPermissionReview: false,
  hasClaimSourceReview: false,
  hasAccessibilityReview: false,
  hasApprovalEscalationPlan: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const OBJECTIVES = SOCIAL_MEDIA_OBJECTIVES.map(({ id }) => id)
const CHANNELS = SOCIAL_MEDIA_CHANNELS.map(({ id }) => id)

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

export function sanitizeSocialMediaPlan(value: unknown): SocialMediaPlanDraft {
  if (!isRecord(value)) return DEFAULT_SOCIAL_MEDIA_PLAN
  const rawCadence = isRecord(value.channelCadence) ? value.channelCadence : {}
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_SOCIAL_MEDIA_PLAN.stage
  const objective = OBJECTIVES.includes(
    value.objective as SocialMediaObjectiveId
  )
    ? (value.objective as SocialMediaObjectiveId)
    : DEFAULT_SOCIAL_MEDIA_PLAN.objective
  const previewChannel = CHANNELS.includes(
    value.previewChannel as SocialMediaChannelId
  )
    ? (value.previewChannel as SocialMediaChannelId)
    : DEFAULT_SOCIAL_MEDIA_PLAN.previewChannel
  const campaignWeeks = SOCIAL_MEDIA_CAMPAIGN_WEEKS.includes(
    value.campaignWeeks as 4 | 8 | 12
  )
    ? (value.campaignWeeks as 4 | 8 | 12)
    : DEFAULT_SOCIAL_MEDIA_PLAN.campaignWeeks

  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    campaignName: safeText(value.campaignName, 120),
    stage,
    objective,
    campaignWeeks,
    primaryAudience: safeText(value.primaryAudience, 400),
    desiredAction: safeText(value.desiredAction, 300),
    destinationUrl: safeText(value.destinationUrl, 1000),
    mainMessage: safeText(value.mainMessage, 700),
    sourceEvidence: safeText(value.sourceEvidence, 900),
    storyPermissionContext: safeText(value.storyPermissionContext, 700),
    voiceGuidance: safeText(value.voiceGuidance, 400),
    postCopy: safeText(value.postCopy, 2200),
    visualDescription: safeText(value.visualDescription, 700),
    alternativeText: safeText(value.alternativeText, 700),
    captionsPlan: safeText(value.captionsPlan, 700),
    linkLabel: safeText(value.linkLabel, 160),
    responseProtocol: safeText(value.responseProtocol, 700),
    approvalOwner: safeText(value.approvalOwner, 240),
    escalationOwner: safeText(value.escalationOwner, 240),
    previewChannel,
    channelCadence: Object.fromEntries(
      SOCIAL_MEDIA_CHANNELS.map(({ id }) => [id, safeCadence(rawCadence[id])])
    ) as SocialMediaPlanDraft["channelCadence"],
    hasStoryPermissionReview: value.hasStoryPermissionReview === true,
    hasClaimSourceReview: value.hasClaimSourceReview === true,
    hasAccessibilityReview: value.hasAccessibilityReview === true,
    hasApprovalEscalationPlan: value.hasApprovalEscalationPlan === true,
  }
}

const DRAFT_AREAS: Array<keyof SocialMediaPlanDraft> = [
  "primaryAudience",
  "desiredAction",
  "destinationUrl",
  "mainMessage",
  "sourceEvidence",
  "storyPermissionContext",
  "voiceGuidance",
  "postCopy",
  "visualDescription",
  "alternativeText",
  "captionsPlan",
  "linkLabel",
  "responseProtocol",
  "approvalOwner",
  "escalationOwner",
]

export function summarizeSocialMediaPlan(
  draft: SocialMediaPlanDraft
): SocialMediaPlanSummary {
  const cadences = Object.values(draft.channelCadence)
  return {
    activeChannelCount: cadences.filter((value) => value > 0).length,
    weeklyOutputs: cadences.reduce((total, value) => total + value, 0),
    campaignOutputs:
      cadences.reduce((total, value) => total + value, 0) * draft.campaignWeeks,
    draftedAreaCount: DRAFT_AREAS.filter((key) => String(draft[key]).trim())
      .length,
    totalAreaCount: DRAFT_AREAS.length,
    safeguardCount: [
      draft.hasStoryPermissionReview,
      draft.hasClaimSourceReview,
      draft.hasAccessibilityReview,
      draft.hasApprovalEscalationPlan,
    ].filter(Boolean).length,
    totalSafeguardCount: 4,
  }
}

export function socialMediaChannelLabel(channel: SocialMediaChannelId) {
  return (
    SOCIAL_MEDIA_CHANNELS.find(({ id }) => id === channel)?.label ?? channel
  )
}

export function socialMediaObjectiveLabel(objective: SocialMediaObjectiveId) {
  return (
    SOCIAL_MEDIA_OBJECTIVES.find(({ id }) => id === objective)?.label ??
    objective
  )
}

function campaignSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "nonprofit-campaign"
  )
}

export type SocialTrackedLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export function buildTrackedSocialUrl(
  destination: string,
  channel: SocialMediaChannelId,
  campaignName: string
): SocialTrackedLinkResult {
  if (!destination.trim()) {
    return { ok: false, error: "Add an HTTP or HTTPS destination." }
  }
  try {
    const url = new URL(destination.trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, error: "Only HTTP and HTTPS destinations are used." }
    }
    url.searchParams.set("utm_source", channel)
    url.searchParams.set("utm_medium", "social")
    url.searchParams.set("utm_campaign", campaignSlug(campaignName))
    return { ok: true, url: url.toString() }
  } catch {
    return { ok: false, error: "Add a complete, valid destination URL." }
  }
}

const STAGE_ACTIONS: Record<DocumentationStageId, SocialMediaPlanAction[]> = {
  exploring: [
    {
      id: "stage-exploring",
      phase: "Audience",
      action:
        "Test one audience need, message, invitation, destination, and channel role before increasing cadence.",
      evidence:
        "Listening notes, source material, a bounded campaign period, responsible owner, and a documented decision about what to change next.",
    },
  ],
  forming: [
    {
      id: "stage-forming",
      phase: "Publishing",
      action:
        "Create the source, permission, accessibility, approval, response, correction, and escalation system before publishing regularly.",
      evidence:
        "Current source library, review checklist, role matrix, account inventory, permission records, response boundaries, and backups.",
    },
  ],
  operating: [
    {
      id: "stage-operating",
      phase: "Learning",
      action:
        "Review the full path from source to post to destination to response and use the evidence to maintain, revise, pause, or stop.",
      evidence:
        "Published record, corrections, questions, access issues, downstream actions, workload, cost, limitations, decision, and next date.",
    },
  ],
  growing: [
    {
      id: "stage-growing",
      phase: "Publishing",
      action:
        "Revalidate governance, security, review levels, local adaptation, contracts, disclosures, and response capacity before expanding channels or automation.",
      evidence:
        "Role-based access, recovery controls, source ownership, permission and rights records, risk-based approvals, comparable measures, and tested escalation.",
    },
  ],
}

export function buildSocialMediaActions(
  draft: SocialMediaPlanDraft
): SocialMediaPlanAction[] {
  const actions = [...STAGE_ACTIONS[draft.stage]]
  const missing: Array<SocialMediaPlanAction | false> = [
    !draft.primaryAudience && {
      id: "missing-audience",
      phase: "Audience",
      action: "Name one primary audience and the need this content serves.",
      evidence:
        "A specific group, its relationship to the mission, its language and access needs, and the basis for the channel choice.",
    },
    (!draft.mainMessage || !draft.sourceEvidence) && {
      id: "missing-source",
      phase: "Source",
      action:
        "Connect the main message to a current source or state the evidence limit.",
      evidence:
        "Source title or location, owner, review date, approved facts, definitions, limitations, and unresolved questions.",
    },
    (!draft.desiredAction || !draft.destinationUrl) && {
      id: "missing-action",
      phase: "Purpose",
      action: "Define one useful action and the real destination for it.",
      evidence:
        "Clear action, working destination, eligibility or expectations, accessibility, privacy, capacity, owner, and confirmation path.",
    },
    (!draft.alternativeText || !draft.captionsPlan || !draft.linkLabel) && {
      id: "missing-access",
      phase: "Access",
      action:
        "Complete the relevant alternative text, caption or transcript, and descriptive link plan.",
      evidence:
        "Human-reviewed alternatives that preserve meaning and a tested accessible destination; omit alternatives that are not relevant and document why.",
    },
    (!draft.responseProtocol ||
      !draft.approvalOwner ||
      !draft.escalationOwner) && {
      id: "missing-ownership",
      phase: "Response",
      action:
        "Assign approval, response boundaries, moderation, correction, and escalation ownership.",
      evidence:
        "Named owner and backup, response timing, sensitive-case handoff, pause conditions, correction method, and record location.",
    },
    (!draft.hasStoryPermissionReview ||
      !draft.hasClaimSourceReview ||
      !draft.hasAccessibilityReview ||
      !draft.hasApprovalEscalationPlan) && {
      id: "remaining-safeguards",
      phase: "Publishing",
      action:
        "Complete the remaining safeguards that apply before treating this brief as reviewable.",
      evidence:
        "Permission and rights, source and claim, accessibility, and approval or escalation decisions with reviewer, date, and open questions.",
    },
  ]
  actions.push(
    ...missing.filter((item): item is SocialMediaPlanAction => !!item)
  )
  return actions
}

export function buildSocialMediaReviewPrompt(draft: SocialMediaPlanDraft) {
  const safe = sanitizeSocialMediaPlan(draft)
  const channels = SOCIAL_MEDIA_CHANNELS.filter(
    ({ id }) => safe.channelCadence[id] > 0
  ).map(({ id, label }) => `${label}: ${safe.channelCadence[id]} per week`)
  const tracked = buildTrackedSocialUrl(
    safe.destinationUrl,
    safe.previewChannel,
    safe.campaignName
  )
  return [
    "Review this nonprofit social media brief for human decision-making.",
    "",
    `Organization: ${safe.organizationName || "Not provided"}`,
    `Campaign: ${safe.campaignName || "Not provided"}`,
    `Stage: ${safe.stage}`,
    `Objective: ${socialMediaObjectiveLabel(safe.objective)}`,
    `Campaign period: ${safe.campaignWeeks} weeks`,
    `Primary audience: ${safe.primaryAudience || "Not provided"}`,
    `Desired action: ${safe.desiredAction || "Not provided"}`,
    `Destination: ${safe.destinationUrl || "Not provided"}`,
    `Tracked preview: ${tracked.ok ? tracked.url : tracked.error}`,
    `Main message: ${safe.mainMessage || "Not provided"}`,
    `Source or evidence: ${safe.sourceEvidence || "Not provided"}`,
    `Story and permission context: ${safe.storyPermissionContext || "Not provided"}`,
    `Voice guidance: ${safe.voiceGuidance || "Not provided"}`,
    `Draft post: ${safe.postCopy || "Not provided"}`,
    `Visual direction: ${safe.visualDescription || "Not provided"}`,
    `Alternative text: ${safe.alternativeText || "Not provided"}`,
    `Captions or transcript plan: ${safe.captionsPlan || "Not provided"}`,
    `Descriptive link label: ${safe.linkLabel || "Not provided"}`,
    `Response protocol: ${safe.responseProtocol || "Not provided"}`,
    `Approval owner: ${safe.approvalOwner || "Not provided"}`,
    `Escalation owner: ${safe.escalationOwner || "Not provided"}`,
    `Channels and user-entered cadence: ${channels.join("; ") || "None selected"}`,
    "",
    "Requirements:",
    "- Preserve the source meaning, definitions, uncertainty, limitations, eligibility, and boundaries.",
    "- Do not invent facts, outcomes, quotes, dates, links, permissions, legal status, platform rules, capacity, disclosures, or audience needs.",
    "- Mark every missing or unverified statement as [NEEDS HUMAN INPUT].",
    "- Identify questions for source, permission, rights, accessibility, privacy, disclosure, political, fundraising, professional, approval, response, and escalation review without making legal conclusions.",
    "- Suggest plain-language and accessible revisions, including meaningful alternative text, accurate captions or transcripts, and descriptive links when relevant.",
    "- Return a review table and options. Do not publish, approve, score, predict performance, or present a final post as verified.",
  ].join("\n")
}

function csvCell(value: string | number) {
  return documentationCsvCell(value)
}

export function buildSocialMediaCsv(draft: SocialMediaPlanDraft) {
  const summary = summarizeSocialMediaPlan(draft)
  const tracked = buildTrackedSocialUrl(
    draft.destinationUrl,
    draft.previewChannel,
    draft.campaignName
  )
  const rows: Array<Array<string | number>> = [
    ["Area", "Working social media brief"],
    ["Organization", draft.organizationName],
    ["Campaign", draft.campaignName],
    ["Stage", draft.stage],
    ["Objective", socialMediaObjectiveLabel(draft.objective)],
    ["Campaign weeks", draft.campaignWeeks],
    ["Primary audience", draft.primaryAudience],
    ["Desired action", draft.desiredAction],
    ["Destination URL", draft.destinationUrl],
    ["Tracked preview", tracked.ok ? tracked.url : tracked.error],
    ["Main message", draft.mainMessage],
    ["Source or evidence", draft.sourceEvidence],
    ["Story and permission context", draft.storyPermissionContext],
    ["Voice guidance", draft.voiceGuidance],
    ["Draft post", draft.postCopy],
    ["Visual direction", draft.visualDescription],
    ["Alternative text", draft.alternativeText],
    ["Captions or transcript plan", draft.captionsPlan],
    ["Descriptive link label", draft.linkLabel],
    ["Response protocol", draft.responseProtocol],
    ["Approval owner", draft.approvalOwner],
    ["Escalation owner", draft.escalationOwner],
    ["Active channels", summary.activeChannelCount],
    ["Weekly planned outputs", summary.weeklyOutputs],
    ["Campaign planned outputs", summary.campaignOutputs],
    [
      "Drafted areas",
      `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
    ],
    [
      "Safeguards selected",
      `${summary.safeguardCount} of ${summary.totalSafeguardCount}`,
    ],
    [],
    ["Channel", "User-entered outputs per week", "Campaign outputs"],
    ...SOCIAL_MEDIA_CHANNELS.map(({ id, label }) => [
      label,
      draft.channelCadence[id],
      draft.channelCadence[id] * draft.campaignWeeks,
    ]),
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildSocialMediaActions(draft).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
