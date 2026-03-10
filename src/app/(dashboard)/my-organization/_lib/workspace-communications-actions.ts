"use server"

import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import type {
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationMediaMode,
  WorkspaceCommunicationPost,
  WorkspaceCommunicationPostStatus,
} from "../_components/workspace-board/workspace-board-types"
import {
  dispatchWorkspaceCommunication,
  readWorkspaceCommunicationDeliveryTasksFromRows,
  type WorkspaceCommunicationDeliveryRow,
} from "./workspace-communications-delivery"
import {
  readWorkspaceCommunicationPostsFromRows,
  type WorkspaceCommunicationPostRow,
} from "./workspace-state"

type WorkspaceCommunicationPostActionResult =
  | { ok: true; post: WorkspaceCommunicationPost }
  | { error: string }

type WorkspaceCommunicationQueueActionResult =
  | { ok: true; deliveredCount: number; failedCount: number; remainingQueuedCount: number }
  | { error: string }

type WorkspaceCommunicationActor =
  | {
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
      userId: string
      orgId: string
      canManage: boolean
    }
  | { error: string }

type WorkspaceCommunicationRecord = {
  id: string
  channel: string
  media_mode: string
  content: string
  status: string
  scheduled_for: string
  posted_at: string | null
}

function normalizeChannel(value: unknown): WorkspaceCommunicationChannel | null {
  if (value === "social" || value === "email" || value === "blog") return value
  return null
}

function normalizeMediaMode(value: unknown): WorkspaceCommunicationMediaMode | null {
  if (value === "text" || value === "image" || value === "video") return value
  return null
}

function normalizeStatus(value: unknown): WorkspaceCommunicationPostStatus | null {
  if (value === "scheduled" || value === "posted") return value
  return null
}

function isMissingDeliveryQueueTableError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01") return true
  const message =
    typeof record.message === "string" ? record.message : typeof record.details === "string" ? record.details : ""
  return message.includes("organization_workspace_communication_deliveries")
}

async function resolveCommunicationActor(): Promise<WorkspaceCommunicationActor> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "You must be signed in." }

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  return {
    supabase,
    userId: user.id,
    orgId,
    canManage: canEditOrganization(role),
  }
}

