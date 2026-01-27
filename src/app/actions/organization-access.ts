"use server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { resolveActiveOrganization } from "@/lib/organization/active-org"

export type OrganizationMemberRole = "owner" | "admin" | "staff" | "board" | "member"

export type OrganizationAccessMember = {
  id: string
  email: string | null
  role: OrganizationMemberRole
  joinedAt: string | null
}

export type OrganizationAccessInvite = {
  id: string
  email: string
  role: OrganizationMemberRole
  token: string
  expiresAt: string
  createdAt: string
  acceptedAt: string | null
}

type OrganizationAccessResult = { ok: true } | { error: string }

type OrganizationAccessListResult =
  | {
      ok: true
      members: OrganizationAccessMember[]
      invites: OrganizationAccessInvite[]
      adminsCanInvite: boolean
      staffCanManageCalendar: boolean
      canInvite: boolean
      canManageMembers: boolean
      canManageSettings: boolean
    }
  | { error: string }

type CreateInviteResult =
  | { ok: true; invite: OrganizationAccessInvite }
  | { error: string }

type AcceptInviteResult =
  | { ok: true; orgId: string }
  | { error: string }

const INVITE_ROLES: OrganizationMemberRole[] = ["admin", "staff", "board", "member"]

function normalizeEmail(input: string) {
  return input.trim().toLowerCase()
}

function isValidEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

function isOrganizationMemberRole(value: string): value is OrganizationMemberRole {
  return value === "owner" || value === "admin" || value === "staff" || value === "board" || value === "member"
}

function resolveUserEmail(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  if (typeof user.email === "string" && user.email.length > 0) return user.email
  const metaEmail = user.user_metadata?.email
  return typeof metaEmail === "string" && metaEmail.length > 0 ? metaEmail : null
}

function createInviteToken() {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid.replace(/-/g, "")
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

export async function listOrganizationAccessAction(): Promise<OrganizationAccessListResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isPlatformAdmin = profileRow?.role === "admin"

  const canManageMembers = isPlatformAdmin || orgId === user.id
  const canManageSettings = isPlatformAdmin || orgId === user.id

  const { data: settingsRow } = await supabase
    .from("organization_access_settings")
    .select("admins_can_invite, staff_can_manage_calendar")
    .eq("org_id", orgId)
    .maybeSingle<{ admins_can_invite: boolean; staff_can_manage_calendar: boolean }>()

  const adminsCanInvite = Boolean(settingsRow?.admins_can_invite)
  const staffCanManageCalendar = Boolean(settingsRow?.staff_can_manage_calendar)
  const canInvite = isPlatformAdmin || orgId === user.id || (role === "admin" && adminsCanInvite)

  const ownerEmail = orgId === user.id ? resolveUserEmail(user) : null
  const members: OrganizationAccessMember[] = [
    {
      id: orgId,
      email: ownerEmail,
      role: "owner",
      joinedAt: orgId === user.id ? (user.created_at ?? null) : null,
    },
  ]

  const [{ data: memberships, error: membershipsError }, invitesResult] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("member_id, member_email, role, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .returns<Array<{ member_id: string; member_email: string; role: OrganizationMemberRole; created_at: string }>>(),
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
      : Promise.resolve({ data: [] as Array<{ id: string; email: string; role: OrganizationMemberRole; token: string; expires_at: string; accepted_at: string | null; created_at: string }>, error: null }),
  ])

  if (membershipsError) return { error: "Unable to load members." }
  if (invitesResult.error) return { error: "Unable to load invites." }

  for (const membership of memberships ?? []) {
    if (membership.member_id === orgId) continue
    members.push({
      id: membership.member_id,
      email: membership.member_email,
      role: membership.role,
      joinedAt: membership.created_at,
    })
  }

  const normalizedInvites: OrganizationAccessInvite[] = (invitesResult.data ?? []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
    acceptedAt: invite.accepted_at,
  }))

  return {
    ok: true,
    members,
    invites: normalizedInvites,
    adminsCanInvite,
    staffCanManageCalendar,
    canInvite,
    canManageMembers,
    canManageSettings,
  }
}

