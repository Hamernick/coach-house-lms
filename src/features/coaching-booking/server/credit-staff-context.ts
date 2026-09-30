import "server-only"

import { requirePlatformCapability } from "@/lib/admin/auth"
import { loadOrganizationCoachActorScope } from "@/lib/admin/organization-coach-scope"
import { canAccessOrganizationInCoachScope } from "@/lib/organization-coach-scope"
import { createSupabaseAdminClient } from "@/lib/supabase"
import type { CoachingCreditPerson } from "../credit-types"

export async function resolveCoachingCreditStaffContext(orgId: string) {
  const actor = await requirePlatformCapability("organizations")
  const scope = await loadOrganizationCoachActorScope({
    accessLevel: actor.accessLevel,
    userId: actor.userId,
  })
  if (!canAccessOrganizationInCoachScope(scope, orgId))
    throw new Error("Organization not available.")
  const admin = createSupabaseAdminClient()
  const [org, memberships] = await Promise.all([
    admin
      .from("organizations")
      .select("user_id")
      .eq("user_id", orgId)
      .maybeSingle(),
    admin
      .from("organization_memberships")
      .select("member_id", { count: "exact" })
      .eq("org_id", orgId),
  ])
  if (
    org.error ||
    !org.data ||
    memberships.error ||
    memberships.count !== memberships.data?.length
  ) {
    throw new Error("Unable to load organization members.")
  }
  const ids = Array.from(
    new Set([orgId, ...memberships.data.map((row) => row.member_id)])
  )
  const profiles = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids)
  if (profiles.error) throw new Error("Unable to load credit recipients.")
  const people: CoachingCreditPerson[] = (profiles.data ?? []).map((row) => ({
    id: row.id,
    name: row.full_name || row.email || "Member",
    email: row.email,
  }))
  return { admin, actorId: actor.userId, people }
}
