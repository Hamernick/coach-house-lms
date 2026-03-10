import { randomUUID } from "node:crypto"

import type { OrganizationMemberRole } from "@/lib/organization/active-org"

import {
  buildDefaultBoardState,
  normalizeWorkspaceBoardState,
} from "../_components/workspace-board/workspace-board-layout"
import type {
  WorkspaceBoardState,
  WorkspaceCommunicationActivity,
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationChannelConnection,
  WorkspaceCommunicationMediaMode,
  WorkspaceCommunicationPost,
  WorkspaceCommunicationsState,
  WorkspaceCollaborationInvite,
  WorkspaceCollaborationInviteStatus,
  WorkspaceDurationUnit,
} from "../_components/workspace-board/workspace-board-types"

export type WorkspaceCollaborationInviteRow = {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  created_by: string
  created_at: string
  expires_at: string
  revoked_at: string | null
  duration_value: number | null
  duration_unit: string | null
}

export type WorkspaceCommunicationPostRow = {
  id: string
  channel: string
  media_mode: string
  content: string
  status: string
  scheduled_for: string
  posted_at: string | null
  created_by: string
  created_at: string
}

export type WorkspaceCommunicationChannelConnectionRow = {
  org_id: string
  channel: string
  is_connected: boolean
  provider: string | null
  connected_by: string | null
  connected_at: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeDurationUnit(value: unknown): WorkspaceDurationUnit {
  if (value === "hours" || value === "days" || value === "months") return value
  return "hours"
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function normalizeDurationValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1
  return Math.max(1, Math.min(12, Math.round(value)))
}

function normalizeCommunicationChannel(value: unknown): WorkspaceCommunicationChannel {
  if (value === "social" || value === "email" || value === "blog") return value
  return "social"
}

function normalizeCommunicationMediaMode(value: unknown): WorkspaceCommunicationMediaMode {
  if (value === "text" || value === "image" || value === "video") return value
  return "text"
}

function normalizeCommunicationStatus(value: unknown): WorkspaceCommunicationActivity["status"] {
  if (value === "posted") return "posted"
  return "scheduled"
}

function normalizeInvite(rawInvite: unknown): WorkspaceCollaborationInvite | null {
  if (!isRecord(rawInvite)) return null
  if (typeof rawInvite.userId !== "string" || rawInvite.userId.trim().length === 0) return null
  if (typeof rawInvite.createdBy !== "string" || rawInvite.createdBy.trim().length === 0) return null

  const createdAt = normalizeDate(rawInvite.createdAt) ?? new Date().toISOString()
  const expiresAt = normalizeDate(rawInvite.expiresAt)
  if (!expiresAt) return null

  return {
    id: typeof rawInvite.id === "string" && rawInvite.id.trim().length > 0 ? rawInvite.id : randomUUID(),
    userId: rawInvite.userId,
    userName: typeof rawInvite.userName === "string" ? rawInvite.userName : null,
    userEmail: typeof rawInvite.userEmail === "string" ? rawInvite.userEmail : null,
    createdBy: rawInvite.createdBy,
    createdAt,
    expiresAt,
    revokedAt: normalizeDate(rawInvite.revokedAt),
    durationValue: normalizeDurationValue(rawInvite.durationValue),
    durationUnit: normalizeDurationUnit(rawInvite.durationUnit),
  }
}

export function canInviteWorkspaceCollaborators(role: OrganizationMemberRole) {
  return role === "owner" || role === "admin" || role === "staff" || role === "board"
}

export function readWorkspaceBoardStateValue(value: unknown): WorkspaceBoardState {
  if (!value) return buildDefaultBoardState()
  return normalizeWorkspaceBoardState(value)
}

export function readWorkspaceCollaborationInvitesFromRows(
  rows: WorkspaceCollaborationInviteRow[] | null | undefined,
) {
  if (!rows || rows.length === 0) return []
  return rows
    .map((row) =>
      normalizeInvite({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        createdBy: row.created_by,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        durationValue: row.duration_value ?? 1,
        durationUnit: row.duration_unit ?? "hours",
      }),
    )
    .filter((entry): entry is WorkspaceCollaborationInvite => Boolean(entry))
}

export function readWorkspaceCommunicationPostsFromRows(
  rows: WorkspaceCommunicationPostRow[] | null | undefined,
): WorkspaceCommunicationPost[] {
  if (!rows || rows.length === 0) return []
  return rows
    .map((row) => {
      const scheduledFor = normalizeDate(row.scheduled_for)
      const createdAt = normalizeDate(row.created_at)
      if (!scheduledFor || !createdAt) return null
      return {
        id: row.id,
        channel: normalizeCommunicationChannel(row.channel),
        mediaMode: normalizeCommunicationMediaMode(row.media_mode),
        content: row.content,
        status: normalizeCommunicationStatus(row.status),
        scheduledFor,
        postedAt: normalizeDate(row.posted_at),
        createdBy: row.created_by,
        createdAt,
      }
    })
    .filter((entry): entry is WorkspaceCommunicationPost => Boolean(entry))
}

function buildDefaultWorkspaceChannelConnections(): WorkspaceCommunicationsState["channelConnections"] {
  return {
    social: {
      connected: false,
      provider: null,
      connectedAt: null,
      connectedBy: null,
    },
    email: {
      connected: false,
      provider: null,
      connectedAt: null,
      connectedBy: null,
    },
    blog: {
      connected: false,
      provider: null,
      connectedAt: null,
      connectedBy: null,
    },
  }
}

function normalizeConnectionValue(
  row: WorkspaceCommunicationChannelConnectionRow,
): WorkspaceCommunicationChannelConnection {
  return {
    connected: Boolean(row.is_connected),
    provider: typeof row.provider === "string" && row.provider.trim().length > 0 ? row.provider.trim() : null,
    connectedAt: normalizeDate(row.connected_at),
    connectedBy: typeof row.connected_by === "string" && row.connected_by.trim().length > 0 ? row.connected_by : null,
  }
}

export function readWorkspaceCommunicationChannelConnectionsFromRows(
  rows: WorkspaceCommunicationChannelConnectionRow[] | null | undefined,
): WorkspaceCommunicationsState["channelConnections"] {
  const connections = buildDefaultWorkspaceChannelConnections()
  if (!rows || rows.length === 0) return connections

  for (const row of rows) {
    const channel = normalizeCommunicationChannel(row.channel)
    connections[channel] = normalizeConnectionValue(row)
  }

  return connections
}

function dayKeyFromDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
}

