import { format, parseISO } from "date-fns"
import type { ProjectDetails, ProjectTask } from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceCreateTaskInput as Input, MemberWorkspacePersonOption as Person, MemberWorkspaceTaskGroup as Group } from "../types"

export function savedTask(id: string, input: Input, projectName: string, people: Person[]): ProjectTask {
  const person = people.find(item => item.id === input.assigneeUserId)
  const workstreamName = input.workstreamName?.trim() || "General"
  return {
    id, name: input.title.trim(), description: input.description, status: input.status,
    startDate: input.startDate ? parseISO(input.startDate) : undefined, endDate: input.endDate ? parseISO(input.endDate) : undefined,
    dueLabel: input.endDate ? format(parseISO(input.endDate), "dd/MM/yyyy") : undefined, priority: input.priority, tag: input.tagLabel,
    assignee: person ? { id: person.id, name: person.name, avatarUrl: person.avatarUrl ?? undefined } : undefined,
    projectId: input.projectId, projectName, workstreamName,
    workstreamId: `${input.projectId}:${workstreamName.toLowerCase().replace(/\s+/g, "-")}`,
  }
}

export function upsertPersonalTask(groups: Group[], id: string, input: Input, projectName: string, people: Person[], viewerId: string) {
  const previous = groups.flatMap(group => group.tasks).find(task => task.id === id)
  const next = groups.map(group => ({ ...group, tasks: group.tasks.filter(task => task.id !== id) }))
  if (input.assigneeUserId && input.assigneeUserId !== viewerId && !previous?.tracker?.collaboratorUserIds.includes(viewerId)) return next.filter(group => group.tasks.length)
  const group = next.find(item => item.projectId === input.projectId) ?? {
    projectId: input.projectId, projectName, projectClient: null,
    projectStatus: "planned" as const, projectPriority: "medium" as const,
    projectTags: [], projectMembers: [], projectStartDate: "", projectEndDate: "", tasks: [],
  }
  const assignee = people.find(person => person.id === (input.assigneeUserId === undefined ? viewerId : input.assigneeUserId))
  const { tasks: _tasks, ...metadata } = group
  const task = {
    ...previous, ...metadata, ...input, id, projectName: group.projectName,
    title: input.title.trim(), taskType: input.tagLabel?.toLowerCase() === "bug" ? "bug" as const : input.tagLabel?.toLowerCase() === "internal" ? "improvement" as const : "task" as const,
    assignee, canUpdate: previous?.canUpdate ?? true,
  }
  // Keep an edited task's position; new tasks appear first.
  const oldIndex = groups.find(item => item.projectId === input.projectId)?.tasks.findIndex(item => item.id === id) ?? -1
  group.tasks.splice(Math.max(0, oldIndex), 0, task)
  if (!next.includes(group)) next.unshift(group)
  return next.filter(item => item.tasks.length)
}

export function upsertProjectTask(project: ProjectDetails, task: ProjectTask): ProjectDetails {
  const previous = project.workstreams.flatMap(group => group.tasks).find(item => item.id === task.id)
  task = { ...previous, ...task, tracker: previous?.tracker }
  const groups = project.workstreams.map(group => ({ ...group, tasks: group.tasks.filter(item => item.id !== task.id) }))
  const group = groups.find(item => item.name === task.workstreamName)
  if (group) group.tasks.unshift(task)
  else groups.unshift({ id: task.workstreamId, name: task.workstreamName, tasks: [task] })
  const tasks = groups.flatMap(item => item.tasks)
  const progress = Math.round(tasks.filter(item => item.status === "done").length / tasks.length * 100)
  return {
    ...project, workstreams: groups.filter(item => item.tasks.length),
    source: project.source ? { ...project.source, taskCount: tasks.length, progress } : undefined,
    time: { ...project.time, progressPercent: progress },
    timelineTasks: [
      ...project.timelineTasks.filter(item => item.id !== task.id),
      ...(task.startDate && task.endDate ? [{ id: task.id, name: task.name, startDate: task.startDate, endDate: task.endDate, assignee: task.assignee, status: task.status === "todo" ? "planned" as const : task.status }] : []),
    ],
  }
}
