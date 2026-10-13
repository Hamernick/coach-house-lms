"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"

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
import { toast } from "@/lib/toast"

import {
  copyToClipboard,
  type OrganizationInviteRoleOption,
} from "./organization-access-manager-helpers"

type UseOrganizationAccessManagerStateResult = {
  loading: boolean
  members: OrganizationAccessMember[]
  invites: OrganizationAccessInvite[]
  adminsCanInvite: boolean
  staffCanManageCalendar: boolean
  hasPaidTeamAccess: boolean
  canInvite: boolean
  canManageMembers: boolean
  canEditRoles: boolean
  canManageSettings: boolean
  canManageTesterFlags: boolean
  loadError: string | null
  inviteEmail: string
  inviteRole: OrganizationInviteRoleOption
  pending: boolean
  inviteUrlBase: string
  setInviteEmail: (value: string) => void
  setInviteRole: (value: OrganizationInviteRoleOption) => void
  refresh: () => Promise<void>
  updateAdminsCanInvite: (next: boolean) => void
  updateStaffCanManageCalendar: (next: boolean) => void
  createInvite: () => void
  updateMemberRole: (memberId: string, role: OrganizationMemberRole) => void
  updateMemberTesterFlag: (memberId: string, isTester: boolean) => void
  removeMember: (memberId: string) => void
  copyInviteLink: (link: string) => void
  revokeInvite: (inviteId: string) => void
}

export function useOrganizationAccessManagerState(): UseOrganizationAccessManagerStateResult {
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
  const [inviteRole, setInviteRole] = useState<OrganizationInviteRoleOption>("staff")
  const [origin, setOrigin] = useState("")
  const [pending, startTransition] = useTransition()

  const inviteUrlBase = useMemo(() => {
    if (!origin) return ""
    return origin.replace(/\/$/, "")
  }, [origin])

  const refresh = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
    void refresh()
  }, [refresh])

  const updateAdminsCanInvite = useCallback(
    (next: boolean) => {
      startTransition(async () => {
        const toastId = toast.loading("Updating invite permissions…")
        const res = await setOrganizationAdminsCanInviteAction(Boolean(next))
        if ("error" in res) {
          toast.error(res.error, { id: toastId })
          return
        }
        toast.success("Updated", { id: toastId })
        await refresh()
      })
    },
    [refresh],
  )

  const updateStaffCanManageCalendar = useCallback(
    (next: boolean) => {
      startTransition(async () => {
        const toastId = toast.loading("Updating calendar permissions…")
        const res = await setOrganizationStaffCanManageCalendarAction(Boolean(next))
        if ("error" in res) {
          toast.error(res.error, { id: toastId })
          return
        }
        toast.success("Updated", { id: toastId })
        await refresh()
      })
    },
    [refresh],
  )

  const createInvite = useCallback(() => {
    if (pending || inviteEmail.trim().length === 0) return

    startTransition(async () => {
      const toastId = toast.loading("Creating invite…")
      const inviteKind = inviteRole === "funder" ? "funder" : "standard"
      const role: OrganizationMemberRole = inviteRole === "funder" ? "member" : inviteRole
      const res = await createOrganizationInviteAction({
        email: inviteEmail,
        role,
        inviteKind,
      })
      if ("error" in res) {
        toast.error(res.error, { id: toastId })
        return
      }

      const link = inviteUrlBase
        ? `${inviteUrlBase}/join-organization?token=${res.invite.token}`
        : `/join-organization?token=${res.invite.token}`
      try {
        await copyToClipboard(link)
        toast.success("Invite link copied", { id: toastId })
      } catch {
        toast.success("Invite created", { id: toastId })
      }
      setInviteEmail("")
      await refresh()
    })
  }, [inviteEmail, inviteRole, inviteUrlBase, pending, refresh])

  const updateMemberRole = useCallback(
    (memberId: string, role: OrganizationMemberRole) => {
      startTransition(async () => {
        const res = await updateOrganizationMemberRoleAction({ memberId, role })
        if ("error" in res) {
          toast.error(res.error)
          return
        }
        await refresh()
      })
    },
    [refresh],
  )

  const updateMemberTesterFlag = useCallback(
    (memberId: string, isTester: boolean) => {
      startTransition(async () => {
        const res = await setOrganizationMemberTesterFlagAction({
          memberId,
          isTester,
        })
        if ("error" in res) {
          toast.error(res.error)
          return
        }
        toast.success(isTester ? "Tester tools enabled." : "Tester tools disabled.")
        await refresh()
      })
    },
    [refresh],
  )

  const removeMember = useCallback(
    (memberId: string) => {
      startTransition(async () => {
        const res = await removeOrganizationMemberAction(memberId)
        if ("error" in res) {
          toast.error(res.error)
          return
        }
        toast.success("Member removed")
        await refresh()
      })
    },
    [refresh],
  )

  const copyInviteLink = useCallback((link: string) => {
    startTransition(async () => {
      try {
        await copyToClipboard(link)
        toast.success("Invite link copied")
      } catch {
        toast.error("Unable to copy invite link")
      }
    })
  }, [])

  const revokeInvite = useCallback(
    (inviteId: string) => {
      startTransition(async () => {
        const res = await revokeOrganizationInviteAction(inviteId)
        if ("error" in res) {
          toast.error(res.error)
          return
        }
        toast.success("Invite revoked")
        await refresh()
      })
    },
    [refresh],
  )

  return {
    loading,
    members,
    invites,
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
  }
}
