"use client"

import { useCallback, useEffect, useState } from "react"

import {
  listOrganizationAccessAction,
  type OrganizationAccessInvite,
  type OrganizationAccessMember,
  type OrganizationAccessRequest,
} from "@/app/actions/organization-access"

export type WorkspaceBoardOrganizationAccessSnapshot = {
  loading: boolean
  loadError: string | null
  members: OrganizationAccessMember[]
  invites: OrganizationAccessInvite[]
  requests: OrganizationAccessRequest[]
  adminsCanInvite: boolean
  staffCanManageCalendar: boolean
  canInviteTeam: boolean
  canManageMembers: boolean
  canEditRoles: boolean
  canManageSettings: boolean
  hasPaidTeamAccess: boolean
  inviteCapabilityMessage: string | null
  refresh: () => Promise<void>
}

export function useWorkspaceBoardOrganizationAccessState({
  enabled = true,
}: {
  enabled?: boolean
} = {}): WorkspaceBoardOrganizationAccessSnapshot {
  const [loading, setLoading] = useState(Boolean(enabled))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [members, setMembers] = useState<OrganizationAccessMember[]>([])
  const [invites, setInvites] = useState<OrganizationAccessInvite[]>([])
  const [requests, setRequests] = useState<OrganizationAccessRequest[]>([])
  const [adminsCanInvite, setAdminsCanInvite] = useState(false)
  const [staffCanManageCalendar, setStaffCanManageCalendar] = useState(false)
  const [canInviteTeam, setCanInviteTeam] = useState(false)
  const [canManageMembers, setCanManageMembers] = useState(false)
  const [canEditRoles, setCanEditRoles] = useState(false)
  const [canManageSettings, setCanManageSettings] = useState(false)
  const [hasPaidTeamAccess, setHasPaidTeamAccess] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const result = await listOrganizationAccessAction()
    if ("error" in result) {
      setMembers([])
      setInvites([])
      setRequests([])
      setAdminsCanInvite(false)
      setStaffCanManageCalendar(false)
      setCanInviteTeam(false)
      setCanManageMembers(false)
      setCanEditRoles(false)
      setCanManageSettings(false)
      setHasPaidTeamAccess(false)
      setLoadError(result.error)
      setLoading(false)
      return
    }

    setMembers(result.members)
    setInvites(result.invites)
    setRequests(result.requests)
    setAdminsCanInvite(Boolean(result.adminsCanInvite))
    setStaffCanManageCalendar(Boolean(result.staffCanManageCalendar))
    setCanInviteTeam(result.canInvite)
    setCanManageMembers(result.canManageMembers)
    setCanEditRoles(result.canEditRoles)
    setCanManageSettings(result.canManageSettings)
    setHasPaidTeamAccess(result.hasPaidTeamAccess)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refresh])

  const inviteCapabilityMessage = loadError
    ? loadError
    : !hasPaidTeamAccess
      ? "Upgrade to Organization to invite teammates and manage team access."
      : !canInviteTeam
        ? "Only the organization owner, platform admins, or approved admins can send team invites."
        : null

  return {
    loading,
    loadError,
    members,
    invites,
    requests,
    adminsCanInvite,
    staffCanManageCalendar,
    canInviteTeam,
    canManageMembers,
    canEditRoles,
    canManageSettings,
    hasPaidTeamAccess,
    inviteCapabilityMessage,
    refresh,
  }
}
