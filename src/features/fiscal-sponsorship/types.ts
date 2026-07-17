import type * as React from "react"

import type { FiscalSponsorshipFormBFields } from "./lib/form-b-field-manifest"

export type FiscalSponsorshipApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "needs_info"
  | "approved"
  | "declined"
  | "agreement_ready"
  | "signed"
  | "countersigned"

export type FiscalSponsorshipReviewDecision =
  | "approved"
  | "needs_info"
  | "declined"

export type FiscalSponsorshipDocumentKind =
  | "application"
  | "agreement"
  | "executed_agreement"
  | "audit_certificate"
  | "regrant"

export type FiscalSponsorshipDocumentKey =
  | "tax_id_confirmation"
  | "governing_documents"
  | "formation_or_good_standing"
  | "budget_support"
  | "fundraising_materials"
  | "insurance"
  | "grant_request_support"
  | "grantee_report"
  | "closeout_report"
  | "additional_info"

export type FiscalSponsorshipDocumentStatus =
  | "draft"
  | "generated"
  | "sent_for_signature"
  | "partially_signed"
  | "executed"
  | "voided"
  | "error"

export type FiscalSponsorshipDocumentReviewStatus =
  | "pending"
  | "accepted"
  | "needs_info"
  | "rejected"
  | "not_required"

export type FiscalSponsorshipSignaturePacketStatus =
  | "draft"
  | "sent"
  | "coach_signed"
  | "applicant_signed"
  | "completed"
  | "declined"
  | "voided"
  | "error"

export type FiscalSponsorshipLegalEntityType =
  | "corporation"
  | "individual"
  | "informal_group_with_ein"
  | "llc"
  | "partnership"
  | "other"

export type FiscalSponsorshipProjectDurationType =
  | "temporary"
  | "ongoing_multi_year"

export type FiscalSponsorshipInput = {
  id: string
}

export type FiscalSponsorshipApplicationInput = {
  projectId: string
  status?: FiscalSponsorshipApplicationStatus | string | null
  applicantFullName?: string | null
  applicantFirstName?: string | null
  applicantLastName?: string | null
  mailingStreetAddress?: string | null
  mailingStreetAddress2?: string | null
  mailingCity?: string | null
  mailingState?: string | null
  mailingPostalCode?: string | null
  phoneNumber?: string | null
  primaryEmail?: string | null
  legalEntityType?: FiscalSponsorshipLegalEntityType | string | null
  legalEntityHas501c3?: boolean | null
  formationStatus?: string | null
  projectName?: string | null
  projectDurationType?: FiscalSponsorshipProjectDurationType | string | null
  temporaryStartDate?: string | null
  temporaryEndDate?: string | null
  focusArea?: string | null
  projectDescription?: string | null
  projectLocation?: string | null
  estimatedBudgetCents?: number | null
  expenseSummary?: string | null
  prospectiveFundingSources?: string | null
  publicBenefit?: string | null
  leadershipBackground?: string | null
  initiativeHistory?: string | null
  shortPublicDescription?: string | null
  operatesOutsideUnitedStates?: boolean | null
  receivesInvestorReturnFunds?: boolean | null
  engagesInLobbying?: boolean | null
  hasLegalComplianceFinancialConcerns?: boolean | null
  concernsExplanation?: string | null
  sourceSnapshot?: unknown
  documentTemplatePayload?: unknown
  metadata?: unknown
}

export type FiscalSponsorshipApplicationPrefill = {
  sourceActivityId?: string | null
  sourceActivityTitle?: string | null
  sourceActivityKind?: string | null
  applicantFullName?: string | null
  applicantFirstName?: string | null
  applicantLastName?: string | null
  mailingStreetAddress?: string | null
  mailingStreetAddress2?: string | null
  mailingCity?: string | null
  mailingState?: string | null
  mailingPostalCode?: string | null
  phoneNumber?: string | null
  primaryEmail?: string | null
  legalEntityHas501c3?: boolean | null
  formationStatus?: string | null
  projectName?: string | null
  projectDurationType?: FiscalSponsorshipProjectDurationType | null
  temporaryStartDate?: string | null
  temporaryEndDate?: string | null
  focusArea?: string | null
  projectDescription?: string | null
  projectLocation?: string | null
  estimatedBudgetCents?: number | null
  expenseSummary?: string | null
  prospectiveFundingSources?: string | null
  publicBenefit?: string | null
  leadershipBackground?: string | null
  initiativeHistory?: string | null
  shortPublicDescription?: string | null
}

