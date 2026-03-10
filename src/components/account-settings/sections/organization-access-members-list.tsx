"use client"

import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type {
  OrganizationAccessMember,
  OrganizationMemberRole,
} from "@/app/actions/organization-access"
import {
  formatDate,
  MEMBER_EDITABLE_ROLES,
  ROLE_LABELS,
} from "./organization-access-manager-helpers"

type OrganizationAccessMembersListProps = {
  members: OrganizationAccessMember[]
  pending: boolean
  canEditRoles: boolean
  canManageMembers: boolean
  canManageTesterFlags: boolean
  onRoleChange: (memberId: string, role: OrganizationMemberRole) => void
  onTesterChange: (memberId: string, isTester: boolean) => void
  onRemoveMember: (memberId: string) => void
}

export function OrganizationAccessMembersList({
  members,
  pending,
  canEditRoles,
  canManageMembers,
  canManageTesterFlags,
  onRoleChange,
  onTesterChange,
  onRemoveMember,
}: OrganizationAccessMembersListProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isOwner = member.role === "owner"
        return (
          <div
            key={member.id}
            className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {member.email ?? member.id}
                {isOwner ? <span className="ml-2 text-xs font-normal text-muted-foreground">(owner)</span> : null}
              </p>
              {member.joinedAt ? <p className="mt-1 text-xs text-muted-foreground">Joined {formatDate(member.joinedAt)}</p> : null}
              {canManageTesterFlags ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tester tools {member.isTester ? "enabled" : "disabled"}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {isOwner ? (
                <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                  {ROLE_LABELS.owner}
                </span>
              ) : canEditRoles ? (
                <Select
                  value={member.role}
                  onValueChange={(value) => onRoleChange(member.id, value as OrganizationMemberRole)}
                  disabled={pending}
                >
                  <SelectTrigger size="sm" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_EDITABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                  {ROLE_LABELS[member.role]}
                </span>
              )}

              {canManageTesterFlags ? (
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2 py-1">
                  <span className="text-xs text-muted-foreground">Tester</span>
                  <Switch
                    checked={Boolean(member.isTester)}
                    disabled={pending}
                    onCheckedChange={(next) => onTesterChange(member.id, Boolean(next))}
                    aria-label={`Toggle tester tools for ${member.email ?? member.id}`}
                  />
                </div>
              ) : null}

              {canManageMembers && !isOwner ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onRemoveMember(member.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2Icon className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
