import type { DocumentationStageId } from "./types"

export type LegalMatterCategoryId =
  | "formation-governance"
  | "tax-exempt-activities"
  | "fundraising"
  | "people-work"
  | "contracts-partnerships"
  | "programs-licensing-safety"
  | "accessibility-civil-rights"
  | "privacy-cybersecurity"
  | "intellectual-property"
  | "property-insurance-risk"
  | "disputes-government"
  | "merger-dissolution-assets"

export type LegalMatterUrgencyId =
  | "planning"
  | "active-decision"
  | "dated-response"
  | "immediate-safety"

export type LegalPlanDraft = {
  version: 1
  organizationName: string
  matterTitle: string
  stage: DocumentationStageId
  category: LegalMatterCategoryId
  urgency: LegalMatterUrgencyId
  decisionQuestion: string
  knownFacts: string
  assumptionsUnknowns: string
  affectedPeople: string
  jurisdictionsLocations: string
  timelineDeadlines: string
  governingDocuments: string
  actionsCommunications: string
  authorityConflicts: string
  safetyRightsAccess: string
  evidencePreservation: string
  confidentialityDataBoundary: string
  counselReferral: string
  decisionFollowUp: string
  hasUrgentSafetyReview: boolean
  hasAuthorityConflictReview: boolean
  hasJurisdictionSourceReview: boolean
  hasQualifiedCounselReview: boolean
}

export type LegalPlanSummary = {
  draftedAreaCount: number
  totalAreaCount: number
  safeguardCount: number
  totalSafeguardCount: number
  pathwayStepCount: number
  totalPathwayStepCount: number
}

export type LegalPlanAction = {
  id: string
  phase:
    | "Triage"
    | "Stabilize"
    | "Preserve"
    | "Scope"
    | "Refer"
    | "Decide"
    | "Safeguards"
  action: string
  evidence: string
}
