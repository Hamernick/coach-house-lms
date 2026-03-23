import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  ensureInvitedMemberInOrgDirectory,
  mapOrganizationAccessRequestRow,
  resolveInvitePermissionContext,
  resolveProfileSummaries,
  type OrganizationAccessRequestRow,
} from "./invites-helpers"
import {
  getAuthenticatedUser,
  isOrganizationMemberRole,
  resolveUserEmail,
  type ListOrganizationAccessRequestsResult,
  type OrganizationAccessResult,
  type RespondToOrganizationAccessRequestResult,
} from "./shared"

async function resolveOrganizationNamesMap(
  client: ReturnType<typeof createSupabaseAdminClient> | Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orgIds: string[],
) {
  const dedupedOrgIds = [...new Set(orgIds.filter(Boolean))]
  if (dedupedOrgIds.length === 0) return new Map<string, string>()

  const { data } = await client
    .from("organizations")
    .select("user_id, profile")
    .in("user_id", dedupedOrgIds)
    .returns<Array<{ user_id: string; profile: Record<string, unknown> | null }>>()

  return new Map(
    (data ?? []).map((row) => {
      const rawName = typeof row.profile?.name === "string" ? row.profile.name.trim() : ""
      return [row.user_id, rawName.length > 0 ? rawName : "Coach House organization"]
    }),
  )
}

async function archiveAccessRequestNotifications({
  adminClient,
  requestId,
  userId,
}: {
  adminClient: ReturnType<typeof createSupabaseAdminClient>
  requestId: string
  userId: string
}) {
  await adminClient
    .from("notifications")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("type", "organization_access_request")
    .contains("metadata", { requestId })
}

export async function listMyOrganizationAccessRequestsActionImpl(): Promise<ListOrganizationAccessRequestsResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const { data: requestRows, error } = await supabase
    .from("organization_access_requests")
    .select(
      "id, org_id, invitee_user_id, invitee_email, role, status, invited_by_user_id, organization_invite_id, message, responded_at, expires_at, created_at",
    )
    .eq("invitee_user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrganizationAccessRequestRow[]>()

  if (error) return { error: "Unable to load access requests." }

  const inviterIds = (requestRows ?? [])
    .map((request) => request.invited_by_user_id)
    .filter((value): value is string => Boolean(value))

  const [organizationNames, profileSummaries] = await Promise.all([
    resolveOrganizationNamesMap(
      supabase,
      (requestRows ?? []).map((request) => request.org_id),
    ),
    resolveProfileSummaries(supabase, inviterIds),
  ])

  return {
    ok: true,
    requests: (requestRows ?? []).map((request) =>
      mapOrganizationAccessRequestRow({
        request,
        organizationName:
          organizationNames.get(request.org_id) ?? "Coach House organization",
        inviteeName: null,
        inviterName: request.invited_by_user_id
          ? profileSummaries.get(request.invited_by_user_id)?.fullName ??
            profileSummaries.get(request.invited_by_user_id)?.email ??
            "Coach House teammate"
          : "Coach House teammate",
      }),
    ),
  }
}

async function respondToOrganizationAccessRequest({
  requestId,
  nextStatus,
}: {
  requestId: string
  nextStatus: "accepted" | "declined"
}): Promise<RespondToOrganizationAccessRequestResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user
  const email = resolveUserEmail(user)
  if (!email) return { error: "Your account does not have an email address." }

  let adminClient: ReturnType<typeof createSupabaseAdminClient>
  try {
    adminClient = createSupabaseAdminClient()
  } catch {
    return { error: "Organization access is not configured on this environment." }
  }

  const { data: requestRow, error: requestError } = await adminClient
    .from("organization_access_requests")
    .select(
      "id, org_id, invitee_user_id, invitee_email, role, status, invited_by_user_id, organization_invite_id, message, responded_at, expires_at, created_at",
    )
    .eq("id", requestId)
    .maybeSingle<OrganizationAccessRequestRow>()

  if (requestError || !requestRow) {
    return { error: "Access request not found." }
  }
  if (requestRow.invitee_user_id !== user.id) {
    return { error: "You do not have permission to respond to this request." }
  }

  if (requestRow.status !== "pending") {
    return {
      error:
        requestRow.status === "accepted"
          ? "This request was already accepted."
          : requestRow.status === "declined"
            ? "This request was already declined."
            : "This request is no longer active.",
    }
  }

  if (new Date(requestRow.expires_at).getTime() < Date.now()) {
    await adminClient
      .from("organization_access_requests")
      .update({
        status: "expired",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestRow.id)
    return { error: "This request has expired." }
  }

  if (!isOrganizationMemberRole(requestRow.role) || requestRow.role === "owner") {
    return { error: "Invalid request role." }
  }

  const nowIso = new Date().toISOString()

  if (nextStatus === "accepted") {
    const normalizedEmail = email.trim().toLowerCase()
    const { error: membershipError } = await adminClient
      .from("organization_memberships")
      .upsert(
        {
          org_id: requestRow.org_id,
          member_id: user.id,
          role: requestRow.role,
          member_email: normalizedEmail,
          created_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "org_id,member_id" },
      )

    if (membershipError) {
      return { error: "Unable to grant organization access." }
    }

    try {
      await ensureInvitedMemberInOrgDirectory({
        adminClient,
        orgId: requestRow.org_id,
        role: requestRow.role,
        inviteKind: "standard",
        user,
        email,
      })
    } catch {}
  }

  const { error: updateError } = await adminClient
    .from("organization_access_requests")
    .update({
      status: nextStatus,
      responded_at: nowIso,
    })
    .eq("id", requestRow.id)

  if (updateError) {
    return { error: "Unable to update access request." }
  }

  await archiveAccessRequestNotifications({
    adminClient,
    requestId: requestRow.id,
    userId: user.id,
  })

  return {
    ok: true,
    orgId: requestRow.org_id,
    status: nextStatus,
  }
}

export async function acceptOrganizationAccessRequestActionImpl(
  requestId: string,
): Promise<RespondToOrganizationAccessRequestResult> {
  return respondToOrganizationAccessRequest({ requestId, nextStatus: "accepted" })
}

export async function declineOrganizationAccessRequestActionImpl(
  requestId: string,
): Promise<RespondToOrganizationAccessRequestResult> {
  return respondToOrganizationAccessRequest({ requestId, nextStatus: "declined" })
}

export async function revokeOrganizationAccessRequestActionImpl(
  requestId: string,
): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }

  const inviteContext = await resolveInvitePermissionContext(supabase, authResult.user.id)
  if ("error" in inviteContext) return { error: inviteContext.error }
  if (!inviteContext.canInvite) {
    return { error: "You do not have permission to manage requests." }
  }

  const { error } = await supabase
    .from("organization_access_requests")
    .update({
      status: "revoked",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("org_id", inviteContext.orgId)
    .eq("status", "pending")

  if (error) return { error: "Unable to revoke access request." }
  return { ok: true }
}
