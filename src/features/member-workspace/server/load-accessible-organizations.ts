import type { SupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"

import type { Database } from "@/lib/supabase"
import type { OrganizationMemberRole } from "@/lib/organization/active-org"
import type { MemberWorkspaceAccessibleOrganization } from "../types"

function readProfileString(
  profile: Record<string, unknown> | null | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = profile?.[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }
  return null
}

function normalizeMembershipRole(role: string | null | undefined): OrganizationMemberRole {
  if (role === "owner") return "owner"
  if (role === "admin") return "admin"
  if (role === "staff") return "staff"
  if (role === "board") return "board"
  return "member"
}

function rolePriority(role: OrganizationMemberRole) {
  if (role === "owner") return 0
  if (role === "admin") return 1
  if (role === "staff") return 2
  if (role === "board") return 3
  return 4
}

const loadAccessibleOrganizationsCached = cache(async (
  supabase: SupabaseClient<Database, "public">,
  userId: string,
): Promise<MemberWorkspaceAccessibleOrganization[]> => {
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("org_id, role")
    .eq("member_id", userId)
    .returns<Array<{ org_id: string; role: string | null }>>()

  const membershipRows = memberships ?? []
  const organizationIds = [...new Set([userId, ...membershipRows.map((membership) => membership.org_id)])]
  const membershipByOrgId = new Map(
    membershipRows.map((membership) => [membership.org_id, membership] as const),
  )

  const { data: organizations } = await supabase
    .from("organizations")
    .select("user_id, public_slug, profile")
    .in("user_id", organizationIds)
    .returns<Array<{ user_id: string; public_slug: string | null; profile: Record<string, unknown> | null }>>()

  const organizationMap = new Map(
    (organizations ?? []).map((organization) => [organization.user_id, organization]),
  )

  const accessibleOrganizations = organizationIds.map<MemberWorkspaceAccessibleOrganization>((orgId) => {
    const membership = membershipByOrgId.get(orgId)
    const role: OrganizationMemberRole = orgId === userId ? "owner" : normalizeMembershipRole(membership?.role)
    const organization = organizationMap.get(orgId)
    const rawName = readProfileString(organization?.profile, "name") ?? ""
    const imageUrl =
      readProfileString(organization?.profile, "logoUrl", "logo_url") ??
      readProfileString(organization?.profile, "brandMarkUrl", "brand_mark_url") ??
      null

    return {
      orgId,
      role,
      name:
        rawName.length > 0
          ? rawName
          : orgId === userId
            ? "My organization"
            : "Coach House organization",
      publicSlug:
        typeof organization?.public_slug === "string" && organization.public_slug.trim().length > 0
          ? organization.public_slug.trim()
          : null,
      imageUrl,
    }
  })

  return accessibleOrganizations.sort((left, right) => {
    const roleDiff = rolePriority(left.role) - rolePriority(right.role)
    if (roleDiff !== 0) return roleDiff
    return left.name.localeCompare(right.name)
  })
})

export async function loadAccessibleOrganizations(
  supabase: SupabaseClient<Database, "public">,
  userId: string,
): Promise<MemberWorkspaceAccessibleOrganization[]> {
  return loadAccessibleOrganizationsCached(supabase, userId)
}
