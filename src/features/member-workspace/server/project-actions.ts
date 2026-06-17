"use server"

import { revalidatePath } from "next/cache"

import type { Database } from "@/lib/supabase"
import type { MemberWorkspaceCreateProjectFormInput } from "../types"
import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import { loadOrganizationProjectStarterIdMap } from "./project-persistence"
import { buildStarterOrganizationProjects } from "./project-starter-data"
import {
  buildStarterOrganizationTaskAssignees,
  buildStarterOrganizationTasks,
} from "./task-starter-data"
import { MEMBER_WORKSPACE_STARTER_VERSION } from "./starter-data"
import { normalizeMemberWorkspaceCreateProjectInput } from "./project-create-input"
import { ensureMemberWorkspaceFeatureAccess } from "./access"
import {
  isMissingOrganizationProjectOverviewDocumentsTableError,
  isMissingOrganizationProjectsTableError,
  isMissingOrganizationWorkspaceStarterStateTableError,
} from "./table-errors"
import { upsertProjectOverviewDocument } from "./project-overview-documents"

export type MemberWorkspaceResetStarterProjectsResult =
  | { ok: true }
  | { error: string }

export type MemberWorkspaceClearStarterDataResult =
  | { ok: true }
  | { error: string }

export type MemberWorkspaceCreateProjectResult =
  | { ok: true; id: string }
  | { error: string }

export type MemberWorkspaceDeleteProjectResult =
  | { ok: true; id: string }
  | { error: string }

type OrganizationProjectInsert =
  Database["public"]["Tables"]["organization_projects"]["Insert"]

type OrganizationProjectUpdate =
  Database["public"]["Tables"]["organization_projects"]["Update"]

const PLATFORM_ADMIN_PROJECT_MUTATION_ERROR =
  "That project action is not available for platform admins."
const OVERVIEW_DOCUMENTS_MIGRATION_ERROR =
  "Organization overview documents are not available until the latest workspace database migrations are applied."

function ensureProjectMutationAllowed(
  actor: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>,
  options: { allowPlatformAdmin?: boolean; platformAdminError?: string } = {}
) {
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (actor.isAdmin) {
    if (options.allowPlatformAdmin) return null
    return {
      error:
        options.platformAdminError ?? PLATFORM_ADMIN_PROJECT_MUTATION_ERROR,
    } as const
  }

  if (!actor.canEdit) {
    return { error: "Only organization editors can manage projects." } as const
  }

  return null
}

async function resolveProjectCreateOrgId({
  actor,
  input,
}: {
  actor: Awaited<ReturnType<typeof resolveMemberWorkspaceActorContext>>
  input: MemberWorkspaceCreateProjectFormInput
}): Promise<{ ok: true; orgId: string } | { error: string }> {
  if (actor.isAdmin) {
    const orgId = input.orgId?.trim()
    if (!orgId) {
      return { error: "Choose an organization for the project." }
    }

    const { data, error } = await actor.supabase
      .from("organizations")
      .select("user_id")
      .eq("user_id", orgId)
      .maybeSingle<{ user_id: string }>()

    if (error || !data) {
      return { error: "Choose a valid organization for the project." }
    }

    return { ok: true, orgId }
  }

  if (!actor.canEdit) {
    return { error: "Only organization editors can create projects." }
  }

  const requestedOrgId = input.orgId?.trim()
  if (requestedOrgId && requestedOrgId !== actor.activeOrg.orgId) {
    return {
      error: "You can only create projects for the active organization.",
    }
  }

  return { ok: true, orgId: actor.activeOrg.orgId }
}

export async function createMemberWorkspaceProjectAction(
  input: MemberWorkspaceCreateProjectFormInput
): Promise<MemberWorkspaceCreateProjectResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const mutationAccessResult = ensureProjectMutationAllowed(actor, {
    allowPlatformAdmin: true,
  })
  if (mutationAccessResult) {
    return mutationAccessResult
  }
  const targetOrg = await resolveProjectCreateOrgId({ actor, input })
  if ("error" in targetOrg) return targetOrg

  const normalized = normalizeMemberWorkspaceCreateProjectInput(input)
  if (!normalized.ok) {
    return { error: normalized.error }
  }

  const payload: OrganizationProjectInsert = {
    org_id: targetOrg.orgId,
    project_kind: "standard",
    name: normalized.value.name,
    description: normalized.value.description,
    status: normalized.value.status,
    priority: normalized.value.priority,
    progress: 0,
    start_date: normalized.value.startDate,
    end_date: normalized.value.endDate,
    client_name: normalized.value.clientName,
    type_label: normalized.value.typeLabel,
    duration_label: normalized.value.durationLabel,
    tags: normalized.value.tags,
    member_labels: normalized.value.memberLabels,
    task_count: 0,
    created_source: "user",
    created_by: actor.userId,
    updated_by: actor.userId,
  }

  const { data, error } = await actor.supabase
    .from("organization_projects")
    .insert(payload)
    .select("id")
    .single<{ id: string }>()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to create project." }
  }

  if (normalized.value.hasOverviewDocumentHtml) {
    const overviewDocumentError = await upsertProjectOverviewDocument({
      actorId: actor.userId,
      documentHtml: normalized.value.overviewDocumentHtml ?? "",
      orgId: targetOrg.orgId,
      projectId: data.id,
      supabase: actor.supabase,
    })

    if (overviewDocumentError) {
      if (
        isMissingOrganizationProjectOverviewDocumentsTableError(
          overviewDocumentError
        )
      ) {
        return { error: OVERVIEW_DOCUMENTS_MIGRATION_ERROR }
      }

      return { error: "Unable to save the overview document." }
    }
  }

  revalidatePath("/organizations")
  return { ok: true, id: data.id }
}

