"use client"

import { useState } from "react"
import InfoIcon from "lucide-react/dist/esm/icons/info"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"

import { OrganizationAccessMembersList } from "@/components/account-settings/sections/organization-access-members-list"
import { OrganizationAccessPolicyControls } from "@/components/account-settings/sections/organization-access-policy-controls"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { WorkspaceInviteAccessLevel } from "./workspace-board-invite-sheet-helpers"
import { WorkspaceBoardTeamAccessPendingList } from "./workspace-board-team-access-pending-list"
import type { WorkspaceBoardOrganizationAccessSnapshot } from "./workspace-board-organization-access-state"
import type { WorkspaceBoardAccessManagementActions } from "./use-workspace-board-access-management-actions"

export function WorkspaceBoardInviteSheetTeamSection({
  isPending,
  organizationAccessState,
  accessManagementActions,
  inviteUrlBase,
  inviteAccessLevel,
  teamInviteEmail,
  onTeamInviteEmailChange,
  onCreateTeamInvite,
  onCopyOrganizationInviteLink,
  onRevokeOrganizationInvite,
  onRevokeOrganizationAccessRequest,
}: {
  isPending: boolean
  organizationAccessState: WorkspaceBoardOrganizationAccessSnapshot
  accessManagementActions: WorkspaceBoardAccessManagementActions
  inviteUrlBase: string
  inviteAccessLevel: WorkspaceInviteAccessLevel
  teamInviteEmail: string
  onTeamInviteEmailChange: (value: string) => void
  onCreateTeamInvite: () => void
  onCopyOrganizationInviteLink: (link: string) => void
  onRevokeOrganizationInvite: (inviteId: string) => void
  onRevokeOrganizationAccessRequest: (requestId: string) => void
}) {
  const pending = isPending || accessManagementActions.pending
  const [memberToRemoveId, setMemberToRemoveId] = useState<string | null>(null)
  const memberToRemove = organizationAccessState.members.find(
    (member) => member.id === memberToRemoveId
  )

  const confirmMemberRemoval = () => {
    if (!memberToRemoveId) return
    accessManagementActions.removeMember(memberToRemoveId)
    setMemberToRemoveId(null)
  }

  return (
    <div className="space-y-5">
      {organizationAccessState.canInviteTeam ? (
        <div className="grid gap-2">
          <Label htmlFor="workspace-team-invite-email">Email</Label>
          <Input
            id="workspace-team-invite-email"
            type="email"
            placeholder="name@example.com"
            value={teamInviteEmail}
            onChange={(event) =>
              onTeamInviteEmailChange(event.currentTarget.value)
            }
            disabled={pending}
          />
          <Button
            type="button"
            className="h-9 w-full"
            onClick={onCreateTeamInvite}
            disabled={pending || teamInviteEmail.trim().length === 0}
          >
            {pending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {inviteAccessLevel === "viewer"
              ? "Create viewer invite"
              : "Create editor invite"}
          </Button>
        </div>
      ) : (
        <div className="border-border/60 bg-background/40 text-muted-foreground rounded-md border border-dashed px-3 py-3 text-sm">
          {organizationAccessState.inviteCapabilityMessage ??
            "Team invites are unavailable for this account right now."}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium">Pending team access</h3>
          <HoverCard openDelay={120} closeDelay={120}>
            <HoverCardTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Team invite details"
                className="text-muted-foreground size-6 rounded-full"
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
                <p className="text-foreground text-sm font-medium">
                  Team invite details
                </p>
                <p className="text-muted-foreground text-xs leading-5">
                  Team invites create full organization access and stay active
                  for 7 days. Existing Coach House users receive an in-app
                  request, while new users are emailed a secure invite.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {organizationAccessState.loading ? (
          <div className="border-border/60 bg-background/20 text-muted-foreground rounded-md border px-3 py-2 text-xs">
            Loading team access…
          </div>
        ) : (
          <WorkspaceBoardTeamAccessPendingList
            invites={organizationAccessState.invites}
            requests={organizationAccessState.requests}
            inviteUrlBase={inviteUrlBase}
            pending={pending}
            onCopyInviteLink={onCopyOrganizationInviteLink}
            onRevokeInvite={onRevokeOrganizationInvite}
            onRevokeRequest={onRevokeOrganizationAccessRequest}
          />
        )}
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="text-sm font-medium">Current members</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Review durable organization access, roles, and membership.
          </p>
        </div>
        {organizationAccessState.loading ? (
          <div className="border-border/60 bg-background/20 text-muted-foreground rounded-md border px-3 py-2 text-xs">
            Loading members…
          </div>
        ) : organizationAccessState.members.length > 0 ? (
          <OrganizationAccessMembersList
            members={organizationAccessState.members}
            pending={pending}
            canEditRoles={organizationAccessState.canEditRoles}
            canManageMembers={organizationAccessState.canManageMembers}
            canManageTesterFlags={false}
            onRoleChange={accessManagementActions.updateMemberRole}
            onTesterChange={() => undefined}
            onRemoveMember={setMemberToRemoveId}
          />
        ) : (
          <p className="border-border/60 text-muted-foreground rounded-md border border-dashed px-3 py-2 text-xs">
            No accepted members yet.
          </p>
        )}
      </div>

      {organizationAccessState.canManageSettings ? (
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-medium">Access settings</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Control delegated organization permissions.
            </p>
          </div>
          <OrganizationAccessPolicyControls
            adminsCanInvite={organizationAccessState.adminsCanInvite}
            staffCanManageCalendar={
              organizationAccessState.staffCanManageCalendar
            }
            pending={pending}
            onAdminsCanInviteChange={
              accessManagementActions.updateAdminsCanInvite
            }
            onStaffCanManageCalendarChange={
              accessManagementActions.updateStaffCanManageCalendar
            }
          />
        </div>
      ) : null}

      <AlertDialog
        open={Boolean(memberToRemoveId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMemberToRemoveId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.email ?? "This member"} will lose access to the
              organization workspace. You can invite them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep member</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmMemberRemoval}
            >
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
