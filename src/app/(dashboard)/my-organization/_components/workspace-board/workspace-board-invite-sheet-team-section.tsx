"use client"

import type {
  OrganizationAccessInvite,
  OrganizationAccessRequest,
} from "@/app/actions/organization-access"
import InfoIcon from "lucide-react/dist/esm/icons/info"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { WorkspaceInviteAccessLevel } from "./workspace-board-invite-sheet-helpers"
import { WorkspaceBoardTeamAccessPendingList } from "./workspace-board-team-access-pending-list"

export function WorkspaceBoardInviteSheetTeamSection({
  canInviteTeam,
  isPending,
  organizationAccessLoading,
  organizationAccessMessage,
  organizationInvites,
  organizationRequests,
  inviteUrlBase,
  inviteAccessLevel,
  teamInviteEmail,
  onTeamInviteEmailChange,
  onCreateTeamInvite,
  onCopyOrganizationInviteLink,
  onRevokeOrganizationInvite,
  onRevokeOrganizationAccessRequest,
}: {
  canInviteTeam: boolean
  isPending: boolean
  organizationAccessLoading: boolean
  organizationAccessMessage?: string | null
  organizationInvites: OrganizationAccessInvite[]
  organizationRequests: OrganizationAccessRequest[]
  inviteUrlBase: string
  inviteAccessLevel: WorkspaceInviteAccessLevel
  teamInviteEmail: string
  onTeamInviteEmailChange: (value: string) => void
  onCreateTeamInvite: () => void
  onCopyOrganizationInviteLink: (link: string) => void
  onRevokeOrganizationInvite: (inviteId: string) => void
  onRevokeOrganizationAccessRequest: (requestId: string) => void
}) {
  return (
    <section className="space-y-2">
      {canInviteTeam ? (
        <div className="grid gap-2">
          <Label htmlFor="workspace-team-invite-email">Email</Label>
          <Input
            id="workspace-team-invite-email"
            type="email"
            placeholder="name@example.com"
            value={teamInviteEmail}
            onChange={(event) => onTeamInviteEmailChange(event.currentTarget.value)}
            disabled={isPending}
          />
          <Button
            type="button"
            className="h-9 w-full"
            onClick={onCreateTeamInvite}
            disabled={isPending || teamInviteEmail.trim().length === 0}
          >
            {isPending ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {inviteAccessLevel === "viewer" ? "Create viewer invite" : "Create editor invite"}
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border/60 bg-background/40 px-3 py-3 text-sm text-muted-foreground">
          {organizationAccessMessage ??
            "Team invites are unavailable for this account right now."}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-medium">Team access</h3>
        <HoverCard openDelay={120} closeDelay={120}>
          <HoverCardTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Team invite details"
              className="size-6 rounded-full text-muted-foreground"
            >
              <InfoIcon aria-hidden />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            side="right"
            sideOffset={8}
            className="w-[18rem] rounded-xl p-0"
          >
            <div className="flex flex-col gap-1 px-3 py-3">
              <p className="text-sm font-medium text-foreground">Team invite details</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Team invites create full organization access and stay active for 7 days. Existing Coach House users receive an in-app request, while new users are emailed a secure invite.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>

      {organizationAccessLoading ? (
        <div className="rounded-md border border-border/60 bg-background/20 px-3 py-2 text-xs text-muted-foreground">
          Loading team access…
        </div>
      ) : (
        <WorkspaceBoardTeamAccessPendingList
          invites={organizationInvites}
          requests={organizationRequests}
          inviteUrlBase={inviteUrlBase}
          pending={isPending}
          onCopyInviteLink={onCopyOrganizationInviteLink}
          onRevokeInvite={onRevokeOrganizationInvite}
          onRevokeRequest={onRevokeOrganizationAccessRequest}
        />
      )}
    </section>
  )
}
