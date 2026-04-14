import type { Database } from "@/lib/supabase"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { MemberWorkspaceAdminOrganizationSummary } from "@/features/member-workspace/types"
import { mapAdminOrganizationSummaryToProject } from "./admin-organization-overview"
import { organizationProjectSelectFields } from "./project-select"
import type { OrganizationProjectRecord } from "./project-starter-data"
import {
  isMissingOrganizationProjectsTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type OrganizationProjectInsert =
  Database["public"]["Tables"]["organization_projects"]["Insert"]
type OrganizationProjectUpdate =
  Database["public"]["Tables"]["organization_projects"]["Update"]

function stringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function buildCanonicalAdminOrganizationProjectFields(
  organization: MemberWorkspaceAdminOrganizationSummary,
) {
  const project = mapAdminOrganizationSummaryToProject(organization)

  return {
    org_id: organization.orgId,
    canonical_org_id: organization.orgId,
    project_kind: "organization_admin",
    name: project.name,
    description: project.description ?? null,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    start_date: project.startDate.toISOString().slice(0, 10),
    end_date: project.endDate.toISOString().slice(0, 10),
    client_name: project.client ?? null,
    type_label: project.typeLabel ?? null,
    duration_label: project.durationLabel ?? null,
    tags: project.tags,
    member_labels: project.members,
    task_count: project.taskCount,
    created_source: "system",
  } as const
}

export function buildCanonicalAdminOrganizationProject(
  organization: MemberWorkspaceAdminOrganizationSummary,
): OrganizationProjectInsert {
  return {
    ...buildCanonicalAdminOrganizationProjectFields(organization),
    created_by: organization.orgId,
    updated_by: organization.orgId,
  }
}

function buildCanonicalAdminOrganizationProjectUpdate(
  organization: MemberWorkspaceAdminOrganizationSummary,
): OrganizationProjectUpdate {
  return {
    ...buildCanonicalAdminOrganizationProjectFields(organization),
    updated_by: organization.orgId,
  }
}

function canonicalAdminProjectNeedsRefresh({
  organization,
  existing,
}: {
  organization: MemberWorkspaceAdminOrganizationSummary
  existing: OrganizationProjectRecord
}) {
  const desired = buildCanonicalAdminOrganizationProjectFields(organization)

  return (
    existing.org_id !== desired.org_id ||
    (existing.canonical_org_id ?? null) !== (desired.canonical_org_id ?? null) ||
    existing.project_kind !== desired.project_kind ||
    existing.name !== desired.name ||
    (existing.description ?? null) !== (desired.description ?? null) ||
    existing.status !== desired.status ||
    existing.priority !== desired.priority ||
    existing.progress !== desired.progress ||
    existing.start_date !== desired.start_date ||
    existing.end_date !== desired.end_date ||
    (existing.client_name ?? null) !== (desired.client_name ?? null) ||
    (existing.type_label ?? null) !== (desired.type_label ?? null) ||
    (existing.duration_label ?? null) !== (desired.duration_label ?? null) ||
    existing.task_count !== desired.task_count ||
    existing.created_source !== desired.created_source ||
    !stringArraysEqual(existing.tags ?? [], desired.tags ?? []) ||
    !stringArraysEqual(existing.member_labels ?? [], desired.member_labels ?? [])
  )
}

async function loadCanonicalAdminProjectsByOrgIds({
  orgIds,
  supabase,
}: {
  orgIds: string[]
  supabase: ServerSupabaseClient
}) {
  const { data, error } = await supabase
    .from("organization_projects")
    .select(organizationProjectSelectFields)
    .eq("project_kind", "organization_admin")
    .in("canonical_org_id", orgIds)
    .returns<OrganizationProjectRecord[]>()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) {
      return null
    }
    throw toMemberWorkspaceDataError(error, "Unable to load organization projects.")
  }

  return data ?? []
}

