"use client"

import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react"
import UserPlus2Icon from "lucide-react/dist/esm/icons/user-plus-2"

import {
  createOrganizationInviteAction,
  revokeOrganizationAccessRequestAction,
  revokeOrganizationInviteAction,
} from "@/app/actions/organization-access"
import {
  createWorkspaceCollaborationInviteAction,
  revokeWorkspaceCollaborationInviteAction,
} from "../../_lib/workspace-actions"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import { WorkspaceBoardInviteSheetBody } from "./workspace-board-invite-sheet-content"
import {
  useWorkspaceBoardOrganizationAccessState,
  type WorkspaceBoardOrganizationAccessSnapshot,
} from "./workspace-board-organization-access-state"
import {
  clampDurationValue,
  resolveInviteStatus,
  resolveWorkspaceTeamInviteRole,
  type WorkspaceInviteAccessLevel,
  type WorkspaceInviteAudience,
} from "./workspace-board-invite-sheet-helpers"
import type {
  WorkspaceCollaborationInvite,
  WorkspaceDurationUnit,
  WorkspaceMemberOption,
} from "./workspace-board-types"

async function copyInviteLink(link: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link)
    return
  }

  if (typeof window !== "undefined") {
    window.prompt("Copy this invite link:", link)
  }
}

export function WorkspaceBoardInviteSheet({
  canInvite,
  members,
  invites,
  onInvitesChange,
  organizationAccessState,
  triggerClassName,
  triggerContent,
  triggerAriaLabel,
  triggerSize = "sm",
  triggerVariant = "outline",
}: {
  canInvite: boolean
  members: WorkspaceMemberOption[]
  invites: WorkspaceCollaborationInvite[]
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
  organizationAccessState?: WorkspaceBoardOrganizationAccessSnapshot
  triggerClassName?: string
  triggerContent?: ReactNode
  triggerAriaLabel?: string
  triggerSize?: "sm" | "icon" | "default"
  triggerVariant?: "outline" | "ghost" | "secondary" | "default"
}) {
  const [open, setOpen] = useState(false)
  const [inviteAudience, setInviteAudience] = useState<WorkspaceInviteAudience>("team")
  const [inviteAccessLevel, setInviteAccessLevel] = useState<WorkspaceInviteAccessLevel>("viewer")
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const [teamInviteEmail, setTeamInviteEmail] = useState("")
  const [durationValue, setDurationValue] = useState<number>(4)
  const [durationUnit, setDurationUnit] = useState<WorkspaceDurationUnit>("hours")
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [origin, setOrigin] = useState("")
  const [isPending, startTransition] = useTransition()
  const fallbackOrganizationAccessState = useWorkspaceBoardOrganizationAccessState({
    enabled: open && !organizationAccessState,
  })
  const resolvedOrganizationAccessState =
    organizationAccessState ?? fallbackOrganizationAccessState

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin.replace(/\/$/, ""))
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setNowMs(Date.now())
    const timer = globalThis.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => globalThis.clearInterval(timer)
  }, [open])

  const inviteRows = useMemo(
    () =>
      invites.map((invite) => ({
        invite,
        status: resolveInviteStatus(invite, nowMs),
      })),
    [invites, nowMs],
  )

  const activeInvites = useMemo(
    () => inviteRows.filter((entry) => entry.status === "active"),
    [inviteRows],
  )
  const historicalInvites = useMemo(
    () => inviteRows.filter((entry) => entry.status !== "active").slice(0, 8),
    [inviteRows],
  )

  const memberOptions = useMemo(() => {
    const invited = new Set(activeInvites.map((entry) => entry.invite.userId))
    return members.filter((member) => !invited.has(member.userId))
  }, [activeInvites, members])

  const canOpenInviteSheet = canInvite || resolvedOrganizationAccessState.canInviteTeam

  const handleCreate = () => {
    if (!selectedMemberId) {
      toast.error("Choose someone to invite.")
      return
    }

    startTransition(async () => {
      const result = await createWorkspaceCollaborationInviteAction({
        userId: selectedMemberId,
        durationValue: clampDurationValue(durationValue),
        durationUnit,
      })

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      onInvitesChange(result.invites)
      setSelectedMemberId("")

      if (result.inviteWasAlreadyActive) {
        toast.success("Temporary invite is already active")
        return
      }

      toast.success(
        result.notificationSent
          ? "Collaboration invite created and notification sent"
          : "Collaboration invite created",
      )
    })
  }

  const handleCreateTeamInvite = () => {
    if (!teamInviteEmail.trim()) {
      toast.error("Enter an email address.")
      return
    }

    startTransition(async () => {
      const result = await createOrganizationInviteAction({
        email: teamInviteEmail,
        role: resolveWorkspaceTeamInviteRole(inviteAccessLevel),
        inviteKind: "standard",
      })

      if ("error" in result) {
        toast.error(result.error)
        return
      }

      if ("invite" in result) {
        if (result.emailSent) {
          toast.success(
            result.outcome === "external_invite_resent"
              ? "Invite email sent again"
              : inviteAccessLevel === "viewer"
                ? "Viewer invite emailed"
                : "Editor invite emailed",
          )
        } else {
          const link = origin
            ? `${origin}/join-organization?token=${result.invite.token}`
            : `/join-organization?token=${result.invite.token}`

          try {
            await copyInviteLink(link)
            toast.warning("Invite created, but email delivery failed. Link copied instead.", {
              description: result.emailError ?? undefined,
            })
          } catch {
            toast.warning("Invite created, but email delivery failed.", {
              description: result.emailError ?? undefined,
            })
          }
        }
      } else {
        const requestLabel =
          result.outcome === "existing_user_request_resent"
            ? "Access request sent again"
            : "Access request sent"
        if (result.emailSent) {
          toast.success(requestLabel)
        } else {
          toast.warning(requestLabel, {
            description:
              result.emailError ??
              "The request is pending in Team Access, but the email notification failed.",
          })
        }
      }

      setTeamInviteEmail("")
      await resolvedOrganizationAccessState.refresh()
    })
  }

  const handleRevoke = (inviteId: string) => {
    startTransition(async () => {
      const result = await revokeWorkspaceCollaborationInviteAction(inviteId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      onInvitesChange(result.invites)
      toast.success("Invite revoked")
    })
  }

  const handleCopyOrganizationInviteLink = (link: string) => {
    startTransition(async () => {
      try {
        await copyInviteLink(link)
        toast.success("Invite link copied")
      } catch {
        toast.error("Unable to copy invite link")
      }
    })
  }

  const handleRevokeOrganizationInvite = (inviteId: string) => {
    startTransition(async () => {
      const result = await revokeOrganizationInviteAction(inviteId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Team invite revoked")
      await resolvedOrganizationAccessState.refresh()
    })
  }

  const handleRevokeOrganizationAccessRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await revokeOrganizationAccessRequestAction(requestId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Access request cancelled")
      await resolvedOrganizationAccessState.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size={triggerSize}
          variant={triggerVariant}
          className={cn("h-8", triggerClassName)}
          disabled={!canOpenInviteSheet}
          aria-label={triggerAriaLabel}
        >
          {triggerContent ?? (
            <>
              <UserPlus2Icon className="h-3.5 w-3.5" aria-hidden />
              Invite
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Workspace collaboration</SheetTitle>
          <SheetDescription>
            Choose between full team access and timed workspace collaboration.
          </SheetDescription>
        </SheetHeader>

        <WorkspaceBoardInviteSheetBody
          canInviteTemporary={canInvite}
          canInviteTeam={resolvedOrganizationAccessState.canInviteTeam}
          isPending={isPending}
          organizationAccessLoading={resolvedOrganizationAccessState.loading}
          organizationAccessMessage={resolvedOrganizationAccessState.inviteCapabilityMessage}
          organizationInvites={resolvedOrganizationAccessState.invites}
          organizationRequests={resolvedOrganizationAccessState.requests}
          inviteUrlBase={origin}
          memberOptions={memberOptions}
          inviteAudience={inviteAudience}
          onInviteAudienceChange={setInviteAudience}
          inviteAccessLevel={inviteAccessLevel}
          onInviteAccessLevelChange={setInviteAccessLevel}
          selectedMemberId={selectedMemberId}
          onSelectedMemberIdChange={setSelectedMemberId}
          teamInviteEmail={teamInviteEmail}
          onTeamInviteEmailChange={setTeamInviteEmail}
          durationValue={durationValue}
          onDurationValueChange={setDurationValue}
          durationUnit={durationUnit}
          onDurationUnitChange={setDurationUnit}
          onCreate={handleCreate}
          onCreateTeamInvite={handleCreateTeamInvite}
          activeInvites={activeInvites}
          historicalInvites={historicalInvites}
          onRevoke={handleRevoke}
          onCopyOrganizationInviteLink={handleCopyOrganizationInviteLink}
          onRevokeOrganizationInvite={handleRevokeOrganizationInvite}
          onRevokeOrganizationAccessRequest={handleRevokeOrganizationAccessRequest}
        />

        <SheetFooter className="border-t border-border/60 bg-background/90">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
