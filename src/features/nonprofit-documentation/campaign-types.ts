import type { DocumentationStageId } from "./types"

export type CampaignTypeId =
  | "awareness-education"
  | "service-access"
  | "fundraising"
  | "advocacy-lobbying"
  | "civic-participation"
  | "volunteer-recruitment"
  | "event"
  | "partnership"

export type CampaignPlanDraft = {
  version: 1
  organizationName: string
  campaignName: string
  stage: DocumentationStageId
  campaignType: CampaignTypeId
  startDate: string
  endDate: string
  objective: string
  primaryAudience: string
  audienceEvidence: string
  desiredAction: string
  mainMessage: string
  supportingEvidence: string
  offerDestination: string
  channelRoles: string
  timelineMilestones: string
  budgetCapacity: string
  ownersApprovals: string
  accessibilityLanguage: string
  consentPrivacy: string
  complianceReview: string
  responseEscalation: string
  measurementPlan: string
  learningDecision: string
  hasClaimReview: boolean
  hasAccessibilityReview: boolean
  hasConsentPrivacyReview: boolean
  hasLegalChannelReview: boolean
  hasDeliveryCapacityReview: boolean
}

export type CampaignPlanSummary = {
  draftedAreaCount: number
  totalAreaCount: number
  pathwayStepCount: number
  totalPathwayStepCount: number
  safeguardCount: number
  totalSafeguardCount: number
  durationDays: number | null
}

export type CampaignPlanAction = {
  id: string
  phase:
    | "Frame"
    | "Listen"
    | "Build"
    | "Review"
    | "Launch"
    | "Respond"
    | "Learn"
    | "Safeguards"
  action: string
  evidence: string
}
