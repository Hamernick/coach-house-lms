import { COACH_HOUSE_ORGANIZATION_NAME } from "../lib/project-organization"
import type { MemberWorkspaceCreateProjectFormInput } from "../types"
import { actorCanAccessOrganization, actorCanAccessOrganizations } from "./member-workspace-actor-permissions"
import type { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"

export async function resolveProjectCreateOrgId({
  actor,
  input,
}: {
  actor: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>
  input: MemberWorkspaceCreateProjectFormInput
}): Promise<{ ok: true; orgId: string } | { error: string }> {
  if (actorCanAccessOrganizations(actor)) {
    let orgId = input.orgId?.trim()
    if (!orgId) {
      const { data } = await actor.supabase.from("organizations")
        .select("user_id").eq("profile->>name", COACH_HOUSE_ORGANIZATION_NAME)
        .maybeSingle<{ user_id: string }>()
      orgId = data?.user_id
      if (!orgId) return { error: "Coach House is not available for this project." }
    }
    if (!actorCanAccessOrganization(actor, orgId)) {
      return { error: "You do not have access to that organization." }
    }

    const { data, error } = await actor.supabase
      .from("organizations")
      .select("user_id")
      .eq("user_id", orgId)
      .maybeSingle<{ user_id: string }>()

    if (error || !data) {
      return { error: "Choose a valid organization for the project." }
    }

    return { ok: true, orgId }
  }

  if (!actor.canEdit) {
    return { error: "Only organization editors can create projects." }
  }

  const requestedOrgId = input.orgId?.trim()
  if (requestedOrgId && requestedOrgId !== actor.activeOrg.orgId) {
    return {
      error: "You can only create projects for the active organization.",
    }
  }

  return { ok: true, orgId: actor.activeOrg.orgId }
}
