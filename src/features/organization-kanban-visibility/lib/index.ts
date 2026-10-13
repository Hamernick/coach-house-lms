import type { OrganizationKanbanVisibilityMode } from "../types"

export const ORGANIZATION_KANBAN_VISIBILITY_VISIBLE = "visible"
export const ORGANIZATION_KANBAN_VISIBILITY_HIDDEN = "hidden"

type OrganizationProject = {
  organizationId?: string | null
  projectKind?: string
}

export function normalizeOrganizationKanbanVisibilityMode(
  value: string | null | undefined
): OrganizationKanbanVisibilityMode {
  return value === ORGANIZATION_KANBAN_VISIBILITY_HIDDEN
    ? ORGANIZATION_KANBAN_VISIBILITY_HIDDEN
    : ORGANIZATION_KANBAN_VISIBILITY_VISIBLE
}

export function applyOrganizationKanbanVisibilityToParams(
  params: URLSearchParams,
  mode: OrganizationKanbanVisibilityMode
) {
  if (mode === ORGANIZATION_KANBAN_VISIBILITY_VISIBLE) {
    params.delete("visibility")
  } else {
    params.set("visibility", mode)
  }
  return params
}

export function filterProjectsByOrganizationKanbanVisibility<
  T extends OrganizationProject,
>({
  hiddenOrganizationIds,
  mode,
  projects,
}: {
  hiddenOrganizationIds: ReadonlySet<string>
  mode: OrganizationKanbanVisibilityMode
  projects: T[]
}) {
  if (mode === ORGANIZATION_KANBAN_VISIBILITY_HIDDEN) {
    return projects.filter(
      (project) =>
        project.projectKind === "organization_admin" &&
        Boolean(
          project.organizationId &&
          hiddenOrganizationIds.has(project.organizationId)
        )
    )
  }

  return projects.filter(
    (project) =>
      !project.organizationId ||
      !hiddenOrganizationIds.has(project.organizationId)
  )
}

export function computeOrganizationKanbanVisibilityCounts({
  hiddenOrganizationIds,
  projects,
}: {
  hiddenOrganizationIds: ReadonlySet<string>
  projects: OrganizationProject[]
}) {
  const organizationIds = new Set(
    projects
      .filter(
        (project) =>
          project.projectKind === "organization_admin" && project.organizationId
      )
      .map((project) => project.organizationId as string)
  )
  let hidden = 0
  for (const organizationId of organizationIds) {
    if (hiddenOrganizationIds.has(organizationId)) hidden += 1
  }
  return {
    hidden,
    visible: organizationIds.size - hidden,
  }
}