export async function createOrganizationInviteAction({
  email,
  role,
}: {
  email: string
  role: OrganizationMemberRole
}): Promise<CreateInviteResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { orgId, role: memberRole } = await resolveActiveOrganization(supabase, user.id)
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isPlatformAdmin = profileRow?.role === "admin"
  const { data: settingsRow } = await supabase
    .from("organization_access_settings")
    .select("admins_can_invite")
    .eq("org_id", orgId)
    .maybeSingle<{ admins_can_invite: boolean }>()
  const adminsCanInvite = Boolean(settingsRow?.admins_can_invite)
  const canInvite = isPlatformAdmin || orgId === user.id || (memberRole === "admin" && adminsCanInvite)
  if (!canInvite) return { error: "You don’t have permission to invite teammates." }

  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) return { error: "Enter a valid email address." }
  if (!INVITE_ROLES.includes(role)) return { error: "Invalid role." }

  let adminClient: ReturnType<typeof createSupabaseAdminClient> | null = null
  try {
    adminClient = createSupabaseAdminClient()
  } catch {
    adminClient = null
  }

  const membershipClient = adminClient ?? supabase
  const { data: existingMember } = await membershipClient
    .from("organization_memberships")
    .select("member_id")
    .eq("org_id", orgId)
    .eq("member_email", normalizedEmail)
    .maybeSingle<{ member_id: string }>()

  if (existingMember) return { error: "That email is already a member of your organization." }

  const { data: existingInvite, error: inviteCheckError } = await supabase
    .from("organization_invites")
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .eq("org_id", orgId)
    .eq("email", normalizedEmail)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string
      email: string
      role: OrganizationMemberRole
      token: string
      expires_at: string
      accepted_at: string | null
      created_at: string
    }>()

  if (inviteCheckError) return { error: "Unable to validate invites." }
  if (existingInvite) {
    return {
      ok: true,
      invite: {
        id: existingInvite.id,
        email: existingInvite.email,
        role: existingInvite.role,
        token: existingInvite.token,
        expiresAt: existingInvite.expires_at,
        createdAt: existingInvite.created_at,
        acceptedAt: existingInvite.accepted_at,
      },
    }
  }

  const token = createInviteToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: createdInvite, error: insertError } = await supabase
    .from("organization_invites")
    .insert({
      org_id: orgId,
      email: normalizedEmail,
      role,
      token,
      expires_at: expiresAt,
      invited_by: user.id,
    })
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .single<{
      id: string
      email: string
      role: OrganizationMemberRole
      token: string
      expires_at: string
      accepted_at: string | null
      created_at: string
    }>()

  if (insertError || !createdInvite) return { error: insertError?.message ?? "Unable to create invite." }

  return {
    ok: true,
    invite: {
      id: createdInvite.id,
      email: createdInvite.email,
      role: createdInvite.role,
      token: createdInvite.token,
      expiresAt: createdInvite.expires_at,
      createdAt: createdInvite.created_at,
      acceptedAt: createdInvite.accepted_at,
    },
  }
}

export async function revokeOrganizationInviteAction(inviteId: string): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isPlatformAdmin = profileRow?.role === "admin"
  const { data: settingsRow } = await supabase
    .from("organization_access_settings")
    .select("admins_can_invite")
    .eq("org_id", orgId)
    .maybeSingle<{ admins_can_invite: boolean }>()
  const adminsCanInvite = Boolean(settingsRow?.admins_can_invite)
  const canInvite = isPlatformAdmin || orgId === user.id || (role === "admin" && adminsCanInvite)
  if (!canInvite) return { error: "You don’t have permission to manage invites." }

  const { error: deleteError } = await supabase
    .from("organization_invites")
    .delete()
    .eq("id", inviteId)
    .eq("org_id", orgId)

  if (deleteError) return { error: "Unable to revoke invite." }
  return { ok: true }
}

export async function removeOrganizationMemberAction(memberId: string): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }
  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  if (orgId !== user.id) return { error: "Only the organization owner can manage members." }
  if (memberId === orgId) return { error: "You can’t remove the organization owner." }

  const { error: deleteError } = await supabase
    .from("organization_memberships")
    .delete()
    .eq("org_id", orgId)
    .eq("member_id", memberId)

  if (deleteError) return { error: "Unable to remove member." }
  return { ok: true }
}

export async function updateOrganizationMemberRoleAction({
  memberId,
  role,
}: {
  memberId: string
  role: OrganizationMemberRole
}): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }
  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  if (orgId !== user.id) return { error: "Only the organization owner can manage members." }
  if (memberId === orgId) return { error: "You can’t change the organization owner role." }
  if (!INVITE_ROLES.includes(role)) return { error: "Invalid role." }

  const { error: updateError } = await supabase
    .from("organization_memberships")
    .update({ role })
    .eq("org_id", orgId)
    .eq("member_id", memberId)

  if (updateError) return { error: "Unable to update role." }
  return { ok: true }
}

