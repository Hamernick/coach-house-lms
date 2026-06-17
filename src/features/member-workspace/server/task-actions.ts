"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type {
  MemberWorkspaceCreateTaskInput,
  MemberWorkspaceTaskStatus,
} from "../types"
import { ensureMemberWorkspaceFeatureAccess } from "./access"
import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import {
  PLATFORM_ADMIN_TASK_MUTATION_ERROR,
  VALID_TASK_PRIORITIES,
  VALID_TASK_STATUSES,
  adjustProjectTaskCount,
  formatTaskType,
  replaceTaskAssignee,
  resolveAssignableUserId,
  resolveTaskTargetProject,
  toDateOnly,
} from "./task-action-helpers"

export type MemberWorkspaceUpdateTaskStatusResult =
  | { ok: true; taskId: string; status: MemberWorkspaceTaskStatus }
  | { error: string }

export type MemberWorkspaceCreateTaskResult =
  | { ok: true; taskId: string }
  | { error: string }

export type MemberWorkspaceUpdateTaskResult =
  | { ok: true; taskId: string }
  | { error: string }

export type MemberWorkspaceUpdateTaskOrderResult =
  | { ok: true; projectId: string }
  | { error: string }

export type MemberWorkspaceDeleteTaskResult =
  | { ok: true; taskId: string; projectId: string }
  | { error: string }

export async function createMemberWorkspaceTaskAction(
  input: MemberWorkspaceCreateTaskInput
): Promise<MemberWorkspaceCreateTaskResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  if (actor.isAdmin) {
    return { error: PLATFORM_ADMIN_TASK_MUTATION_ERROR }
  }
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (!actor.canEdit) {
    return { error: "You do not have access to create tasks." }
  }

  const projectId = input.projectId.trim()
  const title = input.title.trim()

  if (!projectId) {
    return { error: "Choose a project." }
  }

  if (!title) {
    return { error: "Task title is required." }
  }

  if (!VALID_TASK_STATUSES.has(input.status)) {
    return { error: "Choose a valid task status." }
  }

  const priority = input.priority ?? "no-priority"
  if (!VALID_TASK_PRIORITIES.has(priority)) {
    return { error: "Choose a valid task priority." }
  }

  const startDate = toDateOnly(input.startDate)
  const endDate = toDateOnly(input.endDate)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Enter valid task dates." }
  }
  if (endDate.getTime() < startDate.getTime()) {
    return { error: "Target date must be on or after the start date." }
  }

  const projectResult = await resolveTaskTargetProject({
    actor,
    projectId,
  })
  if ("error" in projectResult) {
    return projectResult
  }
  const { project } = projectResult

  const assigneeResult = await resolveAssignableUserId({
    actor,
    orgId: project.org_id,
    requestedUserId: input.assigneeUserId,
  })
  if ("error" in assigneeResult) {
    return assigneeResult
  }

  const admin = createSupabaseAdminClient()
  const sortOrder = Math.max(project.task_count ?? 0, 0)

  const { data: task, error: insertError } = await admin
    .from("organization_tasks")
    .insert({
      org_id: project.org_id,
      project_id: project.id,
      title,
      description: input.description?.trim() ? input.description.trim() : null,
      task_type: formatTaskType(input.tagLabel),
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate,
      priority,
      tag_label: input.tagLabel?.trim() ? input.tagLabel.trim() : null,
      workstream_name: input.workstreamName?.trim()
        ? input.workstreamName.trim()
        : null,
      sort_order: sortOrder,
      created_source: "user",
      created_by: actor.userId,
      updated_by: actor.userId,
    })
    .select("id")
    .single<{ id: string }>()

  if (insertError || !task) {
    return { error: "Unable to create task." }
  }

  const assigneeWriteResult = await replaceTaskAssignee({
    admin,
    actorUserId: actor.userId,
    orgId: project.org_id,
    taskId: task.id,
    userId: assigneeResult.userId,
  })
  if ("error" in assigneeWriteResult) {
    await admin
      .from("organization_tasks")
      .delete()
      .eq("id", task.id)
      .eq("org_id", project.org_id)
    return { error: assigneeWriteResult.error }
  }

  await admin
    .from("organization_projects")
    .update({
      task_count: sortOrder + 1,
      updated_by: actor.userId,
    })
    .eq("id", project.id)
    .eq("org_id", project.org_id)

  revalidatePath("/tasks")
  revalidatePath("/organizations")
  revalidatePath(`/organizations/${project.id}`)

  return { ok: true, taskId: task.id }
}