async function loadQueuedDeliveries({
  supabase,
  orgId,
  limit,
  deliveryIds,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
  limit: number
  deliveryIds?: string[]
}) {
  let query = supabase
    .from("organization_workspace_communication_deliveries")
    .select(
      "id, org_id, communication_id, channel, status, provider, attempt_count, last_error, payload, queued_at, sent_at, created_by, created_at",
    )
    .eq("org_id", orgId)
    .eq("status", "queued")
    .order("queued_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 100)))

  if (deliveryIds && deliveryIds.length > 0) {
    query = query.in("id", deliveryIds)
  }

  const { data, error } = await query.returns<WorkspaceCommunicationDeliveryRow[]>()
  if (error) return { error }

  return { deliveries: readWorkspaceCommunicationDeliveryTasksFromRows(data) }
}

async function loadCommunicationsByIds({
  supabase,
  orgId,
  communicationIds,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
  communicationIds: string[]
}) {
  if (communicationIds.length === 0) return { communicationsById: new Map<string, WorkspaceCommunicationRecord>() }

  const { data, error } = await supabase
    .from("organization_workspace_communications")
    .select("id, channel, media_mode, content, status, scheduled_for, posted_at")
    .eq("org_id", orgId)
    .in("id", communicationIds)
    .returns<WorkspaceCommunicationRecord[]>()

  if (error) return { error }

  const map = new Map<string, WorkspaceCommunicationRecord>()
  for (const communication of data ?? []) {
    map.set(communication.id, communication)
  }
  return { communicationsById: map }
}

async function processDeliveryTask({
  supabase,
  orgId,
  taskId,
  communication,
  attemptCount,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
  taskId: string
  communication: WorkspaceCommunicationRecord
  attemptCount: number
}) {
  const normalizedChannel = normalizeChannel(communication.channel)
  const normalizedMediaMode = normalizeMediaMode(communication.media_mode)
  const nowIso = new Date().toISOString()

  if (!normalizedChannel || !normalizedMediaMode) {
    await supabase
      .from("organization_workspace_communication_deliveries")
      .update({
        status: "failed",
        attempt_count: attemptCount + 1,
        last_error: "Invalid communication channel or media mode.",
        sent_at: nowIso,
      })
      .eq("org_id", orgId)
      .eq("id", taskId)
    return { delivered: false, failed: true }
  }

  const dispatchResult = dispatchWorkspaceCommunication({
    channel: normalizedChannel,
    mediaMode: normalizedMediaMode,
    content: communication.content,
    scheduledFor: communication.scheduled_for,
  })

  if (!dispatchResult.ok) {
    await supabase
      .from("organization_workspace_communication_deliveries")
      .update({
        status: "failed",
        attempt_count: attemptCount + 1,
        provider: dispatchResult.provider,
        last_error: dispatchResult.error,
        payload: dispatchResult.metadata ?? {},
        sent_at: nowIso,
      })
      .eq("org_id", orgId)
      .eq("id", taskId)
    return { delivered: false, failed: true }
  }

  await supabase
    .from("organization_workspace_communication_deliveries")
    .update({
      status: "sent",
      attempt_count: attemptCount + 1,
      provider: dispatchResult.provider,
      last_error: null,
      payload: {
        externalId: dispatchResult.externalId,
        metadata: dispatchResult.metadata,
      },
      sent_at: nowIso,
    })
    .eq("org_id", orgId)
    .eq("id", taskId)

  await supabase
    .from("organization_workspace_communications")
    .update({
      status: "posted",
      posted_at: communication.posted_at ?? nowIso,
    })
    .eq("org_id", orgId)
    .eq("id", communication.id)

  return { delivered: true, failed: false }
}

async function processWorkspaceCommunicationQueueInternal({
  supabase,
  orgId,
  limit,
  deliveryIds,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
  limit: number
  deliveryIds?: string[]
}): Promise<WorkspaceCommunicationQueueActionResult> {
  const deliveriesResult = await loadQueuedDeliveries({ supabase, orgId, limit, deliveryIds })
  if ("error" in deliveriesResult) {
    if (isMissingDeliveryQueueTableError(deliveriesResult.error)) {
      return { ok: true, deliveredCount: 0, failedCount: 0, remainingQueuedCount: 0 }
    }
    return { error: "Unable to load workspace communication queue." }
  }

  const deliveryTasks = deliveriesResult.deliveries
  if (deliveryTasks.length === 0) {
    return { ok: true, deliveredCount: 0, failedCount: 0, remainingQueuedCount: 0 }
  }

  const communicationIds = Array.from(new Set(deliveryTasks.map((task) => task.communicationId)))
  const communicationsResult = await loadCommunicationsByIds({ supabase, orgId, communicationIds })
  if ("error" in communicationsResult) {
    return { error: "Unable to load queued communications." }
  }

  const communicationsById = communicationsResult.communicationsById
  const nowMs = Date.now()
  let deliveredCount = 0
  let failedCount = 0

  for (const task of deliveryTasks) {
    const communication = communicationsById.get(task.communicationId)
    if (!communication) continue

    const scheduledAtMs = new Date(communication.scheduled_for).getTime()
    const isDueNow = communication.status === "posted" || (Number.isFinite(scheduledAtMs) && scheduledAtMs <= nowMs)
    if (!isDueNow) continue

    const result = await processDeliveryTask({
      supabase,
      orgId,
      taskId: task.id,
      communication,
      attemptCount: task.attemptCount,
    })

    if (result.delivered) deliveredCount += 1
    if (result.failed) failedCount += 1
  }

  const remainingResult = await supabase
    .from("organization_workspace_communication_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "queued")

  return {
    ok: true,
    deliveredCount,
    failedCount,
    remainingQueuedCount: remainingResult.count ?? 0,
  }
}

export async function createWorkspaceCommunicationPostAction({
  channel,
  mediaMode,
  content,
  scheduledFor,
  status,
}: {
  channel: WorkspaceCommunicationChannel
  mediaMode: WorkspaceCommunicationMediaMode
  content: string
  scheduledFor: string
  status: WorkspaceCommunicationPostStatus
}): Promise<WorkspaceCommunicationPostActionResult> {
  const normalizedChannel = normalizeChannel(channel)
  const normalizedMediaMode = normalizeMediaMode(mediaMode)
  const normalizedStatus = normalizeStatus(status)
  const normalizedContent = content.trim()
  const scheduledAt = new Date(scheduledFor)

  if (!normalizedChannel) return { error: "Invalid channel." }
  if (!normalizedMediaMode) return { error: "Invalid media mode." }
  if (!normalizedStatus) return { error: "Invalid status." }
  if (!normalizedContent) return { error: "Content is required." }
  if (normalizedContent.length > 5000) return { error: "Content is too long." }
  if (!Number.isFinite(scheduledAt.getTime())) return { error: "Scheduled time is invalid." }

  const actor = await resolveCommunicationActor()
  if ("error" in actor) return { error: actor.error }
  if (!actor.canManage) {
    return { error: "Only owner, admin, or staff can manage workspace communications." }
  }

  const postedAt = normalizedStatus === "posted" ? new Date().toISOString() : null

  const { data, error } = await actor.supabase
    .from("organization_workspace_communications")
    .insert({
      org_id: actor.orgId,
      channel: normalizedChannel,
      media_mode: normalizedMediaMode,
      content: normalizedContent,
      status: normalizedStatus,
      scheduled_for: scheduledAt.toISOString(),
      posted_at: postedAt,
      created_by: actor.userId,
    })
    .select(
      "id, channel, media_mode, content, status, scheduled_for, posted_at, created_by, created_at",
    )
    .maybeSingle<WorkspaceCommunicationPostRow>()

  if (error || !data) {
    return { error: error?.message ?? "Unable to save communication post." }
  }

  const [post] = readWorkspaceCommunicationPostsFromRows([data])
  if (!post) return { error: "Unable to read saved communication post." }

  const queueInsertResult = await actor.supabase
    .from("organization_workspace_communication_deliveries")
    .insert({
      org_id: actor.orgId,
      communication_id: post.id,
      channel: post.channel,
      status: "queued",
      provider: "mock",
      attempt_count: 0,
      payload: {
        mediaMode: post.mediaMode,
      },
      queued_at: new Date().toISOString(),
      created_by: actor.userId,
    })
    .select("id")
    .maybeSingle<{ id: string }>()

  if (queueInsertResult.error && !isMissingDeliveryQueueTableError(queueInsertResult.error)) {
    return { error: queueInsertResult.error.message ?? "Unable to enqueue communication delivery." }
  }

  if (queueInsertResult.data?.id && normalizedStatus === "posted") {
    await processWorkspaceCommunicationQueueInternal({
      supabase: actor.supabase,
      orgId: actor.orgId,
      limit: 1,
      deliveryIds: [queueInsertResult.data.id],
    })
  }

  return { ok: true, post }
}

export async function processWorkspaceCommunicationDeliveryQueueAction({
  limit = 20,
}: {
  limit?: number
} = {}): Promise<WorkspaceCommunicationQueueActionResult> {
  const actor = await resolveCommunicationActor()
  if ("error" in actor) return { error: actor.error }
  if (!actor.canManage) {
    return { error: "Only owner, admin, or staff can process workspace communication queue." }
  }

  return processWorkspaceCommunicationQueueInternal({
    supabase: actor.supabase,
    orgId: actor.orgId,
    limit: Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 20, 100)),
  })
}
