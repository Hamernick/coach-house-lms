import { documentationCsvCell } from "./csv-cell"
import type {
  LegalMatterCategoryId,
  LegalMatterUrgencyId,
  LegalPlanAction,
  LegalPlanDraft,
  LegalPlanSummary,
} from "../legal-types"
import type { DocumentationStageId } from "../types"

export const LEGAL_PLAN_STORAGE_KEY =
  "coach-house:documentation:legal-matter-brief:v1"

export const LEGAL_MATTER_CATEGORIES: Array<{
  id: LegalMatterCategoryId
  label: string
  description: string
}> = [
  {
    id: "formation-governance",
    label: "Formation, governance, and authority",
    description:
      "Entity formation, governing documents, board action, delegation, conflicts, and fiduciary oversight.",
  },
  {
    id: "tax-exempt-activities",
    label: "Tax-exempt status and activities",
    description:
      "Exempt purpose, private benefit, lobbying, political activity, unrelated activity, filings, and disclosure.",
  },
  {
    id: "fundraising",
    label: "Fundraising and charitable solicitation",
    description:
      "Registration, disclosures, donor terms, gift restrictions, sponsorship, raffles, campaigns, and stewardship.",
  },
  {
    id: "people-work",
    label: "Employment, volunteers, and people",
    description:
      "Working relationships, pay, benefits, leave, accommodations, safety, reporting, records, and transitions.",
  },
  {
    id: "contracts-partnerships",
    label: "Contracts, vendors, and partnerships",
    description:
      "Authority, scope, payment, risk allocation, data, intellectual property, termination, and shared work.",
  },
  {
    id: "programs-licensing-safety",
    label: "Programs, licensing, safety, and safeguarding",
    description:
      "Service rules, credentials, permits, participant protection, reporting, incidents, and professional boundaries.",
  },
  {
    id: "accessibility-civil-rights",
    label: "Accessibility and civil rights",
    description:
      "Program, employment, facility, communication, language, disability, discrimination, and equal-access questions.",
  },
  {
    id: "privacy-cybersecurity",
    label: "Privacy, data, and cybersecurity",
    description:
      "Collection, consent, access, vendors, retention, incidents, notices, and sensitive information.",
  },
  {
    id: "intellectual-property",
    label: "Intellectual property, brand, and content",
    description:
      "Copyright, trademark, licenses, ownership, permissions, releases, and commissioned work.",
  },
  {
    id: "property-insurance-risk",
    label: "Property, facilities, insurance, and risk",
    description:
      "Leases, ownership, accessibility, occupancy, maintenance, insurance, waivers, and physical risk.",
  },
  {
    id: "disputes-government",
    label: "Disputes, complaints, and government inquiries",
    description:
      "Claims, subpoenas, regulator contact, investigations, preservation, response, and resolution.",
  },
  {
    id: "merger-dissolution-assets",
    label: "Merger, dissolution, transfer, and charitable assets",
    description:
      "Structural change, liabilities, restricted assets, approvals, notices, records, and responsible closeout.",
  },
]

export const LEGAL_MATTER_URGENCIES: Array<{
  id: LegalMatterUrgencyId
  label: string
  description: string
}> = [
  {
    id: "planning",
    label: "Planning question",
    description: "No known active decision, incident, demand, or deadline.",
  },
  {
    id: "active-decision",
    label: "Active decision",
    description: "A decision or commitment is being considered now.",
  },
  {
    id: "dated-response",
    label: "Dated notice or response",
    description:
      "A contract, claim, complaint, filing, notice, or request has a stated date.",
  },
  {
    id: "immediate-safety",
    label: "Immediate safety or active incident",
    description:
      "People, systems, property, protected rights, or evidence may need prompt protection.",
  },
]

