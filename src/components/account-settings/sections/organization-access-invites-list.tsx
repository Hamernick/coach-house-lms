"use client"

import CopyIcon from "lucide-react/dist/esm/icons/copy"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import type { OrganizationAccessInvite } from "@/app/actions/organization-access"
import {
  formatDate,
  formatInviteRoleLabel,
} from "./organization-access-manager-helpers"

type OrganizationAccessInvitesListProps = {
  invites: OrganizationAccessInvite[]
  inviteUrlBase: string
  pending: boolean
  onCopyInviteLink: (link: string) => void
  onRevokeInvite: (inviteId: string) => void
}

export function OrganizationAccessInvitesList({
  invites,
  inviteUrlBase,
  pending,
  onCopyInviteLink,
  onRevokeInvite,
}: OrganizationAccessInvitesListProps) {
  return (
    <div className="space-y-3">
      {invites.map((invite) => {
        const expired = new Date(invite.expiresAt).getTime() < Date.now()
        const link = inviteUrlBase ? `${inviteUrlBase}/join-organization?token=${invite.token}` : `/join-organization?token=${invite.token}`
        return (
          <div
            key={invite.id}
            className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{invite.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatInviteRoleLabel(invite)} • Expires {formatDate(invite.expiresAt)}
                {expired ? <span className="ml-2 text-destructive">Expired</span> : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon className="h-4 w-4" aria-hidden />
                Revoke
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
