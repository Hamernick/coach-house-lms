import type {
  FiscalSponsorshipApplicationStatus,
  FiscalSponsorshipDocumentStatus,
  FiscalSponsorshipSignaturePacketStatus,
} from "../types"

type WebhookRecord = Record<string, unknown>

type FiscalDocuSealWebhookStatusInput = {
  applicantSignerEmail?: string | null
  coachSignerEmail?: string | null
  currentPacketStatus: string
  payload: unknown
}

export type FiscalDocuSealWebhookStatus = {
  applicationStatus: FiscalSponsorshipApplicationStatus | null
  completedAt: string | null
  documentStatus: FiscalSponsorshipDocumentStatus | null
  eventType: string
  packetStatus: FiscalSponsorshipSignaturePacketStatus
  summary: string
}

const PACKET_STATUSES = new Set<FiscalSponsorshipSignaturePacketStatus>([
  "draft",
  "sent",
  "coach_signed",
  "applicant_signed",
  "completed",
  "declined",
  "voided",
  "error",
])

function asRecord(value: unknown): WebhookRecord | null {
  return value && typeof value === "object" ? (value as WebhookRecord) : null
}

function getString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number") return String(value)
  return null
}

function getNestedRecord(record: WebhookRecord | null, path: string[]) {
  let next: unknown = record
  for (const key of path) {
    const nextRecord = asRecord(next)
    if (!nextRecord) return null
    next = nextRecord[key]
  }

  return asRecord(next)
}

function getNestedString(record: WebhookRecord | null, path: string[]) {
  if (!record) return null

  let next: unknown = record
  for (const key of path) {
    const nextRecord = asRecord(next)
    if (!nextRecord) return null
    next = nextRecord[key]
  }

  return getString(next)
}

function collectSubmitters(payload: unknown) {
  const root = asRecord(payload)
  const candidates = [
    root?.submitters,
    getNestedRecord(root, ["submission"])?.submitters,
    getNestedRecord(root, ["data"])?.submitters,
    getNestedRecord(root, ["data", "submission"])?.submitters,
  ]

  return candidates
    .filter(Array.isArray)
    .flatMap((candidate) => candidate as unknown[])
    .map(asRecord)
    .filter(Boolean) as WebhookRecord[]
}

function submitterIsComplete(submitter: WebhookRecord) {
  const status = getString(submitter.status)?.toLowerCase()
  return Boolean(
    submitter.completed_at ||
    submitter.completedAt ||
    status === "completed" ||
    status === "complete" ||
    status === "signed"
  )
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null
}

function resolveSubmitterEmail(payload: unknown) {
  const root = asRecord(payload)
  const submitter =
    getNestedRecord(root, ["submitter"]) ??
    getNestedRecord(root, ["data", "submitter"]) ??
    getNestedRecord(root, ["submission", "submitter"]) ??
    getNestedRecord(root, ["data", "submission", "submitter"])

  return (
    getNestedString(submitter, ["email"]) ??
    getNestedString(submitter, ["email_address"]) ??
    getNestedString(submitter, ["emailAddress"])
  )
}

function resolveCompletedAt(payload: unknown) {
  const root = asRecord(payload)
  const submitter =
    getNestedRecord(root, ["submitter"]) ??
    getNestedRecord(root, ["data", "submitter"])

  return (
    getNestedString(root, ["completed_at"]) ??
    getNestedString(root, ["completedAt"]) ??
    getNestedString(root, ["submission", "completed_at"]) ??
    getNestedString(root, ["data", "submission", "completed_at"]) ??
    getNestedString(submitter, ["completed_at"]) ??
    null
  )
}

function resolvePacketStatus(status: string) {
  return PACKET_STATUSES.has(status as FiscalSponsorshipSignaturePacketStatus)
    ? (status as FiscalSponsorshipSignaturePacketStatus)
    : "sent"
}

export function resolveDocuSealWebhookEventType(payload: unknown) {
  const root = asRecord(payload)
  return (
    getNestedString(root, ["event_type"]) ??
    getNestedString(root, ["eventType"]) ??
    getNestedString(root, ["event"]) ??
    getNestedString(root, ["type"]) ??
    getNestedString(root, ["data", "event_type"]) ??
    "docuseal.webhook"
  )
}