export async function updateMemberWorkspaceProjectAction(
  projectId: string,
  input: MemberWorkspaceCreateProjectFormInput
): Promise<MemberWorkspaceCreateProjectResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const mutationAccessResult = ensureProjectMutationAllowed(actor, {
    allowPlatformAdmin: true,
  })
  if (mutationAccessResult) {
    return mutationAccessResult
  }

  const normalized = normalizeMemberWorkspaceCreateProjectInput(input)
  if (!normalized.ok) {
    return { error: normalized.error }
  }

  const { data: existingProject, error: existingProjectError } =
    await actor.supabase
      .from("organization_projects")
      .select("id, org_id")
      .eq("id", projectId)
      .maybeSingle<{ id: string; org_id: string }>()

  if (existingProjectError || !existingProject) {
    if (
      existingProjectError &&
      isMissingOrganizationProjectsTableError(existingProjectError)
    ) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to find that project." }
  }

  if (!actor.isAdmin && existingProject.org_id !== actor.activeOrg.orgId) {
    return {
      error: "You can only update projects for the active organization.",
    }
  }

  const payload: OrganizationProjectUpdate = {
    name: normalized.value.name,
    description: normalized.value.description,
    status: normalized.value.status,
    priority: normalized.value.priority,
    start_date: normalized.value.startDate,
    end_date: normalized.value.endDate,
    client_name: normalized.value.clientName,
    type_label: normalized.value.typeLabel,
    duration_label: normalized.value.durationLabel,
    tags: normalized.value.tags,
    member_labels: normalized.value.memberLabels,
    updated_by: actor.userId,
  }

  const { error: updateError } = await actor.supabase
    .from("organization_projects")
    .update(payload)
    .eq("id", projectId)

  if (updateError) {
    if (isMissingOrganizationProjectsTableError(updateError)) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to update project." }
  }

  if (normalized.value.hasOverviewDocumentHtml) {
    const overviewDocumentError = await upsertProjectOverviewDocument({
      actorId: actor.userId,
      documentHtml: normalized.value.overviewDocumentHtml ?? "",
      orgId: existingProject.org_id,
      projectId,
      supabase: actor.supabase,
    })

    if (overviewDocumentError) {
      if (
        isMissingOrganizationProjectOverviewDocumentsTableError(
          overviewDocumentError
        )
      ) {
        return { error: OVERVIEW_DOCUMENTS_MIGRATION_ERROR }
      }

      return { error: "Unable to save the overview document." }
    }
  }

  revalidatePath("/organizations")
  revalidatePath(`/organizations/${projectId}`)
  return { ok: true, id: projectId }
}

export async function updateMemberWorkspaceProjectStatusAction(
  projectId: string,
  status: Database["public"]["Tables"]["organization_projects"]["Update"]["status"]
): Promise<MemberWorkspaceCreateProjectResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const mutationAccessResult = ensureProjectMutationAllowed(actor, {
    allowPlatformAdmin: true,
  })
  if (mutationAccessResult) {
    return mutationAccessResult
  }

  const { data: existingProject, error: existingProjectError } =
    await actor.supabase
      .from("organization_projects")
      .select("id, org_id")
      .eq("id", projectId)
      .maybeSingle<{ id: string; org_id: string }>()

  if (existingProjectError || !existingProject) {
    if (
      existingProjectError &&
      isMissingOrganizationProjectsTableError(existingProjectError)
    ) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to find that project." }
  }

  if (!actor.isAdmin && existingProject.org_id !== actor.activeOrg.orgId) {
    return {
      error: "You can only update projects for the active organization.",
    }
  }

  const { error: updateError } = await actor.supabase
    .from("organization_projects")
    .update({
      status,
      updated_by: actor.userId,
    })
    .eq("id", projectId)

  if (updateError) {
    if (isMissingOrganizationProjectsTableError(updateError)) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to update project status." }
  }

  revalidatePath("/organizations")
  revalidatePath(`/organizations/${projectId}`)
  return { ok: true, id: projectId }
}

