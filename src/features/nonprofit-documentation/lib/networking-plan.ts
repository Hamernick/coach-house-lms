import type {
  DocumentationStageId,
  NetworkingEngagementId,
  NetworkingObjectiveId,
  NetworkingPlanAction,
  NetworkingPlanDraft,
  NetworkingPlanSummary,
  NetworkingRelationshipCategoryId,
  NetworkingRelationshipDraft,
} from "../types"

export const NETWORKING_PLAN_STORAGE_KEY =
  "coach-house:documentation:networking-plan:v1"

export const NETWORKING_OBJECTIVES: Array<{
  id: NetworkingObjectiveId
  label: string
  description: string
}> = [
  {
    id: "community-listening",
    label: "Community listening",
    description:
      "Understand priorities, assets, language, access, history, and concerns.",
  },
  {
    id: "referral-pathway",
    label: "Referral pathway",
    description:
      "Clarify fit, capacity, handoffs, feedback, and service boundaries.",
  },
  {
    id: "peer-learning",
    label: "Peer learning",
    description:
      "Exchange operating knowledge without extracting or overstating expertise.",
  },
  {
    id: "funding-relationships",
    label: "Funding relationships",
    description:
      "Learn priorities and fit before making a specific, supportable request.",
  },
  {
    id: "advocacy-policy",
    label: "Advocacy or policy",
    description:
      "Share mission evidence within applicable nonpartisan and lobbying rules.",
  },
  {
    id: "volunteer-talent",
    label: "Volunteer or talent network",
    description:
      "Connect real work with qualified, supported people and clear boundaries.",
  },
]

export const NETWORKING_CATEGORIES: Array<{
  id: NetworkingRelationshipCategoryId
  label: string
  description: string
}> = [
  {
    id: "community",
    label: "Community member or group",
    description: "People affected by, contributing to, or closest to the work.",
  },
  {
    id: "peer-nonprofit",
    label: "Peer nonprofit",
    description: "Organizations with related knowledge, services, or reach.",
  },
  {
    id: "public-agency",
    label: "Public agency",
    description: "Local, Tribal, territorial, state, or federal public bodies.",
  },
  {
    id: "funder",
    label: "Funder or donor network",
    description:
      "Institutional, corporate, community, or individual supporters.",
  },
  {
    id: "business-professional",
    label: "Business or professional",
    description: "Employers, associations, specialists, vendors, or advisors.",
  },
  {
    id: "advocate-media",
    label: "Advocate or media",
    description: "Issue advocates, organizers, journalists, or communicators.",
  },
  {
    id: "other",
    label: "Other relationship role",
    description: "A locally relevant role described by the organization.",
  },
]

export const NETWORKING_ENGAGEMENTS: Array<{
  id: NetworkingEngagementId
  label: string
  description: string
}> = [
  {
    id: "listen",
    label: "Listen",
    description: "Hear context without presuming an ask or solution.",
  },
  {
    id: "learn",
    label: "Learn",
    description: "Clarify fit, priorities, boundaries, and possible value.",
  },
  {
    id: "exchange",
    label: "Exchange",
    description: "Share useful information, access, or introductions mutually.",
  },
  {
    id: "coordinate",
    label: "Coordinate",
    description: "Align a bounded referral, event, activity, or response.",
  },
  {
    id: "collaborate",
    label: "Collaborate",
    description: "Consider sustained joint work with explicit governance.",
  },
]

export const NETWORKING_REVIEW_WEEKS = [4, 8, 12] as const
export const MAX_NETWORKING_RELATIONSHIPS = 8

export function createNetworkingRelationship(
  id = "relationship-1"
): NetworkingRelationshipDraft {
  return {
    id,
    label: "",
    category: "community",
    engagement: "listen",
    purpose: "",
    theirContext: "",
    responsibleOffer: "",
    nextStep: "",
    owner: "",
    reviewTiming: "",
  }
}

