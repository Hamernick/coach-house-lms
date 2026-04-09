import type { Database } from "@/lib/supabase"

import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import {
  isMissingOrganizationTaskAssigneesTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type OrganizationTaskAssignmentRow =
  Database["public"]["Tables"]["organization_task_assignees"]["Row"]

type ProfileRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
}

export type TaskAssigneeProfile = {
  id: string
  name: string
  avatarUrl: string | null
}

export async function loadTaskAssigneeMap({
  supabase,
  taskIds,
}: {
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
  taskIds: string[]
}) {
  const assigneeByTaskId = new Map<string, TaskAssigneeProfile>()

  if (taskIds.length === 0) {
    return assigneeByTaskId
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("organization_task_assignees")
    .select("task_id, user_id")
    .in("task_id", taskIds)
    .returns<Array<Pick<OrganizationTaskAssignmentRow, "task_id" | "user_id">>>()

  if (assignmentError) {
    if (isMissingOrganizationTaskAssigneesTableError(assignmentError)) {
      return assigneeByTaskId
    }
    throw toMemberWorkspaceDataError(assignmentError, "Unable to load task assignees.")
  }

  const firstAssignmentByTaskId = new Map<string, string>()
  for (const assignment of assignmentRows ?? []) {
    if (!firstAssignmentByTaskId.has(assignment.task_id)) {
      firstAssignmentByTaskId.set(assignment.task_id, assignment.user_id)
    }
  }

  const userIds = Array.from(new Set(firstAssignmentByTaskId.values()))
  if (userIds.length === 0) {
    return assigneeByTaskId
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds)
    .returns<ProfileRow[]>()

  if (profileError) {
    throw toMemberWorkspaceDataError(profileError, "Unable to load task assignee profiles.")
  }

  const profileById = new Map<string, TaskAssigneeProfile>(
    (profileRows ?? []).map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.full_name?.trim() || profile.email?.trim() || "Unknown member",
        avatarUrl: profile.avatar_url?.trim() || null,
      },
    ]),
  )

  for (const [taskId, userId] of firstAssignmentByTaskId.entries()) {
    const assignee = profileById.get(userId)
    if (assignee) {
      assigneeByTaskId.set(taskId, assignee)
    }
  }

  return assigneeByTaskId
}
