import { randomUUID } from "node:crypto"

import type {
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationMediaMode,
} from "../_components/workspace-board/workspace-board-types"

export type WorkspaceCommunicationDeliveryStatus = "queued" | "sent" | "failed"

export type WorkspaceCommunicationDeliveryRow = {
  id: string
  org_id: string
  communication_id: string
  channel: string
  status: string
  provider: string
  attempt_count: number
  last_error: string | null
  payload: Record<string, unknown> | null
  queued_at: string
  sent_at: string | null
  created_by: string
  created_at: string
}

export type WorkspaceCommunicationDeliveryTask = {
  id: string
  orgId: string
  communicationId: string
  channel: WorkspaceCommunicationChannel
  status: WorkspaceCommunicationDeliveryStatus
  provider: string
  attemptCount: number
  lastError: string | null
  payload: Record<string, unknown>
  queuedAt: string
  sentAt: string | null
  createdBy: string
  createdAt: string
}

export type WorkspaceCommunicationDeliveryInput = {
  channel: WorkspaceCommunicationChannel
  mediaMode: WorkspaceCommunicationMediaMode
  content: string
  scheduledFor: string
}

type WorkspaceCommunicationDispatchResult =
  | {
      ok: true
      provider: string
      externalId: string
      metadata: Record<string, unknown>
    }
  | {
      ok: false
      provider: string
      error: string
      metadata?: Record<string, unknown>
    }

function normalizeChannel(value: unknown): WorkspaceCommunicationChannel | null {
  if (value === "social" || value === "email" || value === "blog") return value
  return null
}

function normalizeDeliveryStatus(value: unknown): WorkspaceCommunicationDeliveryStatus {
  if (value === "sent") return "sent"
  if (value === "failed") return "failed"
  return "queued"
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function normalizePayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export function readWorkspaceCommunicationDeliveryTasksFromRows(
  rows: WorkspaceCommunicationDeliveryRow[] | null | undefined,
): WorkspaceCommunicationDeliveryTask[] {
  if (!rows || rows.length === 0) return []
  return rows
    .map((row) => {
      const channel = normalizeChannel(row.channel)
      const queuedAt = normalizeDate(row.queued_at)
      const createdAt = normalizeDate(row.created_at)
      if (!channel || !queuedAt || !createdAt) return null
      return {
        id: row.id,
        orgId: row.org_id,
        communicationId: row.communication_id,
        channel,
        status: normalizeDeliveryStatus(row.status),
        provider: row.provider,
        attemptCount: Math.max(0, Number.isFinite(row.attempt_count) ? row.attempt_count : 0),
        lastError: row.last_error,
        payload: normalizePayload(row.payload),
        queuedAt,
        sentAt: normalizeDate(row.sent_at),
        createdBy: row.created_by,
        createdAt,
      }
    })
    .filter((entry): entry is WorkspaceCommunicationDeliveryTask => Boolean(entry))
}

function mockSocialAdapter(input: WorkspaceCommunicationDeliveryInput): WorkspaceCommunicationDispatchResult {
  return {
    ok: true,
    provider: "mock-social",
    externalId: `social_${randomUUID()}`,
    metadata: {
      mediaMode: input.mediaMode,
      contentLength: input.content.length,
    },
  }
}

function mockEmailAdapter(input: WorkspaceCommunicationDeliveryInput): WorkspaceCommunicationDispatchResult {
  return {
    ok: true,
    provider: "mock-email",
    externalId: `email_${randomUUID()}`,
    metadata: {
      mediaMode: input.mediaMode,
      subjectPreview: input.content.slice(0, 72),
    },
  }
}

function mockBlogAdapter(input: WorkspaceCommunicationDeliveryInput): WorkspaceCommunicationDispatchResult {
  const slugBase = input.content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48)

  return {
    ok: true,
    provider: "mock-blog",
    externalId: `blog_${randomUUID()}`,
    metadata: {
      mediaMode: input.mediaMode,
      slug: slugBase.length > 0 ? slugBase : "workspace-post",
    },
  }
}

export function dispatchWorkspaceCommunication(input: WorkspaceCommunicationDeliveryInput) {
  if (input.channel === "email") return mockEmailAdapter(input)
  if (input.channel === "blog") return mockBlogAdapter(input)
  return mockSocialAdapter(input)
}
