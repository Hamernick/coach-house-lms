import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  getAuthenticatedUser,
  resolveOrganizationActorContext,
  resolvePaidTeamAccessForOrg,
  TEAM_ACCESS_UPGRADE_MESSAGE,
} from "./shared"
import type { OrganizationAccessResult } from "./shared"

async function resolveOwnerWithPaidAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<{ orgId: string } | { error: string }> {
  const { orgId } = await resolveOrganizationActorContext(supabase, userId)
  if (orgId !== userId) {
    return { error: "Only the organization owner can change this setting." }
  }
  const paidAccess = await resolvePaidTeamAccessForOrg(supabase, orgId)
  if ("error" in paidAccess) return { error: paidAccess.error }
  if (!paidAccess.hasPaidTeamAccess) return { error: TEAM_ACCESS_UPGRADE_MESSAGE }
  return { orgId }
}

export async function setOrganizationAdminsCanInviteActionImpl(
  next: boolean,
): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const permission = await resolveOwnerWithPaidAccess(supabase, user.id)
  if ("error" in permission) return { error: permission.error }

  const { error: upsertError } = await supabase
    .from("organization_access_settings")
    .upsert(
      { org_id: permission.orgId, admins_can_invite: Boolean(next) },
      { onConflict: "org_id" },
    )

  if (upsertError) return { error: upsertError.message ?? "Unable to update setting." }
  return { ok: true }
}

export async function setOrganizationStaffCanManageCalendarActionImpl(
  next: boolean,
): Promise<OrganizationAccessResult> {
  const supabase = await createSupabaseServerClient()
  const authResult = await getAuthenticatedUser(supabase)
  if ("error" in authResult) return { error: authResult.error }
  const user = authResult.user

  const permission = await resolveOwnerWithPaidAccess(supabase, user.id)
  if ("error" in permission) return { error: permission.error }

  const { error: upsertError } = await supabase
    .from("organization_access_settings")
    .upsert(
      { org_id: permission.orgId, staff_can_manage_calendar: Boolean(next) },
      { onConflict: "org_id" },
    )

  if (upsertError) return { error: upsertError.message ?? "Unable to update setting." }
  return { ok: true }
}
