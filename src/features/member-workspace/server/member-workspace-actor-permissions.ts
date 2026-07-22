import {
  canAccessOrganizationInCoachScope,
  filterByOrganizationCoachScope,
  type OrganizationCoachActorScope,
} from "@/lib/organization-coach-scope"

export function actorCanAccessOrganizations(actor: {
  isAdmin: boolean
  canAccessOrganizations?: boolean
}) {
  return actor.canAccessOrganizations === true || actor.isAdmin
}

export function actorCanAccessOrganization(
  actor: {
    activeOrg?: { orgId: string }
    canAccessOrganizations?: boolean
    isAdmin: boolean
    organizationCoachScope?: OrganizationCoachActorScope
  },
  organizationId: string
) {
  if (!actorCanAccessOrganizations(actor)) {
    return actor.activeOrg?.orgId === organizationId
  }

  return canAccessOrganizationInCoachScope(
    actor.organizationCoachScope,
    organizationId
  )
}

export function filterOrganizationsForActor<T extends { orgId: string }>(
  actor: {
    canAccessOrganizations?: boolean
    isAdmin: boolean
    organizationCoachScope?: OrganizationCoachActorScope
  },
  organizations: T[]
) {
  if (!actorCanAccessOrganizations(actor)) return []
  return filterByOrganizationCoachScope(
    organizations,
    actor.organizationCoachScope
  )
}