export async function ensureCanonicalAdminProjects({
  organizations,
  supabase,
}: {
  organizations: MemberWorkspaceAdminOrganizationSummary[]
  supabase: ServerSupabaseClient
}): Promise<OrganizationProjectRecord[] | null> {
  if (organizations.length === 0) {
    return []
  }

  const orgIds = organizations.map((organization) => organization.orgId)
  const existingRows = await loadCanonicalAdminProjectsByOrgIds({
    orgIds,
    supabase,
  })
  if (existingRows === null) return null

  const existingRowsByOrgId = new Map<string, OrganizationProjectRecord>()
  for (const row of existingRows) {
    existingRowsByOrgId.set(row.canonical_org_id ?? row.org_id, row)
  }

  const missingOrganizations = organizations.filter(
    (organization) => !existingRowsByOrgId.has(organization.orgId),
  )

  if (missingOrganizations.length > 0) {
    const payload = missingOrganizations.map(buildCanonicalAdminOrganizationProject)
    const { error: insertError } = await supabase
      .from("organization_projects")
      .insert(payload)

    if (insertError) {
      if (isMissingOrganizationProjectsTableError(insertError)) {
        return null
      }
      throw toMemberWorkspaceDataError(
        insertError,
        "Unable to synchronize organization projects.",
      )
    }

    const { data: insertedRows, error: insertedRowsError } = await supabase
      .from("organization_projects")
      .select(organizationProjectSelectFields)
      .eq("project_kind", "organization_admin")
      .in(
        "canonical_org_id",
        missingOrganizations.map((organization) => organization.orgId),
      )
      .returns<OrganizationProjectRecord[]>()

    if (insertedRowsError) {
      if (isMissingOrganizationProjectsTableError(insertedRowsError)) {
        return null
      }
      throw toMemberWorkspaceDataError(
        insertedRowsError,
        "Unable to load synchronized organization projects.",
      )
    }

    for (const row of insertedRows ?? []) {
      existingRowsByOrgId.set(row.canonical_org_id ?? row.org_id, row)
    }
  }

  const staleOrganizations = organizations.flatMap((organization) => {
    const existing = existingRowsByOrgId.get(organization.orgId)
    if (!existing) return []
    if (!canonicalAdminProjectNeedsRefresh({ organization, existing })) return []
    return [{ organization, existing }] as const
  })

  if (staleOrganizations.length > 0) {
    const updateResults = await Promise.all(
      staleOrganizations.map(async ({ organization, existing }) => {
        const { error } = await supabase
          .from("organization_projects")
          .update(buildCanonicalAdminOrganizationProjectUpdate(organization))
          .eq("id", existing.id)
        return error
      }),
    )

    const updateError = updateResults.find(Boolean)
    if (updateError) {
      if (isMissingOrganizationProjectsTableError(updateError)) {
        return null
      }
      throw toMemberWorkspaceDataError(
        updateError,
        "Unable to synchronize organization projects.",
      )
    }

    const synchronizedRows = await loadCanonicalAdminProjectsByOrgIds({
      orgIds,
      supabase,
    })
    if (synchronizedRows === null) return null

    const synchronizedRowsByOrgId = new Map<string, OrganizationProjectRecord>()
    for (const row of synchronizedRows) {
      synchronizedRowsByOrgId.set(row.canonical_org_id ?? row.org_id, row)
    }

    return organizations
      .map((organization) => synchronizedRowsByOrgId.get(organization.orgId) ?? null)
      .filter((row): row is OrganizationProjectRecord => Boolean(row))
  }

  return organizations
    .map((organization) => existingRowsByOrgId.get(organization.orgId) ?? null)
    .filter((row): row is OrganizationProjectRecord => Boolean(row))
}

export function attachCanonicalProjectIdsToOrganizations({
  canonicalProjects,
  organizations,
}: {
  canonicalProjects: OrganizationProjectRecord[] | null
  organizations: MemberWorkspaceAdminOrganizationSummary[]
}) {
  const projectIdByOrgId = new Map<string, string>()

  for (const project of canonicalProjects ?? []) {
    projectIdByOrgId.set(project.canonical_org_id ?? project.org_id, project.id)
  }

  return organizations.map((organization) => ({
    ...organization,
    canonicalProjectId: projectIdByOrgId.get(organization.orgId) ?? null,
  }))
}
