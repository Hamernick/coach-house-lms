import type { DocumentationStageId } from "./types"

export type HrRelationshipId =
  | "employee"
  | "volunteer"
  | "independent-contractor"
  | "board-member"
  | "intern-fellow"
  | "mixed-team"

export type HrPlanDraft = {
  version: 1
  organizationName: string
  roleTitle: string
  stage: DocumentationStageId
  relationship: HrRelationshipId
  reviewDays: 30 | 60 | 90 | 180
  missionNeed: string
  roleOutcomes: string
  essentialFunctions: string
  qualifications: string
  scheduleLocation: string
  compensationResources: string
  recruitmentAccess: string
  selectionProcess: string
  onboardingTraining: string
  supervisionFeedback: string
  accommodationsAccess: string
  safetyReporting: string
  recordsBoundary: string
  ownerBackup: string
  transitionPlan: string
  hasClassificationCompensationReview: boolean
  hasFairAccessibleProcessReview: boolean
  hasSafetyReportingReview: boolean
  hasRecordsAuthorityReview: boolean
}

export type HrPlanSummary = {
  draftedAreaCount: number
  totalAreaCount: number
  safeguardCount: number
  totalSafeguardCount: number
  lifecycleStepCount: number
  totalLifecycleStepCount: number
}

export type HrPlanAction = {
  id: string
  phase:
    | "Purpose"
    | "Relationship"
    | "Recruit"
    | "Onboard"
    | "Support"
    | "Safeguards"
    | "Transition"
  action: string
  evidence: string
}