export async function updateMemberWorkspaceProjectScheduleAction(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<MemberWorkspaceCreateProjectResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const mutationAccessResult = ensureProjectMutationAllowed(actor, {
    allowPlatformAdmin: true,
  })
  if (mutationAccessResult) {
    return mutationAccessResult
  }

  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) {
    return { error: "Choose a project." }
  }

  const normalizedStartDate = startDate.trim()
  const normalizedEndDate = endDate.trim()
  const parsedStartDate = new Date(`${normalizedStartDate}T00:00:00.000Z`)
  const parsedEndDate = new Date(`${normalizedEndDate}T00:00:00.000Z`)

  if (
    Number.isNaN(parsedStartDate.getTime()) ||
    Number.isNaN(parsedEndDate.getTime())
  ) {
    return { error: "Enter valid project dates." }
  }

  if (parsedEndDate.getTime() < parsedStartDate.getTime()) {
    return { error: "End date must be on or after the start date." }
  }

  const { data: existingProject, error: existingProjectError } =
    await actor.supabase
      .from("organization_projects")
      .select("id, org_id")
      .eq("id", normalizedProjectId)
      .maybeSingle<{ id: string; org_id: string }>()

  if (existingProjectError || !existingProject) {
    if (
      existingProjectError &&
      isMissingOrganizationProjectsTableError(existingProjectError)
    ) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to find that project." }
  }

  if (!actor.isAdmin && existingProject.org_id !== actor.activeOrg.orgId) {
    return {
      error: "You can only update projects for the active organization.",
    }
  }

  const { error: updateError } = await actor.supabase
    .from("organization_projects")
    .update({
      start_date: normalizedStartDate,
      end_date: normalizedEndDate,
      updated_by: actor.userId,
    })
    .eq("id", normalizedProjectId)

  if (updateError) {
    if (isMissingOrganizationProjectsTableError(updateError)) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to update project dates." }
  }

  revalidatePath("/organizations")
  revalidatePath(`/organizations/${normalizedProjectId}`)
  return { ok: true, id: normalizedProjectId }
}

export async function deleteMemberWorkspaceProjectAction(
  projectId: string
): Promise<MemberWorkspaceDeleteProjectResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const mutationAccessResult = ensureProjectMutationAllowed(actor, {
    allowPlatformAdmin: true,
  })
  if (mutationAccessResult) {
    return mutationAccessResult
  }

  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) {
    return { error: "Choose an organization to delete." }
  }

  const { data: existingProject, error: existingProjectError } =
    await actor.supabase
      .from("organization_projects")
      .select("id, org_id, project_kind, canonical_org_id")
      .eq("id", normalizedProjectId)
      .maybeSingle<{
        id: string
        org_id: string
        project_kind: string
        canonical_org_id: string | null
      }>()

  if (existingProjectError || !existingProject) {
    if (
      existingProjectError &&
      isMissingOrganizationProjectsTableError(existingProjectError)
    ) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to find that organization." }
  }

  if (!actor.isAdmin && existingProject.org_id !== actor.activeOrg.orgId) {
    return {
      error: "You can only delete organizations for the active organization.",
    }
  }

  if (
    existingProject.project_kind !== "standard" ||
    existingProject.canonical_org_id
  ) {
    return {
      error:
        "Canonical organization records cannot be deleted from this screen.",
    }
  }

  const { error: deleteError } = await actor.supabase
    .from("organization_projects")
    .delete()
    .eq("id", normalizedProjectId)
    .eq("project_kind", "standard")

  if (deleteError) {
    if (isMissingOrganizationProjectsTableError(deleteError)) {
      return {
        error:
          "Organizations are not available until the latest workspace database migrations are applied.",
      }
    }
    return { error: "Unable to delete organization." }
  }

  revalidatePath("/organizations")
  revalidatePath(`/organizations/${normalizedProjectId}`)
  return { ok: true, id: normalizedProjectId }
}

