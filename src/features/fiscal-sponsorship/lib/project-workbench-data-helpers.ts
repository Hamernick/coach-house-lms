import type {
  FiscalSponsorshipApplicationStatus,
  FiscalSponsorshipDocumentKey,
  FiscalSponsorshipDocumentStatus,
  FiscalSponsorshipProjectWorkbenchDocumentAction,
  FiscalSponsorshipProjectWorkbenchItem,
  FiscalSponsorshipProjectWorkbenchPhase,
  FiscalSponsorshipProjectWorkflowSummary,
  FiscalSponsorshipProjectWorkflowSummaryDocument,
  FiscalSponsorshipSignaturePacketStatus,
} from "../types"

export function isApplicationSubmittedOrLater(
  status: FiscalSponsorshipApplicationStatus | null | undefined
) {
  return Boolean(
    status &&
    [
      "submitted",
      "in_review",
      "needs_info",
      "approved",
      "agreement_ready",
      "signed",
      "countersigned",
    ].includes(status)
  )
}

export function isApplicationApprovedOrLater(
  status: FiscalSponsorshipApplicationStatus | null | undefined
) {
  return Boolean(
    status &&
    ["approved", "agreement_ready", "signed", "countersigned"].includes(status)
  )
}

export function formatApplicationStatus(
  status: FiscalSponsorshipApplicationStatus | null | undefined
) {
  const labels: Record<FiscalSponsorshipApplicationStatus, string> = {
    agreement_ready: "Agreement ready",
    approved: "Approved",
    countersigned: "Countersigned",
    declined: "Declined",
    draft: "Draft intake",
    in_review: "In review",
    needs_info: "Needs info",
    signed: "Signed",
    submitted: "Submitted",
  }

  return status ? labels[status] : "No application"
}

export function formatDocumentStatus(
  status: FiscalSponsorshipDocumentStatus | null | undefined
) {
  const labels: Record<FiscalSponsorshipDocumentStatus, string> = {
    draft: "Draft",
    error: "Error",
    executed: "Executed",
    generated: "Generated",
    partially_signed: "Partially signed",
    sent_for_signature: "Sent for signature",
    voided: "Voided",
  }

  return status ? labels[status] : "Not generated"
}

export function formatPacketStatus(
  status: FiscalSponsorshipSignaturePacketStatus | null | undefined
) {
  const labels: Record<FiscalSponsorshipSignaturePacketStatus, string> = {
    applicant_signed: "Applicant signed",
    coach_signed: "Coach signed",
    completed: "Completed",
    declined: "Declined",
    draft: "Draft",
    error: "Error",
    sent: "Sent",
    voided: "Voided",
  }

  return status ? labels[status] : "Not sent"
}

export function formatDocumentReviewStatus(
  status: FiscalSponsorshipProjectWorkflowSummaryDocument["reviewStatus"]
) {
  const labels: Record<
    FiscalSponsorshipProjectWorkflowSummaryDocument["reviewStatus"],
    string
  > = {
    accepted: "Accepted",
    needs_info: "Needs info",
    not_required: "Not required",
    pending: "Pending review",
    rejected: "Rejected",
  }

  return labels[status]
}

export function buildDocumentAction({
  description,
  document,
  fallbackStatus,
  id,
  statusLabel,
  title,
}: {
  description: string
  document?: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  fallbackStatus: string
  id: string
  statusLabel?: string
  title: string
}): FiscalSponsorshipProjectWorkbenchDocumentAction {
  return {
    id,
    title: document?.title ?? title,
    description,
    statusLabel: statusLabel
      ? statusLabel
      : document
        ? formatDocumentStatus(document.status)
        : fallbackStatus,
    viewHref: document?.viewHref ?? null,
    downloadHref: document?.downloadHref ?? null,
  }
}

export function resolveApplicantSigningStatus(
  status: FiscalSponsorshipSignaturePacketStatus | null | undefined
) {
  if (!status) return "Not sent"
  if (["applicant_signed", "completed"].includes(status)) return "Signed"
  if (["declined", "voided", "error"].includes(status)) {
    return formatPacketStatus(status)
  }
  return "Needs signature"
}

