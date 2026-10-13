import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  ensureInvitedMemberInOrgDirectory,
  mapOrganizationInviteRow,
  resolveInvitePermissionContext,
  type OrganizationInviteRow,
} from "./invites-helpers"
import {
  createInviteToken,
  INVITE_ROLES,
  getAuthenticatedUser,
  isOrganizationMemberRole,
  isValidEmail,
  normalizeEmail,
  parseInviteKindFromToken,
  resolveUserEmail,
  tryCreateSupabaseAdminClient,
} from "./shared"
import type {
  AcceptInviteResult,
  CreateInviteResult,
  OrganizationAccessResult,
  OrganizationInviteKind,
  OrganizationMemberRole,
} from "./shared"

export async function createOrganizationInviteActionImpl({
  email,
  role,
  inviteKind = "standard",
}: {
  email: string
  role: OrganizationMemberRole
  inviteKind?: OrganizationInviteKind
}): Promise<CreateInviteResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const inviteContext = await resolveInvitePermissionContext(supabase, user.id)
  if ("error" in inviteContext) return { error: inviteContext.error }
  if (!inviteContext.canInvite) {
    return { error: "You don’t have permission to invite teammates." }
  }

  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) {
    return { error: "Enter a valid email address." }
  }
  if (!INVITE_ROLES.includes(role)) return { error: "Invalid role." }
  if (inviteKind !== "standard" && inviteKind !== "funder") {
    return { error: "Invalid invite type." }
  }
  if (inviteKind === "funder" && role !== "member") {
    return { error: "Funder invites must use member access." }
  }

  const adminClient = tryCreateSupabaseAdminClient()
  const membershipClient = adminClient ?? supabase
  const { data: existingMember } = await membershipClient
    .from("organization_memberships")
    .select("member_id")
    .eq("org_id", inviteContext.orgId)
    .eq("member_email", normalizedEmail)
    .maybeSingle<{ member_id: string }>()

  if (existingMember) {
    return { error: "That email is already a member of your organization." }
  }

  const { data: existingInvite, error: inviteCheckError } = await supabase
    .from("organization_invites")
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .eq("org_id", inviteContext.orgId)
    .eq("email", normalizedEmail)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<OrganizationInviteRow>()

  if (inviteCheckError) return { error: "Unable to validate invites." }
  if (existingInvite) {
    return { ok: true, invite: mapOrganizationInviteRow(existingInvite) }
  }

  const token = createInviteToken(inviteKind)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const storedRole = inviteKind === "funder" ? "member" : role

  const { data: createdInvite, error: insertError } = await supabase
    .from("organization_invites")
    .insert({
      org_id: inviteContext.orgId,
      email: normalizedEmail,
      role: storedRole,
      token,
      expires_at: expiresAt,
      invited_by: user.id,
    })
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .single<OrganizationInviteRow>()

  if (insertError || !createdInvite) {
    return { error: insertError?.message ?? "Unable to create invite." }
  }

  return { ok: true, invite: mapOrganizationInviteRow(createdInvite) }
}

export async function revokeOrganizationInviteActionImpl(
  inviteId: string,
): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const inviteContext = await resolveInvitePermissionContext(supabase, user.id)
  if ("error" in inviteContext) return { error: inviteContext.error }
  if (!inviteContext.canInvite) {
    return { error: "You don’t have permission to manage invites." }
  }

  const { error: deleteError } = await supabase
    .from("organization_invites")
    .delete()
    .eq("id", inviteId)
    .eq("org_id", inviteContext.orgId)

  if (deleteError) return { error: "Unable to revoke invite." }
  return { ok: true }
}

export async function acceptOrganizationInviteActionImpl(
  token: string,
): Promise<AcceptInviteResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

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
    .select("id, org_id, email, role, token, expires_at, accepted_at")
    .eq("token", normalizedToken)
    .maybeSingle<{
      id: string
      org_id: string
      email: string
      role: string
      token: string
      expires_at: string
      accepted_at: string | null
    }>()

  if (inviteError || !invite) return { error: "Invite not found." }
  const inviteKind = parseInviteKindFromToken(invite.token)

  if (!isOrganizationMemberRole(invite.role) || invite.role === "owner") {
    return { error: "Invalid invite role." }
  }
  const inviteRole = invite.role

  if (invite.accepted_at) {
    return { ok: true, orgId: invite.org_id, role: inviteRole, inviteKind }
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: "This invite link has expired." }
  }

  const normalizedInviteEmail = normalizeEmail(invite.email)
  const normalizedUserEmail = normalizeEmail(email)
  if (normalizedInviteEmail !== normalizedUserEmail) {
    return { error: "This invite was sent to a different email address." }
  }

  const now = new Date().toISOString()

  const { error: upsertError } = await adminClient
    .from("organization_memberships")
    .upsert(
      {
        org_id: invite.org_id,
        member_id: user.id,
        role: inviteRole,
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
    await ensureInvitedMemberInOrgDirectory({
      adminClient,
      orgId: invite.org_id,
      role: inviteRole,
      inviteKind,
      user,
      email,
    })
  } catch {}

  return { ok: true, orgId: invite.org_id, role: inviteRole, inviteKind }
}
