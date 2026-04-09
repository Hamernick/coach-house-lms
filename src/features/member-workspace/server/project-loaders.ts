import {
  loadAdminOrganizationSummaries,
  mapAdminOrganizationSummaryToProject,
} from "./admin-organization-overview"
import { ensureCanonicalAdminProjects } from "./admin-projects"
import { loadAccessibleOrganizations } from "./load-accessible-organizations"
import {
  mapOrganizationProjectToViewModel,
  type OrganizationProjectRecord,
} from "./project-starter-data"
import { loadMemberWorkspacePersonOptionsForOrganizations } from "./person-options"
import { resolveMemberWorkspaceActorContext } from "./member-workspace-actor-context"
import { ensureStarterProjectsForOrg } from "./project-persistence"
import { organizationProjectSelectFields } from "./project-select"
import { resolveMemberWorkspaceStorageMode } from "./starter-data"
import {
  isMissingOrganizationProjectsTableError,
  toMemberWorkspaceDataError,
} from "./table-errors"

export async function loadMemberWorkspaceProjectsPage() {
  const actor = await resolveMemberWorkspaceActorContext()

  if (actor.isAdmin) {
    const organizations = await loadAdminOrganizationSummaries({
      supabase: actor.supabase,
    })
    const orgIds = organizations.map((organization) => organization.orgId)
    const organizationOptions = organizations.map((organization) => ({
      orgId: organization.orgId,
      name: organization.name,
    }))
    const [assigneeOptions, canonicalProjects, projectResult] = await Promise.all([
      loadMemberWorkspacePersonOptionsForOrganizations({
        orgIds,
        supabase: actor.supabase,
      }),
      ensureCanonicalAdminProjects({
        organizations,
        supabase: actor.supabase,
      }),
      orgIds.length > 0
        ? actor.supabase
            .from("organization_projects")
            .select(organizationProjectSelectFields)
            .in("org_id", orgIds)
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false })
            .returns<OrganizationProjectRecord[]>()
        : Promise.resolve({
            data: [] as OrganizationProjectRecord[],
            error: null,
          }),
    ])

    if (!canonicalProjects) {
      return {
        projects: organizations.map(mapAdminOrganizationSummaryToProject),
        storageMode: "custom" as const,
        starterProjectCount: 0,
        hasUserProjects: organizations.length > 0,
        canResetStarterData: false,
        canCreateProjects: false,
        scope: "platform-admin" as const,
        organizationOptions,
        assigneeOptions,
      }
    }

    const { data: allProjects, error } = projectResult

    if (error) {
      if (isMissingOrganizationProjectsTableError(error)) {
        return {
          projects: canonicalProjects.map(mapOrganizationProjectToViewModel),
          storageMode: "custom" as const,
          starterProjectCount: 0,
          hasUserProjects: canonicalProjects.length > 0,
          canResetStarterData: false,
          canCreateProjects: false,
          scope: "platform-admin" as const,
          organizationOptions,
          assigneeOptions,
        }
      }
      throw toMemberWorkspaceDataError(error, "Unable to load workspace projects.")
    }

    const rows = allProjects ?? []

    return {
      projects:
        rows.length > 0
          ? rows.map(mapOrganizationProjectToViewModel)
          : canonicalProjects.map(mapOrganizationProjectToViewModel),
      storageMode: "custom" as const,
      starterProjectCount: 0,
      hasUserProjects: rows.length > 0 || canonicalProjects.length > 0,
      canResetStarterData: false,
      canCreateProjects: true,
      scope: "platform-admin" as const,
      organizationOptions,
      assigneeOptions,
    }
  }

  const accessibleOrganizations = await loadAccessibleOrganizations(
    actor.supabase,
    actor.userId,
  )
  const activeOrganizationOption =
    accessibleOrganizations.find(
      (organization) => organization.orgId === actor.activeOrg.orgId,
    ) ?? null
  const organizationOptions = activeOrganizationOption
    ? [{ orgId: activeOrganizationOption.orgId, name: activeOrganizationOption.name }]
    : [{ orgId: actor.activeOrg.orgId, name: "Active organization" }]
  const [, assigneeOptions] = await Promise.all([
    ensureStarterProjectsForOrg({
      canEdit: actor.canEdit,
      orgId: actor.activeOrg.orgId,
      userId: actor.userId,
      supabase: actor.supabase,
    }),
    loadMemberWorkspacePersonOptionsForOrganizations({
      orgIds: [actor.activeOrg.orgId],
      supabase: actor.supabase,
    }),
  ])

  const { data: projects, error } = await actor.supabase
    .from("organization_projects")
    .select(organizationProjectSelectFields)
    .eq("org_id", actor.activeOrg.orgId)
    .eq("project_kind", "standard")
    .neq("created_source", "system")
    .order("start_date", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<OrganizationProjectRecord[]>()

  if (error) {
    if (isMissingOrganizationProjectsTableError(error)) {
      return {
        projects: [],
        storageMode: "empty" as const,
        starterProjectCount: 0,
      hasUserProjects: false,
      canResetStarterData: false,
      canCreateProjects: actor.canEdit,
      scope: "organization" as const,
      organizationOptions,
      assigneeOptions,
    }
  }
    throw toMemberWorkspaceDataError(error, "Unable to load workspace projects.")
  }

  const rows = projects ?? []
  const storageMode = resolveMemberWorkspaceStorageMode(rows)
  const starterProjectCount = rows.filter(
    (project) => project.created_source === "starter_seed",
  ).length

  return {
    projects: rows.map(mapOrganizationProjectToViewModel),
    storageMode,
    starterProjectCount,
    hasUserProjects: rows.some((project) => project.created_source !== "starter_seed"),
    canResetStarterData: actor.canEdit && starterProjectCount > 0,
    canCreateProjects: actor.canEdit,
    scope: "organization" as const,
    organizationOptions,
    assigneeOptions,
  }
}
