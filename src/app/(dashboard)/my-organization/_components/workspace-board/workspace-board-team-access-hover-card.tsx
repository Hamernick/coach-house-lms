"use client"

import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCardContent } from "@/components/ui/hover-card"

import { WorkspaceBoardInviteSheet } from "./workspace-board-invite-sheet"
import type { WorkspaceBoardOrganizationAccessSnapshot } from "./workspace-board-organization-access-state"
import { formatRemaining } from "./workspace-board-invite-sheet-helpers"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceMemberOption,
} from "./workspace-board-types"

type WorkspaceAccessPerson = {
  id: string
  name: string
  subtitle: string
  avatarUrl: string | null
}

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

export function WorkspaceBoardTeamAccessHoverCard({
  accessPeople,
  activeInviteRows,
  activeInviteCount,
  pendingTeamAccessCount,
  pendingTeamInvites,
  pendingAccessRequests,
  canInvite,
  members,
  invites,
  onInvitesChange,
  organizationAccessState,
}: {
  accessPeople: WorkspaceAccessPerson[]
  activeInviteRows: WorkspaceCollaborationInvite[]
  activeInviteCount: number
  pendingTeamAccessCount: number
  pendingTeamInvites: WorkspaceBoardOrganizationAccessSnapshot["invites"]
  pendingAccessRequests: WorkspaceBoardOrganizationAccessSnapshot["requests"]
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
  organizationAccessState: WorkspaceBoardOrganizationAccessSnapshot
}) {
  return (
    <HoverCardContent align="start" side="bottom" className="w-[22rem] rounded-xl p-0">
      <div className="border-b border-border/60 px-3 py-2.5">
        <p className="text-sm font-semibold">Team access</p>
        <p className="text-xs text-muted-foreground">
          People with access to this workspace, temporary collaboration invites, and pending team access.
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

        {activeInviteRows.length > 0 ? (
          <>
            <div className="px-1 pt-2">
              <p className="text-xs font-medium text-muted-foreground">Active invites</p>
            </div>
            {activeInviteRows.map((invite) => {
              const displayName =
                invite.userName?.trim() || invite.userEmail || "Temporary collaborator"
              const hue = hueFromSeed(invite.userId)

              return (
                <div
                  key={invite.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
                >
                  <Avatar className="h-8 w-8 border border-border/50">
                    <AvatarFallback
                      className="text-[10px] font-semibold"
                      style={{
                        backgroundColor: `hsl(${hue} 28% 88%)`,
                        color: `hsl(${hue} 32% 26%)`,
                      }}
                    >
                      {toInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Temporary access · {formatRemaining(invite.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    Invited
                  </Badge>
                </div>
              )
            })}
          </>
        ) : null}

        {pendingTeamInvites.length > 0 || pendingAccessRequests.length > 0 ? (
          <>
            <div className="px-1 pt-2">
              <p className="text-xs font-medium text-muted-foreground">
                Pending team access
              </p>
            </div>
            {pendingTeamInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{invite.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Email invite · expires {formatRemaining(invite.expiresAt)}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Pending
                </Badge>
              </div>
            ))}
            {pendingAccessRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {request.inviteeName?.trim() || request.inviteeEmail}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Existing account request · expires {formatRemaining(request.expiresAt)}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Pending
                </Badge>
              </div>
            ))}
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2.5">
        <div className="text-xs text-muted-foreground">
          <span className="tabular-nums">{activeInviteCount}</span> active{" "}
          {activeInviteCount === 1 ? "invite" : "invites"}
          {pendingTeamAccessCount > 0 ? (
            <>
              {" "}· <span className="tabular-nums">{pendingTeamAccessCount}</span> pending team{" "}
              {pendingTeamAccessCount === 1 ? "item" : "items"}
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <WorkspaceBoardInviteSheet
            canInvite={canInvite}
            members={members}
            invites={invites}
            onInvitesChange={onInvitesChange}
            organizationAccessState={organizationAccessState}
            triggerVariant="ghost"
            triggerClassName="h-8 rounded-md px-2.5"
          />
          <Button asChild variant="ghost" size="sm" className="h-8 rounded-md px-2.5">
            <Link href="/workspace?view=editor&tab=people">Manage members</Link>
          </Button>
        </div>
      </div>
    </HoverCardContent>
  )
}
