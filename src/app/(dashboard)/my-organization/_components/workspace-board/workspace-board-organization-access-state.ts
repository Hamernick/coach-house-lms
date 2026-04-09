"use client"

import { useCallback, useEffect, useState } from "react"

import {
  listOrganizationAccessAction,
  type OrganizationAccessInvite,
  type OrganizationAccessRequest,
} from "@/app/actions/organization-access"

export type WorkspaceBoardOrganizationAccessSnapshot = {
  loading: boolean
  loadError: string | null
  invites: OrganizationAccessInvite[]
  requests: OrganizationAccessRequest[]
  canInviteTeam: boolean
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
  const [invites, setInvites] = useState<OrganizationAccessInvite[]>([])
  const [requests, setRequests] = useState<OrganizationAccessRequest[]>([])
  const [canInviteTeam, setCanInviteTeam] = useState(false)
  const [hasPaidTeamAccess, setHasPaidTeamAccess] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    const result = await listOrganizationAccessAction()
    if ("error" in result) {
      setInvites([])
      setRequests([])
      setCanInviteTeam(false)
      setHasPaidTeamAccess(false)
      setLoadError(result.error)
      setLoading(false)
      return
    }

    setInvites(result.invites)
    setRequests(result.requests)
    setCanInviteTeam(result.canInvite)
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
    invites,
    requests,
    canInviteTeam,
    hasPaidTeamAccess,
    inviteCapabilityMessage,
    refresh,
  }
}
