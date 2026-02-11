import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"

export type OrganizationMemberRole = "owner" | "admin" | "staff" | "board" | "member"

export type ActiveOrganization = {
  orgId: string
  role: OrganizationMemberRole
}

const ROLE_PRIORITY: Record<OrganizationMemberRole, number> = {
  owner: 0,
  admin: 1,
  staff: 2,
  board: 3,
  member: 4,
}

function normalizeRole(role: unknown): OrganizationMemberRole {
  if (role === "owner") return "owner"
  if (role === "admin") return "admin"
  if (role === "staff") return "staff"
  if (role === "board") return "board"
  return "member"
}

function createdAtValue(input: string | null | undefined) {
  if (!input) return Number.POSITIVE_INFINITY
  const parsed = Date.parse(input)
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY
}

export function canEditOrganization(role: OrganizationMemberRole) {
  return role === "owner" || role === "admin" || role === "staff"
}

export async function resolveActiveOrganization(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ActiveOrganization> {
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("org_id, role, created_at")
    .eq("member_id", userId)
    .returns<Array<{ org_id: string; role: string | null; created_at: string | null }>>()

  if (Array.isArray(memberships) && memberships.length > 0) {
    const sorted = [...memberships].sort((left, right) => {
      const roleDiff = ROLE_PRIORITY[normalizeRole(left.role)] - ROLE_PRIORITY[normalizeRole(right.role)]
      if (roleDiff !== 0) return roleDiff
      return createdAtValue(left.created_at) - createdAtValue(right.created_at)
    })
    const membership = sorted[0]
    return {
      orgId: membership.org_id,
      role: normalizeRole(membership.role),
    }
  }

  return { orgId: userId, role: "owner" }
}