export async function updateMemberWorkspaceTaskAction(
  taskId: string,
  input: MemberWorkspaceCreateTaskInput
): Promise<MemberWorkspaceUpdateTaskResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  if (actor.isAdmin) {
    return { error: PLATFORM_ADMIN_TASK_MUTATION_ERROR }
  }
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (!actor.canEdit) {
    return { error: "You do not have access to edit tasks." }
  }

  const normalizedTaskId = taskId.trim()
  if (!normalizedTaskId) {
    return { error: "Choose a task." }
  }

  const projectId = input.projectId.trim()
  const title = input.title.trim()
  if (!projectId) {
    return { error: "Choose a project." }
  }
  if (!title) {
    return { error: "Task title is required." }
  }
  if (!VALID_TASK_STATUSES.has(input.status)) {
    return { error: "Choose a valid task status." }
  }

  const priority = input.priority ?? "no-priority"
  if (!VALID_TASK_PRIORITIES.has(priority)) {
    return { error: "Choose a valid task priority." }
  }

  const startDate = toDateOnly(input.startDate)
  const endDate = toDateOnly(input.endDate)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: "Enter valid task dates." }
  }
  if (endDate.getTime() < startDate.getTime()) {
    return { error: "Target date must be on or after the start date." }
  }

  const taskQuery = actor.supabase
    .from("organization_tasks")
    .select("id, org_id, project_id")
    .eq("id", normalizedTaskId)

  const { data: existingTask, error: existingTaskError } = await (actor.isAdmin
    ? taskQuery.maybeSingle<{
        id: string
        org_id: string
        project_id: string
      }>()
    : taskQuery
        .eq("org_id", actor.activeOrg.orgId)
        .maybeSingle<{ id: string; org_id: string; project_id: string }>())

  if (existingTaskError || !existingTask) {
    return { error: "Task not found." }
  }

  const projectResult = await resolveTaskTargetProject({
    actor,
    projectId,
  })
  if ("error" in projectResult) {
    return projectResult
  }
  const { project } = projectResult

  const assigneeResult = await resolveAssignableUserId({
    actor,
    orgId: project.org_id,
    requestedUserId: input.assigneeUserId,
  })
  if ("error" in assigneeResult) {
    return assigneeResult
  }

  const admin = createSupabaseAdminClient()
  const { error: updateError } = await admin
    .from("organization_tasks")
    .update({
      org_id: project.org_id,
      project_id: project.id,
      title,
      description: input.description?.trim() ? input.description.trim() : null,
      task_type: formatTaskType(input.tagLabel),
      status: input.status,
      start_date: input.startDate,
      end_date: input.endDate,
      priority,
      tag_label: input.tagLabel?.trim() ? input.tagLabel.trim() : null,
      workstream_name: input.workstreamName?.trim()
        ? input.workstreamName.trim()
        : null,
      updated_by: actor.userId,
    })
    .eq("id", normalizedTaskId)
    .eq("org_id", existingTask.org_id)

  if (updateError) {
    return { error: "Unable to update task." }
  }

  const assigneeWriteResult = await replaceTaskAssignee({
    admin,
    actorUserId: actor.userId,
    orgId: project.org_id,
    taskId: normalizedTaskId,
    userId: assigneeResult.userId,
  })
  if ("error" in assigneeWriteResult) {
    return { error: assigneeWriteResult.error }
  }

  if (existingTask.project_id !== project.id) {
    await Promise.all([
      adjustProjectTaskCount({
        admin,
        projectId: existingTask.project_id,
        delta: -1,
        updatedBy: actor.userId,
      }),
      adjustProjectTaskCount({
        admin,
        projectId: project.id,
        delta: 1,
        updatedBy: actor.userId,
      }),
    ])
  }

  revalidatePath("/tasks")
  revalidatePath("/organizations")
  revalidatePath(`/organizations/${existingTask.project_id}`)
  if (existingTask.project_id !== project.id) {
    revalidatePath(`/organizations/${project.id}`)
  }

  return { ok: true, taskId: normalizedTaskId }
}

export async function updateMemberWorkspaceTaskStatusAction(
  taskId: string,
  nextStatus: MemberWorkspaceTaskStatus
): Promise<MemberWorkspaceUpdateTaskStatusResult> {
  const normalizedTaskId = taskId.trim()

  if (!normalizedTaskId) {
    return { error: "Choose a task." }
  }

  if (!VALID_TASK_STATUSES.has(nextStatus)) {
    return { error: "Choose a valid task status." }
  }

  const actor = await resolveMemberWorkspaceActorContext()
  if (actor.isAdmin) {
    return { error: PLATFORM_ADMIN_TASK_MUTATION_ERROR }
  }
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  let canUpdateTask = actor.canEdit

  if (!canUpdateTask) {
    const { data: assignment, error: assignmentError } = await actor.supabase
      .from("organization_task_assignees")
      .select("task_id")
      .eq("org_id", actor.activeOrg.orgId)
      .eq("user_id", actor.userId)
      .eq("task_id", normalizedTaskId)
      .maybeSingle()

    if (assignmentError) {
      return { error: "Unable to verify task access." }
    }

    canUpdateTask = !!assignment
  }

  if (!canUpdateTask) {
    return { error: "You do not have access to update that task." }
  }

  const taskQuery = actor.supabase
    .from("organization_tasks")
    .select("id, org_id, project_id, status")
    .eq("id", normalizedTaskId)

  const { data: task, error: taskError } = await taskQuery
    .eq("org_id", actor.activeOrg.orgId)
    .maybeSingle<{
      id: string
      org_id: string
      project_id: string
      status: string
    }>()

  if (taskError || !task) {
    return { error: "Task not found." }
  }

  if (task.status === nextStatus) {
    return { ok: true, taskId: normalizedTaskId, status: nextStatus }
  }

  const admin = createSupabaseAdminClient()
  const { error: updateError } = await admin
    .from("organization_tasks")
    .update({
      status: nextStatus,
      updated_by: actor.userId,
    })
    .eq("id", normalizedTaskId)
    .eq("org_id", task.org_id)

  if (updateError) {
    return { error: "Unable to update task status." }
  }

  revalidatePath("/tasks")
  revalidatePath("/organizations")
  revalidatePath(`/organizations/${task.project_id}`)

  return { ok: true, taskId: normalizedTaskId, status: nextStatus }
}

