"use client"

import { useMemo, useRef } from "react"
import Link from "next/link"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

import { WorkspaceBoardInviteSheet } from "./workspace-board-invite-sheet"
import { WorkspaceTutorialCallout } from "./workspace-tutorial-callout"
import {
  buildWorkspaceAccessPeople,
  countActiveWorkspaceInvites,
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
  const sectionRef = useRef<HTMLElement | null>(null)
  const nowMs = Date.now()
  const activeInviteCount = countActiveWorkspaceInvites(invites, nowMs)
  const accessPeople = useMemo(
    () =>
      buildWorkspaceAccessPeople({
        currentUser,
        members,
      }),
    [currentUser, members],
  )
  const visiblePeople = accessPeople.slice(0, 4)
  const extraPeopleCount = Math.max(0, accessPeople.length - visiblePeople.length)
  const realtimeLabel =
    realtimeState === "live" ? "Live" : realtimeState === "connecting" ? "Connecting…" : "Realtime degraded"
  const showEmptyState = shouldShowWorkspaceTeamAccessEmptyState({
    accessPeopleCount: accessPeople.length,
    activeInviteCount,
  })

  return (
    <section
      ref={sectionRef}
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
              <HoverCardContent align="start" side="bottom" className="w-[22rem] rounded-xl p-0">
                <div className="border-b border-border/60 px-3 py-2.5">
                  <p className="text-sm font-semibold">Team access</p>
                  <p className="text-xs text-muted-foreground">
                    People with access to this workspace and temporary invite status.
                  </p>
                </div>

                <div className="max-h-72 space-y-1 overflow-y-auto p-2">
                  {accessPeople.slice(0, 8).map((person) => {
                    const hue = hueFromSeed(person.id)
                    return (
                      <div
                        key={person.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
                      >
                        <Avatar className="h-8 w-8 border border-border/50">
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
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{person.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{person.subtitle}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
                  <div className="text-xs text-muted-foreground">
                    <span className="tabular-nums">{activeInviteCount}</span> active{" "}
                    {activeInviteCount === 1 ? "invite" : "invites"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <WorkspaceBoardInviteSheet
                      canInvite={canInvite}
                      members={members}
                      invites={invites}
                      onInvitesChange={onInvitesChange}
                      triggerVariant="ghost"
                      triggerClassName="h-8 rounded-md px-2.5"
                    />
                    <Button asChild variant="ghost" size="sm" className="h-8 rounded-md px-2.5">
                      <Link href="/workspace?view=editor&tab=people">Manage members</Link>
                    </Button>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <WorkspaceBoardInviteSheet
              canInvite={canInvite}
              members={members}
              invites={invites}
              onInvitesChange={onInvitesChange}
              triggerSize="icon"
              triggerVariant="outline"
              triggerAriaLabel="Invite collaborator"
              triggerContent={<PlusIcon className="h-4 w-4" aria-hidden />}
              triggerClassName="h-9 w-9 rounded-full border-border/65 bg-card p-0"
            />
          </div>

          <p className="px-1 text-xs text-muted-foreground">
            <span className="tabular-nums">{accessPeople.length}</span>{" "}
            {accessPeople.length === 1 ? "member" : "members"} ·{" "}
            <span className="tabular-nums">{activeInviteCount}</span> active{" "}
            {activeInviteCount === 1 ? "invite" : "invites"}
          </p>
        </>
      )}
      {tutorialCallout ? (
        <WorkspaceTutorialCallout
          anchorRef={sectionRef}
          title={tutorialCallout.title}
          instruction={tutorialCallout.instruction}
        />
      ) : null}
    </section>
  )
}
