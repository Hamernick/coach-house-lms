"use client"

import { useEffect, useMemo, useState } from "react"
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from "@supabase/supabase-js"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSupabaseClient } from "@/hooks/use-supabase-client"
import { cn } from "@/lib/utils"

import type { WorkspaceCollaborationInvite } from "./workspace-board-types"

type PresenceParticipant = {
  id: string
  name: string
  avatarUrl: string | null
  color: string
}

type ConnectionState = "connecting" | "live" | "degraded"

function toInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase()
}

function colorFromId(id: string) {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(index)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 76%, 58%)`
}

function buildParticipantMap(
  state: Record<string, Array<{ id?: string; name?: string; avatarUrl?: string | null; color?: string }>>,
) {
  const map = new Map<string, PresenceParticipant>()

  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      const id = typeof entry.id === "string" && entry.id.trim().length > 0 ? entry.id : null
      if (!id) continue
      const name = typeof entry.name === "string" && entry.name.trim().length > 0 ? entry.name : "Guest"
      map.set(id, {
        id,
        name,
        avatarUrl: typeof entry.avatarUrl === "string" ? entry.avatarUrl : null,
        color: typeof entry.color === "string" ? entry.color : colorFromId(id),
      })
    }
  }

  return map
}

export function WorkspaceBoardCollaboration({
  roomName,
  currentUser,
  invites,
  realtimeState,
  presentationMode = false,
}: {
  roomName: string
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  invites: WorkspaceCollaborationInvite[]
  realtimeState: ConnectionState
  presentationMode?: boolean
}) {
  const supabase = useSupabaseClient()
  const [participants, setParticipants] = useState<PresenceParticipant[]>([])
  const [presenceState, setPresenceState] = useState<ConnectionState>("connecting")
  const safeRoomName = roomName.trim().length > 0 ? roomName.trim() : "workspace"

  const inviteLookup = useMemo(() => {
    return new Map(
      invites.map((invite) => [invite.userId, { name: invite.userName ?? "Teammate", email: invite.userEmail }]),
    )
  }, [invites])

  useEffect(() => {
    const channelName = `workspace-presence:${safeRoomName}`
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    function refresh(channelRef: RealtimeChannel) {
      const state = channelRef.presenceState()
      const map = buildParticipantMap(state as Record<string, Array<{ id?: string; name?: string; avatarUrl?: string | null; color?: string }>>)
      const next = Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name))
      setParticipants(next)
    }

    channel
      .on("presence", { event: "sync" }, () => {
        refresh(channel)
      })
      .on("presence", { event: "join" }, () => {
        refresh(channel)
      })
      .on("presence", { event: "leave" }, () => {
        refresh(channel)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await channel.track({
            id: currentUser.id,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
            color: colorFromId(currentUser.id),
          })
          setPresenceState("live")
          return
        }
        if (
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT ||
          status === REALTIME_SUBSCRIBE_STATES.CLOSED
        ) {
          setPresenceState("degraded")
          setParticipants([])
          return
        }
        setPresenceState("connecting")
      })

    return () => {
      void channel.unsubscribe()
      setParticipants([])
      setPresenceState("connecting")
    }
  }, [currentUser.avatarUrl, currentUser.id, currentUser.name, safeRoomName, supabase])

  const activeCount = participants.length
  const connectionState: ConnectionState =
    presenceState === "degraded" || realtimeState === "degraded"
      ? "degraded"
      : presenceState === "connecting" || realtimeState === "connecting"
        ? "connecting"
        : "live"
  const statusText =
    connectionState === "live"
      ? activeCount > 0
        ? `${activeCount} live`
        : "No live collaborators"
      : connectionState === "connecting"
        ? "Connecting…"
        : "Realtime degraded"

  if (presentationMode) {
    return (
      <div
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs",
          connectionState === "live"
            ? "border-border/60 bg-background/70 text-foreground"
            : connectionState === "connecting"
              ? "border-border/60 bg-background/70 text-muted-foreground"
              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-muted-foreground/60",
            connectionState === "live" && "bg-emerald-500",
            connectionState === "connecting" && "animate-pulse bg-muted-foreground/70",
            connectionState === "degraded" && "bg-amber-500",
          )}
          aria-hidden
        />
        <span className="font-medium">{activeCount > 0 ? `${activeCount} present` : "View-only workspace"}</span>
        <span className="text-[11px] opacity-80">{statusText}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {participants.slice(0, 5).map((participant) => {
          const inviteMetadata = inviteLookup.get(participant.id)
          const ariaLabel = inviteMetadata?.email
            ? `${participant.name} (${inviteMetadata.email})`
            : participant.name

          return (
            <Avatar
              key={participant.id}
              className="h-8 w-8 border border-background"
              style={{ boxShadow: `0 0 0 1px ${participant.color}` }}
              aria-label={ariaLabel}
            >
              {participant.avatarUrl ? <AvatarImage src={participant.avatarUrl} alt={participant.name} /> : null}
              <AvatarFallback className="text-[10px] font-medium">{toInitials(participant.name)}</AvatarFallback>
            </Avatar>
          )
        })}
        {participants.length > 5 ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-semibold text-muted-foreground">
            +{participants.length - 5}
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
          connectionState === "live" && activeCount > 0 && "text-foreground",
          connectionState === "degraded" && "text-amber-700 dark:text-amber-300",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-muted-foreground/60",
            connectionState === "live" && "bg-emerald-500",
            connectionState === "connecting" && "animate-pulse bg-muted-foreground/70",
            connectionState === "degraded" && "bg-amber-500",
          )}
          aria-hidden
        />
        {statusText}
      </p>
    </div>
  )
}
