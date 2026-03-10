"use server"

import { canEditOrganization } from "@/lib/organization/active-org"

import {
  asWorkspaceObjectiveActionError,
  mapLegacyTrackerStateToObjectiveCollection,
  normalizeWorkspaceObjectiveCreateInput,
  normalizeWorkspaceObjectiveStatusUpdateInput,
  type WorkspaceObjectiveActionResult,
  type WorkspaceObjectiveCollection,
  type WorkspaceObjectiveCreateInput,
  type WorkspaceObjectiveRecord,
  type WorkspaceObjectiveStatusUpdateInput,
} from "@/features/workspace-objectives"

import {
  isMissingTableError,
  mapObjectiveGroupRow,
  mapObjectiveRowWithoutRelations,
  mapObjectiveRows,
  resolveWorkspaceObjectiveActorContext,
  WORKSPACE_OBJECTIVE_GROUP_ROW_SELECT,
  WORKSPACE_OBJECTIVE_ROW_SELECT,
  type ObjectiveAssigneeRow,
  type ObjectiveGroupRow,
  type ObjectiveLinkRow,
  type ObjectiveRow,
} from "./workspace-objectives-actions-helpers"

export async function loadWorkspaceObjectivesAction(): Promise<
  WorkspaceObjectiveActionResult<WorkspaceObjectiveCollection>
> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  const { supabase, activeOrg, userId } = actor

  const [groupsResult, objectivesResult, assigneesResult, linksResult] = await Promise.all([
    supabase
      .from("organization_workspace_objective_groups")
      .select(WORKSPACE_OBJECTIVE_GROUP_ROW_SELECT)
      .eq("org_id", activeOrg.orgId)
      .order("created_at", { ascending: true })
      .returns<ObjectiveGroupRow[]>(),
    supabase
      .from("organization_workspace_objectives")
      .select(WORKSPACE_OBJECTIVE_ROW_SELECT)
      .eq("org_id", activeOrg.orgId)
      .order("updated_at", { ascending: false })
      .returns<ObjectiveRow[]>(),
    supabase
      .from("organization_workspace_objective_assignees")
      .select("objective_id, user_id, role, created_by, created_at")
      .eq("org_id", activeOrg.orgId)
      .returns<ObjectiveAssigneeRow[]>(),
    supabase
      .from("organization_workspace_objective_links")
      .select("id, objective_id, card_id, entity_type, entity_id, link_kind, created_by, created_at")
      .eq("org_id", activeOrg.orgId)
      .returns<ObjectiveLinkRow[]>(),
  ])

  const missingObjectivesTables =
    isMissingTableError(groupsResult.error, "organization_workspace_objective_groups") ||
    isMissingTableError(objectivesResult.error, "organization_workspace_objectives") ||
    isMissingTableError(assigneesResult.error, "organization_workspace_objective_assignees") ||
    isMissingTableError(linksResult.error, "organization_workspace_objective_links")

  if (missingObjectivesTables) {
    const boardResult = await supabase
      .from("organization_workspace_boards")
      .select("state")
      .eq("org_id", activeOrg.orgId)
      .maybeSingle<{ state: unknown }>()

    if (boardResult.error) {
      return asWorkspaceObjectiveActionError("Unable to load objectives.")
    }

    return {
      ok: true,
      data: mapLegacyTrackerStateToObjectiveCollection({
        orgId: activeOrg.orgId,
        actorId: userId,
        state: boardResult.data?.state,
      }),
    }
  }

  if (groupsResult.error || objectivesResult.error || assigneesResult.error || linksResult.error) {
    return asWorkspaceObjectiveActionError("Unable to load objectives.")
  }

  const objectiveRows = objectivesResult.data ?? []
  if (objectiveRows.length === 0) {
    const boardResult = await supabase
      .from("organization_workspace_boards")
      .select("state")
      .eq("org_id", activeOrg.orgId)
      .maybeSingle<{ state: unknown }>()

    if (!boardResult.error) {
      const fallback = mapLegacyTrackerStateToObjectiveCollection({
        orgId: activeOrg.orgId,
        actorId: userId,
        state: boardResult.data?.state,
      })
      if (fallback.loadedFrom === "legacy_tracker") {
        return { ok: true, data: fallback }
      }
    }
  }

  return {
    ok: true,
    data: {
      groups: (groupsResult.data ?? []).map(mapObjectiveGroupRow),
      objectives: mapObjectiveRows({
        objectiveRows,
        assigneeRows: assigneesResult.data ?? [],
        linkRows: linksResult.data ?? [],
      }),
      loadedFrom: "normalized",
    },
  }
}

