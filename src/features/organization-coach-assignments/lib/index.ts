import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
export {
  ALL_ORGANIZATION_COACH_SCOPE,
  canAccessOrganizationInCoachScope,
  filterByOrganizationCoachScope,
} from "@/lib/organization-coach-scope"
import type { OrganizationCoachOption } from "../types"
import type {
  OrganizationCoachAssignmentCoverage,
  OrganizationCoachFilterValue,
} from "../types"

export const ORGANIZATION_COACH_FILTER_ALL = "all"
export const ORGANIZATION_COACH_FILTER_UNASSIGNED = "unassigned"

export function getOrganizationCoachInitials(coach: OrganizationCoachOption) {
  return coach.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function normalizeOrganizationCoachFilter({
  coachOptions,
  value,
}: {
  coachOptions: OrganizationCoachOption[]
  value: string | null | undefined
}): OrganizationCoachFilterValue {
  if (value === ORGANIZATION_COACH_FILTER_UNASSIGNED) {
    return ORGANIZATION_COACH_FILTER_UNASSIGNED
  }
  if (coachOptions.some((coach) => coach.id === value)) {
    return value as string
  }
  return ORGANIZATION_COACH_FILTER_ALL
}

export function applyOrganizationCoachFilterToParams(
  params: URLSearchParams,
  value: OrganizationCoachFilterValue
) {
  if (value === ORGANIZATION_COACH_FILTER_ALL) {
    params.delete("coach")
  } else {
    params.set("coach", value)
  }
  return params
}

export function filterProjectsByOrganizationCoach({
  projects,
  value,
}: {
  projects: PlatformAdminDashboardLabProject[]
  value: OrganizationCoachFilterValue
}) {
  if (value === ORGANIZATION_COACH_FILTER_ALL) return projects

  return projects.filter((project) => {
    if (!project.organizationId) return false
    const coachId = project.organizationCoachAssignment?.coach.id ?? null
    return value === ORGANIZATION_COACH_FILTER_UNASSIGNED
      ? coachId === null
      : coachId === value
  })
}

export function computeOrganizationCoachAssignmentCoverage(
  projects: PlatformAdminDashboardLabProject[]
): OrganizationCoachAssignmentCoverage {
  const organizations = new Map<string, string | null>()
  for (const project of projects) {
    if (
      project.projectKind !== "organization_admin" ||
      !project.organizationId
    ) {
      continue
    }
    organizations.set(
      project.organizationId,
      project.organizationCoachAssignment?.coach.id ?? null
    )
  }

  const countByCoachId: Record<string, number> = {}
  let assigned = 0
  for (const coachId of organizations.values()) {
    if (!coachId) continue
    assigned += 1
    countByCoachId[coachId] = (countByCoachId[coachId] ?? 0) + 1
  }

  return {
    total: organizations.size,
    assigned,
    unassigned: organizations.size - assigned,
    countByCoachId,
  }
}
