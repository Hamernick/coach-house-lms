import { documentationCsvCell } from "./csv-cell"
import type {
  CampaignPlanAction,
  CampaignPlanDraft,
  CampaignPlanSummary,
  CampaignTypeId,
} from "../campaign-types"
import type { DocumentationStageId } from "../types"

export const CAMPAIGN_PLAN_STORAGE_KEY =
  "coach-house:documentation:campaign-plan:v1"

export const CAMPAIGN_TYPES: Array<{
  id: CampaignTypeId
  label: string
  description: string
}> = [
  {
    id: "awareness-education",
    label: "Awareness or public education",
    description:
      "Help a defined audience understand a sourced issue or option.",
  },
  {
    id: "service-access",
    label: "Service access",
    description: "Help eligible people find, understand, and use a service.",
  },
  {
    id: "fundraising",
    label: "Fundraising",
    description: "Invite support for a truthful, specific charitable need.",
  },
  {
    id: "advocacy-lobbying",
    label: "Advocacy or lobbying",
    description: "Advance a public-policy objective with qualified review.",
  },
  {
    id: "civic-participation",
    label: "Nonpartisan civic participation",
    description: "Support public participation without candidate intervention.",
  },
  {
    id: "volunteer-recruitment",
    label: "Volunteer recruitment",
    description: "Invite people into a defined, supported volunteer role.",
  },
  {
    id: "event",
    label: "Event participation",
    description: "Move a relevant audience from invitation to attendance.",
  },
  {
    id: "partnership",
    label: "Partner activation",
    description: "Coordinate organizations around a bounded shared action.",
  },
]

export const CAMPAIGN_PATHWAY: Array<{
  id: CampaignPlanAction["phase"]
  label: string
  description: string
  fields: Array<keyof CampaignPlanDraft>
}> = [
  {
    id: "Frame",
    label: "Frame",
    description: "Name the objective and one observable action.",
    fields: ["objective", "desiredAction"],
  },
  {
    id: "Listen",
    label: "Listen",
    description: "Define the audience from evidence, not assumption.",
    fields: ["primaryAudience", "audienceEvidence"],
  },
  {
    id: "Build",
    label: "Build",
    description: "Connect message, proof, destination, and channel roles.",
    fields: [
      "mainMessage",
      "supportingEvidence",
      "offerDestination",
      "channelRoles",
    ],
  },
  {
    id: "Review",
    label: "Review",
    description: "Check authority, access, consent, privacy, and requirements.",
    fields: [
      "ownersApprovals",
      "accessibilityLanguage",
      "consentPrivacy",
      "complianceReview",
    ],
  },
  {
    id: "Launch",
    label: "Launch",
    description: "Match milestones and scope to real capacity.",
    fields: ["timelineMilestones", "budgetCapacity"],
  },
  {
    id: "Respond",
    label: "Respond",
    description: "Assign response, correction, pause, and escalation paths.",
    fields: ["responseEscalation"],
  },
  {
    id: "Learn",
    label: "Learn",
    description: "Define evidence and the decision it will inform.",
    fields: ["measurementPlan", "learningDecision"],
  },
]

