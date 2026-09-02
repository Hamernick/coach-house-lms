import type {
  DocumentationStageId,
  PartnershipBriefAction,
  PartnershipBriefDraft,
  PartnershipBriefSummary,
  PartnershipModelId,
  PartnershipReviewMonths,
  PartnershipTermMonths,
} from "../types"

export const PARTNERSHIP_BRIEF_STORAGE_KEY =
  "coach-house:documentation:partnership-brief:v1"

export const PARTNERSHIP_MODELS: Array<{
  id: PartnershipModelId
  label: string
  description: string
}> = [
  {
    id: "referral",
    label: "Referral relationship",
    description:
      "Each organization keeps its own services while coordinating responsible introductions and follow-up.",
  },
  {
    id: "co-delivery",
    label: "Co-delivery",
    description:
      "Partners jointly deliver a defined program, event, service, or participant pathway.",
  },
  {
    id: "shared-resource",
    label: "Shared resource",
    description:
      "Partners share space, staff, technology, purchasing, administration, or another bounded resource.",
  },
  {
    id: "joint-campaign",
    label: "Joint campaign",
    description:
      "Partners coordinate communications, advocacy, fundraising, or public education around a shared goal.",
  },
  {
    id: "strategic-alliance",
    label: "Strategic alliance",
    description:
      "Partners create a deeper, longer-term arrangement that may affect governance, assets, programs, or identity.",
  },
]

export const PARTNERSHIP_TERMS: PartnershipTermMonths[] = [3, 6, 12, 18, 24]
export const PARTNERSHIP_REVIEW_INTERVALS: PartnershipReviewMonths[] = [
  1, 3, 6, 12,
]

export const DEFAULT_PARTNERSHIP_BRIEF: PartnershipBriefDraft = {
  version: 1,
  organizationName: "",
  partnerName: "",
  partnershipName: "",
  stage: "exploring",
  model: "referral",
  termMonths: 6,
  reviewEveryMonths: 3,
  sharedPurpose: "",
  communityRole: "",
  organizationContribution: "",
  partnerContribution: "",
  jointActivities: "",
  intendedResult: "",
  decisionRights: "",
  financialTerms: "",
  dataBoundaries: "",
  communicationRhythm: "",
  conflictPath: "",
  closeoutPlan: "",
  organizationLead: "",
  partnerLead: "",
  hasConflictReview: false,
  hasDataReview: false,
  hasAccessibilityPlan: false,
  hasAuthorizedApproval: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]
const MODELS = PARTNERSHIP_MODELS.map(({ id }) => id)
const DRAFTED_KEYS: Array<keyof PartnershipBriefDraft> = [
  "sharedPurpose",
  "communityRole",
  "organizationContribution",
  "partnerContribution",
  "jointActivities",
  "intendedResult",
  "decisionRights",
  "financialTerms",
  "dataBoundaries",
  "communicationRhythm",
  "conflictPath",
  "closeoutPlan",
  "organizationLead",
  "partnerLead",
]
const SAFEGUARD_KEYS: Array<keyof PartnershipBriefDraft> = [
  "hasConflictReview",
  "hasDataReview",
  "hasAccessibilityPlan",
  "hasAuthorizedApproval",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maximum = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

export function sanitizePartnershipBrief(
  value: unknown
): PartnershipBriefDraft {
  if (!isRecord(value)) return DEFAULT_PARTNERSHIP_BRIEF
  const termMonths = Number(value.termMonths) as PartnershipTermMonths
  const reviewEveryMonths = Number(
    value.reviewEveryMonths
  ) as PartnershipReviewMonths
  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    partnerName: safeText(value.partnerName, 120),
    partnershipName: safeText(value.partnershipName, 140),
    stage: STAGES.includes(value.stage as DocumentationStageId)
      ? (value.stage as DocumentationStageId)
      : DEFAULT_PARTNERSHIP_BRIEF.stage,
    model: MODELS.includes(value.model as PartnershipModelId)
      ? (value.model as PartnershipModelId)
      : DEFAULT_PARTNERSHIP_BRIEF.model,
    termMonths: PARTNERSHIP_TERMS.includes(termMonths) ? termMonths : 6,
    reviewEveryMonths: PARTNERSHIP_REVIEW_INTERVALS.includes(reviewEveryMonths)
      ? reviewEveryMonths
      : 3,
    sharedPurpose: safeText(value.sharedPurpose),
    communityRole: safeText(value.communityRole),
    organizationContribution: safeText(value.organizationContribution),
    partnerContribution: safeText(value.partnerContribution),
    jointActivities: safeText(value.jointActivities),
    intendedResult: safeText(value.intendedResult),
    decisionRights: safeText(value.decisionRights),
    financialTerms: safeText(value.financialTerms),
    dataBoundaries: safeText(value.dataBoundaries),
    communicationRhythm: safeText(value.communicationRhythm),
    conflictPath: safeText(value.conflictPath),
    closeoutPlan: safeText(value.closeoutPlan),
    organizationLead: safeText(value.organizationLead, 300),
    partnerLead: safeText(value.partnerLead, 300),
    hasConflictReview: value.hasConflictReview === true,
    hasDataReview: value.hasDataReview === true,
    hasAccessibilityPlan: value.hasAccessibilityPlan === true,
    hasAuthorizedApproval: value.hasAuthorizedApproval === true,
  }
}

