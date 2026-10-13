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

  const [membershipsResult, invitesResult] = await Promise.all([
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
  ])

  if (membershipsResult.error) return { error: "Unable to load members." }
  if (invitesResult.error) return { error: "Unable to load invites." }

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

  if (members.length > 0) {
    const memberIds = members.map((member) => member.id)
    const { data: memberProfiles, error: memberProfilesError } = await supabase
      .from("profiles")
      .select("id, is_tester")
      .in("id", memberIds)
      .returns<Array<{ id: string; is_tester: boolean | null }>>()

    if (!memberProfilesError && memberProfiles) {
      const testerMap = new Map(
        memberProfiles.map((profile) => [profile.id, Boolean(profile.is_tester)]),
      )
      for (const member of members) {
        member.isTester = testerMap.get(member.id) ?? false
      }
    }
  }

  return {
    ok: true,
    members,
    invites: normalizedInvites,
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
