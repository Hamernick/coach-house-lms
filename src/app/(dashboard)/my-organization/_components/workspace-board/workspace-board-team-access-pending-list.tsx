"use client"

import CopyIcon from "lucide-react/dist/esm/icons/copy"
import MailIcon from "lucide-react/dist/esm/icons/mail"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import type {
  OrganizationAccessInvite,
  OrganizationAccessRequest,
} from "@/app/actions/organization-access"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ROLE_LABELS,
  formatDate,
  formatInviteRoleLabel,
} from "@/components/account-settings/sections/organization-access-manager-helpers"

function renderRequestRecipient(request: OrganizationAccessRequest) {
  return request.inviteeName?.trim() || request.inviteeEmail
}

export function WorkspaceBoardTeamAccessPendingList({
  invites,
  requests,
  inviteUrlBase,
  pending,
  onCopyInviteLink,
  onRevokeInvite,
  onRevokeRequest,
}: {
  invites: OrganizationAccessInvite[]
  requests: OrganizationAccessRequest[]
  inviteUrlBase: string
  pending: boolean
  onCopyInviteLink: (link: string) => void
  onRevokeInvite: (inviteId: string) => void
  onRevokeRequest: (requestId: string) => void
}) {
  if (invites.length === 0 && requests.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-xs text-muted-foreground">
        No pending team invites yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {invites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending team invites
          </p>
          {invites.map((invite) => {
            const link = inviteUrlBase
              ? `${inviteUrlBase}/join-organization?token=${invite.token}`
              : `/join-organization?token=${invite.token}`

            return (
              <div
                key={invite.id}
                className="rounded-xl border border-border/60 bg-background/40 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {invite.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatInviteRoleLabel(invite)} · Expires {formatDate(invite.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 rounded-full">
                    Email invite
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => onCopyInviteLink(link)}
                    className="gap-2"
                  >
                    <CopyIcon className="h-4 w-4" aria-hidden />
                    Copy link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => onRevokeInvite(invite.id)}
                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2Icon className="h-4 w-4" aria-hidden />
                    Revoke
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {requests.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending access requests
          </p>
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-border/60 bg-background/40 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {renderRequestRecipient(request)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ROLE_LABELS[request.role]} · Respond by {formatDate(request.expiresAt)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-full">
                  <MailIcon className="mr-1 h-3 w-3" aria-hidden />
                  Existing account
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onRevokeRequest(request.id)}
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2Icon className="h-4 w-4" aria-hidden />
                  Cancel request
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
