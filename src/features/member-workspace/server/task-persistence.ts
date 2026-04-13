import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  ensureStarterProjectsForOrg,
  loadOrganizationProjectStarterIdMap,
} from "./project-persistence"
import {
  buildStarterOrganizationTaskAssignees,
  buildStarterOrganizationTasks,
} from "./task-starter-data"
import { loadTaskProjectScope } from "./task-project-scope"
import {
  isMissingOrganizationProjectsTableError,
  isMissingOrganizationTaskAssigneesTableError,
  isMissingOrganizationTasksTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function ensureStarterTasksForOrg({
  canEdit,
  orgId,
  userId,
  supabase,
}: {
  canEdit: boolean
  orgId: string
  userId: string
  supabase: ServerSupabaseClient
}) {
  if (!canEdit) {
    return
  }

  await ensureStarterProjectsForOrg({
    canEdit,
    orgId,
    userId,
    supabase,
  })

  const { projectIds } = await loadTaskProjectScope({
    orgId,
    supabase,
  })

  if (projectIds.size === 0) {
    return
  }

  const { count, error: existingTasksError } = await supabase
    .from("organization_tasks")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .in("project_id", Array.from(projectIds))

  if (existingTasksError) {
    if (isMissingOrganizationTasksTableError(existingTasksError)) return
    throw toMemberWorkspaceDataError(
      existingTasksError,
      "Unable to load workspace tasks.",
    )
  }

  if ((count ?? 0) > 0) {
    return
  }

  const projectIdByStarterKey = await loadOrganizationProjectStarterIdMap({
    orgId,
    supabase,
  })

  if (projectIdByStarterKey.size === 0) {
    return
  }

  const starterTasks = buildStarterOrganizationTasks({
    orgId,
    actorId: userId,
    projectIdByStarterKey,
  })

  if (starterTasks.length === 0) {
    return
  }

  const { data: upsertedTasks, error: upsertTasksError } = await supabase
    .from("organization_tasks")
    .upsert(starterTasks, { onConflict: "org_id,starter_seed_key" })
    .select("id, starter_seed_key")
    .returns<Array<{ id: string; starter_seed_key: string | null }>>()

  if (upsertTasksError) {
    if (isMissingOrganizationTasksTableError(upsertTasksError)) return
    if (isMissingOrganizationProjectsTableError(upsertTasksError)) return
    throw toMemberWorkspaceDataError(
      upsertTasksError,
      "Unable to initialize workspace tasks.",
    )
  }

  const taskIdByStarterKey = new Map<string, string>()
  for (const row of upsertedTasks ?? []) {
    if (!row.starter_seed_key) continue
    taskIdByStarterKey.set(row.starter_seed_key, row.id)
  }

  const starterAssignees = buildStarterOrganizationTaskAssignees({
    orgId,
    actorId: userId,
    assigneeUserId: userId,
    taskIdByStarterKey,
  })

  if (starterAssignees.length === 0) {
    return
  }

  const { error: upsertAssigneesError } = await supabase
    .from("organization_task_assignees")
    .upsert(starterAssignees, { onConflict: "task_id,user_id" })

  if (upsertAssigneesError) {
    if (isMissingOrganizationTaskAssigneesTableError(upsertAssigneesError)) {
      return
    }
    throw toMemberWorkspaceDataError(
      upsertAssigneesError,
      "Unable to initialize workspace task assignments.",
    )
  }
}