export async function updateMemberWorkspaceTaskOrderAction(
  projectId: string,
  orderedTaskIds: string[]
): Promise<MemberWorkspaceUpdateTaskOrderResult> {
  const actor = await resolveMemberWorkspaceActorContext()

  if (actor.isAdmin) {
    return { error: PLATFORM_ADMIN_TASK_MUTATION_ERROR }
  }
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (!actor.canEdit) {
    return { error: "You do not have access to reorder tasks." }
  }

  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) {
    return { error: "Choose a project." }
  }

  const normalizedTaskIds = Array.from(
    new Set(orderedTaskIds.map((taskId) => taskId.trim()).filter(Boolean))
  )

  if (normalizedTaskIds.length === 0) {
    return { error: "Choose at least one task to reorder." }
  }

  const projectResult = await resolveTaskTargetProject({
    actor,
    projectId: normalizedProjectId,
  })
  if ("error" in projectResult) {
    return projectResult
  }

  const { project } = projectResult
  const admin = createSupabaseAdminClient()

  const { data: taskRows, error: taskRowsError } = await admin
    .from("organization_tasks")
    .select("id")
    .eq("org_id", project.org_id)
    .eq("project_id", project.id)
    .order("sort_order", { ascending: true })
    .returns<Array<{ id: string }>>()

  if (taskRowsError) {
    return { error: "Unable to load tasks for reordering." }
  }

  const currentTaskIds = (taskRows ?? []).map((task) => task.id)

  if (
    currentTaskIds.length !== normalizedTaskIds.length ||
    currentTaskIds.some((taskId) => !normalizedTaskIds.includes(taskId))
  ) {
    return { error: "Task order is out of date. Refresh and try again." }
  }

  const updates = normalizedTaskIds.map((taskId, index) =>
    admin
      .from("organization_tasks")
      .update({
        sort_order: index,
        updated_by: actor.userId,
      })
      .eq("id", taskId)
      .eq("org_id", project.org_id)
      .eq("project_id", project.id)
  )

  const results = await Promise.all(updates)
  if (results.some((result) => result.error)) {
    return { error: "Unable to save task order." }
  }

  revalidatePath("/tasks")
  revalidatePath(`/organizations/${project.id}`)

  return { ok: true, projectId: project.id }
}

export async function deleteMemberWorkspaceTaskAction(
  taskId: string
): Promise<MemberWorkspaceDeleteTaskResult> {
  const actor = await resolveMemberWorkspaceActorContext()

  if (actor.isAdmin) {
    return { error: PLATFORM_ADMIN_TASK_MUTATION_ERROR }
  }
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (!actor.canEdit) {
    return { error: "You do not have access to delete tasks." }
  }

  const normalizedTaskId = taskId.trim()
  if (!normalizedTaskId) {
    return { error: "Choose a task." }
  }

  const taskQuery = actor.supabase
    .from("organization_tasks")
    .select("id, org_id, project_id")
    .eq("id", normalizedTaskId)

  const { data: task, error: taskError } = await taskQuery
    .eq("org_id", actor.activeOrg.orgId)
    .maybeSingle<{ id: string; org_id: string; project_id: string }>()

  if (taskError || !task) {
    return { error: "Task not found." }
  }

  const admin = createSupabaseAdminClient()

  const { error: assigneeDeleteError } = await admin
    .from("organization_task_assignees")
    .delete()
    .eq("task_id", normalizedTaskId)

  if (assigneeDeleteError) {
    return { error: "Unable to delete task assignees." }
  }

  const { error: taskDeleteError } = await admin
    .from("organization_tasks")
    .delete()
    .eq("id", normalizedTaskId)
    .eq("org_id", task.org_id)

  if (taskDeleteError) {
    return { error: "Unable to delete task." }
  }

  await adjustProjectTaskCount({
    admin,
    projectId: task.project_id,
    delta: -1,
    updatedBy: actor.userId,
  })

  revalidatePath("/tasks")
  revalidatePath("/organizations")
  revalidatePath(`/organizations/${task.project_id}`)

  return { ok: true, taskId: normalizedTaskId, projectId: task.project_id }
}