export const LEGAL_MATTER_PATHWAY = [
  {
    id: "triage",
    label: "Triage",
    description: "State the decision and identify affected people.",
    fields: ["decisionQuestion", "affectedPeople"] as const,
  },
  {
    id: "stabilize",
    label: "Stabilize",
    description:
      "Address immediate safety, rights, access, and current actions.",
    fields: ["safetyRightsAccess", "actionsCommunications"] as const,
  },
  {
    id: "preserve",
    label: "Preserve",
    description: "Separate known facts and protect relevant evidence.",
    fields: ["knownFacts", "evidencePreservation"] as const,
  },
  {
    id: "scope",
    label: "Scope",
    description: "Map unknowns, jurisdictions, timing, and source documents.",
    fields: [
      "assumptionsUnknowns",
      "jurisdictionsLocations",
      "timelineDeadlines",
      "governingDocuments",
    ] as const,
  },
  {
    id: "refer",
    label: "Refer",
    description: "Identify authority, conflicts, and qualified counsel needs.",
    fields: ["authorityConflicts", "counselReferral"] as const,
  },
  {
    id: "decide",
    label: "Decide",
    description: "Record authorized advice, decisions, owners, and follow-up.",
    fields: ["confidentialityDataBoundary", "decisionFollowUp"] as const,
  },
] as const

export const DEFAULT_LEGAL_PLAN: LegalPlanDraft = {
  version: 1,
  organizationName: "",
  matterTitle: "",
  stage: "exploring",
  category: "formation-governance",
  urgency: "planning",
  decisionQuestion: "",
  knownFacts: "",
  assumptionsUnknowns: "",
  affectedPeople: "",
  jurisdictionsLocations: "",
  timelineDeadlines: "",
  governingDocuments: "",
  actionsCommunications: "",
  authorityConflicts: "",
  safetyRightsAccess: "",
  evidencePreservation: "",
  confidentialityDataBoundary: "",
  counselReferral: "",
  decisionFollowUp: "",
  hasUrgentSafetyReview: false,
  hasAuthorityConflictReview: false,
  hasJurisdictionSourceReview: false,
  hasQualifiedCounselReview: false,
}

const STAGES: DocumentationStageId[] = [
  "exploring",
  "forming",
  "operating",
  "growing",
]

