"use server"

import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import {
  asWorkspaceObjectiveActionError,
  mapLegacyTrackerStateToObjectiveCollection,
  normalizeWorkspaceObjectiveCreateInput,
  normalizeWorkspaceObjectiveStatusUpdateInput,
} from "../lib"
import type {
  WorkspaceObjectiveActionResult,
  WorkspaceObjectiveCollection,
  WorkspaceObjectiveCreateInput,
  WorkspaceObjectiveRecord,
  WorkspaceObjectiveStatusUpdateInput,
} from "../types"

type ObjectiveGroupRow = {
  id: string
  org_id: string
  title: string
  kind: string
  source_type: string | null
  archived_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

type ObjectiveRow = {
  id: string
  org_id: string
  group_id: string | null
  title: string
  description: string | null
  status: string
  priority: string
  kind: string
  source_type: string
  source_key: string | null
  due_at: string | null
  completed_at: string | null
  position_rank: number
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

type ObjectiveAssigneeRow = {
  objective_id: string
  user_id: string
  role: string
  created_by: string
  created_at: string
}

type ObjectiveLinkRow = {
  id: string
  objective_id: string
  card_id: string
  entity_type: string | null
  entity_id: string | null
  link_kind: string
  created_by: string
  created_at: string
}

function isMissingTableError(error: unknown, tableName: string) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01" || record.code === "PGRST205") return true
  const message = typeof record.message === "string" ? record.message : ""
  const details = typeof record.details === "string" ? record.details : ""
  const hint = typeof record.hint === "string" ? record.hint : ""
  return message.includes(tableName) || details.includes(tableName) || hint.includes(tableName)
}

async function resolveActorContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    return { ok: false as const, error: "Unable to load user." }
  }
  if (!user) {
    return { ok: false as const, error: "You must be signed in." }
  }

  const activeOrg = await resolveActiveOrganization(supabase, user.id)
  return {
    ok: true as const,
    supabase,
    userId: user.id,
    activeOrg,
  }
}

function mapObjectiveRows({
  objectiveRows,
  assigneeRows,
  linkRows,
}: {
  objectiveRows: ObjectiveRow[]
  assigneeRows: ObjectiveAssigneeRow[]
  linkRows: ObjectiveLinkRow[]
}) {
  const assigneesByObjective = new Map<string, ObjectiveAssigneeRow[]>()
  for (const row of assigneeRows) {
    const existing = assigneesByObjective.get(row.objective_id)
    if (existing) existing.push(row)
    else assigneesByObjective.set(row.objective_id, [row])
  }

  const linksByObjective = new Map<string, ObjectiveLinkRow[]>()
  for (const row of linkRows) {
    const existing = linksByObjective.get(row.objective_id)
    if (existing) existing.push(row)
    else linksByObjective.set(row.objective_id, [row])
  }

  return objectiveRows.map<WorkspaceObjectiveRecord>((row) => ({
    id: row.id,
    orgId: row.org_id,
    groupId: row.group_id,
    title: row.title,
    description: row.description,
    status: row.status as WorkspaceObjectiveRecord["status"],
    priority: row.priority as WorkspaceObjectiveRecord["priority"],
    kind: row.kind as WorkspaceObjectiveRecord["kind"],
    sourceType: row.source_type as WorkspaceObjectiveRecord["sourceType"],
    sourceKey: row.source_key,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    positionRank: row.position_rank,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignees: (assigneesByObjective.get(row.id) ?? []).map((assignee) => ({
      objectiveId: assignee.objective_id,
      userId: assignee.user_id,
      role: assignee.role as WorkspaceObjectiveRecord["assignees"][number]["role"],
      createdBy: assignee.created_by,
      createdAt: assignee.created_at,
    })),
    links: (linksByObjective.get(row.id) ?? []).map((link) => ({
      id: link.id,
      objectiveId: link.objective_id,
      cardId: link.card_id as WorkspaceObjectiveRecord["links"][number]["cardId"],
      entityType: link.entity_type as WorkspaceObjectiveRecord["links"][number]["entityType"],
      entityId: link.entity_id,
      linkKind: link.link_kind as WorkspaceObjectiveRecord["links"][number]["linkKind"],
      createdBy: link.created_by,
      createdAt: link.created_at,
    })),
  }))
}

export async function loadWorkspaceObjectivesAction(): Promise<
  WorkspaceObjectiveActionResult<WorkspaceObjectiveCollection>
