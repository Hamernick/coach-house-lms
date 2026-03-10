import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { hasPaidTeamAccessFromSubscription } from "@/lib/billing/subscription-access"

export type OrganizationMemberRole =
  | "owner"
  | "admin"
  | "staff"
  | "board"
  | "member"

export type OrganizationAccessMember = {
  id: string
  email: string | null
  role: OrganizationMemberRole
  joinedAt: string | null
  isTester?: boolean
}

export type OrganizationAccessInvite = {
  id: string
  email: string
  role: OrganizationMemberRole
  inviteKind: OrganizationInviteKind
  token: string
  expiresAt: string
  createdAt: string
  acceptedAt: string | null
}

export type OrganizationAccessResult = { ok: true } | { error: string }

export type OrganizationAccessListResult =
  | {
      ok: true
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
    }
  | { error: string }

export type CreateInviteResult =
  | { ok: true; invite: OrganizationAccessInvite }
  | { error: string }

export type AcceptInviteResult =
  | {
      ok: true
      orgId: string
      role: OrganizationMemberRole
      inviteKind: OrganizationInviteKind
    }
  | { error: string }

export type OrganizationInviteKind = "standard" | "funder"
export const FUNDER_INVITE_TOKEN_PREFIX = "fndr_"

export type ServerSupabaseClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>

export type AuthenticatedUser = {
  id: string
  email?: string | null
  created_at?: string | null
  user_metadata?: Record<string, unknown>
}

export const INVITE_ROLES: OrganizationMemberRole[] = [
  "admin",
  "staff",
  "board",
  "member",
]

export const TEAM_ACCESS_UPGRADE_MESSAGE =
  "Upgrade to Organization to invite teammates and manage team access."

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase()
}

export function isValidEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

export function isOrganizationMemberRole(
  value: string,
): value is OrganizationMemberRole {
  return (
    value === "owner" ||
    value === "admin" ||
    value === "staff" ||
    value === "board" ||
    value === "member"
  )
}

export function resolveUserEmail(user: {
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  if (typeof user.email === "string" && user.email.length > 0) return user.email
  const metaEmail = user.user_metadata?.email
  return typeof metaEmail === "string" && metaEmail.length > 0 ? metaEmail : null
}

export function createInviteToken(inviteKind: OrganizationInviteKind = "standard") {
  const prefix = inviteKind === "funder" ? FUNDER_INVITE_TOKEN_PREFIX : ""
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}${uuid.replace(/-/g, "")}`
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return `${prefix}${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`
  }
  return `${prefix}${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

export function parseInviteKindFromToken(token: string): OrganizationInviteKind {
  return token.startsWith(FUNDER_INVITE_TOKEN_PREFIX) ? "funder" : "standard"
}

export async function resolvePaidTeamAccessForOrg(
  supabase: ServerSupabaseClient,
  orgId: string,
): Promise<{ hasPaidTeamAccess: boolean } | { error: string }> {
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("status, metadata, created_at")
    .eq("user_id", orgId)
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; metadata: Json | null }>()

  if (error) return { error: "Unable to load subscription status." }

  const hasPaidTeamAccess = hasPaidTeamAccessFromSubscription(subscription ?? null)

  return { hasPaidTeamAccess }
}

export async function getAuthenticatedUser(
  supabase: ServerSupabaseClient,
): Promise<{ user: AuthenticatedUser } | { error: string }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }
  return { user: user as AuthenticatedUser }
}

export async function resolveOrganizationActorContext(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<{
  orgId: string
  role: OrganizationMemberRole
  isPlatformAdmin: boolean
}> {
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()

  return {
    orgId,
    role: role as OrganizationMemberRole,
    isPlatformAdmin: profileRow?.role === "admin",
  }
}

export async function getOrganizationAccessSettings(
  supabase: ServerSupabaseClient,
  orgId: string,
): Promise<{ adminsCanInvite: boolean; staffCanManageCalendar: boolean }> {
  const { data: settingsRow } = await supabase
    .from("organization_access_settings")
    .select("admins_can_invite, staff_can_manage_calendar")
    .eq("org_id", orgId)
    .maybeSingle<{ admins_can_invite: boolean; staff_can_manage_calendar: boolean }>()

  return {
    adminsCanInvite: Boolean(settingsRow?.admins_can_invite),
    staffCanManageCalendar: Boolean(settingsRow?.staff_can_manage_calendar),
  }
}

export function canInviteTeammates({
  hasPaidTeamAccess,
  isPlatformAdmin,
  isOwner,
  role,
  adminsCanInvite,
}: {
  hasPaidTeamAccess: boolean
  isPlatformAdmin: boolean
  isOwner: boolean
  role: OrganizationMemberRole
  adminsCanInvite: boolean
}) {
  if (!hasPaidTeamAccess) return false
  return isPlatformAdmin || isOwner || (role === "admin" && adminsCanInvite)
}

export function tryCreateSupabaseAdminClient(): ReturnType<
  typeof createSupabaseAdminClient
> | null {
  try {
    return createSupabaseAdminClient()
  } catch {
    return null
  }
}
