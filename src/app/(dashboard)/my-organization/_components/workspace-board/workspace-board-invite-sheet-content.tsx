"use client"

import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import ChevronUpIcon from "lucide-react/dist/esm/icons/chevron-up"
import Clock4Icon from "lucide-react/dist/esm/icons/clock-4"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  clampDurationValue,
  formatDuration,
  formatRemaining,
  formatTimestamp,
  isWorkspaceInviteAccessAvailable,
  resolveWorkspaceInviteAccessCopy,
  statusLabel,
  statusTone,
  type WorkspaceInviteAccessLevel,
  type WorkspaceInviteAudience,
} from "./workspace-board-invite-sheet-helpers"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceCollaborationInviteStatus,
  WorkspaceDurationUnit,
  WorkspaceMemberOption,
} from "./workspace-board-types"

type InviteRow = {
  invite: WorkspaceCollaborationInvite
  status: WorkspaceCollaborationInviteStatus
}

export function WorkspaceBoardInviteSheetBody({
  canInvite,
  isPending,
  memberOptions,
  inviteAudience,
  onInviteAudienceChange,
  inviteAccessLevel,
  onInviteAccessLevelChange,
  selectedMemberId,
  onSelectedMemberIdChange,
  teamInviteEmail,
  onTeamInviteEmailChange,
  durationValue,
  onDurationValueChange,
  durationUnit,
  onDurationUnitChange,
  onCreate,
  onCreateTeamInvite,
  activeInvites,
  historicalInvites,
  onRevoke,
}: {
  canInvite: boolean
  isPending: boolean
  memberOptions: WorkspaceMemberOption[]
  inviteAudience: WorkspaceInviteAudience
  onInviteAudienceChange: (value: WorkspaceInviteAudience) => void
  inviteAccessLevel: WorkspaceInviteAccessLevel
  onInviteAccessLevelChange: (value: WorkspaceInviteAccessLevel) => void
  selectedMemberId: string
  onSelectedMemberIdChange: (value: string) => void
  teamInviteEmail: string
  onTeamInviteEmailChange: (value: string) => void
  durationValue: number
  onDurationValueChange: (value: number) => void
  durationUnit: WorkspaceDurationUnit
  onDurationUnitChange: (value: WorkspaceDurationUnit) => void
  onCreate: () => void
  onCreateTeamInvite: () => void
  activeInvites: InviteRow[]
  historicalInvites: InviteRow[]
  onRevoke: (inviteId: string) => void
}) {
  const normalizedSelectedMemberId = memberOptions.some((member) => member.userId === selectedMemberId)
    ? selectedMemberId
    : undefined
  const accessCopy = resolveWorkspaceInviteAccessCopy(inviteAudience, inviteAccessLevel)
  const accessAvailable = isWorkspaceInviteAccessAvailable(inviteAudience, inviteAccessLevel)
  const isTeamInvite = inviteAudience === "team"

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
      <section className="space-y-3 rounded-lg border border-border/60 bg-background/30 p-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Invite type
          </p>
          <Tabs
            value={inviteAudience}
            onValueChange={(value) => onInviteAudienceChange(value as WorkspaceInviteAudience)}
            className="gap-0"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-full border border-border/60 bg-background/70 p-1">
              <TabsTrigger
                value="temporary"
                className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Temporary
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Team
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Access
          </p>
          <Tabs
            value={inviteAccessLevel}
            onValueChange={(value) => onInviteAccessLevelChange(value as WorkspaceInviteAccessLevel)}
            className="gap-0"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-full border border-border/60 bg-background/70 p-1">
              <TabsTrigger
                value="viewer"
                className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Viewer
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background"
              >
                Editor
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-sm font-medium text-foreground">{accessCopy.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {accessCopy.description}
            </p>
          </div>
        </div>

        {isTeamInvite ? (
          <div className="grid gap-2">
            <Label htmlFor="workspace-team-invite-email">Email</Label>
            <Input
              id="workspace-team-invite-email"
              type="email"
              placeholder="name@example.com"
              value={teamInviteEmail}
              onChange={(event) => onTeamInviteEmailChange(event.currentTarget.value)}
              disabled={isPending || !canInvite}
            />
            <Button
              type="button"
              className="h-9 w-full"
              onClick={onCreateTeamInvite}
              disabled={isPending || !canInvite || teamInviteEmail.trim().length === 0}
            >
              {isPending ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {inviteAccessLevel === "viewer" ? "Create viewer invite" : "Create editor invite"}
            </Button>
          </div>
        ) : accessAvailable ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="workspace-invite-member">Teammate</Label>
              <Select value={normalizedSelectedMemberId} onValueChange={onSelectedMemberIdChange}>
                <SelectTrigger id="workspace-invite-member" className="w-full">
                  <SelectValue placeholder="Select teammate" />
                </SelectTrigger>
                <SelectContent>
                  {memberOptions.length > 0 ? (
                    memberOptions.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.name?.trim() || member.email || member.userId}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      All members already invited
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <div className="grid gap-2">
                <Label htmlFor="workspace-invite-duration">Duration</Label>
                <div
                  id="workspace-invite-duration"
                  className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-1 rounded-md border border-border/60 bg-background/70 p-1"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDurationValueChange(clampDurationValue(durationValue - 1))}
                    disabled={!canInvite}
                    aria-label="Decrease invite duration"
                  >
                    <ChevronDownIcon className="h-4 w-4" aria-hidden />
                  </Button>
                  <div className="flex min-w-0 flex-col items-center justify-center">
                    <span className="text-2xl font-semibold tabular-nums leading-none">{durationValue}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDurationValueChange(clampDurationValue(durationValue + 1))}
                    disabled={!canInvite}
                    aria-label="Increase invite duration"
                  >
                    <ChevronUpIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workspace-invite-unit">Unit</Label>
                <Select value={durationUnit} onValueChange={(value) => onDurationUnitChange(value as WorkspaceDurationUnit)}>
                  <SelectTrigger id="workspace-invite-unit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="button" className="h-9 w-full" onClick={onCreate} disabled={isPending || !canInvite}>
              {isPending ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Create temporary invite
            </Button>
          </>
        ) : (
          <div className="rounded-md border border-dashed border-border/60 bg-background/40 px-3 py-3 text-sm text-muted-foreground">
            Temporary viewer access is not available yet. Use the Team tab for read-only invites, or switch to Editor for timed collaboration.
          </div>
        )}
      </section>

      {!isTeamInvite ? (
        <section className="space-y-2">
        <h3 className="text-sm font-medium">Active invites</h3>
        {activeInvites.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
            No active invites.
          </p>
        ) : (
          <ul className="space-y-2">
            {activeInvites.map(({ invite, status }) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {invite.userName?.trim() || invite.userEmail || invite.userId}
                    </p>
                    <Badge variant="outline" className={statusTone(status)}>
                      {statusLabel(status)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock4Icon className="h-3 w-3" aria-hidden />
                    {formatDuration(invite.durationValue, invite.durationUnit)} · {formatRemaining(invite.expiresAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRevoke(invite.id)}
                  disabled={isPending || !canInvite}
                  aria-label="Revoke invite"
                >
                  <XIcon className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
        </section>
      ) : (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Team access</h3>
          <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
            Team invites create full organization access and last 7 days until accepted. Use Viewer for read-only access and Editor for day-to-day workspace editing.
          </p>
        </section>
      )}

      {!isTeamInvite ? (
        <section className="space-y-2">
        <h3 className="text-sm font-medium">Invite history</h3>
        {historicalInvites.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
            No recent expired or revoked invites.
          </p>
        ) : (
          <ul className="space-y-2">
            {historicalInvites.map(({ invite, status }) => (
              <li
                key={invite.id}
                className="rounded-md border border-border/60 bg-background/20 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {invite.userName?.trim() || invite.userEmail || invite.userId}
                  </p>
                  <Badge variant="outline" className={statusTone(status)}>
                    {statusLabel(status)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDuration(invite.durationValue, invite.durationUnit)} ·{" "}
                  {status === "revoked"
                    ? `Revoked ${formatTimestamp(invite.revokedAt)}`
                    : `Expired ${formatTimestamp(invite.expiresAt)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
        </section>
      ) : null}
    </div>
  )
}
