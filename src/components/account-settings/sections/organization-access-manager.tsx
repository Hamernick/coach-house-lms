"use client"

import Link from "next/link"

import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import UserPlusIcon from "lucide-react/dist/esm/icons/user-plus"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { OrganizationAccessInvitesList } from "./organization-access-invites-list"
import { OrganizationAccessRequestsList } from "./organization-access-requests-list"
import {
  INVITEABLE_ROLES,
  INVITE_ROLE_LABELS,
  ROLE_HELP,
  type OrganizationInviteRoleOption,
} from "./organization-access-manager-helpers"
import { useOrganizationAccessManagerState } from "./organization-access-manager-state"
import { OrganizationAccessMembersList } from "./organization-access-members-list"
import { OrganizationAccessProfileCard } from "./organization-access-profile-card"

export function OrganizationAccessManager({
  organizationName,
  className,
}: {
  organizationName?: string
  className?: string
}) {
  const {
    loading,
    members,
    invites,
    requests,
    adminsCanInvite,
    staffCanManageCalendar,
    hasPaidTeamAccess,
    canInvite,
    canManageMembers,
    canEditRoles,
    canManageSettings,
    canManageTesterFlags,
    loadError,
    inviteEmail,
    inviteRole,
    pending,
    inviteUrlBase,
    setInviteEmail,
    setInviteRole,
    refresh,
    updateAdminsCanInvite,
    updateStaffCanManageCalendar,
    createInvite,
    updateMemberRole,
    updateMemberTesterFlag,
    removeMember,
    copyInviteLink,
    revokeInvite,
    revokeRequest,
  } = useOrganizationAccessManagerState()

  const organizationLabel = organizationName?.trim() ? organizationName.trim() : "your organization"
  const hasInvites = invites.length > 0
  const hasRequests = requests.length > 0
  const hasMembers = members.length > 0

  return (
    <div className={cn("space-y-6", className)}>
      <OrganizationAccessProfileCard />

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Invite board members, staff, and funders
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Invite someone to join {organizationLabel}. They’ll create their own account and then accept the invite link.
            </p>
          </div>
        </div>

        {!hasPaidTeamAccess ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Free includes 1 admin seat (founder only). Upgrade to Organization to invite teammates, assign roles,
              and manage access settings.
            </p>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/?section=pricing">Upgrade to Organization</Link>
            </Button>
          </div>
        ) : null}

        {canManageSettings ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Allow org admins to invite</p>
              <p className="text-sm text-muted-foreground">
                When enabled, teammates with the <span className="font-medium text-foreground">Admin</span> role can create and revoke invite links.
              </p>
            </div>
            <Switch
              checked={adminsCanInvite}
              disabled={pending}
              onCheckedChange={updateAdminsCanInvite}
              aria-label="Allow org admins to invite"
            />
          </div>
        ) : null}

        {canManageSettings ? (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Allow staff to manage the roadmap calendar</p>
              <p className="text-sm text-muted-foreground">
                When enabled, teammates with the <span className="font-medium text-foreground">Staff</span> role can add and edit calendar events.
              </p>
            </div>
            <Switch
              checked={staffCanManageCalendar}
              disabled={pending}
              onCheckedChange={updateStaffCanManageCalendar}
              aria-label="Allow staff to manage the roadmap calendar"
            />
          </div>
        ) : null}

        {canInvite ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)_auto] lg:items-end">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="orgInviteEmail">Email</Label>
              <Input
                id="orgInviteEmail"
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.currentTarget.value)}
                disabled={pending}
              />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as OrganizationInviteRoleOption)}
                disabled={pending}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITEABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {INVITE_ROLE_LABELS[role]}
                      {ROLE_HELP[role] ? (
                        <span className="text-xs text-muted-foreground"> — {ROLE_HELP[role]}</span>
                      ) : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={pending || inviteEmail.trim().length === 0}
              onClick={createInvite}
              className="gap-2 lg:self-end"
            >
              {pending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <UserPlusIcon className="h-4 w-4" aria-hidden />
              )}
              Invite
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Invites are managed by the organization owner.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Members</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage who can access {organizationLabel}.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={pending}>
            Refresh
          </Button>
        </div>

        {loadError ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {hasMembers ? (
              <OrganizationAccessMembersList
                members={members}
                pending={pending}
                canEditRoles={canEditRoles}
                canManageMembers={canManageMembers}
                canManageTesterFlags={canManageTesterFlags}
                onRoleChange={updateMemberRole}
                onTesterChange={updateMemberTesterFlag}
                onRemoveMember={removeMember}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            )}

            {canInvite ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Pending email invites</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    External invites are emailed when delivery is configured. Copy the fallback link or revoke it here.
                  </p>
                </div>
                {hasInvites ? (
                  <OrganizationAccessInvitesList
                    invites={invites}
                    inviteUrlBase={inviteUrlBase}
                    pending={pending}
                    onCopyInviteLink={copyInviteLink}
                    onRevokeInvite={revokeInvite}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                )}
              </div>
            ) : null}

            {canInvite ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Pending teammate requests</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Existing Coach House users accept or decline these requests inside their account.
                  </p>
                </div>
                {hasRequests ? (
                  <OrganizationAccessRequestsList
                    requests={requests}
                    pending={pending}
                    onRevokeRequest={revokeRequest}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No pending teammate requests.</p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