export async function resetMemberWorkspaceStarterProjectsAction(): Promise<MemberWorkspaceResetStarterProjectsResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (actor.isAdmin || !actor.canEdit) {
    return { error: "Only organization editors can reset starter data." }
  }

  const { error: deleteTasksError } = await actor.supabase
    .from("organization_tasks")
    .delete()
    .eq("org_id", actor.activeOrg.orgId)
    .eq("created_source", "starter_seed")

  if (deleteTasksError) {
    return { error: "Unable to clear starter tasks." }
  }

  const { error: deleteError } = await actor.supabase
    .from("organization_projects")
    .delete()
    .eq("org_id", actor.activeOrg.orgId)
    .eq("created_source", "starter_seed")

  if (deleteError) {
    return { error: "Unable to clear starter projects." }
  }

  const starterProjects = buildStarterOrganizationProjects({
    orgId: actor.activeOrg.orgId,
    actorId: actor.userId,
  })

  const { error: insertError } = await actor.supabase
    .from("organization_projects")
    .upsert(starterProjects, { onConflict: "org_id,starter_seed_key" })

  if (insertError) {
    return { error: "Unable to restore starter projects." }
  }

  const projectIdByStarterKey = await loadOrganizationProjectStarterIdMap({
    orgId: actor.activeOrg.orgId,
    supabase: actor.supabase,
  })

  const starterTasks = buildStarterOrganizationTasks({
    orgId: actor.activeOrg.orgId,
    actorId: actor.userId,
    projectIdByStarterKey,
  })

  const { data: upsertedTasks, error: starterTasksError } = await actor.supabase
    .from("organization_tasks")
    .upsert(starterTasks, { onConflict: "org_id,starter_seed_key" })
    .select("id, starter_seed_key")
    .returns<Array<{ id: string; starter_seed_key: string | null }>>()

  if (starterTasksError) {
    return { error: "Unable to restore starter tasks." }
  }

  const taskIdByStarterKey = new Map<string, string>()
  for (const row of upsertedTasks ?? []) {
    if (!row.starter_seed_key) continue
    taskIdByStarterKey.set(row.starter_seed_key, row.id)
  }

  const starterTaskAssignees = buildStarterOrganizationTaskAssignees({
    orgId: actor.activeOrg.orgId,
    actorId: actor.userId,
    assigneeUserId: actor.userId,
    taskIdByStarterKey,
  })

  const { error: starterTaskAssigneesError } = await actor.supabase
    .from("organization_task_assignees")
    .upsert(starterTaskAssignees, { onConflict: "task_id,user_id" })

  if (starterTaskAssigneesError) {
    return { error: "Unable to restore starter task assignments." }
  }

  const { error: starterStateError } = await actor.supabase
    .from("organization_workspace_starter_state")
    .upsert(
      {
        org_id: actor.activeOrg.orgId,
        seed_version: MEMBER_WORKSPACE_STARTER_VERSION,
        seeded_at: new Date().toISOString(),
        last_reset_at: new Date().toISOString(),
        updated_by: actor.userId,
      },
      { onConflict: "org_id" }
    )

  if (starterStateError) {
    return { error: "Unable to update starter state." }
  }

  revalidatePath("/organizations")
  revalidatePath("/tasks")
  return { ok: true }
}

export async function clearMemberWorkspaceStarterDataAction(): Promise<MemberWorkspaceClearStarterDataResult> {
  const actor = await resolveMemberWorkspaceActorContext()
  const featureAccess = ensureMemberWorkspaceFeatureAccess(actor)
  if (featureAccess) return featureAccess

  if (actor.isAdmin || !actor.canEdit) {
    return { error: "Only organization editors can clear demo data." }
  }

  const timestamp = new Date().toISOString()
  const { error: starterStateError } = await actor.supabase
    .from("organization_workspace_starter_state")
    .upsert(
      {
        org_id: actor.activeOrg.orgId,
        seed_version: MEMBER_WORKSPACE_STARTER_VERSION,
        seeded_at: timestamp,
        last_reset_at: timestamp,
        updated_by: actor.userId,
      },
      { onConflict: "org_id" }
    )

  if (
    starterStateError &&
    !isMissingOrganizationWorkspaceStarterStateTableError(starterStateError)
  ) {
    return { error: "Unable to update starter-data state." }
  }

  const { error: deleteTasksError } = await actor.supabase
    .from("organization_tasks")
    .delete()
    .eq("org_id", actor.activeOrg.orgId)
    .eq("created_source", "starter_seed")

  if (deleteTasksError) {
    return { error: "Unable to clear demo tasks." }
  }

  const { error: deleteProjectsError } = await actor.supabase
    .from("organization_projects")
    .delete()
    .eq("org_id", actor.activeOrg.orgId)
    .eq("project_kind", "standard")
    .eq("created_source", "starter_seed")

  if (deleteProjectsError) {
    return { error: "Unable to clear demo organizations." }
  }

  revalidatePath("/organizations")
  revalidatePath("/tasks")
  return { ok: true }
}