export type FiscalSponsorshipNormalizedApplicationInput = Required<
  Pick<FiscalSponsorshipApplicationInput, "projectId">
> & {
  status: FiscalSponsorshipApplicationStatus
  applicantFullName: string | null
  applicantFirstName: string | null
  applicantLastName: string | null
  mailingStreetAddress: string | null
  mailingStreetAddress2: string | null
  mailingCity: string | null
  mailingState: string | null
  mailingPostalCode: string | null
  phoneNumber: string | null
  primaryEmail: string | null
  legalEntityType: FiscalSponsorshipLegalEntityType | null
  legalEntityHas501c3: boolean | null
  formationStatus: string | null
  projectName: string | null
  projectDurationType: FiscalSponsorshipProjectDurationType | null
  temporaryStartDate: string | null
  temporaryEndDate: string | null
  focusArea: string | null
  projectDescription: string | null
  projectLocation: string | null
  estimatedBudgetCents: number | null
  expenseSummary: string | null
  prospectiveFundingSources: string | null
  publicBenefit: string | null
  leadershipBackground: string | null
  initiativeHistory: string | null
  shortPublicDescription: string | null
  operatesOutsideUnitedStates: boolean | null
  receivesInvestorReturnFunds: boolean | null
  engagesInLobbying: boolean | null
  hasLegalComplianceFinancialConcerns: boolean | null
  concernsExplanation: string | null
  sourceSnapshot: unknown
  documentTemplatePayload: unknown
  metadata: unknown
}

export type NormalizeFiscalSponsorshipApplicationResult =
  | { ok: true; value: FiscalSponsorshipNormalizedApplicationInput }
  | { ok: false; error: string }

export type SaveFiscalSponsorshipApplicationResult =
  | { ok: true; applicationId: string }
  | { error: string }

export type FiscalSponsorshipApplicationRecord =
  FiscalSponsorshipNormalizedApplicationInput & {
    id: string
    orgId: string
    createdAt: string
    updatedAt: string
  }

export type LoadFiscalSponsorshipApplicationResult =
  | {
      ok: true
      application: FiscalSponsorshipApplicationRecord | null
    }
  | { error: string }

export type FiscalSponsorshipWorkflowActionResult =
  | { ok: true; applicationId: string }
  | { error: string }

export type GenerateFiscalSponsorshipAgreementResult =
  | {
      ok: true
      applicationId: string
      assetId: string | null
      documentId: string
    }
  | { error: string }

export type SendFiscalSponsorshipAgreementResult =
  | {
      ok: true
      applicationId: string
      packetId: string
      providerSubmissionId: string | null
    }
  | { error: string }

export type FiscalSponsorshipReviewInput = {
  decision: FiscalSponsorshipReviewDecision
  notes?: string | null
  projectId: string
}

export type GenerateFiscalSponsorshipAgreementInput = {
  projectId: string
}

export type SendFiscalSponsorshipAgreementInput = {
  documentId?: string | null
  projectId: string
}

export type FiscalSponsorshipSignerRole = "applicant" | "coach_house"
export type FiscalSponsorshipSignatureMethod = "typed" | "drawn"

export type FiscalSponsorshipSigningSession = {
  packetId: string
  projectId: string
  projectName: string
  organizationId: string
  organizationName: string
  role: FiscalSponsorshipSignerRole
  packetStatus: FiscalSponsorshipSignaturePacketStatus
  canSign: boolean
  fieldsEditable: boolean
  fields: FiscalSponsorshipFormBFields
  signerName: string
  signerEmail: string
  signatureMethod: FiscalSponsorshipSignatureMethod
  signatureValue: string
  signerTitle: string
  confirmed: boolean
  draftRevision: number
  draftUpdatedAt: string | null
  previewHref: string
  executedDocumentHref: string | null
  auditDocumentHref: string | null
  applicantSignedAt: string | null
  coachSignedAt: string | null
}

export type LoadFiscalSponsorshipSigningSessionResult =
  | { ok: true; session: FiscalSponsorshipSigningSession }
  | { error: string }