export function partnershipModelLabel(model: PartnershipModelId) {
  return (
    PARTNERSHIP_MODELS.find(({ id }) => id === model)?.label ??
    "Referral relationship"
  )
}

export function summarizePartnershipBrief(
  draft: PartnershipBriefDraft
): PartnershipBriefSummary {
  const draftedAreaCount = DRAFTED_KEYS.filter((key) =>
    String(draft[key]).trim()
  ).length
  const safeguardCount = SAFEGUARD_KEYS.filter(
    (key) => draft[key] === true
  ).length
  return {
    draftedAreaCount,
    totalAreaCount: DRAFTED_KEYS.length,
    reviewMomentCount: Math.ceil(draft.termMonths / draft.reviewEveryMonths),
    safeguardCount,
    totalSafeguardCount: SAFEGUARD_KEYS.length,
    hasReviewableBrief: Boolean(
      draft.sharedPurpose &&
      draft.organizationContribution &&
      draft.partnerContribution &&
      draft.jointActivities &&
      draft.decisionRights &&
      draft.closeoutPlan
    ),
  }
}

const STAGE_ACTIONS: Record<
  DocumentationStageId,
  Omit<PartnershipBriefAction, "id">
> = {
  exploring: {
    phase: "Purpose",
    action:
      "Listen for the shared problem and test a small, reversible collaboration before promising a permanent structure.",
    evidence:
      "Keep community input, landscape research, partner conversations, the smallest useful test, assumptions, and a stop or continue gate.",
  },
  forming: {
    phase: "Governance",
    action:
      "Define each organization's authority, contribution, cost, risk, records, communication, and approval before launch.",
    evidence:
      "Keep due diligence, conflicts, approvals, a written brief or agreement, budget, insurance review, leads, and the first review date.",
  },
  operating: {
    phase: "Learning",
    action:
      "Review whether commitments, participant experience, access, referrals, workload, cost, and results match the agreement.",
    evidence:
      "Keep delivery records, partner and community interpretation, exceptions, costs, findings, decisions, owners, and follow-up dates.",
  },
  growing: {
    phase: "Governance",
    action:
      "Revisit power, capacity, full cost, local context, data, brand, decision rights, and exit obligations before expanding the relationship.",
    evidence:
      "Keep expansion scenarios, site or cohort differences, capacity evidence, revised terms, approvals, decision gates, and closeout duties.",
  },
}

export function buildPartnershipBriefActions(
  draft: PartnershipBriefDraft
): PartnershipBriefAction[] {
  const actions: PartnershipBriefAction[] = [
    { id: `stage-${draft.stage}`, ...STAGE_ACTIONS[draft.stage] },
  ]
  if (!draft.communityRole) {
    actions.push({
      id: "community-role",
      phase: "People",
      action:
        "Define how affected people will shape, access, interpret, and challenge the partnership rather than treating them as recipients only.",
      evidence:
        "Keep invitations, access supports, consent, compensation where appropriate, feedback, responses, and participation limits.",
    })
  }
  if (!draft.organizationContribution || !draft.partnerContribution) {
    actions.push({
      id: "mutual-contributions",
      phase: "Work",
      action:
        "Make both parties' contributions, limits, dependencies, and full costs explicit before describing the relationship as mutual.",
      evidence:
        "Keep staff time, money, space, systems, relationships, intellectual property, approvals, exclusions, and responsible owners.",
    })
  }
  if (!draft.decisionRights || !draft.organizationLead || !draft.partnerLead) {
    actions.push({
      id: "decision-rights",
      phase: "Governance",
      action:
        "Name operational leads and who recommends, decides, approves, must be consulted, and must be informed for material choices.",
      evidence:
        "Keep named roles, delegated authority, reserved board decisions, escalation paths, records, and backup contacts.",
    })
  }
  if (!draft.financialTerms || !draft.closeoutPlan) {
    actions.push({
      id: "resources-closeout",
      phase: "Closeout",
      action:
        "Document money, in-kind value, ownership, outstanding obligations, participant communication, records, and renewal or exit terms.",
      evidence:
        "Keep the budget, payment and reimbursement terms, restrictions, asset and record disposition, notice duties, transition steps, and approvals.",
    })
  }
  if (!draft.dataBoundaries || !draft.hasDataReview) {
    actions.push({
      id: "data-boundaries",
      phase: "Safeguards",
      action:
        "Pause personal-data sharing until purpose, minimum fields, authority, access, security, retention, deletion, incident response, and consent are reviewed.",
      evidence:
        "Keep a data inventory, lawful purpose, consent or other authority, minimum fields, access list, retention schedule, security terms, and incident contacts.",
    })
  }
  if (
    !draft.hasConflictReview ||
    !draft.hasAccessibilityPlan ||
    !draft.hasAuthorizedApproval
  ) {
    actions.push({
      id: "remaining-safeguards",
      phase: "Safeguards",
      action:
        "Complete conflict, accessibility, authority, and other risk review appropriate to the relationship before representing it as approved.",
      evidence:
        "Keep disclosures and recusals, accessibility plan, insurance and legal review where needed, governing approvals, signed terms, and version history.",
    })
  }
  return actions
}

