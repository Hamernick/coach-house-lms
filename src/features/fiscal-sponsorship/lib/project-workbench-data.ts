import type {
  FiscalSponsorshipApplicationPrefill,
  FiscalSponsorshipProjectWorkbenchData,
  FiscalSponsorshipProjectWorkbenchSigningAction,
  FiscalSponsorshipProjectWorkflowSummary,
} from "../types"
import {
  buildDocumentAction,
  buildRequiredItems,
  buildWorkflowPhases,
  formatApplicationStatus,
  formatDocumentReviewStatus,
  formatDocumentStatus,
  formatPacketStatus,
  getFiscalWorkflowNextStep,
  isApplicationApprovedOrLater,
  isApplicationSubmittedOrLater,
  resolveApplicantSigningStatus,
  resolveCoachSigningStatus,
} from "./project-workbench-data-helpers"

type FiscalSponsorshipProjectWorkbenchSource = {
  project: {
    id: string
    name: string
    description?: string | null
    statusLabel?: string | null
    priorityLabel?: string | null
    locationLabel?: string | null
    taskCount?: number
    fileCount?: number
    noteCount?: number
    assigneeCount?: number
  }
  organization: {
    name: string
    ownerName?: string | null
    organizationStatus?: string | null
    setupCompletedCount?: number
    setupTotalCount?: number
    memberCount?: number
  }
  applicationPrefill?: FiscalSponsorshipApplicationPrefill | null
  workflowSummary?: FiscalSponsorshipProjectWorkflowSummary | null
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function formatCount(
  value: number | undefined,
  singular: string,
  plural: string
) {
  const count = typeof value === "number" && Number.isFinite(value) ? value : 0
  return `${count} ${count === 1 ? singular : plural}`
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function buildFiscalSponsorshipProjectWorkbenchData({
  applicationPrefill = null,
  project,
  organization,
  workflowSummary,
}: FiscalSponsorshipProjectWorkbenchSource): FiscalSponsorshipProjectWorkbenchData {
  const applicationStatus = workflowSummary?.applicationStatus ?? null
  const agreementDocument = workflowSummary?.latestAgreementDocument ?? null
  const executedAgreementDocument =
    workflowSummary?.latestExecutedAgreementDocument ?? null
  const auditCertificateDocument =
    workflowSummary?.latestAuditCertificateDocument ?? null
  const timelineEvents = workflowSummary?.events ?? []
  const requiredDocuments = workflowSummary?.requiredDocuments ?? []
  const signaturePacket = workflowSummary?.latestSignaturePacket ?? null
  const agreementDocumentStatus = agreementDocument?.status ?? null
  const signaturePacketStatus = signaturePacket?.status ?? null
  const hasApplication = Boolean(workflowSummary?.applicationId)
  const hasSubmittedApplication =
    isApplicationSubmittedOrLater(applicationStatus)
  const hasApprovedApplication = isApplicationApprovedOrLater(applicationStatus)
  const hasGeneratedAgreement = Boolean(agreementDocument)
  const hasSentSignaturePacket = Boolean(signaturePacket)
  const hasCompletedSignaturePacket = signaturePacketStatus === "completed"
  const hasProjectDescription = hasValue(project.description)
  const hasProjectLocation = hasValue(project.locationLabel)
  const hasOrganizationOwner = hasValue(organization.ownerName)
  const hasOrganizationSetup =
    typeof organization.setupCompletedCount === "number" &&
    typeof organization.setupTotalCount === "number" &&
    organization.setupTotalCount > 0 &&
    organization.setupCompletedCount >= organization.setupTotalCount
  const hasTeam =
    (organization.memberCount ?? 0) > 0 || (project.assigneeCount ?? 0) > 0
  const hasFiles = (project.fileCount ?? 0) > 0
  const hasRequiredDocumentSupport = requiredDocuments.some(
    (document) => document.documentKey && document.reviewStatus !== "rejected"
  )
  const hasFundraisingMaterialsSupport = requiredDocuments.some(
    (document) =>
      document.documentKey === "fundraising_materials" &&
      document.reviewStatus !== "rejected"
  )
  const hasGrantRequestSupport = requiredDocuments.some(
    (document) =>
      document.documentKey === "grant_request_support" &&
      document.reviewStatus !== "rejected"
  )
  const hasReportSupport = requiredDocuments.some(
    (document) =>
      document.documentKey === "grantee_report" &&
      document.reviewStatus !== "rejected"
  )
  const hasCloseoutReport = requiredDocuments.some(
    (document) =>
      document.documentKey === "closeout_report" &&
      document.reviewStatus !== "rejected"
  )

  const reusableItems = [
    {
      id: "organization-profile",
      label: "Organization profile",
      description: `${organization.name} and owner/contact context`,
      complete: hasOrganizationOwner,
    },
    {
      id: "project-record",
      label: "Project record",
      description: "Name, status, priority, description, and scope source",
      complete: hasProjectDescription,
    },
    {
      id: "project-location",
      label: "Project location",
      description: project.locationLabel || "Location still needs confirmation",
      complete: hasProjectLocation,
    },
    {
      id: "documents",
      label: "Documents",
      description: formatCount(
        project.fileCount,
        "file attached",
        "files attached"
      ),
      complete: hasFiles,
    },
  ]

  const missingItems = [
    {
      id: "legal-entity",
      label: "Legal entity and tax status",
      description: "Entity type, EIN/tax identity, and 501(c)(3) confirmation",
      complete: false,
    },
    {
      id: "budget-funding",
      label: "Budget and funding",
      description: "Estimated budget, expense categories, and funding sources",
      complete: false,
    },
    {
      id: "eligibility-attestations",
      label: "Eligibility attestations",
      description:
        "U.S. operations, lobbying, investor-return funds, and concerns",
      complete: false,
    },
  ]

  const reviewItems = [
    {
      id: "application",
      label: "Application",
      description:
        hasApplication && hasSubmittedApplication
          ? `Application ${formatApplicationStatus(applicationStatus).toLowerCase()}`
          : "Applicant intake still needs to be submitted",
      complete: hasSubmittedApplication,
    },
    {
      id: "coach-review",
      label: "Coach review",
      description:
        hasApprovedApplication && workflowSummary?.reviewedAt
          ? `Approved ${new Date(workflowSummary.reviewedAt).toLocaleDateString()}`
          : "Staff review of completeness, risk, and fundraising language",
      complete: hasApprovedApplication,
    },
    {
      id: "agreement",
      label: "Agreement",
      description: agreementDocument
        ? `${agreementDocument.title} v${agreementDocument.version} is ${formatDocumentStatus(
            agreementDocumentStatus
          ).toLowerCase()}`
        : "Generate a Model C agreement after approval",
      complete: hasGeneratedAgreement,
    },
    {
      id: "signature-packet",
      label: "Signature packet",
      description: signaturePacket
        ? `DocuSeal packet is ${formatPacketStatus(
            signaturePacketStatus
          ).toLowerCase()}`
        : "Send the generated agreement for coach and applicant signatures",
      complete: hasCompletedSignaturePacket,
    },
  ]

  const completedReusableCount = reusableItems.filter(
    (item) => item.complete
  ).length
  const completedReviewCount = reviewItems.filter(
    (item) => item.complete
  ).length
  const readinessPercent = clampPercent(
    ((completedReusableCount + completedReviewCount) /
      (reusableItems.length + missingItems.length + reviewItems.length)) *
      100
  )
  const canApproveApplication = Boolean(
    applicationStatus &&
    ["submitted", "in_review", "needs_info"].includes(applicationStatus)
  )
  const canGenerateAgreement = hasApprovedApplication
  const canSendAgreement = Boolean(
    agreementDocument?.id &&
    agreementDocumentStatus === "generated" &&
    !signaturePacket
  )
  const applicantCanSign = Boolean(
    signaturePacket?.applicantSigningHref &&
    signaturePacketStatus &&
    ["sent", "coach_signed"].includes(signaturePacketStatus)
  )
  const coachCanSign = Boolean(
    signaturePacket?.coachSigningHref &&
    signaturePacketStatus &&
    ["sent", "applicant_signed"].includes(signaturePacketStatus)
  )
  const signingActions: FiscalSponsorshipProjectWorkbenchSigningAction[] =
    signaturePacket
      ? [
          {
            id: "applicant-signature",
            title: "Applicant signature",
            description:
              signaturePacket.applicantSignerEmail ??
              "Applicant receives the DocuSeal signer link",
            href: applicantCanSign
              ? signaturePacket.applicantSigningHref
              : null,
            statusLabel: resolveApplicantSigningStatus(signaturePacketStatus),
          },
          ...(signaturePacket.coachSigningHref
            ? [
                {
                  id: "coach-signature",
                  title: "Coach House countersignature",
                  description:
                    signaturePacket.coachSignerEmail ??
                    "Coach House signer receives the DocuSeal signer link",
                  href: coachCanSign ? signaturePacket.coachSigningHref : null,
                  statusLabel: resolveCoachSigningStatus(signaturePacketStatus),
                },
              ]
            : []),
        ]
      : []
  const phases = buildWorkflowPhases({
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
  })
  const requiredItems = buildRequiredItems({
    agreementDocument,
    hasApplication,
    requiredDocuments,
    signaturePacketStatus,
  })
  const completedRequiredCount = requiredItems.filter(
    (item) => item.complete
  ).length

  return {
    projectId: project.id,
    projectName: project.name,
    organizationName: organization.name,
    applicantName: organization.ownerName?.trim() || "Applicant needed",
    applicationPrefill,
    statusLabel: formatApplicationStatus(applicationStatus),
    readinessPercent: clampPercent(
      ((completedRequiredCount +
        phases.filter((phase) => phase.complete).length) /
        (requiredItems.length + phases.length)) *
        100
    ),
    workflowSummary,
    latestAgreementDocumentId: agreementDocument?.id ?? null,
    canApproveApplication,
    canGenerateAgreement,
    canSendAgreement,
    nextStep: getFiscalWorkflowNextStep({
      agreementDocumentStatus,
      applicationStatus,
      hasCloseoutReport,
      hasGrantRequestSupport,
      hasReportSupport,
      signaturePacketStatus,
    }),
    metrics: [
      {
        id: "application-status",
        label: "Application",
        value: formatApplicationStatus(applicationStatus),
      },
      {
        id: "agreement-status",
        label: "Agreement",
        value: formatDocumentStatus(agreementDocumentStatus),
      },
      {
        id: "signature-status",
        label: "Signatures",
        value: formatPacketStatus(signaturePacketStatus),
      },
      {
        id: "team",
        label: "People",
        value: hasTeam
          ? `${formatCount(organization.memberCount, "org member", "org members")}`
          : "Team needed",
      },
    ],
    timelineEvents,
    documentActions: [
      ...requiredDocuments.map((document) =>
        buildDocumentAction({
          description:
            document.reviewNotes ??
            "Connected from project Assets & Files for Coach House review.",
          document,
          fallbackStatus: formatDocumentReviewStatus(document.reviewStatus),
          id: `required-${document.id}`,
          statusLabel: formatDocumentReviewStatus(document.reviewStatus),
          title: document.title,
        })
      ),
      buildDocumentAction({
        description: agreementDocument
          ? `${agreementDocument.title} v${agreementDocument.version} is ${formatDocumentStatus(
              agreementDocument.status
            ).toLowerCase()}.`
          : "Prepared from confirmed application data.",
        document: agreementDocument,
        fallbackStatus: "Not generated",
        id: "generated-agreement",
        title: "Prepared agreement",
      }),
      buildDocumentAction({
        description: "Stored after DocuSeal reports every signer complete.",
        document: executedAgreementDocument,
        fallbackStatus: "Awaiting signatures",
        id: "executed-agreement",
        title: "Executed agreement",
      }),
      buildDocumentAction({
        description:
          "DocuSeal signing audit trail saved with the final packet.",
        document: auditCertificateDocument,
        fallbackStatus: "Awaiting completion",
        id: "audit-certificate",
        title: "Audit certificate",
      }),
    ],
    phases,
    requiredItems,
    reusableItems,
    missingItems,
    reviewItems,
    signingActions,
  }
}
