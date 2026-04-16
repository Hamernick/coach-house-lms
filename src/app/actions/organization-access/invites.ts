import { createNotification } from "@/lib/notifications"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { buildOrganizationAccessRequestNotificationMetadata } from "@/features/organization-access"
import {
  ensureInvitedMemberInOrgDirectory,
  mapOrganizationAccessRequestRow,
  mapOrganizationInviteRow,
  resolveInvitePermissionContext,
  resolveOrganizationAccessNotificationDescription,
  resolveOrganizationAccessNotificationTitle,
  resolveOrganizationName,
  resolveProfileSummaries,
  type OrganizationAccessRequestRow,
  type OrganizationInviteRow,
} from "./invites-helpers"
import {
  archiveAccessRequestNotifications,
  expiresInSevenDays,
  resolveAppOrigin,
  resolveDisplayName,
  sendExistingUserAccessRequestEmail,
  sendExternalOrganizationInviteEmail,
} from "./invites-side-effects"
import {
  createInviteToken,
  findUserByEmail,
  getAuthenticatedUser,
  INVITE_ROLES,
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
    return { error: "You do not have permission to invite teammates." }
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
  const readClient = adminClient ?? supabase
  const writeClient = adminClient ?? supabase

  const existingUser = await findUserByEmail(normalizedEmail)
  const [existingMemberByEmailResult, existingMemberByUserResult, organizationName, profileSummaries] =
    await Promise.all([
      readClient
        .from("organization_memberships")
        .select("member_id")
        .eq("org_id", inviteContext.orgId)
        .eq("member_email", normalizedEmail)
        .maybeSingle<{ member_id: string }>(),
      existingUser
        ? readClient
            .from("organization_memberships")
            .select("member_id")
            .eq("org_id", inviteContext.orgId)
            .eq("member_id", existingUser.id)
            .maybeSingle<{ member_id: string }>()
        : Promise.resolve({ data: null, error: null }),
      resolveOrganizationName(readClient, inviteContext.orgId),
      resolveProfileSummaries(readClient, [user.id, existingUser?.id ?? ""]),
    ])

  const inviterSummary = profileSummaries.get(user.id)
  const inviterName = resolveDisplayName(
    inviterSummary?.fullName,
    normalizeEmail(resolveUserEmail(user) ?? "Coach House teammate"),
  )

  if (
    existingMemberByEmailResult.data ||
    existingMemberByUserResult.data ||
    existingUser?.id === inviteContext.orgId
  ) {
    return { error: "That email is already a member of your organization." }
  }

  const origin = await resolveAppOrigin()
  const nowIso = new Date().toISOString()

  if (existingUser?.id) {
    await writeClient
      .from("organization_access_requests")
      .update({ status: "expired", responded_at: nowIso })
      .eq("org_id", inviteContext.orgId)
      .eq("invitee_user_id", existingUser.id)
      .eq("status", "pending")
      .lt("expires_at", nowIso)

    const { data: pendingRequest, error: pendingRequestError } = await writeClient
      .from("organization_access_requests")
      .select(
        "id, org_id, invitee_user_id, invitee_email, role, status, invited_by_user_id, organization_invite_id, message, responded_at, expires_at, created_at",
      )
      .eq("org_id", inviteContext.orgId)
      .eq("invitee_user_id", existingUser.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<OrganizationAccessRequestRow>()

    if (pendingRequestError) return { error: "Unable to validate access requests." }

    const nextExpiresAt = expiresInSevenDays()
    const requestRole = inviteKind === "funder" ? "member" : role

    const { data: requestRow, error: requestError } = pendingRequest
      ? await writeClient
          .from("organization_access_requests")
          .update({
            invitee_email: normalizedEmail,
            role: requestRole,
            invited_by_user_id: user.id,
            expires_at: nextExpiresAt,
            responded_at: null,
            message: null,
          })
          .eq("id", pendingRequest.id)
          .select(
            "id, org_id, invitee_user_id, invitee_email, role, status, invited_by_user_id, organization_invite_id, message, responded_at, expires_at, created_at",
          )
          .single<OrganizationAccessRequestRow>()
      : await writeClient
          .from("organization_access_requests")
          .insert({
            org_id: inviteContext.orgId,
            invitee_user_id: existingUser.id,
            invitee_email: normalizedEmail,
            role: requestRole,
            invited_by_user_id: user.id,
            expires_at: nextExpiresAt,
          })
          .select(
            "id, org_id, invitee_user_id, invitee_email, role, status, invited_by_user_id, organization_invite_id, message, responded_at, expires_at, created_at",
          )
          .single<OrganizationAccessRequestRow>()

    if (requestError || !requestRow) {
      return { error: requestError?.message ?? "Unable to create access request." }
    }

    if (adminClient) {
      await archiveAccessRequestNotifications({
        adminClient,
        requestId: requestRow.id,
        userId: existingUser.id,
      })
    }

    await createNotification((adminClient ?? supabase) as never, {
      userId: existingUser.id,
      orgId: inviteContext.orgId,
      actorId: user.id,
      type: "organization_access_request",
      tone: "info",
      href: `/access-requests?request=${encodeURIComponent(requestRow.id)}`,
      title: resolveOrganizationAccessNotificationTitle(organizationName),
      description: resolveOrganizationAccessNotificationDescription({
        inviterName,
        role: requestRole,
      }),
      metadata: {
        ...buildOrganizationAccessRequestNotificationMetadata({
          requestId: requestRow.id,
          organizationName,
          inviterName,
          role: requestRole,
          status: "pending",
        }),
        orgId: inviteContext.orgId,
        inviteeUserId: existingUser.id,
      },
    })

    const request = mapOrganizationAccessRequestRow({
      request: requestRow,
      organizationName,
      inviteeName: resolveDisplayName(
        profileSummaries.get(existingUser.id)?.fullName,
        normalizedEmail,
      ),
      inviterName,
    })

    const emailResult = await sendExistingUserAccessRequestEmail({
      to: normalizedEmail,
      siteUrl: origin,
      organizationName,
      inviterName,
      role: requestRole,
      reviewUrl: `${origin}/access-requests?request=${encodeURIComponent(request.id)}`,
      expiresAt: request.expiresAt,
    })

    return {
      ok: true,
      outcome: pendingRequest
        ? "existing_user_request_resent"
        : "existing_user_request_created",
      request,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? null : emailResult.error,
    }
  }

  const { data: existingInvite, error: inviteCheckError } = await writeClient
    .from("organization_invites")
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .eq("org_id", inviteContext.orgId)
    .eq("email", normalizedEmail)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<OrganizationInviteRow>()

  if (inviteCheckError) return { error: "Unable to validate invites." }

  const inviteRole = inviteKind === "funder" ? "member" : role
  const nextExpiresAt = expiresInSevenDays()
  let inviteRow: OrganizationInviteRow | null = null
  let inviteOutcome: "external_invite_sent" | "external_invite_resent" =
    "external_invite_sent"

  if (existingInvite) {
    const nextToken =
      new Date(existingInvite.expires_at).getTime() < Date.now()
        ? createInviteToken(inviteKind)
        : existingInvite.token

    const { data: updatedInvite, error: updateError } = await writeClient
      .from("organization_invites")
      .update({
        role: inviteRole,
        token: nextToken,
        expires_at: nextExpiresAt,
        invited_by: user.id,
      })
      .eq("id", existingInvite.id)
      .select("id, email, role, token, expires_at, accepted_at, created_at")
      .single<OrganizationInviteRow>()

    if (updateError || !updatedInvite) {
      return { error: updateError?.message ?? "Unable to refresh invite." }
    }

    inviteRow = updatedInvite
    inviteOutcome = "external_invite_resent"
  } else {
    const token = createInviteToken(inviteKind)
    const { data: createdInvite, error: insertError } = await writeClient
      .from("organization_invites")
      .insert({
        org_id: inviteContext.orgId,
        email: normalizedEmail,
        role: inviteRole,
        token,
        expires_at: nextExpiresAt,
        invited_by: user.id,
      })
      .select("id, email, role, token, expires_at, accepted_at, created_at")
      .single<OrganizationInviteRow>()

    if (insertError || !createdInvite) {
      return { error: insertError?.message ?? "Unable to create invite." }
    }

    inviteRow = createdInvite
  }

  const invite = mapOrganizationInviteRow(inviteRow)
  const inviteUrl = `${origin}/join-organization?token=${invite.token}`
  const emailResult = await sendExternalOrganizationInviteEmail({
    to: normalizedEmail,
    siteUrl: origin,
    organizationName,
    inviterName,
    role: inviteRole,
    inviteUrl,
    expiresAt: invite.expiresAt,
  })

  return {
    ok: true,
    outcome: inviteOutcome,
    invite,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? null : emailResult.error,
  }
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
    return { error: "You do not have permission to manage invites." }
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
