import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase"
import {
  canInviteTeammates,
  formatOrganizationRoleLabel,
  getOrganizationAccessSettings,
  parseInviteKindFromToken,
  resolveOrganizationAccessRequestStatus,
  resolveOrganizationActorContext,
  resolvePaidTeamAccessForOrg,
  TEAM_ACCESS_UPGRADE_MESSAGE,
} from "./shared"
import type {
  AuthenticatedUser,
  OrganizationAccessRequest,
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

export type OrganizationAccessRequestRow = {
  id: string
  org_id: string
  invitee_user_id: string
  invitee_email: string
  role: OrganizationMemberRole
  status: "pending" | "accepted" | "declined" | "expired" | "revoked"
  invited_by_user_id: string | null
  organization_invite_id: string | null
  message: string | null
  responded_at: string | null
  expires_at: string
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

export function mapOrganizationAccessRequestRow({
  request,
  organizationName = null,
  inviteeName = null,
  inviterName = null,
}: {
  request: OrganizationAccessRequestRow
  organizationName?: string | null
  inviteeName?: string | null
  inviterName?: string | null
}): OrganizationAccessRequest {
  return {
    id: request.id,
    orgId: request.org_id,
    organizationName,
    inviteeUserId: request.invitee_user_id,
    inviteeEmail: request.invitee_email,
    inviteeName,
    inviterUserId: request.invited_by_user_id,
    inviterName,
    role: request.role,
    status: resolveOrganizationAccessRequestStatus({
      status: request.status,
      expiresAt: request.expires_at,
    }),
    message: request.message,
    createdAt: request.created_at,
    respondedAt: request.responded_at,
    expiresAt: request.expires_at,
  }
}

export function resolveOrganizationAccessNotificationTitle(organizationName: string) {
  return `${organizationName} invited you to collaborate`
}

export function resolveOrganizationAccessNotificationDescription({
  inviterName,
  role,
}: {
  inviterName: string
  role: OrganizationMemberRole
}) {
  return `${inviterName} requested ${formatOrganizationRoleLabel(role).toLowerCase()} access for you.`
}

type OrganizationAccessClient =
  | ServerSupabaseClient
  | ReturnType<typeof createSupabaseAdminClient>

export async function resolveOrganizationName(
  client: OrganizationAccessClient,
  orgId: string,
): Promise<string> {
  const { data: orgRow } = await client
    .from("organizations")
    .select("profile")
    .eq("user_id", orgId)
    .maybeSingle<{ profile: Record<string, unknown> | null }>()

  const profile = orgRow?.profile ?? null
  const rawName = typeof profile?.name === "string" ? profile.name.trim() : ""
  return rawName.length > 0 ? rawName : "Coach House organization"
}

export async function resolveProfileSummaries(
  client: OrganizationAccessClient,
  userIds: string[],
) {
  const dedupedIds = [...new Set(userIds.filter(Boolean))]
  if (dedupedIds.length === 0) return new Map<string, { fullName: string | null; email: string | null }>()

  const { data } = await client
    .from("profiles")
    .select("id, full_name, email")
    .in("id", dedupedIds)
    .returns<Array<{ id: string; full_name: string | null; email: string | null }>>()

  return new Map(
    (data ?? []).map((profile) => [
      profile.id,
      {
        fullName: profile.full_name,
        email: profile.email,
      },
    ]),
  )
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
