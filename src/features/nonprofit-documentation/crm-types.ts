import type { DocumentationStageId } from "./types"

export type CrmRelationshipContextId =
  | "fundraising"
  | "program-service"
  | "volunteer"
  | "membership"
  | "partnership"
  | "advocacy-community"
  | "mixed"

export type CrmFieldCategoryId =
  | "identity"
  | "contact-preference"
  | "relationship"
  | "transaction"
  | "program-service"
  | "demographic"
  | "notes"
  | "system"

export type CrmFieldSensitivityId = "standard" | "restricted" | "high-risk"

export type CrmFieldDraft = {
  id: string
  label: string
  category: CrmFieldCategoryId
  purpose: string
  source: string
  sensitivity: CrmFieldSensitivityId
  accessRole: string
  retentionReview: string
}

export type CrmPlanDraft = {
  version: 1
  organizationName: string
  planName: string
  stage: DocumentationStageId
  relationshipContext: CrmRelationshipContextId
  reviewMonths: 3 | 6 | 12
  systemPurpose: string
  peopleAndDecisions: string
  recordBoundary: string
  collectionNoticeConsent: string
  communicationPreferences: string
  identityDeduplication: string
  relationshipLifecycle: string
  accessRoles: string
  dataQualityCorrection: string
  retentionDeletion: string
  integrationsExports: string
  securityIncident: string
  accessibilityLanguage: string
  reportingDecision: string
  vendorMigration: string
  fields: CrmFieldDraft[]
  hasMinimumNecessaryReview: boolean
  hasNoticePreferenceReview: boolean
  hasAccessIntegrationReview: boolean
  hasRetentionIncidentReview: boolean
  hasLegalSectorReview: boolean
}

export type CrmPlanSummary = {
  draftedAreaCount: number
  totalAreaCount: number
  lifecycleStepCount: number
  totalLifecycleStepCount: number
  safeguardCount: number
  totalSafeguardCount: number
  fieldCount: number
  completeFieldCount: number
  representedCategoryCount: number
  highRiskFieldCount: number
}

export type CrmPlanAction = {
  id: string
  phase:
    | "Define"
    | "Collect"
    | "Permission"
    | "Maintain"
    | "Use"
    | "Protect"
    | "Retire"
    | "Field dictionary"
    | "Safeguards"
  action: string
  evidence: string
}
