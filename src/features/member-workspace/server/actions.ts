"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { writeActiveOrganizationCookie } from "@/lib/organization/active-org-cookie"
import type { MemberWorkspaceSetActiveOrganizationResult } from "../types"
import { loadAccessibleOrganizations } from "./load-accessible-organizations"
import { cookies } from "next/headers"
import { hasWorkspaceSupportAccess, SUPPORT_ORGANIZATION_COOKIE } from "@/lib/organization/support-access"

export async function setActiveOrganizationAction(
  orgId: string
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

  const accessibleOrganizations = await loadAccessibleOrganizations(
    supabase,
    user.id
  )
  let organization = accessibleOrganizations.find(
    (entry) => entry.orgId === normalizedOrgId
  )

  if (!organization && await hasWorkspaceSupportAccess(supabase)) {
    const { data, error } = await supabase.rpc("search_workspace_support_organizations" as never,
      { p_query: "", p_org: normalizedOrgId } as never)
    if (error) return { error: "Unable to verify workspace support access." }
    const row = (data as unknown as Array<{ org_id: string; name: string; image_url: string | null; public_slug: string | null }> | null)?.[0]
    if (row) organization = { orgId: row.org_id, role: "admin", supportAccess: true,
      name: row.name, imageUrl: row.image_url, publicSlug: row.public_slug }
  }

  if (!organization) {
    return { error: "You do not have access to that organization." }
  }

  if (organization.orgId !== user.id && await hasWorkspaceSupportAccess(supabase)) organization.supportAccess = true

  if (organization.supportAccess) {
    const { error } = await supabase.rpc("record_workspace_support_entry" as never, { p_org: organization.orgId } as never)
    if (error) return { error: "Unable to record support access. Please try again." }
  }
  await writeActiveOrganizationCookie(organization.orgId)
  const cookieStore = await cookies()
  cookieStore.set(SUPPORT_ORGANIZATION_COOKIE, organization.supportAccess ? organization.orgId : "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
    maxAge: organization.supportAccess ? 60 * 60 * 8 : 0,
  })
  revalidatePath("/admin")
  revalidatePath("/my-organization")
  revalidatePath("/organization")
  revalidatePath("/organization/documents")
  revalidatePath("/workspace")
  revalidatePath("/organizations")
  revalidatePath("/tasks")
  revalidatePath("/people")
  return { ok: true, orgId: organization.orgId, supportAccess: organization.supportAccess }
}
