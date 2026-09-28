import { format, parseISO } from "date-fns"
import type {
  Project,
  ProjectTask,
  ProjectTaskGroup,
} from "@/features/platform-admin-dashboard"
import type {
  MemberWorkspaceTaskItem,
  MemberWorkspaceTaskGroup,
} from "../types"

export function toProjectTask(task: MemberWorkspaceTaskItem): ProjectTask {
  return {
    id: task.id,
    tracker: task.tracker,
    name: task.title,
    status: task.status,
    dueLabel: task.endDate ? format(parseISO(task.endDate), "dd/MM/yyyy") : undefined,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          avatarUrl: task.assignee.avatarUrl ?? undefined,
        }
      : undefined,
    startDate: task.startDate ? parseISO(task.startDate) : undefined,
    endDate: task.endDate ? parseISO(task.endDate) : undefined,
    priority: task.priority,
    tag: task.tagLabel ?? undefined,
    description: task.description,
    projectId: task.projectId,
    projectName: task.projectName,
    organizationName:
      task.organizationName ?? task.projectClient ?? "Organization",
    workstreamId: task.workstreamName
      ? `${task.projectId}:${task.workstreamName.toLowerCase().replace(/\s+/g, "-")}`
      : `${task.projectId}:general`,
    workstreamName: task.workstreamName ?? "General",
  }
}

export function toProjectGroup(
  group: MemberWorkspaceTaskGroup
): ProjectTaskGroup {
  const tasks = group.tasks.map(toProjectTask)
  const done = tasks.filter((task) => task.status === "done").length
  const total = tasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const project: Project = {
    id: group.projectId,
    name: group.projectName,
    taskCount: total,
    progress,
    startDate: group.projectStartDate ? parseISO(group.projectStartDate) : null,
    endDate: group.projectEndDate ? parseISO(group.projectEndDate) : null,
    status: group.projectStatus,
    priority: group.projectPriority,
    tags: group.projectTags,
    members: group.projectMembers,
    client: group.projectClient ?? undefined,
    typeLabel: group.projectTypeLabel ?? undefined,
    durationLabel: group.projectDurationLabel ?? undefined,
    tasks: tasks.filter((task) => task.startDate && task.endDate).map((task) => ({
      id: task.id,
    tracker: task.tracker,
      name: task.name,
      type: group.tasks.find((item) => item.id === task.id)?.taskType ?? "task",
      assignee: task.assignee?.name ?? "",
      status: task.status,
      startDate: task.startDate!,
      endDate: task.endDate!,
    })),
  }

  return {
    project,
    tasks,
  }
}
