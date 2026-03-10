import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  getAuthenticatedUser,
  INVITE_ROLES,
  resolveOrganizationActorContext,
  resolvePaidTeamAccessForOrg,
  TEAM_ACCESS_UPGRADE_MESSAGE,
} from "./shared"
import type {
  OrganizationAccessResult,
  OrganizationMemberRole,
} from "./shared"

export async function removeOrganizationMemberActionImpl(
  memberId: string,
): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const { orgId } = await resolveOrganizationActorContext(supabase, user.id)
  if (orgId !== user.id) {
    return { error: "Only the organization owner can manage members." }
  }
  if (memberId === orgId) {
    return { error: "You can’t remove the organization owner." }
  }

  const { error: deleteError } = await supabase
    .from("organization_memberships")
    .delete()
    .eq("org_id", orgId)
    .eq("member_id", memberId)

  if (deleteError) return { error: "Unable to remove member." }
  return { ok: true }
}

export async function updateOrganizationMemberRoleActionImpl({
  memberId,
  role,
}: {
  memberId: string
  role: OrganizationMemberRole
}): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const { orgId } = await resolveOrganizationActorContext(supabase, user.id)
  if (orgId !== user.id) {
    return { error: "Only the organization owner can manage members." }
  }
  const paidAccess = await resolvePaidTeamAccessForOrg(supabase, orgId)
  if ("error" in paidAccess) return { error: paidAccess.error }
  if (!paidAccess.hasPaidTeamAccess) return { error: TEAM_ACCESS_UPGRADE_MESSAGE }
  if (memberId === orgId) {
    return { error: "You can’t change the organization owner role." }
  }
  if (!INVITE_ROLES.includes(role)) return { error: "Invalid role." }

  const { error: updateError } = await supabase
    .from("organization_memberships")
    .update({ role })
    .eq("org_id", orgId)
    .eq("member_id", memberId)

  if (updateError) return { error: "Unable to update role." }
  return { ok: true }
}

export async function setOrganizationMemberTesterFlagActionImpl({
  memberId,
  isTester,
}: {
  memberId: string
  isTester: boolean
}): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  if (profileRow?.role !== "admin") {
    return { error: "Only platform admins can change tester access." }
  }

  const { orgId } = await resolveOrganizationActorContext(supabase, user.id)
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("member_id")
    .eq("org_id", orgId)
    .eq("member_id", memberId)
    .maybeSingle<{ member_id: string }>()

  const memberIsInOrg = membership?.member_id === memberId || memberId === orgId
  if (!memberIsInOrg) return { error: "Member not found in this organization." }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_tester: Boolean(isTester) })
    .eq("id", memberId)

  if (updateError) return { error: "Unable to update tester access." }
  return { ok: true }
}
