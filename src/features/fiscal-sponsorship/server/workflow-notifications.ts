import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createNotification, type NotificationTone } from "@/lib/notifications"
import type { Database } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { formatFiscalSponsorshipDocumentKey } from "../lib/required-documents"
import type {
  FiscalSponsorshipDocumentKey,
  FiscalSponsorshipDocumentReviewStatus,
  FiscalSponsorshipReviewDecision,
} from "../types"
import type { FiscalApplicationRow } from "./workflow-support"

type FiscalNotificationClient = SupabaseClient<Database, "public">

type FiscalNotificationPayload = {
  actorId?: string | null
  application: FiscalApplicationRow
  description: string
  href: string
  metadata?: Record<string, unknown>
  title: string
  tone?: NotificationTone
  type: string
}

type FiscalNotificationCopy = Pick<
  FiscalNotificationPayload,
  "description" | "title" | "tone"
>

type FiscalDocuSealCompletionNotificationInput = {
  actorId?: string | null
  applicationId: string
  auditDocumentId?: string | null
  executedDocumentId?: string | null
  orgId: string
  projectId: string
  projectName?: string | null
  submissionId: string
}

const FISCAL_NOTIFICATION_ORG_ROLES = new Set(["owner", "admin", "staff"])

function getFiscalNotificationClient() {
  try {
    return createSupabaseAdminClient()
  } catch (error) {
    console.error("[fiscal-sponsorship] Notifications unavailable.", error)
    return null
  }
}

function getFiscalProjectName(application: FiscalApplicationRow) {
  return application.project_name?.trim() || "Fiscal sponsorship project"
}

function uniqueUserIds(userIds: Array<string | null | undefined>) {
  return [
    ...new Set(userIds.filter((userId): userId is string => Boolean(userId))),
  ]
}

async function loadPlatformAdminRecipientIds({
  excludeUserId,
  supabase,
}: {
  excludeUserId?: string | null
  supabase: Pick<FiscalNotificationClient, "from">
}) {
  const { data, error } = await supabase
    .from("platform_staff_members")
    .select("user_id")
    .returns<Array<{ user_id: string }>>()

  if (error) {
    console.error(
      "[fiscal-sponsorship] Unable to load admin notification recipients.",
      error
    )
    return []
  }

  return uniqueUserIds((data ?? []).map((staff) => staff.user_id)).filter(
    (userId) => userId !== excludeUserId
  )
}

async function loadOrganizationEditorRecipientIds({
  excludeUserId,
  orgId,
  supabase,
}: {
  excludeUserId?: string | null
  orgId: string
  supabase: Pick<FiscalNotificationClient, "from">
}) {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("member_id, role")
    .eq("org_id", orgId)
    .returns<Array<{ member_id: string; role: string }>>()

  if (error) {
    console.error(
      "[fiscal-sponsorship] Unable to load organization notification recipients.",
      error
    )
    return uniqueUserIds([orgId]).filter((userId) => userId !== excludeUserId)
  }

  return uniqueUserIds([
    orgId,
    ...(data ?? [])
      .filter((membership) =>
        FISCAL_NOTIFICATION_ORG_ROLES.has(membership.role)
      )
      .map((membership) => membership.member_id),
  ]).filter((userId) => userId !== excludeUserId)
}

async function createFiscalNotifications({
  payload,
  recipientIds,
  supabase,
}: {
  payload: FiscalNotificationPayload
  recipientIds: string[]
  supabase: FiscalNotificationClient
}) {
  await Promise.all(
    recipientIds.map(async (userId) => {
      const result = await createNotification(supabase, {
        actorId: payload.actorId ?? null,
        description: payload.description,
        href: payload.href,
        metadata: {
          applicationId: payload.application.id,
          orgId: payload.application.org_id,
          projectId: payload.application.project_id,
          ...(payload.metadata ?? {}),
        },
        orgId: payload.application.org_id,
        title: payload.title,
        tone: payload.tone ?? "info",
        type: payload.type,
        userId,
      })

      if ("error" in result) {
        console.error(
          "[fiscal-sponsorship] Unable to create notification.",
          result.error
        )
      }
    })
  )
}

