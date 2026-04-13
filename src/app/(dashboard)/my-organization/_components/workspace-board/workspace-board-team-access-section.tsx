"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip"
import { WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME } from "@/components/workspace/workspace-tutorial-theme"
import { cn } from "@/lib/utils"

import { WorkspaceBoardInviteSheet } from "./workspace-board-invite-sheet"
import { useWorkspaceBoardOrganizationAccessState } from "./workspace-board-organization-access-state"
import { WorkspaceBoardTeamAccessHoverCard } from "./workspace-board-team-access-hover-card"
import { WorkspaceTutorialCallout } from "./workspace-tutorial-callout"
import {
  buildWorkspaceAccessPeople,
  countActiveWorkspaceInvites,
  countPendingWorkspaceTeamAccess,
  listPendingWorkspaceAccessRequests,
  listPendingWorkspaceTeamInvites,
  resolveWorkspaceTeamAccessSummary,
  shouldShowWorkspaceTeamAccessEmptyState,
} from "./workspace-board-team-access"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "./workspace-board-types"

const EMPTY_TEAM_AVATARS = [
  { id: "placeholder-founder", initials: "FD" },
  { id: "placeholder-board", initials: "BD" },
  { id: "placeholder-team", initials: "TM" },
] as const

function toInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts.at(-1)!.slice(0, 1)}`.toUpperCase()
}

function hueFromSeed(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

export function WorkspaceBoardTeamAccessSection({
  canInvite,
  members,
  invites,
  realtimeState,
  currentUser,
  tutorialCallout,
  onInvitesChange,
}: {
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  realtimeState: "connecting" | "live" | "degraded"
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  tutorialCallout?: {
    title: string
    instruction: string
  } | null
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const organizationAccessState = useWorkspaceBoardOrganizationAccessState()

  useEffect(() => {
    setNowMs(Date.now())
    const timer = globalThis.setInterval(() => {
      setNowMs(Date.now())
    }, 60_000)
    return () => globalThis.clearInterval(timer)
  }, [])

  const activeInviteCount = countActiveWorkspaceInvites(invites, nowMs)
  const pendingTeamInvites = useMemo(
    () => listPendingWorkspaceTeamInvites(organizationAccessState.invites, nowMs).slice(0, 4),
    [nowMs, organizationAccessState.invites],
  )
  const pendingAccessRequests = useMemo(
    () => listPendingWorkspaceAccessRequests(organizationAccessState.requests, nowMs).slice(0, 4),
    [nowMs, organizationAccessState.requests],
  )
  const pendingTeamAccessCount = countPendingWorkspaceTeamAccess({
    invites: organizationAccessState.invites,
    requests: organizationAccessState.requests,
    nowMs,
  })
  const accessPeople = useMemo(
    () =>
      buildWorkspaceAccessPeople({
        currentUser,
        members,
      }),
    [currentUser, members],
  )
  const activeInviteRows = useMemo(
    () =>
      invites
        .filter((invite) => {
          if (invite.revokedAt) return false
          const expiresAt = new Date(invite.expiresAt).getTime()
          return Number.isFinite(expiresAt) && expiresAt > nowMs
        })
        .slice(0, 6),
    [invites, nowMs],
  )
  const visiblePeople = accessPeople.slice(0, 4)
  const extraPeopleCount = Math.max(0, accessPeople.length - visiblePeople.length)
  const realtimeLabel =
    realtimeState === "live" ? "Live" : realtimeState === "connecting" ? "Connecting…" : "Realtime degraded"
  const showEmptyState = shouldShowWorkspaceTeamAccessEmptyState({
    accessPeopleCount: accessPeople.length,
    activeInviteCount,
    pendingTeamAccessCount,
    organizationAccessLoading: organizationAccessState.loading,
    organizationAccessError: Boolean(organizationAccessState.loadError),
  })
  const summaryText = resolveWorkspaceTeamAccessSummary({
    accessPeopleCount: accessPeople.length,
    activeInviteCount,
    pendingTeamAccessCount,
    organizationAccessLoading: organizationAccessState.loading,
    organizationAccessError: Boolean(organizationAccessState.loadError),
  })

  const content = (
    <section
      className={cn(
        "space-y-2 rounded-[22px] px-0.5 transition-colors",
        tutorialCallout && "bg-primary/5 ring-1 ring-primary/35",
      )}
      aria-label="Team access"
    >
      <p
        className={cn(
          "px-1 text-sm font-medium text-foreground",
          tutorialCallout && "py-1.5",
        )}
      >
        Team Access
      </p>

      {showEmptyState ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/55 px-4 py-5 shadow-xs">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                {EMPTY_TEAM_AVATARS.map((avatar) => (
                  <Avatar key={avatar.id}>
                    <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                      {avatar.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">No Team Members</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Invite your team to collaborate on this workspace.
              </p>
            </div>

            <div className="flex justify-center">
              <WorkspaceBoardInviteSheet
                canInvite={canInvite}
                members={members}
                invites={invites}
                onInvitesChange={onInvitesChange}
                organizationAccessState={organizationAccessState}
                triggerSize="sm"
                triggerVariant="secondary"
                triggerClassName="h-9 rounded-full px-4"
                triggerContent={
                  <>
                    <PlusIcon className="h-4 w-4" aria-hidden />
                    Invite Members
                  </>
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <HoverCard openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto min-w-0 flex-1 rounded-full border border-border/65 bg-card px-2 py-1.5 text-left shadow-xs transition-colors hover:bg-muted/20"
                  aria-label="Team access details"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center">
                      <div className="flex -space-x-2 pr-1">
                        {visiblePeople.map((person) => {
                          const hue = hueFromSeed(person.id)
                          return (
                            <Avatar
                              key={person.id}
                              className="h-7 w-7 border-2 border-card"
                              title={`${person.name} · ${person.subtitle}`}
                              aria-label={person.name}
                            >
                              {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt={person.name} /> : null}
                              <AvatarFallback
                                className="text-[10px] font-semibold"
                                style={{
                                  backgroundColor: `hsl(${hue} 28% 88%)`,
                                  color: `hsl(${hue} 32% 26%)`,
                                }}
                              >
                                {toInitials(person.name)}
                              </AvatarFallback>
                            </Avatar>
                          )
                        })}
                        {extraPeopleCount > 0 ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                            +{extraPeopleCount}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pr-1 text-[11px] text-muted-foreground">
                      <span
                        aria-hidden
                        className={cn(
                          "h-1.5 w-1.5 rounded-full bg-muted-foreground/70",
                          realtimeState === "live" && "bg-emerald-500",
                          realtimeState === "connecting" && "animate-pulse",
                          realtimeState === "degraded" && "bg-amber-500",
                        )}
                      />
                      <span className="truncate">{realtimeLabel}</span>
                    </div>
                  </div>
                </Button>
              </HoverCardTrigger>
              <WorkspaceBoardTeamAccessHoverCard
                accessPeople={accessPeople}
                activeInviteRows={activeInviteRows}
                activeInviteCount={activeInviteCount}
                pendingTeamAccessCount={pendingTeamAccessCount}
                pendingTeamInvites={pendingTeamInvites}
                pendingAccessRequests={pendingAccessRequests}
                organizationAccessLoading={organizationAccessState.loading}
                organizationAccessLoadError={organizationAccessState.loadError}
                canInvite={canInvite}
                members={members}
                invites={invites}
                onInvitesChange={onInvitesChange}
                organizationAccessState={organizationAccessState}
              />
            </HoverCard>

            <WorkspaceBoardInviteSheet
              canInvite={canInvite}
              members={members}
              invites={invites}
              onInvitesChange={onInvitesChange}
              organizationAccessState={organizationAccessState}
              triggerSize="icon"
              triggerVariant="outline"
              triggerAriaLabel="Invite collaborator"
              triggerContent={<PlusIcon className="h-4 w-4" aria-hidden />}
              triggerClassName="h-9 w-9 rounded-full border-border/65 bg-card p-0"
            />
          </div>

          <p className="px-1 text-xs text-muted-foreground">{summaryText}</p>
        </>
      )}
    </section>
  )

  if (!tutorialCallout) {
    return content
  }

  return (
    <Tooltip open>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <WorkspaceTutorialCallout
        reactGrabOwnerId="workspace-board-team-access-section:callout"
        title={tutorialCallout.title}
        instruction={tutorialCallout.instruction}
        tooltipContentClassName={WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME}
      />
    </Tooltip>
  )
}