export async function createWorkspaceObjectiveGroupAction({
  title,
}: {
  title: string
}): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveCollection["groups"][number]>> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  if (!canEditOrganization(actor.activeOrg.role)) {
    return asWorkspaceObjectiveActionError("Only owner, admin, or staff can create categories.")
  }

  const normalizedTitle = title.trim()
  if (!normalizedTitle) {
    return asWorkspaceObjectiveActionError("Category title is required.")
  }

  const { data, error } = await actor.supabase
    .from("organization_workspace_objective_groups")
    .insert({
      org_id: actor.activeOrg.orgId,
      title: normalizedTitle,
      kind: "custom",
      source_type: "none",
      created_by: actor.userId,
    })
    .select(WORKSPACE_OBJECTIVE_GROUP_ROW_SELECT)
    .maybeSingle<ObjectiveGroupRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to create category.")
  }

  return {
    ok: true,
    data: mapObjectiveGroupRow(data),
  }
}

export async function setWorkspaceObjectiveGroupArchivedAction({
  groupId,
  archived,
}: {
  groupId: string
  archived: boolean
}): Promise<WorkspaceObjectiveActionResult<{ groupId: string; archived: boolean }>> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  if (!canEditOrganization(actor.activeOrg.role)) {
    return asWorkspaceObjectiveActionError("Only owner, admin, or staff can archive categories.")
  }

  const normalizedGroupId = groupId.trim()
  if (!normalizedGroupId) return asWorkspaceObjectiveActionError("Category ID is required.")

  const { error } = await actor.supabase
    .from("organization_workspace_objective_groups")
    .update({
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("org_id", actor.activeOrg.orgId)
    .eq("id", normalizedGroupId)

  if (error) {
    return asWorkspaceObjectiveActionError("Unable to update category archive state.")
  }

  return {
    ok: true,
    data: {
      groupId: normalizedGroupId,
      archived,
    },
  }
}

export async function createWorkspaceObjectiveAction(
  input: WorkspaceObjectiveCreateInput,
): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveRecord>> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  if (!canEditOrganization(actor.activeOrg.role)) {
    return asWorkspaceObjectiveActionError("Only owner, admin, or staff can create objectives.")
  }

  const normalized = normalizeWorkspaceObjectiveCreateInput(input)
  if (!normalized.title) {
    return asWorkspaceObjectiveActionError("Objective title is required.")
  }

  const { data, error } = await actor.supabase
    .from("organization_workspace_objectives")
    .insert({
      org_id: actor.activeOrg.orgId,
      group_id: normalized.groupId ?? null,
      title: normalized.title,
      description: normalized.description ?? null,
      priority: normalized.priority ?? "normal",
      due_at: normalized.dueAt ?? null,
      status: "todo",
      kind: "custom",
      source_type: "custom",
      created_by: actor.userId,
      updated_by: actor.userId,
    })
    .select(WORKSPACE_OBJECTIVE_ROW_SELECT)
    .maybeSingle<ObjectiveRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to create objective.")
  }

  return {
    ok: true,
    data: mapObjectiveRowWithoutRelations(data),
  }
}