export const DEFAULT_NETWORKING_PLAN: NetworkingPlanDraft = {
  version: 1,
  organizationName: "",
  initiativeName: "",
  stage: "exploring",
  objective: "community-listening",
  reviewWeeks: 8,
  networkingPurpose: "",
  communityAccountability: "",
  existingAssets: "",
  relationshipGaps: "",
  invitation: "",
  followUpRhythm: "",
  accessPlan: "",
  dataBoundary: "",
  planOwner: "",
  escalationPath: "",
  relationships: [createNetworkingRelationship()],
  hasCommunityVoiceReview: false,
  hasConsentDataReview: false,
  hasAccessibilityReview: false,
  hasAuthorityConflictReview: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const OBJECTIVES = NETWORKING_OBJECTIVES.map(({ id }) => id)
const CATEGORIES = NETWORKING_CATEGORIES.map(({ id }) => id)
const ENGAGEMENTS = NETWORKING_ENGAGEMENTS.map(({ id }) => id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function safeId(value: unknown, index: number) {
  const id = safeText(value, 80).replace(/[^a-zA-Z0-9_-]/g, "")
  return id || `relationship-${index + 1}`
}

function sanitizeRelationship(
  value: unknown,
  index: number
): NetworkingRelationshipDraft {
  if (!isRecord(value))
    return createNetworkingRelationship(`relationship-${index + 1}`)
  return {
    id: safeId(value.id, index),
    label: safeText(value.label, 160),
    category: CATEGORIES.includes(
      value.category as NetworkingRelationshipCategoryId
    )
      ? (value.category as NetworkingRelationshipCategoryId)
      : "community",
    engagement: ENGAGEMENTS.includes(value.engagement as NetworkingEngagementId)
      ? (value.engagement as NetworkingEngagementId)
      : "listen",
    purpose: safeText(value.purpose, 500),
    theirContext: safeText(value.theirContext, 700),
    responsibleOffer: safeText(value.responsibleOffer, 700),
    nextStep: safeText(value.nextStep, 500),
    owner: safeText(value.owner, 200),
    reviewTiming: safeText(value.reviewTiming, 200),
  }
}

export function sanitizeNetworkingPlan(value: unknown): NetworkingPlanDraft {
  if (!isRecord(value)) return DEFAULT_NETWORKING_PLAN
  const stage = STAGES.includes(value.stage as DocumentationStageId)
    ? (value.stage as DocumentationStageId)
    : DEFAULT_NETWORKING_PLAN.stage
  const objective = OBJECTIVES.includes(
    value.objective as NetworkingObjectiveId
  )
    ? (value.objective as NetworkingObjectiveId)
    : DEFAULT_NETWORKING_PLAN.objective
  const reviewWeeks = NETWORKING_REVIEW_WEEKS.includes(
    value.reviewWeeks as 4 | 8 | 12
  )
    ? (value.reviewWeeks as 4 | 8 | 12)
    : DEFAULT_NETWORKING_PLAN.reviewWeeks
  const relationships = Array.isArray(value.relationships)
    ? value.relationships
        .slice(0, MAX_NETWORKING_RELATIONSHIPS)
        .map(sanitizeRelationship)
    : []

  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    initiativeName: safeText(value.initiativeName, 120),
    stage,
    objective,
    reviewWeeks,
    networkingPurpose: safeText(value.networkingPurpose, 700),
    communityAccountability: safeText(value.communityAccountability, 700),
    existingAssets: safeText(value.existingAssets, 700),
    relationshipGaps: safeText(value.relationshipGaps, 700),
    invitation: safeText(value.invitation, 700),
    followUpRhythm: safeText(value.followUpRhythm, 500),
    accessPlan: safeText(value.accessPlan, 700),
    dataBoundary: safeText(value.dataBoundary, 700),
    planOwner: safeText(value.planOwner, 240),
    escalationPath: safeText(value.escalationPath, 500),
    relationships:
      relationships.length > 0
        ? relationships
        : [createNetworkingRelationship()],
    hasCommunityVoiceReview: value.hasCommunityVoiceReview === true,
    hasConsentDataReview: value.hasConsentDataReview === true,
    hasAccessibilityReview: value.hasAccessibilityReview === true,
    hasAuthorityConflictReview: value.hasAuthorityConflictReview === true,
  }
}

const DRAFT_AREAS: Array<keyof NetworkingPlanDraft> = [
  "networkingPurpose",
  "communityAccountability",
  "existingAssets",
  "relationshipGaps",
  "invitation",
  "followUpRhythm",
  "accessPlan",
  "dataBoundary",
  "planOwner",
  "escalationPath",
]

function mappedRelationships(draft: NetworkingPlanDraft) {
  return draft.relationships.filter(({ label }) => label.trim())
}

export function summarizeNetworkingPlan(
  draft: NetworkingPlanDraft
): NetworkingPlanSummary {
  const relationships = mappedRelationships(draft)
  return {
    relationshipCount: relationships.length,
    representedCategoryCount: new Set(
      relationships.map(({ category }) => category)
    ).size,
    representedEngagementCount: new Set(
      relationships.map(({ engagement }) => engagement)
    ).size,
    nextStepCount: relationships.filter(({ nextStep }) => nextStep.trim())
      .length,
    draftedAreaCount: DRAFT_AREAS.filter((key) => String(draft[key]).trim())
      .length,
    totalAreaCount: DRAFT_AREAS.length,
    safeguardCount: [
      draft.hasCommunityVoiceReview,
      draft.hasConsentDataReview,
      draft.hasAccessibilityReview,
      draft.hasAuthorityConflictReview,
    ].filter(Boolean).length,
    totalSafeguardCount: 4,
  }
}

export function networkingObjectiveLabel(objective: NetworkingObjectiveId) {
  return (
    NETWORKING_OBJECTIVES.find(({ id }) => id === objective)?.label ?? objective
  )
}

export function networkingCategoryLabel(
  category: NetworkingRelationshipCategoryId
) {
  return (
    NETWORKING_CATEGORIES.find(({ id }) => id === category)?.label ?? category
  )
}

export function networkingEngagementLabel(engagement: NetworkingEngagementId) {
  return (
    NETWORKING_ENGAGEMENTS.find(({ id }) => id === engagement)?.label ??
    engagement
  )
}

const STAGE_ACTIONS: Record<DocumentationStageId, NetworkingPlanAction[]> = {
  exploring: [
    {
      id: "stage-exploring",
      phase: "Community",
      action:
        "Begin with listening relationships and existing community assets before seeking influence, funding, referrals, or a formal collaboration.",
      evidence:
        "Community-defined priorities, existing trusted relationships, history, access needs, previous commitments, concerns, and an explicit learning question.",
    },
  ],
  forming: [
    {
      id: "stage-forming",
      phase: "Map",
      action:
        "Build a balanced relationship map with roles, reciprocal value, next steps, ownership, data boundaries, and a maintainable follow-up rhythm.",
      evidence:
        "Organization- or role-level map, conversation briefs, permission-aware notes, owners, review timing, and documented gaps.",
    },
  ],
  operating: [
    {
      id: "stage-operating",
      phase: "Follow-up",
      action:
        "Turn conversations into reliable follow-through, close loops, update capacity, and review whether relationships remain useful and reciprocal.",
      evidence:
        "Commitments, completed follow-ups, warm introductions, referral feedback, declined requests, access issues, relationship maintenance, and decisions.",
    },
  ],
  growing: [
    {
      id: "stage-growing",
      phase: "Learning",
      action:
        "Distribute relationship ownership, preserve context through transitions, and recheck power, representation, privacy, conflicts, and capacity as the network expands.",
      evidence:
        "Shared ownership, current institutional records, succession coverage, conflict review, participation evidence, capacity limits, and network-level learning.",
    },
  ],
}

export function buildNetworkingActions(
  draft: NetworkingPlanDraft
): NetworkingPlanAction[] {
  const actions = [...STAGE_ACTIONS[draft.stage]]
  const relationships = mappedRelationships(draft)
  const missing: Array<NetworkingPlanAction | false> = [
    !draft.networkingPurpose && {
      id: "missing-purpose",
      phase: "Purpose",
      action:
        "Define the mission purpose and the decision this network should improve.",
      evidence:
        "A bounded issue, intended result, current decision, relevant geography or community, and what networking cannot resolve alone.",
    },
    !draft.communityAccountability && {
      id: "missing-community",
      phase: "Community",
      action:
        "Name how people affected by the work shape the map, invitation, decisions, and interpretation.",
      evidence:
        "Participation method, access and compensation decisions, feedback path, decision influence, dissent, and close-the-loop commitment.",
    },
    relationships.length === 0 && {
      id: "missing-map",
      phase: "Map",
      action: "Add at least one organization or relationship role to examine.",
      evidence:
        "A role-level label, category, current engagement mode, purpose, context, responsible offer, and next step without unnecessary personal data.",
    },
    relationships.some(
      ({ purpose, theirContext, responsibleOffer }) =>
        !purpose || !theirContext || !responsibleOffer
    ) && {
      id: "missing-exchange",
      phase: "Exchange",
      action:
        "Clarify the purpose, relevant context, and responsible reciprocal value for each mapped relationship.",
      evidence:
        "What the organization hopes to learn or do, what the other party may value, boundaries, and assumptions marked for confirmation.",
    },
    relationships.some(
      ({ nextStep, owner, reviewTiming }) =>
        !nextStep || !owner || !reviewTiming
    ) && {
      id: "missing-follow-up",
      phase: "Follow-up",
      action:
        "Give each active relationship a voluntary next step, responsible owner, and review timing.",
      evidence:
        "Specific invitation, accessible format, realistic timing, owner, promised follow-up, and a respectful no-response or decline path.",
    },
    (!draft.accessPlan || !draft.dataBoundary || !draft.escalationPath) && {
      id: "missing-safeguards",
      phase: "Safeguards",
      action:
        "Complete access, data, consent, authority, conflict, and escalation boundaries before sharing or acting on the map.",
      evidence:
        "Accessible contact options, minimum necessary records, permission and retention, authorized representation, conflicts, sensitive cases, and escalation owner.",
    },
    (!draft.hasCommunityVoiceReview ||
      !draft.hasConsentDataReview ||
      !draft.hasAccessibilityReview ||
      !draft.hasAuthorityConflictReview) && {
      id: "remaining-reviews",
      phase: "Safeguards",
      action: "Complete the remaining human-review safeguards that apply.",
      evidence:
        "Reviewer, date, decision, evidence, open questions, and the conditions that require another review.",
    },
  ]
  actions.push(
    ...missing.filter((item): item is NetworkingPlanAction => !!item)
  )
  return actions
}

export function buildNetworkingReviewPrompt(draft: NetworkingPlanDraft) {
  const safe = sanitizeNetworkingPlan(draft)
  const relationships = mappedRelationships(safe)
    .map(
      (item, index) =>
        `${index + 1}. ${item.label}; ${networkingCategoryLabel(item.category)}; ${networkingEngagementLabel(item.engagement)}; purpose: ${item.purpose || "Not provided"}; context: ${item.theirContext || "Not provided"}; responsible offer: ${item.responsibleOffer || "Not provided"}; next step: ${item.nextStep || "Not provided"}; owner: ${item.owner || "Not provided"}; review: ${item.reviewTiming || "Not provided"}`
    )
    .join("\n")
  return [
    "Review this nonprofit relationship-map brief for human decision-making.",
    "",
    `Organization: ${safe.organizationName || "Not provided"}`,
    `Initiative: ${safe.initiativeName || "Not provided"}`,
    `Stage: ${safe.stage}`,
    `Objective: ${networkingObjectiveLabel(safe.objective)}`,
    `Review period: ${safe.reviewWeeks} weeks`,
    `Networking purpose: ${safe.networkingPurpose || "Not provided"}`,
    `Community accountability: ${safe.communityAccountability || "Not provided"}`,
    `Existing relationship assets: ${safe.existingAssets || "Not provided"}`,
    `Relationship gaps: ${safe.relationshipGaps || "Not provided"}`,
    `Invitation: ${safe.invitation || "Not provided"}`,
    `Follow-up rhythm: ${safe.followUpRhythm || "Not provided"}`,
    `Access plan: ${safe.accessPlan || "Not provided"}`,
    `Data boundary: ${safe.dataBoundary || "Not provided"}`,
    `Plan owner: ${safe.planOwner || "Not provided"}`,
    `Escalation path: ${safe.escalationPath || "Not provided"}`,
    "",
    "Mapped organizations or roles:",
    relationships || "None provided",
    "",
    "Requirements:",
    "- Center people affected by the work and distinguish their participation from institutional influence.",
    "- Do not invent people, organizations, relationships, authority, consent, trust, needs, capacity, commitments, introductions, endorsements, conflicts, dates, contact details, legal status, or outcomes.",
    "- Mark every assumption or missing fact as [NEEDS HUMAN INPUT].",
    "- Identify extractive, one-sided, inaccessible, duplicative, unsafe, partisan, lobbying, privacy, confidentiality, conflict, representation, and capacity risks without making legal conclusions.",
    "- Suggest questions, reciprocal value, bounded invitations, follow-up steps, and evidence a human should verify.",
    "- Return a review table and options. Do not contact, rank, score, endorse, approve, or select anyone and do not create personal profiles.",
  ].join("\n")
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export function buildNetworkingCsv(draft: NetworkingPlanDraft) {
  const summary = summarizeNetworkingPlan(draft)
  const rows: Array<Array<string | number>> = [
    ["Area", "Working relationship-map brief"],
    ["Organization", draft.organizationName],
    ["Initiative", draft.initiativeName],
    ["Stage", draft.stage],
    ["Objective", networkingObjectiveLabel(draft.objective)],
    ["Review weeks", draft.reviewWeeks],
    ["Networking purpose", draft.networkingPurpose],
    ["Community accountability", draft.communityAccountability],
    ["Existing relationship assets", draft.existingAssets],
    ["Relationship gaps", draft.relationshipGaps],
    ["Invitation", draft.invitation],
    ["Follow-up rhythm", draft.followUpRhythm],
    ["Access plan", draft.accessPlan],
    ["Data boundary", draft.dataBoundary],
    ["Plan owner", draft.planOwner],
    ["Escalation path", draft.escalationPath],
    ["Mapped relationships", summary.relationshipCount],
    ["Categories represented", summary.representedCategoryCount],
    ["Engagement modes represented", summary.representedEngagementCount],
    ["Relationships with next steps", summary.nextStepCount],
    [
      "Drafted areas",
      `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
    ],
    [
      "Safeguards selected",
      `${summary.safeguardCount} of ${summary.totalSafeguardCount}`,
    ],
    [],
    [
      "Relationship label",
      "Category",
      "Engagement",
      "Purpose",
      "Their context",
      "Responsible offer",
      "Next step",
      "Owner",
      "Review timing",
    ],
    ...mappedRelationships(draft).map((item) => [
      item.label,
      networkingCategoryLabel(item.category),
      networkingEngagementLabel(item.engagement),
      item.purpose,
      item.theirContext,
      item.responsibleOffer,
      item.nextStep,
      item.owner,
      item.reviewTiming,
    ]),
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildNetworkingActions(draft).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
