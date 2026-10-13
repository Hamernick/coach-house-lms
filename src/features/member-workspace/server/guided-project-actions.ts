"use server"

import { resolveProjectCreateOrgId } from "./project-organization"
import { revalidatePath } from "next/cache"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  guidedProjectSchema,
  guidedProjectOverview,
  type GuidedProjectInput,
} from "../lib/guided-project"
import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import {
  actorCanAccessOrganizations,
} from "./member-workspace-actor-permissions"
import { loadMemberWorkspacePersonOptionsForOrganizations } from "./person-options"
import { buildProjectOverviewDocumentContent } from "./project-overview-documents"

export async function loadGuidedProjectPeople(organizationId: string) {
  const actor = await resolveMemberWorkspaceActorContext()
  const target = await resolveProjectCreateOrgId({ actor, input: {
    orgId: organizationId || null, name: "", status: "planned", priority: "medium",
  } })
  if ("error" in target) return target
  const people = await loadMemberWorkspacePersonOptionsForOrganizations({
    orgIds: actorCanAccessOrganizations(actor) ? [] : [target.orgId],
    supabase: actor.supabase,
    includePlatformAdmins: actorCanAccessOrganizations(actor),
  })
  return { people }
}

export async function createGuidedProjectAction(
  input: GuidedProjectInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const parsed = guidedProjectSchema.safeParse(input)
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the project details.",
    }
  const value = parsed.data
  const actor = await resolveMemberWorkspaceActorContext()
  const target = await resolveProjectCreateOrgId({ actor, input: {
    orgId: value.organizationId || null, name: value.name, status: "planned", priority: "medium",
  } })
  if ("error" in target) return target
  const people = await loadMemberWorkspacePersonOptionsForOrganizations({
    orgIds: actorCanAccessOrganizations(actor) ? [] : [target.orgId],
    supabase: actor.supabase,
    includePlatformAdmins: actorCanAccessOrganizations(actor),
  })
  const peopleById = new Map(people.map((person) => [person.id, person]))
  const memberIds = [...new Set([value.ownerId, ...value.contributorIds])]
  const assignedIds = [
    ...memberIds,
    ...value.tasks.flatMap((task) =>
      task.assigneeId ? [task.assigneeId] : []
    ),
  ]
  if (assignedIds.some((id) => !peopleById.has(id)))
    return {
      error:
        "One or more people are no longer available for this organization.",
    }
  const overview = buildProjectOverviewDocumentContent(
    guidedProjectOverview(value)
  )
  const { data, error } = await createSupabaseAdminClient().rpc(
    "create_guided_organization_project",
    {
      p_actor_id: actor.userId,
      p_org_id: target.orgId,
      p_request_id: value.requestId,
      p_setup: value,
      p_member_labels: memberIds.map((id) => peopleById.get(id)!.name),
      p_overview_html: overview.documentHtml,
      p_overview_text: overview.documentText,
    }
  )
  if (error)
    return {
      error:
        error.code === "PGRST202" || error.code === "42883"
          ? "Guided setup is not available until the project setup migration is applied."
          : "Project creation failed. Nothing was partially created; you can retry.",
    }
  const result = data as { ok?: boolean; projectId?: string } | null
  if (!result?.ok || !result.projectId)
    return { error: "Project creation could not be completed." }
  revalidatePath("/admin/dashboard")
  revalidatePath("/projects")
  revalidatePath("/organizations")
  revalidatePath("/tasks")
  return { ok: true, id: result.projectId }
}
