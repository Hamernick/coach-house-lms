import { useMemo } from "react"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  buildPublicMapItems,
  type ExternalResourceMapItem,
} from "@/lib/public-map/resource-map-items"
import {
  buildPublicMapGroupFilterCounts,
  type PublicMapGroupFilterKey,
} from "./category-filter"
import { publicMapListItemMatchesQuery } from "./map-items-state"
import {
  buildPublicMapSearchIndex,
  filterPublicMapOrganizationIds,
} from "./search-index"

export function usePublicMapOrganizationById(
  organizations: PublicMapOrganization[]
) {
  return useMemo(
    () =>
      new Map(
        organizations.map(
          (organization) => [organization.id, organization] as const
        )
      ),
    [organizations]
  )
}

export function usePublicMapOrganizationFilterState({
  query,
  favorites,
  includeSeedResources,
  organizationById,
  organizations,
  resourceItems,
}: {
  activeGroup: PublicMapGroupFilterKey
  query: string
  favorites: string[]
  includeSeedResources: boolean
  organizationById: Map<string, PublicMapOrganization>
  organizations: PublicMapOrganization[]
  resourceItems?: ExternalResourceMapItem[]
}) {
  const searchIndex = useMemo(
    () => buildPublicMapSearchIndex(organizations),
    [organizations]
  )
  const queryMatchedOrganizations = useMemo(() => {
    const filteredIds = filterPublicMapOrganizationIds({
      searchIndex,
      query,
      appliedBounds: null,
      favorites,
      activeGroup: "all",
    })
    return filteredIds
      .map((organizationId) => organizationById.get(organizationId) ?? null)
      .filter((organization): organization is PublicMapOrganization =>
        Boolean(organization)
      )
  }, [favorites, organizationById, query, searchIndex])
  const countItems = useMemo(
    () =>
      buildPublicMapItems({
        organizations: queryMatchedOrganizations,
        includeSeedItems: includeSeedResources,
        resourceItems,
      }).filter((item) =>
        publicMapListItemMatchesQuery({ item, query })
      ),
    [includeSeedResources, query, queryMatchedOrganizations, resourceItems]
  )
  const groupCounts = useMemo(
    () => buildPublicMapGroupFilterCounts(countItems),
    [countItems]
  )
  const filteredOrganizations = queryMatchedOrganizations

  return { filteredOrganizations, groupCounts }
}
