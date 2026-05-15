import type { Database } from "@/lib/supabase"
import type {
  MemberWorkspaceTaskGroup,
  MemberWorkspaceTaskItem,
} from "../types"
import { memberWorkspaceStarterProjects } from "./member-workspace-starter-projects"
import { MEMBER_WORKSPACE_STARTER_VERSION } from "./starter-data"

export type OrganizationTaskRecord =
  Database["public"]["Tables"]["organization_tasks"]["Row"]

type OrganizationTaskInsert =
  Database["public"]["Tables"]["organization_tasks"]["Insert"]

type OrganizationTaskAssigneeInsert =
  Database["public"]["Tables"]["organization_task_assignees"]["Insert"]

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildStarterTaskSeedKey(projectSeedKey: string, taskSeedKey: string) {
  return `${projectSeedKey}:${taskSeedKey}`
}

export function buildStarterOrganizationTasks({
  orgId,
  actorId,
  projectIdByStarterKey,
}: {
  orgId: string
  actorId: string
  projectIdByStarterKey: Map<string, string>
}): OrganizationTaskInsert[] {
  return memberWorkspaceStarterProjects.flatMap((project) => {
    const projectId = projectIdByStarterKey.get(project.id)
    if (!projectId) return []

    return project.tasks.map((task, index) => ({
      org_id: orgId,
      project_id: projectId,
      title: task.name,
      description: null,
      task_type: task.type,
      status: task.status,
      start_date: toIsoDate(task.startDate),
      end_date: toIsoDate(task.endDate),
      priority: "medium",
      tag_label: null,
      workstream_name: null,
      sort_order: index,
      created_source: "starter_seed",
      starter_seed_key: buildStarterTaskSeedKey(project.id, task.id),
      starter_seed_version: MEMBER_WORKSPACE_STARTER_VERSION,
      created_by: actorId,
      updated_by: actorId,
    }))
  })
}

export function buildStarterOrganizationTaskAssignees({
  orgId,
  actorId,
  assigneeUserId,
  taskIdByStarterKey,
}: {
  orgId: string
  actorId: string
  assigneeUserId: string
  taskIdByStarterKey: Map<string, string>
}): OrganizationTaskAssigneeInsert[] {
  return memberWorkspaceStarterProjects.flatMap((project) =>
    project.tasks.flatMap((task) => {
      const taskId = taskIdByStarterKey.get(buildStarterTaskSeedKey(project.id, task.id))
      if (!taskId) return []

      return [
        {
          org_id: orgId,
          task_id: taskId,
          user_id: assigneeUserId,
          created_by: actorId,
        },
      ]
    }),
  )
}

export function mapTaskRowsToGroups(
  tasks: MemberWorkspaceTaskItem[],
): MemberWorkspaceTaskGroup[] {
  const groups = new Map<string, MemberWorkspaceTaskGroup>()

  for (const task of tasks) {
    const current = groups.get(task.projectId)
    if (current) {
      current.tasks.push(task)
      continue
    }

    groups.set(task.projectId, {
      projectId: task.projectId,
      projectName: task.projectName,
      projectClient: task.projectClient,
      projectStatus: task.projectStatus,
      projectPriority: task.projectPriority,
      projectTags: task.projectTags,
      projectMembers: task.projectMembers,
      projectTypeLabel: task.projectTypeLabel,
      projectDurationLabel: task.projectDurationLabel,
      projectStartDate: task.projectStartDate,
      projectEndDate: task.projectEndDate,
      tasks: [task],
    })
  }

  return Array.from(groups.values()).sort((left, right) =>
    left.projectName.localeCompare(right.projectName),
  )
}
