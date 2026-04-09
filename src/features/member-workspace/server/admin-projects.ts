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

export function buildCanonicalAdminOrganizationProject(
  organization: MemberWorkspaceAdminOrganizationSummary,
): OrganizationProjectInsert {
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
    created_by: organization.orgId,
    updated_by: organization.orgId,
  }
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
  const { data: existingRows, error: existingError } = await supabase
    .from("organization_projects")
    .select(organizationProjectSelectFields)
    .eq("project_kind", "organization_admin")
    .in("canonical_org_id", orgIds)
    .returns<OrganizationProjectRecord[]>()

  if (existingError) {
    if (isMissingOrganizationProjectsTableError(existingError)) {
      return null
    }
    throw toMemberWorkspaceDataError(
      existingError,
      "Unable to load organization projects.",
    )
  }

  const existingRowsByOrgId = new Map<string, OrganizationProjectRecord>()
  for (const row of existingRows ?? []) {
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
