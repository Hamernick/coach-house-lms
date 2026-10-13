import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase"
import {
  canInviteTeammates,
  getOrganizationAccessSettings,
  parseInviteKindFromToken,
  resolveOrganizationActorContext,
  resolvePaidTeamAccessForOrg,
  TEAM_ACCESS_UPGRADE_MESSAGE,
} from "./shared"
import type {
  AuthenticatedUser,
  OrganizationAccessInvite,
  OrganizationInviteKind,
  OrganizationMemberRole,
  ServerSupabaseClient,
} from "./shared"

export type InvitePermissionContextResult =
  | {
      orgId: string
      canInvite: boolean
    }
  | { error: string }

export type OrganizationInviteRow = {
  id: string
  email: string
  role: OrganizationMemberRole
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export async function resolveInvitePermissionContext(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<InvitePermissionContextResult> {
  const { orgId, role, isPlatformAdmin } = await resolveOrganizationActorContext(
    supabase,
    userId,
  )

  const paidAccess = isPlatformAdmin
    ? { hasPaidTeamAccess: true }
    : await resolvePaidTeamAccessForOrg(supabase, orgId)
  if ("error" in paidAccess) return { error: paidAccess.error }
  if (!paidAccess.hasPaidTeamAccess) return { error: TEAM_ACCESS_UPGRADE_MESSAGE }

  const { adminsCanInvite } = await getOrganizationAccessSettings(supabase, orgId)
  const canInvite = canInviteTeammates({
    hasPaidTeamAccess: paidAccess.hasPaidTeamAccess,
    isPlatformAdmin,
    isOwner: orgId === userId,
    role,
    adminsCanInvite,
  })

  return { orgId, canInvite }
}

export function mapOrganizationInviteRow(
  invite: OrganizationInviteRow,
): OrganizationAccessInvite {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    inviteKind: parseInviteKindFromToken(invite.token),
    token: invite.token,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
    acceptedAt: invite.accepted_at,
  }
}

function resolveInvitedMemberFullName({
  invitedProfileName,
  userMetadataName,
  fallbackEmail,
}: {
  invitedProfileName: string | null
  userMetadataName: string | null
  fallbackEmail: string | null
}) {
  if (typeof invitedProfileName === "string" && invitedProfileName.trim().length > 0) {
    return invitedProfileName.trim()
  }
  if (typeof userMetadataName === "string" && userMetadataName.trim().length > 0) {
    return userMetadataName.trim()
  }
  return fallbackEmail ?? "Teammate"
}

export async function ensureInvitedMemberInOrgDirectory({
  adminClient,
  orgId,
  role,
  inviteKind,
  user,
  email,
}: {
  adminClient: ReturnType<typeof createSupabaseAdminClient>
  orgId: string
  role: OrganizationMemberRole
  inviteKind: OrganizationInviteKind
  user: AuthenticatedUser
  email: string
}) {
  const [{ data: orgRow }, { data: invitedProfile }] = await Promise.all([
    adminClient
      .from("organizations")
      .select("profile")
      .eq("user_id", orgId)
      .maybeSingle<{ profile: Record<string, unknown> | null }>(),
    adminClient
      .from("profiles")
      .select("full_name, headline, avatar_url")
      .eq("id", user.id)
      .maybeSingle<{
        full_name: string | null
        headline: string | null
        avatar_url: string | null
      }>(),
  ])

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const people = Array.isArray(profile.org_people)
    ? (profile.org_people as Array<Record<string, unknown>>)
    : []
  const alreadyExists = people.some(
    (person) => typeof person?.id === "string" && person.id === user.id,
  )

  if (alreadyExists) return

  const category = inviteKind === "funder"
    ? "supporters"
    : role === "board"
      ? "governing_board"
      : role === "member"
        ? "supporters"
        : "staff"
  const userMetadataName =
    typeof user.user_metadata?.full_name === "string"
      ? String(user.user_metadata.full_name)
      : null
  const fullName = resolveInvitedMemberFullName({
    invitedProfileName: invitedProfile?.full_name ?? null,
    userMetadataName,
    fallbackEmail: user.email ?? null,
  })

  people.push({
    id: user.id,
    name: fullName,
    title: invitedProfile?.headline ?? null,
    email,
    linkedin: null,
    category,
    image: invitedProfile?.avatar_url ?? null,
    reportsToId: null,
    pos: null,
  })

  const profilePayload = { ...profile, org_people: people } as Json
  await adminClient
    .from("organizations")
    .upsert({ user_id: orgId, profile: profilePayload }, { onConflict: "user_id" })
}
