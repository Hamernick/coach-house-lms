"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"
import XIcon from "lucide-react/dist/esm/icons/x"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"

import type { WorkspaceCoachInviteShortcut } from "../../_lib/workspace-collaboration-invite-helpers"
import type { WorkspaceMemberOption } from "./workspace-board-types"

export type InviteRow = {
  invite: import("./workspace-board-types").WorkspaceCollaborationInvite
  status: import("./workspace-board-types").WorkspaceCollaborationInviteStatus
}

export type InviteTargetOption = {
  id: string
  primary: string
  secondary: string
  initials: string
  avatarUrl: string | null
  badgeLabel: string | null
  badgeVariant: "outline" | "secondary"
  keywords: string[]
}

export function toInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts.at(-1)!.slice(0, 1)}`.toUpperCase()
}

export function formatMemberRole(role: WorkspaceMemberOption["role"]) {
  if (role === "owner") return "Owner"
  if (role === "board") return "Board"
  if (role === "staff") return "Staff"
  return "Member"
}

export function resolveMemberOptionCopy(member: WorkspaceMemberOption) {
  const trimmedName = member.name?.trim() || null
  const trimmedEmail = member.email?.trim() || null
  const primary = trimmedName || trimmedEmail || (member.isOwner ? "Organization owner" : "Team member")
  const secondary =
    trimmedName && trimmedEmail
      ? trimmedEmail
      : member.isOwner
        ? "Owner"
        : formatMemberRole(member.role)

  return {
    primary,
    secondary,
    initials: toInitials(primary),
  }
}

export function WorkspaceMemberOptionRow({
  option,
  selected = false,
}: {
  option: InviteTargetOption
  selected?: boolean
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <Avatar className="size-7 shrink-0 border border-border/60">
        {option.avatarUrl ? <AvatarImage src={option.avatarUrl} alt={option.primary} /> : null}
        <AvatarFallback className="text-[10px] font-medium">
          {option.initials}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {option.primary}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {option.secondary}
          </span>
        </span>
        {option.badgeLabel ? (
          <Badge variant={option.badgeVariant} className="rounded-full">
            {option.badgeLabel}
          </Badge>
        ) : null}
        {selected ? <CheckIcon className="text-foreground" aria-hidden /> : null}
      </span>
    </span>
  )
}

export function toInviteTargetOption(member: WorkspaceMemberOption): InviteTargetOption {
  const { primary, secondary, initials } = resolveMemberOptionCopy(member)
  return {
    id: member.userId,
    primary,
    secondary,
    initials,
    avatarUrl: member.avatarUrl,
    badgeLabel: member.isOwner ? "Owner" : null,
    badgeVariant: "outline",
    keywords: [primary, secondary, formatMemberRole(member.role)],
  }
}

export function toCoachInviteTargetOption(shortcut: WorkspaceCoachInviteShortcut): InviteTargetOption {
  return {
    id: shortcut.id,
    primary: shortcut.fullName,
    secondary: shortcut.subtitle,
    initials: toInitials(shortcut.name),
    avatarUrl: shortcut.avatarUrl,
    badgeLabel: shortcut.badgeLabel,
    badgeVariant: "secondary",
    keywords: [shortcut.fullName, shortcut.subtitle, ...shortcut.keywords],
  }
}

export function matchesCoachShortcutMember({
  member,
  shortcut,
}: {
  member: WorkspaceMemberOption
  shortcut: WorkspaceCoachInviteShortcut
}) {
  const normalizedName = member.name?.trim().toLowerCase() ?? ""
  const normalizedEmail = member.email?.trim().toLowerCase() ?? ""
  const shortcutEmail = shortcut.email?.trim().toLowerCase() ?? ""

  return (
    (shortcutEmail.length > 0 && normalizedEmail === shortcutEmail) ||
    normalizedName === shortcut.fullName.toLowerCase() ||
    normalizedName === shortcut.name.toLowerCase()
  )
}

export function WorkspaceTemporaryInvitePicker({
  coachTargets,
  memberTargets,
  selectedTargetId,
  selectedTarget,
  onSelectedTargetChange,
}: {
  coachTargets: InviteTargetOption[]
  memberTargets: InviteTargetOption[]
  selectedTargetId: string | undefined
  selectedTarget: InviteTargetOption | null
  onSelectedTargetChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="workspace-invite-member">Reviewer</Label>
      {selectedTarget ? (
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <WorkspaceMemberOptionRow option={selectedTarget} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => onSelectedTargetChange("")}
            aria-label="Clear selected invitee"
          >
            <XIcon aria-hidden />
          </Button>
        </div>
      ) : null}
      <Command className="rounded-md border border-border/60 bg-background/70">
        <CommandInput
          id="workspace-invite-member"
          placeholder="Search teammates or invite Joel / Paula…"
        />
        <CommandList className="max-h-[260px]">
          <CommandEmpty>No people found.</CommandEmpty>
          <CommandGroup heading="Coach House reviewers">
            {coachTargets.map((target) => (
              <CommandItem
                key={target.id}
                value={target.keywords.join(" ")}
                onSelect={() => onSelectedTargetChange(target.id)}
                className="py-2.5"
              >
                <WorkspaceMemberOptionRow
                  option={target}
                  selected={target.id === selectedTargetId}
                />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Organization team">
            {memberTargets.length > 0 ? (
              memberTargets.map((target) => (
                <CommandItem
                  key={target.id}
                  value={target.keywords.join(" ")}
                  onSelect={() => onSelectedTargetChange(target.id)}
                  className="py-2.5"
                >
                  <WorkspaceMemberOptionRow
                    option={target}
                    selected={target.id === selectedTargetId}
                  />
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled value="all members already invited">
                All current teammates already have an active invite.
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </Command>
      <p className="text-xs leading-5 text-muted-foreground">
        Temporary invites are best for live reviews. Joel and Paula stay pinned here, and their invites route through the notifications center.
      </p>
    </div>
  )
}
