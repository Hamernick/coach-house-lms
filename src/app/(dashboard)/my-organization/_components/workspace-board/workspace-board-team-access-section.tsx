"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
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
import {
  patchWorkspaceBoardUiPreferences,
  readWorkspaceBoardUiPreferences,
  type WorkspaceBoardUiPreferenceScope,
} from "./workspace-board-ui-preferences"

const EMPTY_TEAM_AVATARS = [
  { id: "placeholder-founder", initials: "FD" },
  { id: "placeholder-board", initials: "BD" },
  { id: "placeholder-team", initials: "TM" },
] as const

const TEAM_ACCESS_CONTENT_ID = "workspace-team-access-content"
const TEAM_ACCESS_HEADER_BUTTON_CLASS_NAME =
  "hover:bg-muted/30 h-8 w-full justify-between rounded-lg px-2.5 py-0 text-left"

function toInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
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
  uiPreferencesScope,
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
  uiPreferencesScope: WorkspaceBoardUiPreferenceScope
  tutorialCallout?: {
    title: string
    instruction: string
  } | null
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
}) {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [teamAccessCollapsed, setTeamAccessCollapsed] = useState(false)
  const organizationAccessState = useWorkspaceBoardOrganizationAccessState()

  useEffect(() => {
    setNowMs(Date.now())
    const timer = globalThis.setInterval(() => {
      setNowMs(Date.now())
    }, 60_000)
    return () => globalThis.clearInterval(timer)
  }, [])

  useEffect(() => {
    setTeamAccessCollapsed(
      readWorkspaceBoardUiPreferences(uiPreferencesScope).teamAccessCollapsed
    )
  }, [uiPreferencesScope])

  const activeInviteCount = countActiveWorkspaceInvites(invites, nowMs)
  const pendingTeamInvites = useMemo(
    () =>
      listPendingWorkspaceTeamInvites(
        organizationAccessState.invites,
        nowMs
      ).slice(0, 4),
    [nowMs, organizationAccessState.invites]
  )
  const pendingAccessRequests = useMemo(
    () =>
      listPendingWorkspaceAccessRequests(
        organizationAccessState.requests,
        nowMs
      ).slice(0, 4),
    [nowMs, organizationAccessState.requests]
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
    [currentUser, members]
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
    [invites, nowMs]
  )
  const visiblePeople = accessPeople.slice(0, 4)
  const extraPeopleCount = Math.max(
    0,
    accessPeople.length - visiblePeople.length
  )
  const realtimeLabel =
    realtimeState === "live"
      ? "Live"
      : realtimeState === "connecting"
        ? "Connecting…"
        : "Realtime degraded"
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
  const handleTeamAccessCollapsedChange = () => {
    setTeamAccessCollapsed((previous) => {
      const nextCollapsed = !previous
      patchWorkspaceBoardUiPreferences(uiPreferencesScope, {
        teamAccessCollapsed: nextCollapsed,
      })
      return nextCollapsed
    })
  }

  const content = (
    <section
      className={cn(
        "space-y-2 rounded-[22px] px-0.5 transition-colors",
        tutorialCallout && "bg-primary/5 ring-primary/35 ring-1"
      )}
      aria-label="Team access"
    >
      <header className="flex min-h-8 items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={TEAM_ACCESS_HEADER_BUTTON_CLASS_NAME}
          aria-controls={TEAM_ACCESS_CONTENT_ID}
          aria-expanded={!teamAccessCollapsed}
          onClick={handleTeamAccessCollapsedChange}
        >
          <span className="text-foreground truncate text-[15px] leading-5 font-semibold tracking-tight">
            Team Access
          </span>
          <ChevronDownIcon
            className={cn(
              "text-muted-foreground h-4 w-4 transition-transform",
              teamAccessCollapsed && "-rotate-90"
            )}
            aria-hidden
          />
        </Button>
      </header>

      {teamAccessCollapsed ? null : (
        <div id={TEAM_ACCESS_CONTENT_ID} className="space-y-2">
          {showEmptyState ? (
            <div className="border-border/60 bg-card/55 rounded-2xl border border-dashed px-4 py-5 shadow-xs">
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:size-12 *:data-[slot=avatar]:ring-2">
                    {EMPTY_TEAM_AVATARS.map((avatar) => (
                      <Avatar key={avatar.id}>
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                          {avatar.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-foreground text-sm font-semibold">
                    No Team Members
                  </p>
                  <p className="text-muted-foreground text-xs leading-5">
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
                      className="border-border/65 bg-card hover:bg-muted/20 h-auto min-w-0 flex-1 rounded-full border px-2 py-1.5 text-left shadow-xs transition-colors"
                      aria-label="Team access details"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center">
                          <div className="flex -space-x-2 pr-1">
                            {visiblePeople.map((person) => {
                              const hue = hueFromSeed(person.id)
                              return (
                                <Avatar
                                  key={person.id}
                                  className="border-card h-7 w-7 border-2"
                                  title={`${person.name} · ${person.subtitle}`}
                                  aria-label={person.name}
                                >
                                  {person.avatarUrl ? (
                                    <AvatarImage
                                      src={person.avatarUrl}
                                      alt={person.name}
                                    />
                                  ) : null}
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
                              <div className="border-card bg-muted text-muted-foreground flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-semibold">
                                +{extraPeopleCount}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-muted-foreground flex items-center gap-1.5 pr-1 text-[11px]">
                          <span
                            aria-hidden
                            className={cn(
                              "bg-muted-foreground/70 h-1.5 w-1.5 rounded-full",
                              realtimeState === "live" && "bg-emerald-500",
                              realtimeState === "connecting" && "animate-pulse",
                              realtimeState === "degraded" && "bg-amber-500"
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
                    organizationAccessLoadError={
                      organizationAccessState.loadError
                    }
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

              <p className="text-muted-foreground px-1 text-xs">
                {summaryText}
              </p>
            </>
          )}
        </div>
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
