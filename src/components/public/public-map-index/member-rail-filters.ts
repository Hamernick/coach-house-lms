import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  buildPlatformOrganizationMapItem,
  publicMapItemMatchesGroupFilter,
  type ExternalResourceMapItem,
} from "@/lib/public-map/resource-map-items"

import type { PublicMapGroupFilterKey } from "./category-filter"
import { publicMapListItemMatchesQuery } from "./map-items-state"
import type { PublicMapResourceGuide } from "./resource-guides"
import {
  buildPublicMapSearchIndex,
  filterPublicMapOrganizationIds,
} from "./search-index"

export function filterPublicMapSavedResources({
  activeGroup,
  query,
  savedResources,
}: {
  activeGroup: PublicMapGroupFilterKey
  query: string
  savedResources: ExternalResourceMapItem[]
}) {
  return savedResources.filter(
    (item) =>
      publicMapListItemMatchesQuery({ item, query }) &&
      publicMapItemMatchesGroupFilter({ activeGroup, item })
  )
}

export function filterPublicMapSavedGuides({
  activeGroup,
  guides,
  query,
}: {
  activeGroup: PublicMapGroupFilterKey
  guides: PublicMapResourceGuide[]
  query: string
}) {
  const normalizedQuery = query.trim().toLowerCase()
  return guides.filter((guide) => {
    const matchesQuery =
      !normalizedQuery ||
      [guide.title, guide.subtitle, guide.kicker].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    const matchesGroup =
      activeGroup === "all" ||
      guide.primaryResourceCategory === activeGroup ||
      guide.primaryResourceCategory.startsWith(`${activeGroup}_`)
    return matchesQuery && matchesGroup
  })
}

export function filterPublicMapSavedOrganizations({
  activeGroup,
  query,
  savedOrganizations,
}: {
  activeGroup: PublicMapGroupFilterKey
  query: string
  savedOrganizations: PublicMapOrganization[]
}) {
  if (savedOrganizations.length === 0) return []

  const savedOrganizationById = new Map(
    savedOrganizations.map((organization) => [organization.id, organization])
  )
  const filteredIds = filterPublicMapOrganizationIds({
    searchIndex: buildPublicMapSearchIndex(savedOrganizations),
    query,
    appliedBounds: null,
    favorites: savedOrganizations.map((organization) => organization.id),
    activeGroup: "all",
    sortByFavorites: false,
  })

  return filteredIds
    .map((organizationId) => savedOrganizationById.get(organizationId) ?? null)
    .filter((organization): organization is PublicMapOrganization =>
      Boolean(organization)
    )
    .filter((organization) =>
      publicMapItemMatchesGroupFilter({
        activeGroup,
        item: buildPlatformOrganizationMapItem(organization),
      })
    )
}
