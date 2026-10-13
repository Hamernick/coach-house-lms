import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type CreateTaskTransitionResult =
  | { ok: true; projectId: string; taskId: string }
  | { code: string; ok: false }

type UpdateTaskTransitionResult =
  | {
      ok: true
      previousProjectId: string
      projectId: string
      taskId: string
    }
  | { code: string; ok: false }

type DeleteTaskTransitionResult =
  | { ok: true; projectId: string; taskId: string }
  | { code: string; ok: false }

type ReorderTaskTransitionResult =
  | { ok: true; projectId: string }
  | { code: string; ok: false }

function parseCreateTaskTransitionResult(
  value: unknown
): CreateTaskTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return { code: result.code, ok: false }
  }
  if (
    result.ok === true &&
    typeof result.projectId === "string" &&
    typeof result.taskId === "string"
  ) {
    return {
      ok: true,
      projectId: result.projectId,
      taskId: result.taskId,
    }
  }

  return null
}

function transitionFailure(code: string) {
  if (code === "project_not_found") return { error: "Choose a valid project." }
  if (code === "invalid_assignee") {
    return { error: "Choose a valid assignee." }
  }
  if (code === "invalid_title") return { error: "Task title is required." }
  if (code === "invalid_task") return { error: "Unable to create task." }
  return { error: "Unable to create task." }
}

function parseUpdateTaskTransitionResult(
  value: unknown
): UpdateTaskTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return { code: result.code, ok: false }
  }
  if (
    result.ok === true &&
    typeof result.previousProjectId === "string" &&
    typeof result.projectId === "string" &&
    typeof result.taskId === "string"
  ) {
    return {
      ok: true,
      previousProjectId: result.previousProjectId,
      projectId: result.projectId,
      taskId: result.taskId,
    }
  }

  return null
}

function updateTransitionFailure(code: string) {
  if (code === "task_not_found") return { error: "Task not found." }
  if (code === "stale") {
    return { error: "This task changed. Refresh before saving again." }
  }
  return transitionFailure(code)
}

function parseDeleteTaskTransitionResult(
  value: unknown
): DeleteTaskTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return { code: result.code, ok: false }
  }
  if (
    result.ok === true &&
    typeof result.projectId === "string" &&
    typeof result.taskId === "string"
  ) {
    return {
      ok: true,
      projectId: result.projectId,
      taskId: result.taskId,
    }
  }

  return null
}

function parseReorderTaskTransitionResult(
  value: unknown
): ReorderTaskTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return { code: result.code, ok: false }
  }
  if (result.ok === true && typeof result.projectId === "string") {
    return { ok: true, projectId: result.projectId }
  }

  return null
}

export async function createMemberWorkspaceTaskTransition({
  actorId,
  assigneeId,
  description,
  endDate,
  priority,
  projectId,
  startDate,
  status,
  tagLabel,
  taskType,
  title,
  workstreamName,
}: {
  actorId: string
  assigneeId: string | null
  description: string | null
  endDate: string
  priority: string
  projectId: string
  startDate: string
  status: string
  tagLabel: string | null
  taskType: string
  title: string
  workstreamName: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc(
    "create_organization_task_transition",
    {
      p_actor_id: actorId,
      p_assignee_id: assigneeId,
      p_description: description,
      p_end_date: endDate,
      p_priority: priority,
      p_project_id: projectId,
      p_start_date: startDate,
      p_status: status,
      p_tag_label: tagLabel,
      p_task_type: taskType,
      p_title: title,
      p_workstream_name: workstreamName,
    }
  )

  if (error) return { error: "Unable to create task." }

  const result = parseCreateTaskTransitionResult(data)
  if (!result) return { error: "Unable to create task." }
  if (!result.ok) return transitionFailure(result.code)

  return { ok: true as const, taskId: result.taskId }
}

export async function updateMemberWorkspaceTaskTransition({
  actorId,
  assigneeId,
  description,
  endDate,
  expectedOrgId,
  expectedProjectId,
  priority,
  projectId,
  startDate,
  status,
  tagLabel,
  taskId,
  taskType,
  title,
  workstreamName,
}: {
  actorId: string
  assigneeId: string | null
  description: string | null
  endDate: string
  expectedOrgId: string
  expectedProjectId: string
  priority: string
  projectId: string
  startDate: string
  status: string
  tagLabel: string | null
  taskId: string
  taskType: string
  title: string
  workstreamName: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc(
    "update_organization_task_transition",
    {
      p_actor_id: actorId,
      p_assignee_id: assigneeId,
      p_description: description,
      p_end_date: endDate,
      p_expected_org_id: expectedOrgId,
      p_expected_project_id: expectedProjectId,
      p_priority: priority,
      p_project_id: projectId,
      p_start_date: startDate,
      p_status: status,
      p_tag_label: tagLabel,
      p_task_id: taskId,
      p_task_type: taskType,
      p_title: title,
      p_workstream_name: workstreamName,
    }
  )

  if (error) return { error: "Unable to update task." }

  const result = parseUpdateTaskTransitionResult(data)
  if (!result) return { error: "Unable to update task." }
  if (!result.ok) return updateTransitionFailure(result.code)

  return {
    ok: true as const,
    previousProjectId: result.previousProjectId,
    projectId: result.projectId,
    taskId: result.taskId,
  }
}

export async function deleteMemberWorkspaceTaskTransition({
  actorId,
  expectedOrgId,
  expectedProjectId,
  taskId,
}: {
  actorId: string
  expectedOrgId: string
  expectedProjectId: string
  taskId: string
}) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc(
    "delete_organization_task_transition",
    {
      p_actor_id: actorId,
      p_expected_org_id: expectedOrgId,
      p_expected_project_id: expectedProjectId,
      p_task_id: taskId,
    }
  )

  if (error) return { error: "Unable to delete task." }

  const result = parseDeleteTaskTransitionResult(data)
  if (!result) return { error: "Unable to delete task." }
  if (!result.ok) return updateTransitionFailure(result.code)

  return {
    ok: true as const,
    projectId: result.projectId,
    taskId: result.taskId,
  }
}

export async function reorderMemberWorkspaceTasksTransition({
  actorId,
  expectedOrgId,
  orderedTaskIds,
  projectId,
}: {
  actorId: string
  expectedOrgId: string
  orderedTaskIds: string[]
  projectId: string
}) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc(
    "reorder_organization_tasks_transition",
    {
      p_actor_id: actorId,
      p_expected_org_id: expectedOrgId,
      p_ordered_task_ids: orderedTaskIds,
      p_project_id: projectId,
    }
  )

  if (error) return { error: "Unable to save task order." }

  const result = parseReorderTaskTransitionResult(data)
  if (!result) return { error: "Unable to save task order." }
  if (!result.ok) {
    return result.code === "stale"
      ? { error: "Task order is out of date. Refresh and try again." }
      : { error: "Unable to save task order." }
  }

  return { ok: true as const, projectId: result.projectId }
}