export async function setOrganizationAdminsCanInviteAction(next: boolean): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  if (orgId !== user.id) return { error: "Only the organization owner can change this setting." }

  const { error: upsertError } = await supabase
    .from("organization_access_settings")
    .upsert({ org_id: orgId, admins_can_invite: Boolean(next) }, { onConflict: "org_id" })

  if (upsertError) return { error: upsertError.message ?? "Unable to update setting." }
  return { ok: true }
}

export async function setOrganizationStaffCanManageCalendarAction(next: boolean): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  if (orgId !== user.id) return { error: "Only the organization owner can change this setting." }

  const { error: upsertError } = await supabase
    .from("organization_access_settings")
    .upsert({ org_id: orgId, staff_can_manage_calendar: Boolean(next) }, { onConflict: "org_id" })

  if (upsertError) return { error: upsertError.message ?? "Unable to update setting." }
  return { ok: true }
}

export async function acceptOrganizationInviteAction(token: string): Promise<AcceptInviteResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const normalizedToken = String(token ?? "").trim()
  if (!normalizedToken) return { error: "Missing invite token." }

  const email = resolveUserEmail(user)
  if (!email) return { error: "Your account does not have an email address." }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>
  try {
    adminClient = createSupabaseAdminClient()
  } catch {
    return { error: "Invites are not configured on this environment." }
  }

  const { data: invite, error: inviteError } = await adminClient
    .from("organization_invites")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", normalizedToken)
    .maybeSingle<{
      id: string
      org_id: string
      email: string
      role: string
      expires_at: string
      accepted_at: string | null
    }>()

  if (inviteError || !invite) return { error: "Invite not found." }
  if (invite.accepted_at) return { ok: true, orgId: invite.org_id }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: "This invite link has expired." }
  }

  const normalizedInviteEmail = normalizeEmail(invite.email)
  const normalizedUserEmail = normalizeEmail(email)
  if (normalizedInviteEmail !== normalizedUserEmail) {
    return { error: "This invite was sent to a different email address." }
  }

  if (!isOrganizationMemberRole(invite.role) || invite.role === "owner") {
    return { error: "Invalid invite role." }
  }

  const now = new Date().toISOString()

  const { error: upsertError } = await adminClient.from("organization_memberships").upsert(
    {
      org_id: invite.org_id,
      member_id: user.id,
      role: invite.role,
      member_email: normalizedUserEmail,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "org_id,member_id" },
  )

  if (upsertError) return { error: "Unable to join organization." }

  const { error: acceptError } = await adminClient
    .from("organization_invites")
    .update({ accepted_at: now })
    .eq("id", invite.id)

  if (acceptError) {
    return { error: "Joined, but failed to mark invite accepted." }
  }

  // Best-effort: ensure the invited member appears in the org directory.
  try {
    const [{ data: orgRow }, { data: invitedProfile }] = await Promise.all([
      adminClient
        .from("organizations")
        .select("profile")
        .eq("user_id", invite.org_id)
        .maybeSingle<{ profile: Record<string, unknown> | null }>(),
      adminClient
        .from("profiles")
        .select("full_name, headline, avatar_url")
        .eq("id", user.id)
        .maybeSingle<{ full_name: string | null; headline: string | null; avatar_url: string | null }>(),
    ])

    const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
    const people = Array.isArray(profile.org_people) ? (profile.org_people as Array<Record<string, unknown>>) : []
    const already = people.some((person) => typeof person?.id === "string" && person.id === user.id)

    if (!already) {
      const category = invite.role === "board" ? "governing_board" : "staff"
      const fullName =
        (typeof invitedProfile?.full_name === "string" && invitedProfile.full_name.trim().length > 0
          ? invitedProfile.full_name.trim()
          : typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim().length > 0
            ? String(user.user_metadata.full_name).trim()
            : null) ?? user.email ?? "Teammate"

      people.push({
        id: user.id,
        name: fullName,
        title: invitedProfile?.headline ?? null,
        email: email,
        linkedin: null,
        category,
        image: invitedProfile?.avatar_url ?? null,
        reportsToId: null,
        pos: null,
      })

      const profilePayload = { ...profile, org_people: people } as Json
      await adminClient
        .from("organizations")
        .upsert({ user_id: invite.org_id, profile: profilePayload }, { onConflict: "user_id" })
    }
  } catch {}

  return { ok: true, orgId: invite.org_id }
}
