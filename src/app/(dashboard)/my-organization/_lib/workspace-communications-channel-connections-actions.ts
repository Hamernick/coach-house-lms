"use server"

import {
  canEditOrganization,
  resolveActiveOrganization,
} from "@/lib/organization/active-org"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import type {
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationChannelConnection,
} from "../_components/workspace-board/workspace-board-types"

type WorkspaceCommunicationChannelConnectionPayload =
  WorkspaceCommunicationChannelConnection & {
    channel: WorkspaceCommunicationChannel
  }

type WorkspaceCommunicationChannelConnectionActionResult =
  | {
      ok: true
      connection: WorkspaceCommunicationChannelConnectionPayload
    }
  | { error: string }

type WorkspaceCommunicationActor =
  | {
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
      userId: string
      orgId: string
      canManage: boolean
    }
  | { error: string }

type WorkspaceCommunicationChannelConnectionRecord = {
  channel: string
  is_connected: boolean
  provider: string | null
  connected_by: string | null
  connected_at: string | null
}

function normalizeChannel(value: unknown): WorkspaceCommunicationChannel | null {
  if (value === "social" || value === "email" || value === "blog") return value
  return null
}

function isMissingCommunicationChannelsTableError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01") return true
  const message =
    typeof record.message === "string" ? record.message : typeof record.details === "string" ? record.details : ""
  return message.includes("organization_workspace_communication_channels")
}

function normalizeProvider(value: unknown, channel: WorkspaceCommunicationChannel): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim().slice(0, 120)
  if (channel === "email") return "manual-email"
  if (channel === "blog") return "manual-blog"
  return "manual-social"
}

function mapConnectionRecord(
  row: WorkspaceCommunicationChannelConnectionRecord | null,
  fallback: {
    channel: WorkspaceCommunicationChannel
    connected: boolean
    provider: string | null
    connectedBy: string | null
    connectedAt: string | null
  },
): WorkspaceCommunicationChannelConnectionPayload {
  if (!row) {
    return {
      channel: fallback.channel,
      connected: fallback.connected,
      provider: fallback.provider,
      connectedBy: fallback.connectedBy,
      connectedAt: fallback.connectedAt,
    }
  }

  const normalizedChannel = normalizeChannel(row.channel) ?? fallback.channel

  return {
    channel: normalizedChannel,
    connected: Boolean(row.is_connected),
    provider: typeof row.provider === "string" && row.provider.trim().length > 0 ? row.provider.trim() : null,
    connectedBy:
      typeof row.connected_by === "string" && row.connected_by.trim().length > 0 ? row.connected_by : null,
    connectedAt:
      typeof row.connected_at === "string" && Number.isFinite(new Date(row.connected_at).getTime())
        ? new Date(row.connected_at).toISOString()
        : null,
  }
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

export async function setWorkspaceCommunicationChannelConnectionAction({
  channel,
  connected,
  provider,
}: {
  channel: WorkspaceCommunicationChannel
  connected: boolean
  provider?: string | null
}): Promise<WorkspaceCommunicationChannelConnectionActionResult> {
  const normalizedChannel = normalizeChannel(channel)
  if (!normalizedChannel) return { error: "Invalid channel." }

  const actor = await resolveCommunicationActor()
  if ("error" in actor) return { error: actor.error }
  if (!actor.canManage) {
    return { error: "Only owner, admin, or staff can manage workspace communication channels." }
  }

  const nowIso = new Date().toISOString()
  const normalizedProvider = connected ? normalizeProvider(provider, normalizedChannel) : null

  const { data, error } = await actor.supabase
    .from("organization_workspace_communication_channels")
    .upsert(
      {
        org_id: actor.orgId,
        channel: normalizedChannel,
        is_connected: connected,
        provider: normalizedProvider,
        connected_by: connected ? actor.userId : null,
        connected_at: connected ? nowIso : null,
        disconnected_at: connected ? null : nowIso,
        metadata: {
          source: "workspace-board",
        },
      },
      { onConflict: "org_id,channel" },
    )
    .select("channel, is_connected, provider, connected_by, connected_at")
    .maybeSingle<WorkspaceCommunicationChannelConnectionRecord>()

  if (error) {
    if (isMissingCommunicationChannelsTableError(error)) {
      return {
        ok: true,
        connection: mapConnectionRecord(null, {
          channel: normalizedChannel,
          connected,
          provider: normalizedProvider,
          connectedBy: connected ? actor.userId : null,
          connectedAt: connected ? nowIso : null,
        }),
      }
    }
    return { error: error.message ?? "Unable to update channel connection." }
  }

  return {
    ok: true,
    connection: mapConnectionRecord(data ?? null, {
      channel: normalizedChannel,
      connected,
      provider: normalizedProvider,
      connectedBy: connected ? actor.userId : null,
      connectedAt: connected ? nowIso : null,
    }),
  }
}
