"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"

import CopyIcon from "lucide-react/dist/esm/icons/copy"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import UserPlusIcon from "lucide-react/dist/esm/icons/user-plus"

import {
  createOrganizationInviteAction,
  listOrganizationAccessAction,
  removeOrganizationMemberAction,
  revokeOrganizationInviteAction,
  setOrganizationMemberTesterFlagAction,
  setOrganizationAdminsCanInviteAction,
  setOrganizationStaffCanManageCalendarAction,
  updateOrganizationMemberRoleAction,
  type OrganizationAccessInvite,
  type OrganizationAccessMember,
  type OrganizationMemberRole,
} from "@/app/actions/organization-access"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  board: "Board",
  member: "Member",
}

const ROLE_HELP: Partial<Record<OrganizationMemberRole, string>> = {
  admin: "Can manage access.",
  staff: "Can edit org settings.",
  board: "View-only access.",
  member: "Basic access.",
}

const INVITEABLE_ROLES: OrganizationMemberRole[] = ["staff", "board", "admin", "member"]

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return value
  }
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  if (typeof window !== "undefined") {
    window.prompt("Copy this link:", text)
  }
}

export function OrganizationAccessManager({
  organizationName,
  className,
}: {
  organizationName?: string
  className?: string
}) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<OrganizationAccessMember[]>([])
  const [invites, setInvites] = useState<OrganizationAccessInvite[]>([])
  const [adminsCanInvite, setAdminsCanInvite] = useState(false)
  const [staffCanManageCalendar, setStaffCanManageCalendar] = useState(false)
  const [hasPaidTeamAccess, setHasPaidTeamAccess] = useState(false)
  const [canInvite, setCanInvite] = useState(false)
  const [canManageMembers, setCanManageMembers] = useState(false)
  const [canEditRoles, setCanEditRoles] = useState(false)
  const [canManageSettings, setCanManageSettings] = useState(false)
  const [canManageTesterFlags, setCanManageTesterFlags] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<OrganizationMemberRole>("staff")
  const [pending, startTransition] = useTransition()
  const [origin, setOrigin] = useState("")

  const organizationLabel = organizationName?.trim() ? organizationName.trim() : "your organization"

  const inviteUrlBase = useMemo(() => {
    if (!origin) return ""
    return origin.replace(/\/$/, "")
  }, [origin])

  async function load() {
    setLoading(true)
    setLoadError(null)
    const res = await listOrganizationAccessAction()
    if ("error" in res) {
      setLoadError(res.error)
      setMembers([])
      setInvites([])
      setAdminsCanInvite(false)
      setStaffCanManageCalendar(false)
      setHasPaidTeamAccess(false)
      setCanInvite(false)
      setCanManageMembers(false)
      setCanEditRoles(false)
      setCanManageSettings(false)
      setCanManageTesterFlags(false)
      setLoading(false)
      return
    }
    setMembers(res.members)
    setInvites(res.invites)
    setAdminsCanInvite(Boolean(res.adminsCanInvite))
    setStaffCanManageCalendar(Boolean(res.staffCanManageCalendar))
    setHasPaidTeamAccess(Boolean(res.hasPaidTeamAccess))
    setCanInvite(Boolean(res.canInvite))
    setCanManageMembers(Boolean(res.canManageMembers))
    setCanEditRoles(Boolean(res.canEditRoles))
    setCanManageSettings(Boolean(res.canManageSettings))
    setCanManageTesterFlags(Boolean(res.canManageTesterFlags))
    setLoading(false)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only on mount
  }, [])

  const hasInvites = invites.length > 0
  const hasMembers = members.length > 0

  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Organization profile</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit your public profile, programs, and org details from{" "}
              <Link href="/organization" className="text-primary underline-offset-4 hover:underline">
                Organization
              </Link>
              .
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/organization">Open Organization</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Invite board members & staff</p>
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
              <Link href="/pricing">Upgrade to Organization</Link>
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
              onCheckedChange={(next) => {
                startTransition(async () => {
                  const toastId = toast.loading("Updating invite permissions…")
                  const res = await setOrganizationAdminsCanInviteAction(Boolean(next))
                  if ("error" in res) {
                    toast.error(res.error, { id: toastId })
                    return
                  }
                  toast.success("Updated", { id: toastId })
                  await load()
                })
              }}
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
              onCheckedChange={(next) => {
                startTransition(async () => {
                  const toastId = toast.loading("Updating calendar permissions…")
                  const res = await setOrganizationStaffCanManageCalendarAction(Boolean(next))
                  if ("error" in res) {
                    toast.error(res.error, { id: toastId })
                    return
                  }
                  toast.success("Updated", { id: toastId })
                  await load()
                })
              }}
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
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as OrganizationMemberRole)} disabled={pending}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITEABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                      {ROLE_HELP[role] ? <span className="text-xs text-muted-foreground"> — {ROLE_HELP[role]}</span> : null}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={pending || inviteEmail.trim().length === 0}
              onClick={() => {
                if (pending) return
                startTransition(async () => {
                  const toastId = toast.loading("Creating invite…")
                  const res = await createOrganizationInviteAction({ email: inviteEmail, role: inviteRole })
                  if ("error" in res) {
                    toast.error(res.error, { id: toastId })
                    return
                  }

                  const link = inviteUrlBase ? `${inviteUrlBase}/join-organization?token=${res.invite.token}` : `/join-organization?token=${res.invite.token}`
                  try {
                    await copyToClipboard(link)
                    toast.success("Invite link copied", { id: toastId })
                  } catch {
                    toast.success("Invite created", { id: toastId })
                  }
                  setInviteEmail("")
                  await load()
                })
              }}
              className="gap-2 lg:self-end"
            >
              {pending ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlusIcon className="h-4 w-4" aria-hidden />}
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
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={pending}>
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
                            onValueChange={(value) => {
                              const nextRole = value as OrganizationMemberRole
                              startTransition(async () => {
                                const res = await updateOrganizationMemberRoleAction({ memberId: member.id, role: nextRole })
                                if ("error" in res) {
                                  toast.error(res.error)
                                  return
                                }
                                await load()
                              })
                            }}
                            disabled={pending}
                          >
                            <SelectTrigger size="sm" className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INVITEABLE_ROLES.map((role) => (
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
                              onCheckedChange={(next) => {
                                startTransition(async () => {
                                  const res = await setOrganizationMemberTesterFlagAction({
                                    memberId: member.id,
                                    isTester: Boolean(next),
                                  })
                                  if ("error" in res) {
                                    toast.error(res.error)
                                    return
                                  }
                                  toast.success(
                                    Boolean(next)
                                      ? "Tester tools enabled."
                                      : "Tester tools disabled.",
                                  )
                                  await load()
                                })
                              }}
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
                            onClick={() => {
                              startTransition(async () => {
                                const res = await removeOrganizationMemberAction(member.id)
                                if ("error" in res) {
                                  toast.error(res.error)
                                  return
                                }
                                toast.success("Member removed")
                                await load()
                              })
                            }}
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
            ) : (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            )}

            {canInvite ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Pending invites</p>
                  <p className="mt-1 text-sm text-muted-foreground">Copy an invite link or revoke it.</p>
                </div>
                {hasInvites ? (
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
                              {ROLE_LABELS[invite.role]} • Expires {formatDate(invite.expiresAt)}
                              {expired ? <span className="ml-2 text-destructive">Expired</span> : null}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={pending}
                              onClick={() => {
                                startTransition(async () => {
                                  try {
                                    await copyToClipboard(link)
                                    toast.success("Invite link copied")
                                  } catch {
                                    toast.error("Unable to copy invite link")
                                  }
                                })
                              }}
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
                              onClick={() => {
                                startTransition(async () => {
                                  const res = await revokeOrganizationInviteAction(invite.id)
                                  if ("error" in res) {
                                    toast.error(res.error)
                                    return
                                  }
                                  toast.success("Invite revoked")
                                  await load()
                                })
                              }}
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
                ) : (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