function protectSpreadsheetCell(value: string | number | boolean) {
  const text = String(value)
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

function csvCell(value: string | number | boolean) {
  return `"${protectSpreadsheetCell(value).replaceAll('"', '""')}"`
}

export function buildPartnershipBriefCsv(draft: PartnershipBriefDraft) {
  const rows: Array<[string, string | number | boolean]> = [
    ["Organization", draft.organizationName],
    ["Potential partner", draft.partnerName],
    ["Working partnership name", draft.partnershipName],
    ["Organization stage", draft.stage],
    ["Relationship model", partnershipModelLabel(draft.model)],
    ["Term months", draft.termMonths],
    ["Review every months", draft.reviewEveryMonths],
    ["Shared purpose", draft.sharedPurpose],
    ["Community role", draft.communityRole],
    ["Organization contribution", draft.organizationContribution],
    ["Partner contribution", draft.partnerContribution],
    ["Joint activities", draft.jointActivities],
    ["Intended result and evidence", draft.intendedResult],
    ["Decision rights", draft.decisionRights],
    ["Financial and resource terms", draft.financialTerms],
    ["Data boundaries", draft.dataBoundaries],
    ["Communication rhythm", draft.communicationRhythm],
    ["Conflict and escalation path", draft.conflictPath],
    ["Renewal or closeout plan", draft.closeoutPlan],
    ["Organization lead", draft.organizationLead],
    ["Partner lead", draft.partnerLead],
    ["Conflict review planned", draft.hasConflictReview],
    ["Data review planned", draft.hasDataReview],
    ["Accessibility plan included", draft.hasAccessibilityPlan],
    ["Authorized approval planned", draft.hasAuthorizedApproval],
  ]
  return [
    ["Area", "Working partnership brief"].map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n")
}

export function buildPartnershipReviewPrompt(draft: PartnershipBriefDraft) {
  const summary = summarizePartnershipBrief(draft)
  return `You are reviewing a proposed nonprofit partnership brief. Treat every entry below as an unverified planning statement, not an established fact, commitment, approval, contract, or professional opinion.

Do not invent facts, partner interest, authority, consent, legal duties, financial terms, data rights, community support, capacity, accessibility, outcomes, approvals, or evidence. Identify missing information and questions instead. Distinguish what the brief states from what must be confirmed.

Organization: ${draft.organizationName || "Not entered"}
Potential partner: ${draft.partnerName || "Not entered"}
Working name: ${draft.partnershipName || "Not entered"}
Stage: ${draft.stage}
Relationship model: ${partnershipModelLabel(draft.model)}
Term and review: ${draft.termMonths} months; review every ${draft.reviewEveryMonths} months (${summary.reviewMomentCount} planned review moments)
Shared purpose: ${draft.sharedPurpose || "Not entered"}
Community role: ${draft.communityRole || "Not entered"}
Organization contribution: ${draft.organizationContribution || "Not entered"}
Partner contribution: ${draft.partnerContribution || "Not entered"}
Joint activities: ${draft.jointActivities || "Not entered"}
Intended result and evidence: ${draft.intendedResult || "Not entered"}
Decision rights: ${draft.decisionRights || "Not entered"}
Financial and resource terms: ${draft.financialTerms || "Not entered"}
Data boundaries: ${draft.dataBoundaries || "Not entered"}
Communication rhythm: ${draft.communicationRhythm || "Not entered"}
Conflict path: ${draft.conflictPath || "Not entered"}
Renewal or closeout: ${draft.closeoutPlan || "Not entered"}
Leads: ${draft.organizationLead || "Not entered"}; ${draft.partnerLead || "Not entered"}
Safeguards selected: conflict ${draft.hasConflictReview}; data ${draft.hasDataReview}; accessibility ${draft.hasAccessibilityPlan}; authorized approval ${draft.hasAuthorizedApproval}

Review in this order:
1. Restate the proposed public benefit, each party's contribution, and the community's role using only the brief.
2. List ambiguities, asymmetries, hidden labor, unsupported assumptions, missing voices, and dependencies.
3. List questions for both partners and affected community members.
4. Identify topics needing board, legal, tax, finance, privacy, security, insurance, accessibility, employment, intellectual-property, fundraising, or program review.
5. Propose a small reversible test, the evidence to keep, and a decision gate.
6. Separate operational edits from terms that require authorized agreement.

End with: This review does not recommend a partner, score trust or equity, create an agreement, establish authority or consent, validate compliance, or predict partnership results.`
}