> {
  const actor = await resolveActorContext()
  if (!actor.ok) return asWorkspaceObjectiveActionError(actor.error)

  const { supabase, activeOrg, userId } = actor

  const [groupsResult, objectivesResult, assigneesResult, linksResult] = await Promise.all([
    supabase
      .from("organization_workspace_objective_groups")
      .select("id, org_id, title, kind, source_type, archived_at, created_by, created_at, updated_at")
      .eq("org_id", activeOrg.orgId)
      .order("created_at", { ascending: true })
      .returns<ObjectiveGroupRow[]>(),
    supabase
      .from("organization_workspace_objectives")
      .select(
        "id, org_id, group_id, title, description, status, priority, kind, source_type, source_key, due_at, completed_at, position_rank, created_by, updated_by, created_at, updated_at",
      )
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
      groups: (groupsResult.data ?? []).map((group) => ({
        id: group.id,
        orgId: group.org_id,
        title: group.title,
        kind: group.kind as WorkspaceObjectiveCollection["groups"][number]["kind"],
        sourceType: group.source_type as WorkspaceObjectiveCollection["groups"][number]["sourceType"],
        archivedAt: group.archived_at,
        createdBy: group.created_by,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      })),
      objectives: mapObjectiveRows({
        objectiveRows,
        assigneeRows: assigneesResult.data ?? [],
        linkRows: linksResult.data ?? [],
      }),
      loadedFrom: "normalized",
    },
  }
}

export async function createWorkspaceObjectiveAction(
  input: WorkspaceObjectiveCreateInput,
): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveRecord>> {
  const actor = await resolveActorContext()
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
    .select(
      "id, org_id, group_id, title, description, status, priority, kind, source_type, source_key, due_at, completed_at, position_rank, created_by, updated_by, created_at, updated_at",
    )
    .maybeSingle<ObjectiveRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to create objective.")
  }

  return {
    ok: true,
    data: {
      id: data.id,
      orgId: data.org_id,
      groupId: data.group_id,
      title: data.title,
      description: data.description,
      status: data.status as WorkspaceObjectiveRecord["status"],
      priority: data.priority as WorkspaceObjectiveRecord["priority"],
      kind: data.kind as WorkspaceObjectiveRecord["kind"],
      sourceType: data.source_type as WorkspaceObjectiveRecord["sourceType"],
      sourceKey: data.source_key,
      dueAt: data.due_at,
      completedAt: data.completed_at,
      positionRank: data.position_rank,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      assignees: [],
      links: [],
    },
  }
}

export async function createWorkspaceObjectiveGroupAction({
  title,
}: {
  title: string
}): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveCollection["groups"][number]>> {
  const actor = await resolveActorContext()
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
    .select("id, org_id, title, kind, source_type, archived_at, created_by, created_at, updated_at")
    .maybeSingle<ObjectiveGroupRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to create category.")
  }

  return {
    ok: true,
    data: {
      id: data.id,
      orgId: data.org_id,
      title: data.title,
      kind: data.kind as WorkspaceObjectiveCollection["groups"][number]["kind"],
      sourceType: data.source_type as WorkspaceObjectiveCollection["groups"][number]["sourceType"],
      archivedAt: data.archived_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  }
}

export async function setWorkspaceObjectiveGroupArchivedAction({
  groupId,
  archived,
}: {
  groupId: string
  archived: boolean
}): Promise<WorkspaceObjectiveActionResult<{ groupId: string; archived: boolean }>> {
  const actor = await resolveActorContext()
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

export async function setWorkspaceObjectiveStatusAction(
  input: WorkspaceObjectiveStatusUpdateInput,
): Promise<WorkspaceObjectiveActionResult<WorkspaceObjectiveRecord>> {
  const actor = await resolveActorContext()
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
    .select(
      "id, org_id, group_id, title, description, status, priority, kind, source_type, source_key, due_at, completed_at, position_rank, created_by, updated_by, created_at, updated_at",
    )
    .maybeSingle<ObjectiveRow>()

  if (error || !data) {
    return asWorkspaceObjectiveActionError("Unable to update objective status.")
  }

  return {
    ok: true,
    data: {
      id: data.id,
      orgId: data.org_id,
      groupId: data.group_id,
      title: data.title,
      description: data.description,
      status: data.status as WorkspaceObjectiveRecord["status"],
      priority: data.priority as WorkspaceObjectiveRecord["priority"],
      kind: data.kind as WorkspaceObjectiveRecord["kind"],
      sourceType: data.source_type as WorkspaceObjectiveRecord["sourceType"],
      sourceKey: data.source_key,
      dueAt: data.due_at,
      completedAt: data.completed_at,
      positionRank: data.position_rank,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      assignees: [],
      links: [],
    },
  }
}