async function notifyPlatformAdmins(payload: FiscalNotificationPayload) {
  const supabase = getFiscalNotificationClient()
  if (!supabase) return

  const recipientIds = await loadPlatformAdminRecipientIds({
    excludeUserId: payload.actorId,
    supabase,
  })
  if (recipientIds.length === 0) return

  await createFiscalNotifications({ payload, recipientIds, supabase })
}

async function notifyOrganizationEditors(payload: FiscalNotificationPayload) {
  const supabase = getFiscalNotificationClient()
  if (!supabase) return

  const recipientIds = await loadOrganizationEditorRecipientIds({
    excludeUserId: payload.actorId,
    orgId: payload.application.org_id,
    supabase,
  })
  if (recipientIds.length === 0) return

  await createFiscalNotifications({ payload, recipientIds, supabase })
}

function reviewDecisionNotificationCopy({
  application,
  decision,
}: {
  application: FiscalApplicationRow
  decision: FiscalSponsorshipReviewDecision
}): FiscalNotificationCopy {
  const projectName = getFiscalProjectName(application)

  if (decision === "approved") {
    return {
      description: `${projectName} was approved for fiscal sponsorship. Agreement steps are next.`,
      title: "Fiscal sponsorship approved",
      tone: "success" satisfies NotificationTone,
    }
  }

  if (decision === "needs_info") {
    return {
      description: `Coach House needs more information for ${projectName}. Open the fiscal sponsorship flow to respond.`,
      title: "Fiscal sponsorship needs info",
      tone: "warning" satisfies NotificationTone,
    }
  }

  return {
    description: `${projectName} was declined for fiscal sponsorship. Review the notes in the fiscal sponsorship flow.`,
    title: "Fiscal sponsorship declined",
    tone: "warning" satisfies NotificationTone,
  }
}

function documentReviewNotificationCopy({
  decision,
  documentKey,
}: {
  decision: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
  documentKey: FiscalSponsorshipDocumentKey | null
}): FiscalNotificationCopy {
  const documentLabel = documentKey
    ? formatFiscalSponsorshipDocumentKey(documentKey)
    : "Fiscal sponsorship document"

  if (decision === "accepted") {
    return {
      description: `${documentLabel} was accepted by Coach House.`,
      title: "Fiscal document accepted",
      tone: "success" satisfies NotificationTone,
    }
  }

  if (decision === "needs_info") {
    return {
      description: `${documentLabel} needs more information. Upload a new version when ready.`,
      title: "Fiscal document needs info",
      tone: "warning" satisfies NotificationTone,
    }
  }

  if (decision === "not_required") {
    return {
      description: `${documentLabel} was marked not required for this fiscal sponsorship flow.`,
      title: "Fiscal document not required",
      tone: "info" satisfies NotificationTone,
    }
  }

  return {
    description: `${documentLabel} was rejected. Upload a new version when ready.`,
    title: "Fiscal document rejected",
    tone: "warning" satisfies NotificationTone,
  }
}

export async function notifyFiscalApplicationSubmitted({
  actorId,
  application,
}: {
  actorId: string
  application: FiscalApplicationRow
}) {
  await notifyPlatformAdmins({
    actorId,
    application,
    description: `${getFiscalProjectName(application)} is ready for Coach House review.`,
    href: `/organizations/${application.project_id}`,
    title: "Fiscal sponsorship application submitted",
    tone: "info",
    type: "fiscal_sponsorship_application_submitted",
  })
}

export async function notifyFiscalApplicationReviewed({
  actorId,
  application,
  decision,
}: {
  actorId: string
  application: FiscalApplicationRow
  decision: FiscalSponsorshipReviewDecision
}) {
  const copy = reviewDecisionNotificationCopy({ application, decision })

  await notifyOrganizationEditors({
    actorId,
    application,
    href: "/my-organization",
    metadata: { decision },
    type: `fiscal_sponsorship_application_${decision}`,
    ...copy,
  })
}

export async function notifyFiscalDocumentConnected({
  actorId,
  application,
  documentId,
  documentKey,
}: {
  actorId: string
  application: FiscalApplicationRow
  documentId: string
  documentKey: FiscalSponsorshipDocumentKey
}) {
  await notifyPlatformAdmins({
    actorId,
    application,
    description: `${formatFiscalSponsorshipDocumentKey(documentKey)} for ${getFiscalProjectName(
      application
    )} is ready for review.`,
    href: `/organizations/${application.project_id}`,
    metadata: { documentId, documentKey },
    title: "Fiscal document uploaded",
    tone: "info",
    type: "fiscal_sponsorship_document_connected",
  })
}