export type SaveFiscalSponsorshipSigningDraftInput = {
  packetId: string
  fields: FiscalSponsorshipFormBFields
  signatureMethod: FiscalSponsorshipSignatureMethod
  signatureValue: string
  signerTitle: string
  confirmed: boolean
  expectedRevision: number
}

export type SaveFiscalSponsorshipSigningDraftResult =
  | { ok: true; revision: number; updatedAt: string }
  | { error: string; stale?: boolean }

export type CompleteFiscalSponsorshipSignatureInput =
  SaveFiscalSponsorshipSigningDraftInput & {
    consented: boolean
    authorized: boolean
  }

export type CompleteFiscalSponsorshipSignatureResult =
  | {
      ok: true
      packetId: string
      status: FiscalSponsorshipSignaturePacketStatus
    }
  | { error: string; field?: string }

export type ConnectFiscalSponsorshipDocumentAssetInput = {
  assetId: string
  documentKey: FiscalSponsorshipDocumentKey
  projectId: string
  title?: string | null
}

export type ConnectFiscalSponsorshipDocumentAssetResult =
  | {
      ok: true
      documentId: string
    }
  | { error: string }

export type ReviewFiscalSponsorshipDocumentInput = {
  decision: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
  documentId: string
  notes?: string | null
  projectId: string
}

export type ReviewFiscalSponsorshipDocumentResult =
  | {
      ok: true
      documentId: string
    }
  | { error: string }

export type FiscalSponsorshipProgramOption = {
  id: string
  title?: string | null
  subtitle?: string | null
  description?: string | null
  bannerImageUrl?: string | null
  imageUrl?: string | null
  location?: string | null
  locationType?: "in_person" | "online" | string | null
  locationUrl?: string | null
  goalCents?: number | null
  raisedCents?: number | null
  estimatedBudgetCents?: number | null
  expenseSummary?: string | null
  prospectiveFundingSources?: string | null
  publicBenefit?: string | null
  startDate?: string | null
  endDate?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressCountry?: string | null
  objectKind?: string | null
  focusArea?: string | null
}

export type FiscalSponsorshipPrototypeStepStatus =
  | "approved"
  | "planned"
  | "running"
  | "complete"
  | "skipped"