export function resolveDocuSealWebhookSubmissionId(payload: unknown) {
  const root = asRecord(payload)
  const data = getNestedRecord(root, ["data"])

  return (
    getNestedString(root, ["submission_id"]) ??
    getNestedString(root, ["submissionId"]) ??
    getNestedString(root, ["submission", "id"]) ??
    getNestedString(data, ["submission_id"]) ??
    getNestedString(data, ["submissionId"]) ??
    getNestedString(data, ["submission", "id"]) ??
    getNestedString(root, ["metadata", "submissionId"]) ??
    getNestedString(data, ["metadata", "submissionId"]) ??
    null
  )
}

export function resolveDocuSealWebhookAuditLogUrl(payload: unknown) {
  const root = asRecord(payload)
  return (
    getNestedString(root, ["audit_log_url"]) ??
    getNestedString(root, ["auditLogUrl"]) ??
    getNestedString(root, ["data", "audit_log_url"]) ??
    getNestedString(root, ["data", "auditLogUrl"]) ??
    null
  )
}

export function resolveDocuSealWebhookCombinedDocumentUrl(payload: unknown) {
  const root = asRecord(payload)
  return (
    getNestedString(root, ["combined_document_url"]) ??
    getNestedString(root, ["combinedDocumentUrl"]) ??
    getNestedString(root, ["data", "combined_document_url"]) ??
    getNestedString(root, ["data", "combinedDocumentUrl"]) ??
    null
  )
}

export function mapDocuSealWebhookToFiscalStatus({
  applicantSignerEmail,
  coachSignerEmail,
  currentPacketStatus,
  payload,
}: FiscalDocuSealWebhookStatusInput): FiscalDocuSealWebhookStatus {
  const eventType = resolveDocuSealWebhookEventType(payload)
  const normalizedEventType = eventType.toLowerCase()
  const completedAt = resolveCompletedAt(payload)
  const submitters = collectSubmitters(payload)
  const allSubmittersComplete =
    submitters.length > 1 && submitters.every(submitterIsComplete)

  if (
    normalizedEventType.includes("declined") ||
    normalizedEventType.includes("rejected")
  ) {
    return {
      applicationStatus: null,
      completedAt: null,
      documentStatus: "voided",
      eventType,
      packetStatus: "declined",
      summary: "DocuSeal reported that a fiscal sponsorship signer declined.",
    }
  }

  if (
    normalizedEventType.includes("void") ||
    normalizedEventType.includes("cancel")
  ) {
    return {
      applicationStatus: null,
      completedAt: null,
      documentStatus: "voided",
      eventType,
      packetStatus: "voided",
      summary: "DocuSeal reported that the signing packet was voided.",
    }
  }

  if (
    normalizedEventType.includes("error") ||
    normalizedEventType.includes("failed")
  ) {
    return {
      applicationStatus: null,
      completedAt: null,
      documentStatus: "error",
      eventType,
      packetStatus: "error",
      summary: "DocuSeal reported an error for the signing packet.",
    }
  }

  if (
    allSubmittersComplete ||
    (normalizedEventType.includes("complete") &&
      !normalizedEventType.includes("submitter"))
  ) {
    return {
      applicationStatus: "countersigned",
      completedAt: completedAt ?? new Date().toISOString(),
      documentStatus: "executed",
      eventType,
      packetStatus: "completed",
      summary: "Fiscal sponsorship agreement completed in DocuSeal.",
    }
  }

  if (
    normalizedEventType.includes("signed") ||
    normalizedEventType.includes("complete")
  ) {
    const submitterEmail = normalizeEmail(resolveSubmitterEmail(payload))
    const applicantEmail = normalizeEmail(applicantSignerEmail)
    const coachEmail = normalizeEmail(coachSignerEmail)
    const isApplicant = submitterEmail && submitterEmail === applicantEmail
    const isCoach = submitterEmail && submitterEmail === coachEmail

    if (isApplicant) {
      return {
        applicationStatus: "signed",
        completedAt: null,
        documentStatus: "partially_signed",
        eventType,
        packetStatus: "applicant_signed",
        summary: "Applicant signed the fiscal sponsorship agreement.",
      }
    }

    if (isCoach) {
      return {
        applicationStatus: null,
        completedAt: null,
        documentStatus: "partially_signed",
        eventType,
        packetStatus: "coach_signed",
        summary: "Coach House signed the fiscal sponsorship agreement.",
      }
    }
  }

  return {
    applicationStatus: null,
    completedAt: null,
    documentStatus: null,
    eventType,
    packetStatus: resolvePacketStatus(currentPacketStatus),
    summary: `DocuSeal webhook received: ${eventType}.`,
  }
}
