"use client"

import Link from "next/link"
import UsersIcon from "lucide-react/dist/esm/icons/users"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { updateWorkspaceFinanceAccess } from "@/actions/workspace-finance-access"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  WorkspaceFinanceAccessInput,
  WorkspaceFinanceAccessLevel,
  WorkspaceFinanceAccessMember,
} from "../types"

const NO_ACCESS = "none"

function accessLabel(accessLevel: WorkspaceFinanceAccessLevel | null) {
  if (accessLevel === "manager") return "Can manage"
  if (accessLevel === "viewer") return "Can view"
  return "No access"
}

export function WorkspaceFinanceAccessPopover({
  initialAccess,
}: {
  initialAccess: WorkspaceFinanceAccessInput
}) {
  const [members, setMembers] = useState(initialAccess.members)
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)
  const [pendingRevocation, setPendingRevocation] =
    useState<WorkspaceFinanceAccessMember | null>(null)
  const [pending, startTransition] = useTransition()

  function updateMemberAccess(
    member: WorkspaceFinanceAccessMember,
    accessLevel: WorkspaceFinanceAccessLevel | null
  ) {
    const previousAccessLevel = member.accessLevel
    setMembers((current) =>
      current.map((candidate) =>
        candidate.memberId === member.memberId
          ? { ...candidate, accessLevel }
          : candidate
      )
    )
    setPendingMemberId(member.memberId)

    startTransition(async () => {
      const result = await updateWorkspaceFinanceAccess({
        accessLevel,
        memberId: member.memberId,
      })
      setPendingMemberId(null)

      if ("error" in result) {
        setMembers((current) =>
          current.map((candidate) =>
            candidate.memberId === member.memberId
              ? { ...candidate, accessLevel: previousAccessLevel }
              : candidate
          )
        )
        toast.error(result.error)
        return
      }

      toast.success(
        accessLevel ? "Finance access updated" : "Finance access revoked"
      )
    })
  }

  function handleAccessChange(
    member: WorkspaceFinanceAccessMember,
    value: string
  ) {
    if (value === NO_ACCESS) {
      if (member.accessLevel) setPendingRevocation(member)
      return
    }
    if (value === "viewer" || value === "manager") {
      if (value !== member.accessLevel) updateMemberAccess(member, value)
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label="Share Finance with board members"
            size="sm"
            variant="outline"
          >
            <UsersIcon aria-hidden="true" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[min(24rem,calc(100vw-2rem))] p-0"
          sideOffset={8}
        >
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-sm font-semibold">Board access</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              Share read-only reporting or Finance management with existing
              board members.
            </p>
          </div>

          <div className="max-h-80 divide-y overflow-y-auto overscroll-contain border-t">
            {initialAccess.state === "error" ? (
              <p className="text-muted-foreground px-4 py-6 text-sm">
                Board access could not be loaded. Close this menu and try again.
              </p>
            ) : members.length ? (
              members.map((member) => {
                const memberPending =
                  pending && pendingMemberId === member.memberId
                return (
                  <div
                    key={member.memberId}
                    className="flex min-w-0 items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.email}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Board member
                      </p>
                    </div>
                    <Select
                      disabled={pending}
                      value={member.accessLevel ?? NO_ACCESS}
                      onValueChange={(value) =>
                        handleAccessChange(member, value)
                      }
                    >
                      <SelectTrigger
                        aria-busy={memberPending}
                        aria-label={`Finance access for ${member.email}`}
                        className="h-11 w-36 sm:h-8"
                        size="sm"
                      >
                        <SelectValue>
                          {accessLabel(member.accessLevel)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value={NO_ACCESS}>No access</SelectItem>
                        <SelectItem value="viewer">Can view</SelectItem>
                        <SelectItem value="manager">Can manage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-6 text-sm">
                <p className="text-muted-foreground">No board members yet.</p>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link href="/people">Manage people</Link>
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={Boolean(pendingRevocation)}
        onOpenChange={(open) => {
          if (!open) setPendingRevocation(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Finance access?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRevocation?.email ?? "This board member"} will immediately
              lose access to Finance reporting and exports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep access</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingRevocation) {
                  updateMemberAccess(pendingRevocation, null)
                }
                setPendingRevocation(null)
              }}
            >
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
