import type { Database } from "@/lib/supabase"
import type { MemberWorkspaceTaskItem } from "../types"

import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import { loadMemberWorkspacePersonOptionsForOrganizations } from "./person-options"
import { loadTaskAssigneeMap, type TaskAssigneeProfile } from "./task-assignees"
import { ensureStarterTasksForOrg } from "./task-persistence"
import {
  mapTaskRowsToGroups,
  type OrganizationTaskRecord,
} from "./task-starter-data"
import { resolveMemberWorkspaceStorageMode } from "./starter-data"
import {
  isMissingOrganizationProjectsTableError,
  isMissingOrganizationTaskAssigneesTableError,
  isMissingOrganizationTasksTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type OrganizationTaskAssignmentRow =
  Database["public"]["Tables"]["organization_task_assignees"]["Row"]

type TaskAssignmentQueryRow = Pick<OrganizationTaskAssignmentRow, "task_id" | "user_id"> & {
  organization_tasks:
    | (OrganizationTaskRecord & {
        organization_projects:
          | {
              id: string
              name: string
              client_name: string | null
              status: string
              priority: string
              tags: string[] | null
              member_labels: string[] | null
              type_label: string | null
              duration_label: string | null
              start_date: string
              end_date: string
            }
          | null
      })
    | null
}

function compareTaskItems(left: MemberWorkspaceTaskItem, right: MemberWorkspaceTaskItem) {
  const dateDiff = left.startDate.localeCompare(right.startDate)
  if (dateDiff !== 0) return dateDiff
  return left.title.localeCompare(right.title)
}

function mapTaskAssignmentRowsToItems(
  rows: TaskAssignmentQueryRow[],
  assigneeByTaskId: Map<string, TaskAssigneeProfile>,
  canUpdate: boolean,
): MemberWorkspaceTaskItem[] {
  return rows
    .flatMap((row) => {
      const task = row.organization_tasks
      if (!task) return []
      const project = task.organization_projects

      return [
        {
          id: task.id,
          projectId: task.project_id,
          projectName: project?.name ?? "Unassigned Project",
          projectClient: project?.client_name ?? null,
          projectStatus: (project?.status as MemberWorkspaceTaskItem["projectStatus"]) ?? "planned",
          projectPriority:
            (project?.priority as MemberWorkspaceTaskItem["projectPriority"]) ?? "medium",
          projectTags: project?.tags ?? [],
          projectMembers: project?.member_labels ?? [],
          projectTypeLabel: project?.type_label ?? null,
          projectDurationLabel: project?.duration_label ?? null,
          projectStartDate: project?.start_date ?? task.start_date,
          projectEndDate: project?.end_date ?? task.end_date,
          title: task.title,
          description: task.description ?? undefined,
          taskType: task.task_type as MemberWorkspaceTaskItem["taskType"],
          status: task.status as MemberWorkspaceTaskItem["status"],
          startDate: task.start_date,
          endDate: task.end_date,
          priority:
            (task.priority as MemberWorkspaceTaskItem["priority"]) ?? "no-priority",
          tagLabel: task.tag_label ?? null,
          workstreamName: task.workstream_name ?? null,
          assignee: assigneeByTaskId.get(task.id) ?? null,
          canUpdate,
        },
      ]
    })
    .sort(compareTaskItems)
}

type AdminTaskQueryRow = Pick<
  OrganizationTaskRecord,
  | "id"
  | "org_id"
  | "project_id"
  | "title"
  | "description"
  | "task_type"
  | "status"
  | "start_date"
  | "end_date"
  | "priority"
  | "tag_label"
  | "workstream_name"
  | "sort_order"
  | "created_source"
> & {
  organization_projects:
    | {
        id: string
        name: string
        client_name: string | null
        status: string
        priority: string
        tags: string[] | null
        member_labels: string[] | null
        type_label: string | null
        duration_label: string | null
        start_date: string
        end_date: string
      }
    | null
}

type TaskProjectOption = {
  id: string
  label: string
}

function mapAdminTaskRowsToItems(
  rows: AdminTaskQueryRow[],
  assigneeByTaskId: Map<string, TaskAssigneeProfile>,
  canUpdate: boolean,
): MemberWorkspaceTaskItem[] {
  return rows
    .map((task) => {
      const project = task.organization_projects
      return {
        id: task.id,
        projectId: task.project_id,
        projectName: project?.name ?? "Organization project",
        projectClient: project?.client_name ?? null,
        projectStatus: (project?.status as MemberWorkspaceTaskItem["projectStatus"]) ?? "planned",
        projectPriority:
          (project?.priority as MemberWorkspaceTaskItem["projectPriority"]) ?? "medium",
        projectTags: project?.tags ?? [],
        projectMembers: project?.member_labels ?? [],
        projectTypeLabel: project?.type_label ?? null,
        projectDurationLabel: project?.duration_label ?? null,
        projectStartDate: project?.start_date ?? task.start_date,
        projectEndDate: project?.end_date ?? task.end_date,
        title: task.title,
        description: task.description ?? undefined,
        taskType: task.task_type as MemberWorkspaceTaskItem["taskType"],
        status: task.status as MemberWorkspaceTaskItem["status"],
        startDate: task.start_date,
        endDate: task.end_date,
        priority:
          (task.priority as MemberWorkspaceTaskItem["priority"]) ?? "no-priority",
        tagLabel: task.tag_label ?? null,
        workstreamName: task.workstream_name ?? null,
        assignee: assigneeByTaskId.get(task.id) ?? null,
        canUpdate,
      }
    })
    .sort(compareTaskItems)
}

async function loadTaskProjectOptions({
  orgId,
  supabase,
}: {
  orgId?: string
  supabase: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>["supabase"]
}): Promise<TaskProjectOption[]> {
  let query = supabase
    .from("organization_projects")
    .select("id, name")
    .order("name", { ascending: true })

  if (orgId) {
    query = query.eq("org_id", orgId)
  }

  const { data, error } = await query.returns<Array<{ id: string; name: string }>>()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) {
      return []
    }
    throw toMemberWorkspaceDataError(error, "Unable to load task projects.")
  }

  return (data ?? []).map((project) => ({
    id: project.id,
    label: project.name,
  }))
}

