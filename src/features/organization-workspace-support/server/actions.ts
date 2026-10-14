"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { hasWorkspaceSupportAccess } from "@/lib/organization/support-access"
import { readOrganizationRequestScope } from "@/server/organization/request-scope"
import { organizationWorkspaceSupportEnabled } from "@/lib/feature-flags"
import type { MemberWorkspaceAccessibleOrganization } from "@/features/member-workspace"
import type { WorkspaceSupportParticipant, WorkspaceSupportPresenceInput } from "../types"

async function context() {
  if (!organizationWorkspaceSupportEnabled) throw new Error("Workspace support is not enabled.")
  const client = await createSupabaseServerClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) throw new Error("Sign in again to access this workspace.")
  return client
}

export async function searchSupportOrganizations(query: string): Promise<{ organizations: MemberWorkspaceAccessibleOrganization[]; error?: string }> {
  if (typeof query !== "string" || query.trim().length < 2) return { organizations: [] }
  try {
    const client = await context()
    const { data, error } = await client.rpc("search_workspace_support_organizations" as never, { p_query: query.trim().slice(0, 100) } as never)
    if (error) return { organizations: [], error: "Unable to search support workspaces." }
    return { organizations: ((data ?? []) as Array<{ org_id: string; name: string; image_url: string | null; public_slug: string | null }>).map((row) => ({
      orgId: row.org_id, name: row.name, role: "admin", imageUrl: row.image_url, publicSlug: row.public_slug, supportAccess: true,
    })) }
  } catch {
    return { organizations: [], error: "Workspace support access is unavailable." }
  }
}

export async function syncWorkspaceSupportPresence(input: WorkspaceSupportPresenceInput) {
  try {
    const client = await context()
    if ((await readOrganizationRequestScope())?.supportRequested && !await hasWorkspaceSupportAccess(client)) throw new Error("Support access revoked")
    const { data, error } = await client.rpc("sync_workspace_support_presence" as never, {
      p_org: input.organizationId, p_session: input.sessionId, p_path: input.path,
      p_position: input.position, p_editing: input.editing,
    } as never)
    if (error) throw error
    return { participants: data as unknown as WorkspaceSupportParticipant[] }
  } catch {
    return { error: "Live support presence is unavailable. Reopen the workspace before editing." }
  }
}

export async function leaveWorkspaceSupportPresence(organizationId: string, sessionId: string) {
  const client = await context()
  await client.rpc("leave_workspace_support_presence" as never, { p_org: organizationId, p_session: sessionId } as never)
}
