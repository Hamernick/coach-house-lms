"use client"

import { useCallback, useEffect, useState } from "react"
import type { ProjectDetails, PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import type { MemberWorkspaceCreateProjectFormInput, MemberWorkspaceCreateTaskInput, MemberWorkspacePersonOption, MemberWorkspaceProjectOrganizationOption } from "../../types"
import { savedProject, upsertSavedProject } from "../../lib/saved-project"
import { savedTask, upsertProjectTask } from "../../lib/saved-task"

type Result<K extends string> = ({ ok: true } & Record<K, string>) | { error: string }
type CreateTask = (input: MemberWorkspaceCreateTaskInput) => Promise<Result<"taskId">>
type UpdateTask = (id: string, input: MemberWorkspaceCreateTaskInput) => Promise<Result<"taskId">>
type UpdateProject = (id: string, input: MemberWorkspaceCreateProjectFormInput) => Promise<Result<"id">>

export function useProjectDirectorySavedState(serverProjects: PlatformAdminDashboardLabProject[], organizations: MemberWorkspaceProjectOrganizationOption[]) {
  const [projects, setProjects] = useState(serverProjects)
  useEffect(() => setProjects(serverProjects), [serverProjects])
  const onSaved = useCallback((id: string, input: MemberWorkspaceCreateProjectFormInput, taskCount?: number) => {
    setProjects(current => upsertSavedProject(current, { ...savedProject(id, input, current.find(project => project.id === id), organizations), ...(taskCount === undefined ? {} : { taskCount }) }))
  }, [organizations])
  return { projects, onSaved }
}

export function useProjectSavedState({ serverProject, people, createTask, updateTask, updateProject }: {
  serverProject: ProjectDetails
  people: MemberWorkspacePersonOption[]
  createTask?: CreateTask
  updateTask?: UpdateTask
  updateProject?: UpdateProject
}) {
  const [project, setProject] = useState(serverProject)
  useEffect(() => setProject(serverProject), [serverProject])
  const saveTask = useCallback((id: string, input: MemberWorkspaceCreateTaskInput) => {
    setProject(current => upsertProjectTask(current, savedTask(id, input, current.name, people)))
  }, [people])
  const createTaskAction = useCallback(async (input: MemberWorkspaceCreateTaskInput) => {
    const result = await createTask!(input)
    if (!("error" in result)) saveTask(result.taskId, input)
    return result
  }, [createTask, saveTask])
  const updateTaskAction = useCallback(async (id: string, input: MemberWorkspaceCreateTaskInput) => {
    const result = await updateTask!(id, input)
    if (!("error" in result)) saveTask(result.taskId, input)
    return result
  }, [updateTask, saveTask])
  const updateProjectAction = useCallback(async (id: string, input: MemberWorkspaceCreateProjectFormInput) => {
    const result = await updateProject!(id, input)
    if (!("error" in result)) setProject(current => ({
      ...current, name: input.name.trim(), description: input.description ?? "",
      overviewDocument: input.overviewDocumentHtml ?? current.overviewDocument,
      source: current.source ? savedProject(id, input, current.source, []) : current.source,
      meta: { ...current.meta, priorityLabel: input.priority, sprintLabel: input.typeLabel ?? current.meta.sprintLabel },
      backlog: { ...current.backlog, statusLabel: ({ "on-hold": "On hold", active: "Active", planned: "Planned", backlog: "Backlog", completed: "Completed", cancelled: "Cancelled" } as const)[input.status], priorityLabel: input.priority },
      time: { ...current.time, dueDate: input.endDate ? new Date(`${input.endDate}T00:00:00Z`) : null, schedule: { startDate: input.startDate ?? "", endDate: input.endDate ?? "" } },
    }))
    return result
  }, [updateProject])
  return {
    project,
    createTaskAction: createTask ? createTaskAction : undefined,
    updateTaskAction: updateTask ? updateTaskAction : undefined,
    updateProjectAction: updateProject ? updateProjectAction : undefined,
  }
}
