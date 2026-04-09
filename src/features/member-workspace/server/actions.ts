"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { writeActiveOrganizationCookie } from "@/lib/organization/active-org-cookie"
import type { MemberWorkspaceSetActiveOrganizationResult } from "../types"
import { loadAccessibleOrganizations } from "./load-accessible-organizations"

export async function setActiveOrganizationAction(
  orgId: string,
): Promise<MemberWorkspaceSetActiveOrganizationResult> {
  const normalizedOrgId = orgId.trim()
  if (!normalizedOrgId) {
    return { error: "Choose an organization." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated." }
  }

  const accessibleOrganizations = await loadAccessibleOrganizations(supabase, user.id)
  const organization = accessibleOrganizations.find((entry) => entry.orgId === normalizedOrgId)

  if (!organization) {
    return { error: "You do not have access to that organization." }
  }

  await writeActiveOrganizationCookie(organization.orgId)
  return { ok: true, orgId: organization.orgId }
}