const CATEGORIES = LEGAL_MATTER_CATEGORIES.map(({ id }) => id)
const URGENCIES = LEGAL_MATTER_URGENCIES.map(({ id }) => id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function safeText(value: unknown, maximum = 900) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

export function sanitizeLegalPlan(value: unknown): LegalPlanDraft {
  if (!isRecord(value)) return DEFAULT_LEGAL_PLAN
  return {
    version: 1,
    organizationName: safeText(value.organizationName, 120),
    matterTitle: safeText(value.matterTitle, 140),
    stage: STAGES.includes(value.stage as DocumentationStageId)
      ? (value.stage as DocumentationStageId)
      : DEFAULT_LEGAL_PLAN.stage,
    category: CATEGORIES.includes(value.category as LegalMatterCategoryId)
      ? (value.category as LegalMatterCategoryId)
      : DEFAULT_LEGAL_PLAN.category,
    urgency: URGENCIES.includes(value.urgency as LegalMatterUrgencyId)
      ? (value.urgency as LegalMatterUrgencyId)
      : DEFAULT_LEGAL_PLAN.urgency,
    decisionQuestion: safeText(value.decisionQuestion, 700),
    knownFacts: safeText(value.knownFacts),
    assumptionsUnknowns: safeText(value.assumptionsUnknowns),
    affectedPeople: safeText(value.affectedPeople, 700),
    jurisdictionsLocations: safeText(value.jurisdictionsLocations, 700),
    timelineDeadlines: safeText(value.timelineDeadlines, 700),
    governingDocuments: safeText(value.governingDocuments),
    actionsCommunications: safeText(value.actionsCommunications),
    authorityConflicts: safeText(value.authorityConflicts, 800),
    safetyRightsAccess: safeText(value.safetyRightsAccess, 800),
    evidencePreservation: safeText(value.evidencePreservation, 800),
    confidentialityDataBoundary: safeText(
      value.confidentialityDataBoundary,
      800
    ),
    counselReferral: safeText(value.counselReferral, 800),
    decisionFollowUp: safeText(value.decisionFollowUp, 800),
    hasUrgentSafetyReview: value.hasUrgentSafetyReview === true,
    hasAuthorityConflictReview: value.hasAuthorityConflictReview === true,
    hasJurisdictionSourceReview: value.hasJurisdictionSourceReview === true,
    hasQualifiedCounselReview: value.hasQualifiedCounselReview === true,
  }
}

const DRAFT_AREAS: Array<keyof LegalPlanDraft> = [
  "decisionQuestion",
  "knownFacts",
  "assumptionsUnknowns",
  "affectedPeople",
  "jurisdictionsLocations",
  "timelineDeadlines",
  "governingDocuments",
  "actionsCommunications",
  "authorityConflicts",
  "safetyRightsAccess",
  "evidencePreservation",
  "confidentialityDataBoundary",
  "counselReferral",
  "decisionFollowUp",
]

function hasText(draft: LegalPlanDraft, key: keyof LegalPlanDraft) {
  return typeof draft[key] === "string" && String(draft[key]).trim().length > 0
}

export function summarizeLegalPlan(draft: LegalPlanDraft): LegalPlanSummary {
  const safe = sanitizeLegalPlan(draft)
  return {
    draftedAreaCount: DRAFT_AREAS.filter((key) => hasText(safe, key)).length,
    totalAreaCount: DRAFT_AREAS.length,
    safeguardCount: [
      safe.hasUrgentSafetyReview,
      safe.hasAuthorityConflictReview,
      safe.hasJurisdictionSourceReview,
      safe.hasQualifiedCounselReview,
    ].filter(Boolean).length,
    totalSafeguardCount: 4,
    pathwayStepCount: LEGAL_MATTER_PATHWAY.filter(({ fields }) =>
      fields.every((key) => hasText(safe, key))
    ).length,
    totalPathwayStepCount: LEGAL_MATTER_PATHWAY.length,
  }
}

export function legalCategoryLabel(category: LegalMatterCategoryId) {
  return (
    LEGAL_MATTER_CATEGORIES.find(({ id }) => id === category)?.label ??
    "Matter category"
  )
}

export function legalUrgencyLabel(urgency: LegalMatterUrgencyId) {
  return (
    LEGAL_MATTER_URGENCIES.find(({ id }) => id === urgency)?.label ??
    "Urgency not described"
  )
}

const STAGE_ACTIONS: Record<DocumentationStageId, LegalPlanAction> = {
  exploring: {
    id: "stage-exploring",
    phase: "Triage",
    action:
      "Test whether the proposed work needs a new entity, agreement, protected activity, licensed service, or professional review before making commitments.",
    evidence:
      "Mission need, alternatives, affected people, proposed activity, location, funding, authority, risk, existing sponsor or partner options, and open questions.",
  },
  forming: {
    id: "stage-forming",
    phase: "Scope",
    action:
      "Connect organizing documents, exemption strategy, governance, state obligations, financial authority, records, insurance, and initial agreements before operations expand.",
    evidence:
      "Entity records, bylaws or governing rules, exemption materials, board resolutions, registrations, licenses, fiscal arrangements, policies, contracts, insurance, and counsel review.",
  },
  operating: {
    id: "stage-operating",
    phase: "Refer",
    action:
      "Route material decisions and incidents through a repeatable intake, preservation, authority, conflict, jurisdiction, counsel, decision, and follow-up process.",
    evidence:
      "Matter owner, dates, facts, evidence, affected people, locations, source documents, current actions, conflicts, referral, written advice, authorized decision, and follow-up.",
  },
  growing: {
    id: "stage-growing",
    phase: "Scope",
    action:
      "Require change review before entering new states, services, facilities, funding arrangements, data uses, workforce models, partnerships, transactions, or structural changes.",
    evidence:
      "Expansion plan, jurisdiction map, regulated activities, contracts, data flows, people impacts, permits, insurance, funding terms, delegated authority, conflicts, counsel capacity, and decision gates.",
  },
}

export function buildLegalActions(draft: LegalPlanDraft) {
  const safe = sanitizeLegalPlan(draft)
  const actions: LegalPlanAction[] = [STAGE_ACTIONS[safe.stage]]
  const missing: Array<LegalPlanAction | false> = [
    (!safe.decisionQuestion || !safe.affectedPeople) && {
      id: "missing-triage",
      phase: "Triage",
      action:
        "State the precise decision or response needed and identify people or groups who may be affected before narrowing the legal question.",
      evidence:
        "Decision, desired outcome, affected people, roles, possible harms, access needs, who raised the matter, and what remains outside scope.",
    },
    (!safe.safetyRightsAccess || !safe.actionsCommunications) && {
      id: "missing-stabilize",
      phase: "Stabilize",
      action:
        "Document immediate protective needs and current actions without delaying emergency, safeguarding, incident-response, insurer, regulator, or counsel contact.",
      evidence:
        "Current safety, access, systems, property, reporting and notice questions, response owners, communications, temporary controls, and qualified escalation.",
    },
    (!safe.knownFacts || !safe.evidencePreservation) && {
      id: "missing-preservation",
      phase: "Preserve",
      action:
        "Separate known facts from claims and assumptions, then preserve potentially relevant records without altering, annotating, forwarding, or broadly sharing them.",
      evidence:
        "First-hand facts, sources, dates, documents, messages, system logs, physical items, custodians, storage, access, preservation instruction, and chain of handling.",
    },
    (!safe.assumptionsUnknowns ||
      !safe.jurisdictionsLocations ||
      !safe.timelineDeadlines ||
      !safe.governingDocuments) && {
      id: "missing-scope",
      phase: "Scope",
      action:
        "Map unknowns, every relevant location, all stated dates, and the documents or authorities that may govern before relying on a general rule.",
      evidence:
        "Unknown facts, federal, state, Tribal, territorial and local locations, service and data locations, received dates, stated deadlines, governing documents, contracts, grants, insurance, and current agency sources.",
    },
    (!safe.authorityConflicts || !safe.counselReferral) && {
      id: "missing-referral",
      phase: "Refer",
      action:
        "Identify who may act, who is conflicted, and which qualified attorney or specialist can review this matter in the relevant jurisdiction and subject area.",
      evidence:
        "Governing authority, delegations, recusals, related parties, board or sponsor role, counsel identity and scope, conflicts check, records shared, questions, timing, and fee approval.",
    },
    (!safe.confidentialityDataBoundary || !safe.decisionFollowUp) && {
      id: "missing-decision",
      phase: "Decide",
      action:
        "Define the information boundary and record the authorized decision, advice relied on, conditions, communications, owners, completion evidence, and renewed-review trigger.",
      evidence:
        "Minimum necessary information, access, approved channel, advice, options, authority, decision date, rationale, dissent or recusal, conditions, notices, owner, follow-up date, and closure criteria.",
    },
    (!safe.hasUrgentSafetyReview ||
      !safe.hasAuthorityConflictReview ||
      !safe.hasJurisdictionSourceReview ||
      !safe.hasQualifiedCounselReview) && {
      id: "remaining-safeguards",
      phase: "Safeguards",
      action:
        "Complete the remaining human reviews before relying on this brief for a consequential action, response, communication, filing, agreement, or record decision.",
      evidence:
        "Named reviewer, current source, jurisdiction, governing document, review date, decision, unresolved question, instruction, approval, and renewed-review trigger.",
    },
  ]
  actions.push(
    ...missing.filter((item): item is LegalPlanAction => Boolean(item))
  )
  return actions
}

export function buildLegalReviewPrompt(draft: LegalPlanDraft) {
  const safe = sanitizeLegalPlan(draft)
  return [
    "Review this nonprofit legal-matter intake for human referral preparation.",
    "",
    `Organization: ${safe.organizationName || "Not provided"}`,
    `Working matter: ${safe.matterTitle || "Not provided"}`,
    `Stage: ${safe.stage}`,
    `Category: ${legalCategoryLabel(safe.category)}`,
    `Urgency selected by user: ${legalUrgencyLabel(safe.urgency)}`,
    `Decision question: ${safe.decisionQuestion || "Not provided"}`,
    `Known facts: ${safe.knownFacts || "Not provided"}`,
    `Assumptions and unknowns: ${safe.assumptionsUnknowns || "Not provided"}`,
    `Affected people: ${safe.affectedPeople || "Not provided"}`,
    `Jurisdictions and locations: ${safe.jurisdictionsLocations || "Not provided"}`,
    `Timeline and stated deadlines: ${safe.timelineDeadlines || "Not provided"}`,
    `Governing source documents: ${safe.governingDocuments || "Not provided"}`,
    `Actions and communications: ${safe.actionsCommunications || "Not provided"}`,
    `Authority and conflicts: ${safe.authorityConflicts || "Not provided"}`,
    `Safety, rights, and access: ${safe.safetyRightsAccess || "Not provided"}`,
    `Evidence preservation: ${safe.evidencePreservation || "Not provided"}`,
    `Confidentiality and data boundary: ${safe.confidentialityDataBoundary || "Not provided"}`,
    `Counsel referral: ${safe.counselReferral || "Not provided"}`,
    `Decision and follow-up: ${safe.decisionFollowUp || "Not provided"}`,
    "",
    "Requirements:",
    "- Do not provide legal advice or determine rights, duties, liability, legal status, merits, privilege, confidentiality, preservation scope, notice, reporting, filing, or deadline requirements.",
    "- Do not invent facts, people, documents, communications, laws, jurisdictions, deadlines, approvals, advice, insurance, credentials, or outcomes.",
    "- Mark every assumption, missing source, and unresolved fact as [NEEDS HUMAN INPUT].",
    "- Separate first-hand facts, attributed statements, documents, assumptions, and open questions. Preserve the user’s wording where legal meaning may matter.",
    "- Identify possible urgent safety, safeguarding, cybersecurity, evidence-preservation, insurer, regulator, or qualified-counsel routing questions without declaring that a duty exists.",
    "- Identify current primary sources and questions for a licensed attorney in each relevant jurisdiction and subject area. Do not answer those questions.",
    "- Do not suggest deleting, altering, concealing, backdating, coaching, retaliating, contacting an opposing party, waiving rights, admitting fault, or making a public statement.",
    "- Return a structured issue list, missing-fact table, source checklist, referral questions, and options for authorized human review. Do not recommend a final legal action.",
  ].join("\n")
}

function csvCell(value: string | number) {
  return documentationCsvCell(value)
}

export function buildLegalCsv(draft: LegalPlanDraft) {
  const safe = sanitizeLegalPlan(draft)
  const summary = summarizeLegalPlan(safe)
  const rows: Array<Array<string | number>> = [
    ["Area", "Working nonprofit legal matter and referral brief"],
    ["Organization", safe.organizationName],
    ["Working matter", safe.matterTitle],
    ["Stage", safe.stage],
    ["Matter category", legalCategoryLabel(safe.category)],
    ["Urgency selected by user", legalUrgencyLabel(safe.urgency)],
    ["Decision question", safe.decisionQuestion],
    ["Known facts", safe.knownFacts],
    ["Assumptions and unknowns", safe.assumptionsUnknowns],
    ["Affected people", safe.affectedPeople],
    ["Jurisdictions and locations", safe.jurisdictionsLocations],
    ["Timeline and stated deadlines", safe.timelineDeadlines],
    ["Governing source documents", safe.governingDocuments],
    ["Actions and communications", safe.actionsCommunications],
    ["Authority and conflicts", safe.authorityConflicts],
    ["Safety, rights, and access", safe.safetyRightsAccess],
    ["Evidence preservation", safe.evidencePreservation],
    ["Confidentiality and data boundary", safe.confidentialityDataBoundary],
    ["Counsel referral", safe.counselReferral],
    ["Decision and follow-up", safe.decisionFollowUp],
    [
      "Drafted areas",
      `${summary.draftedAreaCount} of ${summary.totalAreaCount}`,
    ],
    [
      "Complete pathway steps",
      `${summary.pathwayStepCount} of ${summary.totalPathwayStepCount}`,
    ],
    [
      "Safeguards selected",
      `${summary.safeguardCount} of ${summary.totalSafeguardCount}`,
    ],
    [],
    ["Action phase", "Action", "Evidence"],
    ...buildLegalActions(safe).map((item) => [
      item.phase,
      item.action,
      item.evidence,
    ]),
  ]
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