export function resolveCoachSigningStatus(
  status: FiscalSponsorshipSignaturePacketStatus | null | undefined
) {
  if (!status) return "Not sent"
  if (["coach_signed", "completed"].includes(status)) return "Signed"
  if (["declined", "voided", "error"].includes(status)) {
    return formatPacketStatus(status)
  }
  return "Needs signature"
}

export function getFiscalWorkflowNextStep({
  agreementDocumentStatus,
  applicationStatus,
  hasCloseoutReport,
  hasGrantRequestSupport,
  hasReportSupport,
  signaturePacketStatus,
}: {
  agreementDocumentStatus?: FiscalSponsorshipDocumentStatus | null
  applicationStatus?: FiscalSponsorshipApplicationStatus | null
  hasCloseoutReport?: boolean
  hasGrantRequestSupport?: boolean
  hasReportSupport?: boolean
  signaturePacketStatus?: FiscalSponsorshipSignaturePacketStatus | null
}) {
  if (!applicationStatus || applicationStatus === "draft") {
    return "Complete and submit the application"
  }

  if (applicationStatus === "submitted" || applicationStatus === "in_review") {
    return "Coach review and approval"
  }

  if (applicationStatus === "needs_info") {
    return "Collect requested application updates"
  }

  if (applicationStatus === "declined") {
    return "Review decline reason before restarting"
  }

  if (!agreementDocumentStatus || agreementDocumentStatus === "draft") {
    return "Prepare the sponsorship agreement"
  }

  if (agreementDocumentStatus === "generated" && !signaturePacketStatus) {
    return "Send prepared agreement for signatures"
  }

  if (
    signaturePacketStatus &&
    ["sent", "coach_signed", "applicant_signed"].includes(signaturePacketStatus)
  ) {
    return "Track remaining signatures"
  }

  if (signaturePacketStatus === "completed") {
    if (!hasGrantRequestSupport) return "Prepare the first grant request"
    if (!hasReportSupport) return "Submit the next grantee report"
    if (!hasCloseoutReport) return "Keep reporting current"
    return "Review closeout status"
  }

  return "Review fiscal sponsorship workflow status"
}

export function buildRequiredItems({
  agreementDocument,
  hasApplication,
  requiredDocuments,
  signaturePacketStatus,
}: {
  agreementDocument: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  hasApplication: boolean
  requiredDocuments: FiscalSponsorshipProjectWorkflowSummaryDocument[]
  signaturePacketStatus: FiscalSponsorshipSignaturePacketStatus | null
}): FiscalSponsorshipProjectWorkbenchItem[] {
  const hasCompletedSignaturePacket = signaturePacketStatus === "completed"
  const connectedDocumentKeys = new Set(
    requiredDocuments
      .filter((document) => document.reviewStatus !== "rejected")
      .map((document) => document.documentKey)
      .filter((key): key is FiscalSponsorshipDocumentKey => Boolean(key))
  )

  return [
    {
      id: "application-intake",
      label: "Application intake",
      description:
        "Legal identity, U.S. tax reporting details, project scope, budget, fundraising, public benefit, and attestations.",
      complete: hasApplication,
    },
    {
      id: "formation-tax-docs",
      label: "Legal entity and tax status",
      description:
        "EIN/tax identity, governing or formation documents, and any good-standing support requested by Coach House.",
      complete:
        connectedDocumentKeys.has("tax_id_confirmation") ||
        connectedDocumentKeys.has("governing_documents") ||
        connectedDocumentKeys.has("formation_or_good_standing"),
    },
    {
      id: "budget-fundraising-support",
      label: "Budget and fundraising support",
      description:
        "Preliminary budget, expense support, funding sources, and fundraising materials that mention Coach House.",
      complete:
        connectedDocumentKeys.has("budget_support") ||
        connectedDocumentKeys.has("fundraising_materials"),
    },
    {
      id: "agreement-record",
      label: "Agreement record",
      description:
        "Prepared from confirmed intake data and stored with the project documents.",
      complete: Boolean(agreementDocument),
    },
    {
      id: "disbursement-support",
      label: "Grant request support",
      description:
        "Amount, use of funds, timeframe, payment method, supporting documentation, and certification before funds move.",
      complete:
        hasCompletedSignaturePacket &&
        connectedDocumentKeys.has("grant_request_support"),
    },
  ]
}