export function buildWorkspaceCommunicationActivityByDayFromPosts(
  posts: WorkspaceCommunicationPost[],
) {
  const nextByDay: Record<string, WorkspaceCommunicationActivity> = {}
  const sorted = [...posts].sort((left, right) => {
    const leftTime = new Date(left.postedAt ?? left.scheduledFor).getTime()
    const rightTime = new Date(right.postedAt ?? right.scheduledFor).getTime()
    return rightTime - leftTime
  })

  for (const post of sorted) {
    const timestamp = post.postedAt ?? post.scheduledFor
    const dayKey = dayKeyFromDate(timestamp)
    if (!dayKey || nextByDay[dayKey]) continue
    nextByDay[dayKey] = {
      status: post.status,
      channel: post.channel,
      timestamp,
    }
  }

  return nextByDay
}

export function filterActiveWorkspaceInvites(
  invites: WorkspaceCollaborationInvite[],
  nowIso = new Date().toISOString(),
) {
  return invites.filter((invite) => resolveWorkspaceCollaborationInviteStatus(invite, nowIso) === "active")
}

export function resolveWorkspaceCollaborationInviteStatus(
  invite: WorkspaceCollaborationInvite,
  nowIso = new Date().toISOString(),
): WorkspaceCollaborationInviteStatus {
  if (invite.revokedAt) return "revoked"
  const expiry = new Date(invite.expiresAt).getTime()
  const now = new Date(nowIso).getTime()
  if (!Number.isFinite(expiry) || expiry <= now) return "expired"
  return "active"
}

export function buildWorkspaceInviteExpiry({
  unit,
  value,
  now,
}: {
  unit: WorkspaceDurationUnit
  value: number
  now?: Date
}) {
  const safeValue = Math.max(1, Math.min(12, Math.round(value)))
  const base = now ? new Date(now) : new Date()
  if (unit === "hours") {
    base.setHours(base.getHours() + safeValue)
    return base.toISOString()
  }
  if (unit === "days") {
    base.setDate(base.getDate() + safeValue)
    return base.toISOString()
  }
  base.setMonth(base.getMonth() + safeValue)
  return base.toISOString()
}
