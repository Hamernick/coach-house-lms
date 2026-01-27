import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

export type OrganizationMemberRole = "owner" | "admin" | "staff" | "board" | "member"

export type ActiveOrganization = {
  orgId: string
  role: OrganizationMemberRole
}

export function canEditOrganization(role: OrganizationMemberRole) {
  return role === "owner" || role === "admin" || role === "staff"
}

export async function resolveActiveOrganization(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ActiveOrganization> {
  const baseQuery = supabase
    .from("organization_memberships")
    .select("org_id, role, created_at")
    .eq("member_id", userId)
  const orderedQuery =
    typeof (baseQuery as any).order === "function" ? (baseQuery as any).order("created_at", { ascending: true }) : baseQuery
  const limitedQuery = typeof (orderedQuery as any).limit === "function" ? (orderedQuery as any).limit(1) : orderedQuery
  const { data: membership } = await (limitedQuery as any).maybeSingle()

  if (membership?.org_id) {
    return {
      orgId: membership.org_id,
      role: membership.role ?? "member",
    }
  }

  return { orgId: userId, role: "owner" }
}