export async function notifyFiscalDocumentReviewed({
  actorId,
  application,
  decision,
  documentId,
  documentKey,
}: {
  actorId: string
  application: FiscalApplicationRow
  decision: Exclude<FiscalSponsorshipDocumentReviewStatus, "pending">
  documentId: string
  documentKey: FiscalSponsorshipDocumentKey | null
}) {
  const copy = documentReviewNotificationCopy({ decision, documentKey })

  await notifyOrganizationEditors({
    actorId,
    application,
    href: "/my-organization",
    metadata: { decision, documentId, documentKey },
    type: `fiscal_sponsorship_document_${decision}`,
    ...copy,
  })
}

export async function notifyFiscalAgreementGenerated({
  actorId,
  application,
  documentId,
}: {
  actorId: string
  application: FiscalApplicationRow
  documentId: string
}) {
  await notifyOrganizationEditors({
    actorId,
    application,
    description: `Coach House prepared the fiscal sponsorship agreement for ${getFiscalProjectName(
      application
    )}.`,
    href: "/my-organization",
    metadata: { documentId },
    title: "Fiscal agreement prepared",
    tone: "info",
    type: "fiscal_sponsorship_agreement_generated",
  })
}

export async function notifyFiscalAgreementSent({
  actorId,
  application,
  packetId,
  providerSubmissionId,
}: {
  actorId: string
  application: FiscalApplicationRow
  packetId: string
  providerSubmissionId: string | null
}) {
  await notifyOrganizationEditors({
    actorId,
    application,
    description: `The fiscal sponsorship agreement for ${getFiscalProjectName(
      application
    )} was sent for signature.`,
    href: "/my-organization",
    metadata: { packetId, providerSubmissionId },
    title: "Fiscal agreement sent for signature",
    tone: "info",
    type: "fiscal_sponsorship_agreement_sent",
  })
}

export async function notifyFiscalDocuSealCompleted({
  actorId = null,
  applicationId,
  auditDocumentId,
  executedDocumentId,
  orgId,
  projectId,
  projectName,
  submissionId,
}: FiscalDocuSealCompletionNotificationInput) {
  const application = {
    id: applicationId,
    org_id: orgId,
    project_id: projectId,
    project_name: projectName ?? null,
  } as FiscalApplicationRow
  const payload: FiscalNotificationPayload = {
    actorId,
    application,
    description: `DocuSeal completed signing for ${projectName?.trim() || "the fiscal sponsorship agreement"}. Final files are ready.`,
    href: "/my-organization",
    metadata: {
      auditDocumentId,
      executedDocumentId,
      submissionId,
    },
    title: "Fiscal agreement fully signed",
    tone: "success" satisfies NotificationTone,
    type: "fiscal_sponsorship_agreement_completed",
  }

  await Promise.all([
    notifyOrganizationEditors(payload),
    notifyPlatformAdmins(payload),
  ])
}

export async function notifyFiscalNativeAgreementCompleted({
  actorId,
  applicationId,
  auditDocumentId,
  executedDocumentId,
  orgId,
  packetId,
  projectId,
  projectName,
}: {
  actorId: string
  applicationId: string
  auditDocumentId: string
  executedDocumentId: string
  orgId: string
  packetId: string
  projectId: string
  projectName: string
}) {
  const payload: FiscalNotificationPayload = {
    actorId,
    application: {
      id: applicationId,
      org_id: orgId,
      project_id: projectId,
      project_name: projectName,
    } as FiscalApplicationRow,
    description: `Signing is complete for ${projectName}. Final files are ready.`,
    href: "/my-organization",
    metadata: { auditDocumentId, executedDocumentId, packetId },
    title: "Fiscal agreement fully signed",
    tone: "success",
    type: "fiscal_sponsorship_agreement_completed",
  }

  await Promise.all([
    notifyOrganizationEditors(payload),
    notifyPlatformAdmins(payload),
  ])
}