export function buildWorkflowPhases({
  agreementDocument,
  applicationStatus,
  executedAgreementDocument,
  hasCloseoutReport,
  hasFundraisingMaterialsSupport,
  hasGrantRequestSupport,
  hasReportSupport,
  hasRequiredDocumentSupport,
  signaturePacket,
  signaturePacketStatus,
}: {
  agreementDocument: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  applicationStatus: FiscalSponsorshipApplicationStatus | null
  executedAgreementDocument: FiscalSponsorshipProjectWorkflowSummaryDocument | null
  hasCloseoutReport: boolean
  hasFundraisingMaterialsSupport: boolean
  hasGrantRequestSupport: boolean
  hasReportSupport: boolean
  hasRequiredDocumentSupport: boolean
  signaturePacket: FiscalSponsorshipProjectWorkflowSummary["latestSignaturePacket"]
  signaturePacketStatus: FiscalSponsorshipSignaturePacketStatus | null
}): FiscalSponsorshipProjectWorkbenchPhase[] {
  const hasSubmittedApplication =
    isApplicationSubmittedOrLater(applicationStatus)
  const hasApprovedApplication = isApplicationApprovedOrLater(applicationStatus)
  const hasCompletedSignaturePacket = signaturePacketStatus === "completed"
  const applicantSigningHref =
    signaturePacketStatus && signaturePacketStatus === "sent"
      ? (signaturePacket?.applicantSigningHref ?? null)
      : null
  const coachSigningHref =
    signaturePacketStatus && signaturePacketStatus === "applicant_signed"
      ? (signaturePacket?.coachSigningHref ?? null)
      : null
  const signingHref: string | null =
    applicantSigningHref ?? coachSigningHref ?? null

  return [
    {
      id: "application-intake",
      label: "Application intake",
      description:
        "Capture the handbook-required project, legal, budget, fundraising, and risk details once.",
      statusLabel: formatApplicationStatus(applicationStatus),
      complete: hasSubmittedApplication,
      actionLabel: hasSubmittedApplication ? "Open" : "Complete",
      actionType: "application",
      href: null,
    },
    {
      id: "required-documents",
      label: "Required documents",
      description:
        "Attach tax identity, formation, budget, fundraising, and later grant-request support in Assets & Files.",
      statusLabel: hasRequiredDocumentSupport
        ? "Files attached"
        : "Needs uploads",
      complete: hasRequiredDocumentSupport,
      actionLabel: hasRequiredDocumentSupport ? "Review files" : "Upload files",
      actionType: "assets",
      href: null,
    },
    {
      id: "coach-review",
      label: "Coach House review",
      description:
        "Staff reviews completeness, charitable purpose, U.S. eligibility, fundraising language, and risk signals.",
      statusLabel: hasApprovedApplication
        ? "Approved"
        : hasSubmittedApplication
          ? "In review"
          : "Waiting on intake",
      complete: hasApprovedApplication,
      actionLabel: hasSubmittedApplication ? "Waiting" : "Not ready",
      actionType: "waiting",
      href: null,
    },
    {
      id: "agreement",
      label: "Agreement",
      description:
        "Coach House prepares the Form B agreement from confirmed intake data and stores it with the project.",
      statusLabel: formatDocumentStatus(agreementDocument?.status),
      complete: Boolean(agreementDocument),
      actionLabel: agreementDocument?.viewHref ? "View" : "Waiting",
      actionType: agreementDocument?.viewHref ? "document" : "waiting",
      href: agreementDocument?.viewHref ?? null,
    },
    {
      id: "signatures",
      label: "Signature packet",
      description:
        "The applicant signs first in Coach House, then a super admin countersigns. Executed files and audit records stay private.",
      statusLabel: formatPacketStatus(signaturePacketStatus),
      complete: hasCompletedSignaturePacket,
      actionLabel: signingHref ? "Sign" : "Waiting",
      actionType: signingHref ? "signature" : "waiting",
      href: signingHref,
    },
    {
      id: "fund-setup",
      label: "Fund setup",
      description:
        "After signing, confirm donation instructions, fundraising language, and the project fund setup before money moves.",
      statusLabel: hasCompletedSignaturePacket ? "Ready" : "After signing",
      complete: hasCompletedSignaturePacket,
      actionLabel: hasCompletedSignaturePacket ? "Review setup" : "Locked",
      actionType: hasCompletedSignaturePacket ? "assets" : "waiting",
      href: null,
    },
    {
      id: "fundraising-approval",
      label: "Fundraising approval",
      description:
        "Submit grant proposals, donation pages, pitch decks, crowdfunding pages, and tax-deductibility language before anything goes live.",
      statusLabel: hasFundraisingMaterialsSupport
        ? "Materials attached"
        : hasCompletedSignaturePacket
          ? "Needs materials"
          : "After signing",
      complete: hasCompletedSignaturePacket && hasFundraisingMaterialsSupport,
      actionLabel: hasCompletedSignaturePacket ? "Upload materials" : "Locked",
      actionType: hasCompletedSignaturePacket ? "assets" : "waiting",
      href: null,
    },
    {
      id: "donations-ledger",
      label: "Donations and ledger",
      description:
        "Donations go to Coach House, are reviewed, receipted, reduced by the 7% fee, and tracked in the restricted fund ledger.",
      statusLabel: hasCompletedSignaturePacket
        ? "Coach House managed"
        : "After signing",
      complete: hasCompletedSignaturePacket,
      actionLabel: "Coach House managed",
      actionType: "waiting",
      href: null,
    },
    {
      id: "grant-request",
      label: "Grant request",
      description:
        "After signatures, collect the request amount, payment details, use of funds, and support before disbursement.",
      statusLabel: hasGrantRequestSupport
        ? "Support attached"
        : hasCompletedSignaturePacket
          ? "Ready"
          : "After signing",
      complete: hasCompletedSignaturePacket && hasGrantRequestSupport,
      actionLabel: hasCompletedSignaturePacket ? "Prepare" : "Locked",
      actionType: hasCompletedSignaturePacket ? "assets" : "waiting",
      href: null,
    },
    {
      id: "reporting",
      label: "Reporting",
      description:
        "Submit monthly, quarterly, annual, or final activity and expense reports when requested.",
      statusLabel: hasReportSupport
        ? "Report attached"
        : hasCompletedSignaturePacket
          ? "Ready"
          : "After signing",
      complete: hasCompletedSignaturePacket && hasReportSupport,
      actionLabel: hasCompletedSignaturePacket ? "Upload report" : "Locked",
      actionType: hasCompletedSignaturePacket ? "assets" : "waiting",
      href: null,
    },
    {
      id: "closeout",
      label: "Closeout",
      description:
        "If sponsorship ends, upload final reporting and remaining-funds documentation for Coach House reconciliation.",
      statusLabel: hasCloseoutReport
        ? "Closeout attached"
        : hasCompletedSignaturePacket
          ? "When needed"
          : "After signing",
      complete: hasCompletedSignaturePacket && hasCloseoutReport,
      actionLabel: hasCompletedSignaturePacket ? "Upload closeout" : "Locked",
      actionType: hasCompletedSignaturePacket ? "assets" : "waiting",
      href: null,
    },
    ...(executedAgreementDocument?.viewHref
      ? [
          {
            id: "executed-agreement",
            label: "Executed agreement",
            description:
              "Final signed agreement stored privately after both signatures are complete.",
            statusLabel: formatDocumentStatus(executedAgreementDocument.status),
            complete: true,
            actionLabel: "View",
            actionType: "document" as const,
            href: executedAgreementDocument.viewHref,
          },
        ]
      : []),
  ]
}
