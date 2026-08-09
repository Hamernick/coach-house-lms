import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function transitionOrganizationProjectDeletion({
  actorId,
  expectedOrgId,
  expectedUpdatedAt,
  projectId,
}: {
  actorId: string
  expectedOrgId: string
  expectedUpdatedAt: string
  projectId: string
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "delete_organization_project_transition",
    {
      p_actor_id: actorId,
      p_expected_org_id: expectedOrgId,
      p_expected_updated_at: expectedUpdatedAt,
      p_project_id: projectId,
    }
  )

  if (error) {
    const record = error as Record<string, unknown>
    const missing =
      record.code === "42883" ||
      record.code === "PGRST202" ||
      (typeof record.message === "string" &&
        record.message.includes("delete_organization_project_transition"))
    return missing
      ? {
          error:
            "Organizations are not available until the latest workspace database migrations are applied.",
        }
      : { error: "Unable to delete organization." }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { error: "Unable to delete organization." }
  }
  const result = data as Record<string, unknown>
  if (result.ok === true && typeof result.projectId === "string") {
    return { ok: true as const, projectId: result.projectId }
  }
  if (result.ok !== false || typeof result.code !== "string") {
    return { error: "Unable to delete organization." }
  }
  if (result.code === "stale" || result.code === "scope_changed") {
    return { error: "This project changed. Refresh before deleting it." }
  }
  if (result.code === "canonical") {
    return {
      error:
        "Canonical organization records cannot be deleted from this screen.",
    }
  }
  if (result.code === "not_found") {
    return { error: "Unable to find that organization." }
  }
  return { error: "Unable to delete organization." }
}