export const DEFAULT_CAMPAIGN_PLAN: CampaignPlanDraft = {
  version: 1,
  organizationName: "",
  campaignName: "",
  stage: "exploring",
  campaignType: "awareness-education",
  startDate: "",
  endDate: "",
  objective: "",
  primaryAudience: "",
  audienceEvidence: "",
  desiredAction: "",
  mainMessage: "",
  supportingEvidence: "",
  offerDestination: "",
  channelRoles: "",
  timelineMilestones: "",
  budgetCapacity: "",
  ownersApprovals: "",
  accessibilityLanguage: "",
  consentPrivacy: "",
  complianceReview: "",
  responseEscalation: "",
  measurementPlan: "",
  learningDecision: "",
  hasClaimReview: false,
  hasAccessibilityReview: false,
  hasConsentPrivacyReview: false,
  hasLegalChannelReview: false,
  hasDeliveryCapacityReview: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const TYPE_IDS = CAMPAIGN_TYPES.map(({ id }) => id)
const TEXT_LIMITS: Partial<Record<keyof CampaignPlanDraft, number>> = {
  organizationName: 120,
  campaignName: 140,
  startDate: 10,
  endDate: 10,
  objective: 700,
  primaryAudience: 700,
  audienceEvidence: 900,
  desiredAction: 600,
  mainMessage: 700,
  supportingEvidence: 900,
  offerDestination: 800,
  channelRoles: 900,
  timelineMilestones: 900,
  budgetCapacity: 800,
  ownersApprovals: 800,
  accessibilityLanguage: 800,
  consentPrivacy: 800,
  complianceReview: 900,
  responseEscalation: 800,
  measurementPlan: 900,
  learningDecision: 700,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function safeDate(value: unknown) {
  const text = safeText(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : ""
}

export function sanitizeCampaignPlan(value: unknown): CampaignPlanDraft {
  if (!isRecord(value)) return DEFAULT_CAMPAIGN_PLAN
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_CAMPAIGN_PLAN.stage
  const campaignType = TYPE_IDS.includes(value.campaignType as CampaignTypeId)
    ? (value.campaignType as CampaignTypeId)
    : DEFAULT_CAMPAIGN_PLAN.campaignType
  const text = (key: keyof CampaignPlanDraft) =>
    safeText(value[key], TEXT_LIMITS[key] ?? 900)

  return {
    version: 1,
    organizationName: text("organizationName"),
    campaignName: text("campaignName"),
    stage,
    campaignType,
    startDate: safeDate(value.startDate),
    endDate: safeDate(value.endDate),
    objective: text("objective"),
    primaryAudience: text("primaryAudience"),
    audienceEvidence: text("audienceEvidence"),
    desiredAction: text("desiredAction"),
    mainMessage: text("mainMessage"),
    supportingEvidence: text("supportingEvidence"),
    offerDestination: text("offerDestination"),
    channelRoles: text("channelRoles"),
    timelineMilestones: text("timelineMilestones"),
    budgetCapacity: text("budgetCapacity"),
    ownersApprovals: text("ownersApprovals"),
    accessibilityLanguage: text("accessibilityLanguage"),
    consentPrivacy: text("consentPrivacy"),
    complianceReview: text("complianceReview"),
    responseEscalation: text("responseEscalation"),
    measurementPlan: text("measurementPlan"),
    learningDecision: text("learningDecision"),
    hasClaimReview: value.hasClaimReview === true,
    hasAccessibilityReview: value.hasAccessibilityReview === true,
    hasConsentPrivacyReview: value.hasConsentPrivacyReview === true,
    hasLegalChannelReview: value.hasLegalChannelReview === true,
    hasDeliveryCapacityReview: value.hasDeliveryCapacityReview === true,
  }
}

const DRAFT_AREAS: Array<keyof CampaignPlanDraft> = [
  "objective",
  "primaryAudience",
  "audienceEvidence",
  "desiredAction",
  "mainMessage",
  "supportingEvidence",
  "offerDestination",
  "channelRoles",
  "timelineMilestones",
  "budgetCapacity",
  "ownersApprovals",
  "accessibilityLanguage",
  "consentPrivacy",
  "complianceReview",
  "responseEscalation",
  "measurementPlan",
  "learningDecision",
]

function durationDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return null
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null
  }
  return Math.round((end - start) / 86_400_000) + 1
}

export function summarizeCampaignPlan(
  draft: CampaignPlanDraft
): CampaignPlanSummary {
  return {
    draftedAreaCount: DRAFT_AREAS.filter((key) => String(draft[key]).trim())
      .length,
    totalAreaCount: DRAFT_AREAS.length,
    pathwayStepCount: CAMPAIGN_PATHWAY.filter(({ fields }) =>
      fields.every((field) => String(draft[field]).trim())
    ).length,
    totalPathwayStepCount: CAMPAIGN_PATHWAY.length,
    safeguardCount: [
      draft.hasClaimReview,
      draft.hasAccessibilityReview,
      draft.hasConsentPrivacyReview,
      draft.hasLegalChannelReview,
      draft.hasDeliveryCapacityReview,
    ].filter(Boolean).length,
    totalSafeguardCount: 5,
    durationDays: durationDays(draft.startDate, draft.endDate),
  }
}

export function campaignTypeLabel(type: CampaignTypeId) {
  return CAMPAIGN_TYPES.find(({ id }) => id === type)?.label ?? type
}

const STAGE_ACTIONS: Record<DocumentationStageId, CampaignPlanAction> = {
  exploring: {
    id: "stage-exploring",
    phase: "Frame",
    action:
      "Run one bounded test with one primary audience, action, destination, owner, and learning question before adding channels or scale.",
    evidence:
      "Listening notes, source review, working brief, small delivery record, audience response, and a written decision about the next test.",
  },
  forming: {
    id: "stage-forming",
    phase: "Review",
    action:
      "Establish claim, permission, accessibility, approval, spending, delivery, response, correction, and recordkeeping practices before a recurring campaign rhythm.",
    evidence:
      "Source library, role map, approval record, permission evidence, access review, budget owner, response path, and archived final materials.",
  },
  operating: {
    id: "stage-operating",
    phase: "Learn",
    action:
      "Connect each campaign to a program, fundraising, advocacy, volunteer, event, or partnership decision and review the full path after launch.",
    evidence:
      "Reach and destination data, completed actions, questions, access issues, corrections, costs, workload, feedback, limitations, and decision record.",
  },
  growing: {
    id: "stage-growing",
    phase: "Review",
    action:
      "Use a portfolio calendar, common naming and evidence definitions, delegated approvals, segment governance, capacity thresholds, and pause rules across teams and partners.",
    evidence:
      "Campaign register, shared taxonomy, permission and suppression records, authority matrix, budget controls, quality review, portfolio analysis, and stop decisions.",
  },
}

export function buildCampaignActions(
  draft: CampaignPlanDraft
): CampaignPlanAction[] {
  const actions: CampaignPlanAction[] = [STAGE_ACTIONS[draft.stage]]
  for (const step of CAMPAIGN_PATHWAY) {
    const missing = step.fields.filter(
      (field) => !String(draft[field]).trim()
    ).length
    if (!missing) continue
    actions.push({
      id: `pathway-${step.id.toLowerCase()}`,
      phase: step.id,
      action: `Complete the ${step.label.toLowerCase()} decision before treating this campaign step as drafted.`,
      evidence: `${missing} of ${step.fields.length} working areas remain open in this step.`,
    })
  }
  if (
    !draft.hasClaimReview ||
    !draft.hasAccessibilityReview ||
    !draft.hasConsentPrivacyReview ||
    !draft.hasLegalChannelReview ||
    !draft.hasDeliveryCapacityReview
  ) {
    actions.push({
      id: "safeguards",
      phase: "Safeguards",
      action:
        "Complete the applicable human reviews before publication, outreach, spending, data collection, fundraising, advocacy, or partner distribution.",
      evidence:
        "Named reviewer, current source, review date, decision, limits, required changes, approval record, and conditions for renewed review.",
    })
  }
  return actions
}

function csvCell(value: string | number | boolean | null) {
  return documentationCsvCell(value)
}

export function buildCampaignCsv(draft: CampaignPlanDraft) {
  const summary = summarizeCampaignPlan(draft)
  const rows: Array<[string, string | number | boolean | null]> = [
    ["Area", "Working nonprofit campaign brief"],
    ["Organization", draft.organizationName],
    ["Campaign", draft.campaignName],
    ["Stage", draft.stage],
    ["Campaign type", campaignTypeLabel(draft.campaignType)],
    ["Start date", draft.startDate],
    ["End date", draft.endDate],
    ["Duration days", summary.durationDays],
    ...DRAFT_AREAS.map((key) => [key, String(draft[key])] as [string, string]),
    ["Claim and evidence review", draft.hasClaimReview],
    ["Accessibility and language review", draft.hasAccessibilityReview],
    ["Consent and privacy review", draft.hasConsentPrivacyReview],
    ["Legal, tax, and channel review", draft.hasLegalChannelReview],
    ["Delivery and response capacity review", draft.hasDeliveryCapacityReview],
    ["Drafted areas", `${summary.draftedAreaCount}/${summary.totalAreaCount}`],
    [
      "Drafted pathway steps",
      `${summary.pathwayStepCount}/${summary.totalPathwayStepCount}`,
    ],
  ]
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`
}

export function buildCampaignReviewPrompt(draft: CampaignPlanDraft) {
  const summary = summarizeCampaignPlan(draft)
  return [
    "Review this working nonprofit campaign brief as a cautious planning assistant.",
    "Do not publish, send, target, segment, purchase, spend, collect data, contact anyone, or make a legal, tax, accessibility, privacy, fundraising, lobbying, election, copyright, platform, or performance determination.",
    "Do not invent audience research, facts, claims, quotes, outcomes, permissions, consent, authority, law, deadlines, costs, capacity, registrations, disclosures, channel rules, or results.",
    "Mark missing or uncertain information. Distinguish evidence from assumptions. Identify questions for affected people, source owners, accessibility reviewers, campaign owners, finance, fundraising, program leads, privacy or security staff, and qualified counsel as relevant.",
    "Remove names, contact details, health or service information, donor or participant data, credentials, protected reports, and other sensitive information before using another service.",
    "Return: (1) concise summary, (2) open questions by pathway step, (3) claim and source table, (4) access and permission checks, (5) owner and capacity gaps, (6) measurement limits, and (7) a pre-launch review list. Preserve the team’s judgment.",
    "",
    `Organization: ${draft.organizationName || "Not provided"}`,
    `Campaign: ${draft.campaignName || "Not provided"}`,
    `Stage: ${draft.stage}`,
    `Campaign type: ${campaignTypeLabel(draft.campaignType)}`,
    `Working dates: ${draft.startDate || "Open"} to ${draft.endDate || "Open"}`,
    `Drafted areas: ${summary.draftedAreaCount}/${summary.totalAreaCount}`,
    ...DRAFT_AREAS.map((key) => `${key}: ${draft[key] || "Open"}`),
  ].join("\n")
}