export async function loadMemberWorkspaceTasksPage() {
  const actor = await resolveMemberWorkspaceActorContext()

  if (actor.isAdmin) {
    const [{ data: orgRows, error: orgRowsError }, { data: detailRows, error: detailError }] =
      await Promise.all([
        actor.supabase
          .from("organization_projects")
          .select("org_id")
          .returns<Array<Pick<OrganizationTaskRecord, "org_id">>>(),
        actor.supabase
          .from("organization_tasks")
          .select(
            "id, org_id, project_id, title, description, task_type, status, start_date, end_date, priority, tag_label, workstream_name, sort_order, created_source, organization_projects(id, name, client_name, status, priority, tags, member_labels, type_label, duration_label, start_date, end_date)",
          )
          .order("start_date", { ascending: true })
          .order("sort_order", { ascending: true })
          .returns<AdminTaskQueryRow[]>(),
      ])

    if (orgRowsError && !isMissingOrganizationProjectsTableError(orgRowsError)) {
      throw toMemberWorkspaceDataError(orgRowsError, "Unable to load task assignees.")
    }

    if (detailError) {
      if (
        isMissingOrganizationTasksTableError(detailError) ||
        isMissingOrganizationProjectsTableError(detailError)
      ) {
        return {
          taskGroups: [],
          storageMode: "empty" as const,
          starterTaskCount: 0,
          hasAnyOrgTasks: false,
          canResetStarterData: false,
          canManageTasks: true,
          scope: "platform-admin" as const,
          assigneeOptions: [],
          projectOptions: [],
        }
      }
      throw toMemberWorkspaceDataError(detailError, "Unable to load workspace tasks.")
    }

    const rows = detailRows ?? []
    const adminOrgIds = Array.from(new Set((orgRows ?? []).map((row) => row.org_id)))
    const [assigneeOptions, projectOptions, assigneeByTaskId] = await Promise.all([
      loadMemberWorkspacePersonOptionsForOrganizations({
        orgIds: adminOrgIds,
        supabase: actor.supabase,
      }),
      loadTaskProjectOptions({
        supabase: actor.supabase,
      }),
      loadTaskAssigneeMap({
        supabase: actor.supabase,
        taskIds: rows.map((task) => task.id),
      }),
    ])

    return {
      taskGroups: mapTaskRowsToGroups(
        mapAdminTaskRowsToItems(rows, assigneeByTaskId, true),
      ),
      storageMode: resolveMemberWorkspaceStorageMode(rows),
      starterTaskCount: rows.filter((task) => task.created_source === "starter_seed").length,
      hasAnyOrgTasks: rows.length > 0,
      canResetStarterData: false,
      canManageTasks: true,
      scope: "platform-admin" as const,
      assigneeOptions,
      projectOptions,
    }
  }

  const [, assigneeOptions, projectOptions] = await Promise.all([
    ensureStarterTasksForOrg({
      canEdit: actor.canEdit,
      orgId: actor.activeOrg.orgId,
      userId: actor.userId,
      supabase: actor.supabase,
    }),
    loadMemberWorkspacePersonOptionsForOrganizations({
      orgIds: [actor.activeOrg.orgId],
      supabase: actor.supabase,
    }),
    loadTaskProjectOptions({
      orgId: actor.activeOrg.orgId,
      supabase: actor.supabase,
    }),
  ])

  const [{ data: organizationTaskRows, error: organizationTasksError }, { data: assignedRows, error: assignedRowsError }] =
    await Promise.all([
      actor.supabase
        .from("organization_tasks")
        .select("id, created_source")
        .eq("org_id", actor.activeOrg.orgId)
        .neq("created_source", "system")
        .returns<Array<Pick<OrganizationTaskRecord, "id" | "created_source">>>(),
      actor.supabase
        .from("organization_task_assignees")
        .select(
          "task_id, user_id, organization_tasks!inner(id, org_id, project_id, title, description, task_type, status, start_date, end_date, priority, tag_label, workstream_name, sort_order, created_source, starter_seed_key, starter_seed_version, created_by, updated_by, created_at, updated_at, organization_projects(id, name, client_name, status, priority, tags, member_labels, type_label, duration_label, start_date, end_date))",
        )
        .eq("org_id", actor.activeOrg.orgId)
        .eq("user_id", actor.userId)
        .returns<TaskAssignmentQueryRow[]>(),
    ])

  if (organizationTasksError) {
    if (isMissingOrganizationTasksTableError(organizationTasksError)) {
        return {
          taskGroups: [],
          storageMode: "empty" as const,
          starterTaskCount: 0,
          hasAnyOrgTasks: false,
          canResetStarterData: false,
          canManageTasks: actor.canEdit,
          scope: "organization" as const,
          assigneeOptions,
          projectOptions,
        }
      }
      throw toMemberWorkspaceDataError(
      organizationTasksError,
      "Unable to load workspace tasks.",
    )
  }

  if (assignedRowsError) {
    if (
      isMissingOrganizationTaskAssigneesTableError(assignedRowsError) ||
      isMissingOrganizationTasksTableError(assignedRowsError) ||
      isMissingOrganizationProjectsTableError(assignedRowsError)
    ) {
      return {
        taskGroups: [],
        storageMode: "empty" as const,
        starterTaskCount: 0,
        hasAnyOrgTasks: false,
        canResetStarterData: false,
        canManageTasks: actor.canEdit,
        scope: "organization" as const,
        assigneeOptions,
        projectOptions,
      }
    }
    throw toMemberWorkspaceDataError(
      assignedRowsError,
      "Unable to load assigned workspace tasks.",
    )
  }

  const taskRows = organizationTaskRows ?? []
  const assigneeByTaskId = new Map(
    (assignedRows ?? [])
      .map((row) => row.organization_tasks?.id)
      .filter((id): id is string => Boolean(id))
      .map((taskId) => [taskId, actor.currentUser] as const),
  )
  const taskItems = mapTaskAssignmentRowsToItems(
    assignedRows ?? [],
    assigneeByTaskId,
    actor.canEdit,
  )
  const starterTaskCount = taskRows.filter(
    (task) => task.created_source === "starter_seed",
  ).length

  return {
    taskGroups: mapTaskRowsToGroups(taskItems),
    storageMode: resolveMemberWorkspaceStorageMode(taskRows),
    starterTaskCount,
    hasAnyOrgTasks: taskRows.length > 0,
    canResetStarterData: actor.canEdit && starterTaskCount > 0,
    canManageTasks: actor.canEdit,
    scope: "organization" as const,
    assigneeOptions,
    projectOptions,
  }
}
