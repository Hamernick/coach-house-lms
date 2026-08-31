"use client"

import { useCallback, useTransition } from "react"

import {
  removeOrganizationMemberAction,
  setOrganizationAdminsCanInviteAction,
  setOrganizationStaffCanManageCalendarAction,
  updateOrganizationMemberRoleAction,
  type OrganizationMemberRole,
} from "@/app/actions/organization-access"
import { toast } from "@/lib/toast"

export type WorkspaceBoardAccessManagementActions = {
  pending: boolean
  updateMemberRole: (memberId: string, role: OrganizationMemberRole) => void
  removeMember: (memberId: string) => void
  updateAdminsCanInvite: (next: boolean) => void
  updateStaffCanManageCalendar: (next: boolean) => void
}

export function useWorkspaceBoardAccessManagementActions(
  refresh: () => Promise<void>
): WorkspaceBoardAccessManagementActions {
  const [pending, startTransition] = useTransition()

  const updateMemberRole = useCallback(
    (memberId: string, role: OrganizationMemberRole) => {
      startTransition(async () => {
        const result = await updateOrganizationMemberRoleAction({
          memberId,
          role,
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Role updated")
        await refresh()
      })
    },
    [refresh]
  )

  const removeMember = useCallback(
    (memberId: string) => {
      startTransition(async () => {
        const result = await removeOrganizationMemberAction(memberId)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Member removed")
        await refresh()
      })
    },
    [refresh]
  )

  const updateAdminsCanInvite = useCallback(
    (next: boolean) => {
      startTransition(async () => {
        const result = await setOrganizationAdminsCanInviteAction(next)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Invite permissions updated")
        await refresh()
      })
    },
    [refresh]
  )

  const updateStaffCanManageCalendar = useCallback(
    (next: boolean) => {
      startTransition(async () => {
        const result = await setOrganizationStaffCanManageCalendarAction(next)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        toast.success("Calendar permissions updated")
        await refresh()
      })
    },
    [refresh]
  )

  return {
    pending,
    updateMemberRole,
    removeMember,
    updateAdminsCanInvite,
    updateStaffCanManageCalendar,
  }
}
