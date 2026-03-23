import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  canInviteTeammates,
  getAuthenticatedUser,
  getOrganizationAccessSettings,
  parseInviteKindFromToken,
  resolveOrganizationActorContext,
  resolvePaidTeamAccessForOrg,
  resolveUserEmail,
} from "./shared"
import type {
  OrganizationAccessInvite,
  OrganizationAccessListResult,
  OrganizationAccessMember,
  OrganizationMemberRole,
} from "./shared"
import {
  mapOrganizationAccessRequestRow,
  resolveProfileSummaries,
  type OrganizationAccessRequestRow,
} from "./invites-helpers"

export async function listOrganizationAccessActionImpl(): Promise<OrganizationAccessListResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const { orgId, role, isPlatformAdmin } = await resolveOrganizationActorContext(
    supabase,
    user.id,
  )

  const paidAccess = isPlatformAdmin
    ? { hasPaidTeamAccess: true }
    : await resolvePaidTeamAccessForOrg(supabase, orgId)
  if ("error" in paidAccess) return { error: paidAccess.error }
  const hasPaidTeamAccess = paidAccess.hasPaidTeamAccess

  const canManageMembers = isPlatformAdmin || orgId === user.id
  const canEditRoles = hasPaidTeamAccess && canManageMembers
  const canManageSettings = hasPaidTeamAccess && (isPlatformAdmin || orgId === user.id)
  const canManageTesterFlags = isPlatformAdmin

  const { adminsCanInvite, staffCanManageCalendar } =
    await getOrganizationAccessSettings(supabase, orgId)
  const canInvite = canInviteTeammates({
    hasPaidTeamAccess,
    isPlatformAdmin,
    isOwner: orgId === user.id,
    role,
    adminsCanInvite,
  })

  const ownerEmail = orgId === user.id ? resolveUserEmail(user) : null
  const members: OrganizationAccessMember[] = [
    {
      id: orgId,
      email: ownerEmail,
      role: "owner",
      joinedAt: orgId === user.id ? (user.created_at ?? null) : null,
    },
  ]

  const [membershipsResult, invitesResult, requestsResult] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("member_id, member_email, role, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          member_id: string
          member_email: string
          role: OrganizationMemberRole
          created_at: string
        }>
      >(),
    canInvite
      ? supabase
          .from("organization_invites")
          .select("id, email, role, token, expires_at, accepted_at, created_at")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .returns<
            Array<{
              id: string
              email: string
              role: OrganizationMemberRole
              token: string
              expires_at: string
              accepted_at: string | null
              created_at: string
            }>
          >()
      : Promise.resolve({
          data: [] as Array<{
            id: string
            email: string
            role: OrganizationMemberRole
            token: string
            expires_at: string
            accepted_at: string | null
            created_at: string
          }>,
          error: null,
        }),
    canInvite
      ? supabase
          .from("organization_access_requests")
          .select(
            "id, org_id, invitee_user_id, invitee_email, role, status, invited_by_user_id, organization_invite_id, message, responded_at, expires_at, created_at",
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .returns<OrganizationAccessRequestRow[]>()
      : Promise.resolve({
          data: [] as OrganizationAccessRequestRow[],
          error: null,
        }),
  ])

  if (membershipsResult.error) return { error: "Unable to load members." }
  if (invitesResult.error) return { error: "Unable to load invites." }
  if (requestsResult.error) return { error: "Unable to load access requests." }

  for (const membership of membershipsResult.data ?? []) {
    if (membership.member_id === orgId) continue
    members.push({
      id: membership.member_id,
      email: membership.member_email,
      role: membership.role,
      joinedAt: membership.created_at,
    })
  }

  const normalizedInvites: OrganizationAccessInvite[] = (
    invitesResult.data ?? []
  ).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    inviteKind: parseInviteKindFromToken(invite.token),
    token: invite.token,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
    acceptedAt: invite.accepted_at,
  }))

  const requestRows = requestsResult.data ?? []

  const requestInviteeIds = requestRows.map((request) => request.invitee_user_id)

  if (members.length > 0 || requestInviteeIds.length > 0) {
    const memberIds = [...new Set([...members.map((member) => member.id), ...requestInviteeIds])]
    const { data: memberProfiles, error: memberProfilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_tester")
      .in("id", memberIds)
      .returns<Array<{ id: string; full_name: string | null; email: string | null; is_tester: boolean | null }>>()

    if (!memberProfilesError && memberProfiles) {
      const testerMap = new Map(
        memberProfiles.map((profile) => [profile.id, Boolean(profile.is_tester)]),
      )
      for (const member of members) {
        member.isTester = testerMap.get(member.id) ?? false
      }

      const profileMap = new Map(
        memberProfiles.map((profile) => [
          profile.id,
          {
            fullName: profile.full_name,
            email: profile.email,
          },
        ]),
      )

      const inviterIds = requestRows
        .map((request) => request.invited_by_user_id)
        .filter((value): value is string => Boolean(value))
      const inviterProfileMap = await resolveProfileSummaries(supabase, inviterIds)

      const requests = requestRows.map((request) =>
        mapOrganizationAccessRequestRow({
          request,
          organizationName: null,
          inviteeName:
            profileMap.get(request.invitee_user_id)?.fullName ??
            profileMap.get(request.invitee_user_id)?.email ??
            request.invitee_email,
          inviterName: request.invited_by_user_id
            ? inviterProfileMap.get(request.invited_by_user_id)?.fullName ??
              inviterProfileMap.get(request.invited_by_user_id)?.email ??
              "Coach House teammate"
            : "Coach House teammate",
        }),
      )

      return {
        ok: true,
        members,
        invites: normalizedInvites,
        requests,
        adminsCanInvite,
        staffCanManageCalendar,
        hasPaidTeamAccess,
        canInvite,
        canManageMembers,
        canEditRoles,
        canManageSettings,
        canManageTesterFlags,
      }
    }
  }

  return {
    ok: true,
    members,
    invites: normalizedInvites,
    requests: requestRows.map((request) =>
      mapOrganizationAccessRequestRow({
        request,
        organizationName: null,
        inviteeName: request.invitee_email,
        inviterName: "Coach House teammate",
      }),
    ),
    adminsCanInvite,
    staffCanManageCalendar,
    hasPaidTeamAccess,
    canInvite,
    canManageMembers,
    canEditRoles,
    canManageSettings,
    canManageTesterFlags,
  }
}