export async function setWorkspaceObjectiveAssigneesAction({
  objectiveId,
  userIds,
}: {
  objectiveId: string
  userIds: string[]
}): Promise<WorkspaceObjectiveActionResult<{ objectiveId: string; userIds: string[] }>> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  if (!canEditOrganization(actor.activeOrg.role)) {
    return asWorkspaceObjectiveActionError("Only owner, admin, or staff can assign objectives.")
  }

  const normalizedObjectiveId = objectiveId.trim()
  if (!normalizedObjectiveId) {
    return asWorkspaceObjectiveActionError("Objective ID is required.")
  }

  const uniqueUserIds = Array.from(
    new Set(
      userIds
        .map((userId) => userId.trim())
        .filter((userId) => userId.length > 0),
    ),
  )

  const objectiveResult = await actor.supabase
    .from("organization_workspace_objectives")
    .select("id")
    .eq("org_id", actor.activeOrg.orgId)
    .eq("id", normalizedObjectiveId)
    .maybeSingle<{ id: string }>()

  if (objectiveResult.error || !objectiveResult.data) {
    return asWorkspaceObjectiveActionError("Unable to find objective.")
  }

  const membershipsResult = await actor.supabase
    .from("organization_memberships")
    .select("member_id")
    .eq("org_id", actor.activeOrg.orgId)
    .returns<Array<{ member_id: string }>>()

  if (membershipsResult.error) {
    return asWorkspaceObjectiveActionError("Unable to load workspace members.")
  }

  const assignableUserIds = new Set<string>([
    actor.activeOrg.orgId,
    ...(membershipsResult.data ?? []).map((membership) => membership.member_id),
  ])
  const nextUserIds = uniqueUserIds.filter((userId) => assignableUserIds.has(userId))

  const { error: clearError } = await actor.supabase
    .from("organization_workspace_objective_assignees")
    .delete()
    .eq("org_id", actor.activeOrg.orgId)
    .eq("objective_id", normalizedObjectiveId)

  if (clearError) {
    return asWorkspaceObjectiveActionError("Unable to reset objective assignees.")
  }

  if (nextUserIds.length > 0) {
    const { error: insertError } = await actor.supabase
      .from("organization_workspace_objective_assignees")
      .insert(
        nextUserIds.map((userId) => ({
          objective_id: normalizedObjectiveId,
          org_id: actor.activeOrg.orgId,
          user_id: userId,
          role: "assignee" as const,
          created_by: actor.userId,
        })),
      )

    if (insertError) {
      return asWorkspaceObjectiveActionError("Unable to assign objective.")
    }
  }

  return {
    ok: true,
    data: {
      objectiveId: normalizedObjectiveId,
      userIds: nextUserIds,
    },
  }
}

export async function setWorkspaceObjectiveDetailsAction({
  objectiveId,
  title,
  description,
  priority,
  dueAt,
  groupId,
}: {
  objectiveId: string
  title: string
  description: string | null
  priority: "low" | "normal" | "high" | "critical"
  dueAt: string | null
  groupId: string | null
}): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveRecord>> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  if (!canEditOrganization(actor.activeOrg.role)) {
    return asWorkspaceObjectiveActionError("Only owner, admin, or staff can update objectives.")
  }

  const normalizedObjectiveId = objectiveId.trim()
  const normalizedTitle = title.trim()
  if (!normalizedObjectiveId) {
    return asWorkspaceObjectiveActionError("Objective ID is required.")
  }
  if (!normalizedTitle) {
    return asWorkspaceObjectiveActionError("Objective title is required.")
  }

  const normalizedDescription = description?.trim() ? description.trim() : null
  const normalizedDueAt = dueAt?.trim() ? dueAt : null
  const normalizedGroupId = groupId?.trim() ? groupId.trim() : null
  const normalizedPriority =
    priority === "low" || priority === "high" || priority === "critical" ? priority : "normal"

  const { data, error } = await actor.supabase
    .from("organization_workspace_objectives")
    .update({
      title: normalizedTitle,
      description: normalizedDescription,
      priority: normalizedPriority,
      due_at: normalizedDueAt,
      group_id: normalizedGroupId,
      updated_by: actor.userId,
    })
    .eq("org_id", actor.activeOrg.orgId)
    .eq("id", normalizedObjectiveId)
    .select(WORKSPACE_OBJECTIVE_ROW_SELECT)
    .maybeSingle<ObjectiveRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to update objective.")
  }

  return {
    ok: true,
    data: mapObjectiveRowWithoutRelations(data),
  }
}

export async function setWorkspaceObjectiveStatusAction(
  input: WorkspaceObjectiveStatusUpdateInput,
): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveRecord>> {
  const actor = await resolveWorkspaceObjectiveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  if (!canEditOrganization(actor.activeOrg.role)) {
    return asWorkspaceObjectiveActionError("Only owner, admin, or staff can update objective status.")
  }

  const normalized = normalizeWorkspaceObjectiveStatusUpdateInput(input)
  if (!normalized.objectiveId) {
    return asWorkspaceObjectiveActionError("Objective ID is required.")
  }

  const completedAt = normalized.status === "done" ? new Date().toISOString() : null
  const { data, error } = await actor.supabase
    .from("organization_workspace_objectives")
    .update({
      status: normalized.status,
      completed_at: completedAt,
      updated_by: actor.userId,
    })
    .eq("org_id", actor.activeOrg.orgId)
    .eq("id", normalized.objectiveId)
    .select(WORKSPACE_OBJECTIVE_ROW_SELECT)
    .maybeSingle<ObjectiveRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to update objective status.")
  }

  return {
    ok: true,
    data: mapObjectiveRowWithoutRelations(data),
  }
}