export type FiscalSponsorshipPrototypeStep = {
  id: string
  title: string
  description: string
  detail: string
  badgeLabel: string
  toolLabel: string
  status: FiscalSponsorshipPrototypeStepStatus
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export type FiscalSponsorshipPrototypeDocumentStatus =
  | "Info"
  | "Draft"
  | "Needs signature"
  | "Awaiting agreement"
  | "Ready later"

export type FiscalSponsorshipPrototypeDocument = {
  id: string
  title: string
  description: string
  href: string
  downloadHref?: string
  status: FiscalSponsorshipPrototypeDocumentStatus
  stepId: FiscalSponsorshipPrototypeStep["id"]
  signatureRequired: boolean
}

export type FiscalSponsorshipPrototypeSigner = {
  id: string
  role: string
  name: string
  status: "Needs signature" | "Waiting" | "Countersign"
  description: string
}

export type FiscalSponsorshipProjectWorkbenchMetric = {
  id: string
  label: string
  value: string
}

export type FiscalSponsorshipProjectWorkbenchItem = {
  id: string
  label: string
  description: string
  complete: boolean
}

export type FiscalSponsorshipProjectWorkbenchPhaseAction =
  | "application"
  | "assets"
  | "document"
  | "signature"
  | "waiting"

export type FiscalSponsorshipProjectWorkbenchPhase = {
  id: string
  label: string
  description: string
  statusLabel: string
  complete: boolean
  actionLabel: string
  actionType: FiscalSponsorshipProjectWorkbenchPhaseAction
  href: string | null
}

export type FiscalSponsorshipProjectWorkflowSummaryDocument = {
  id: string
  title: string
  kind: FiscalSponsorshipDocumentKind
  status: FiscalSponsorshipDocumentStatus
  documentKey: FiscalSponsorshipDocumentKey | null
  reviewStatus: FiscalSponsorshipDocumentReviewStatus
  version: number
  assetId: string | null
  generatedAt: string | null
  storagePath: string | null
  viewHref: string | null
  downloadHref: string | null
  uploadedAt: string | null
  reviewedAt: string | null
  reviewNotes: string | null
}

export type FiscalSponsorshipProjectWorkflowSummaryPacket = {
  id: string
  status: FiscalSponsorshipSignaturePacketStatus
  provider: string
  providerSubmissionId: string | null
  sentAt: string | null
  completedAt: string | null
  applicantSignerEmail: string | null
  coachSignerEmail: string | null
  applicantSigningHref: string | null
  coachSigningHref: string | null
}

export type FiscalSponsorshipProjectWorkflowEvent = {
  id: string
  actorId: string | null
  applicationId: string | null
  createdAt: string
  eventType: string
  metadata: unknown
  summary: string
}

export type FiscalSponsorshipProjectWorkflowSummary = {
  applicationId: string | null
  applicationStatus: FiscalSponsorshipApplicationStatus | null
  legalEntityType: FiscalSponsorshipLegalEntityType | null
  submittedAt: string | null
  reviewedAt: string | null
  events: FiscalSponsorshipProjectWorkflowEvent[]
  latestAgreementDocument: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  latestExecutedAgreementDocument: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  latestAuditCertificateDocument: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  requiredDocuments: FiscalSponsorshipProjectWorkflowSummaryDocument[]
  latestSignaturePacket: FiscalSponsorshipProjectWorkflowSummaryPacket | null
}

export type FiscalSponsorshipProjectWorkbenchDocumentAction = {
  id: string
  title: string
  description: string
  statusLabel: string
  viewHref: string | null
  downloadHref: string | null
}

export type FiscalSponsorshipProjectWorkbenchSigningAction = {
  id: string
  title: string
  description: string
  href: string | null
  statusLabel: string
}

export type FiscalSponsorshipProjectAssetOption = {
  id: string
  name: string
  description?: string | null
  downloadHref?: string | null
  url?: string | null
  sizeLabel?: string | null
}

export type FiscalSponsorshipProjectWorkbenchData = {
  projectId: string
  projectName: string
  organizationName: string
  applicantName: string
  applicationPrefill?: FiscalSponsorshipApplicationPrefill | null
  statusLabel: string
  readinessPercent: number
  nextStep: string
  workflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
  latestAgreementDocumentId: string | null
  canApproveApplication: boolean
  canGenerateAgreement: boolean
  canSendAgreement: boolean
  documentActions: FiscalSponsorshipProjectWorkbenchDocumentAction[]
  timelineEvents: FiscalSponsorshipProjectWorkflowEvent[]
  metrics: FiscalSponsorshipProjectWorkbenchMetric[]
  phases: FiscalSponsorshipProjectWorkbenchPhase[]
  requiredItems: FiscalSponsorshipProjectWorkbenchItem[]
  reusableItems: FiscalSponsorshipProjectWorkbenchItem[]
  missingItems: FiscalSponsorshipProjectWorkbenchItem[]
  reviewItems: FiscalSponsorshipProjectWorkbenchItem[]
  signingActions: FiscalSponsorshipProjectWorkbenchSigningAction[]
}

export type FiscalSponsorshipProjectWorkbenchDocumentActionProps = {
  connectFiscalSponsorshipDocumentAssetAction?: (
    input: ConnectFiscalSponsorshipDocumentAssetInput
  ) => Promise<ConnectFiscalSponsorshipDocumentAssetResult>
  reviewFiscalSponsorshipDocumentAction?: (
    input: ReviewFiscalSponsorshipDocumentInput
  ) => Promise<ReviewFiscalSponsorshipDocumentResult>
}

export type FiscalSponsorshipProjectWorkbenchAdminActionProps = Pick<
  FiscalSponsorshipProjectWorkbenchDocumentActionProps,
  "reviewFiscalSponsorshipDocumentAction"
> & {
  generateFiscalSponsorshipAgreementAction?: (
    input: GenerateFiscalSponsorshipAgreementInput
  ) => Promise<GenerateFiscalSponsorshipAgreementResult>
  reviewFiscalSponsorshipApplicationAction?: (
    input: FiscalSponsorshipReviewInput
  ) => Promise<FiscalSponsorshipWorkflowActionResult>
  sendFiscalSponsorshipAgreementForSignatureAction?: (
    input: SendFiscalSponsorshipAgreementInput
  ) => Promise<SendFiscalSponsorshipAgreementResult>
}
