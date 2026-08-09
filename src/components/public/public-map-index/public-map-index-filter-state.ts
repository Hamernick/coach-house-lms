import { useMemo } from "react"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  buildPublicMapItems,
  publicMapItemMatchesGroupFilter,
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

export function usePublicMapFilteredOrganizations({
  deferredQuery,
  favorites,
  organizationById,
  organizations,
}: {
  deferredQuery: string
  favorites: string[]
  organizationById: Map<string, PublicMapOrganization>
  organizations: PublicMapOrganization[]
}) {
  const searchIndex = useMemo(
    () => buildPublicMapSearchIndex(organizations),
    [organizations]
  )
  return useMemo(() => {
    const filteredIds = filterPublicMapOrganizationIds({
      searchIndex,
      query: deferredQuery,
      appliedBounds: null,
      favorites,
      activeGroup: "all",
    })
    return filteredIds
      .map((organizationId) => organizationById.get(organizationId) ?? null)
      .filter((organization): organization is PublicMapOrganization =>
        Boolean(organization)
      )
  }, [deferredQuery, favorites, organizationById, searchIndex])
}

export function usePublicMapOrganizationFilterState({
  activeGroup,
  deferredQuery,
  favorites,
  includeSeedResources,
  organizationById,
  organizations,
  resourceItems,
}: {
  activeGroup: PublicMapGroupFilterKey
  deferredQuery: string
  favorites: string[]
  includeSeedResources: boolean
  organizationById: Map<string, PublicMapOrganization>
  organizations: PublicMapOrganization[]
  resourceItems?: ExternalResourceMapItem[]
}) {
  const queryMatchedOrganizations = usePublicMapFilteredOrganizations({
    deferredQuery,
    favorites,
    organizationById,
    organizations,
  })
  const countItems = useMemo(
    () =>
      buildPublicMapItems({
        organizations: queryMatchedOrganizations,
        includeSeedItems: includeSeedResources,
        resourceItems,
      }).filter((item) =>
        publicMapListItemMatchesQuery({ item, query: deferredQuery })
      ),
    [
      deferredQuery,
      includeSeedResources,
      queryMatchedOrganizations,
      resourceItems,
    ]
  )
  const groupCounts = useMemo(
    () => buildPublicMapGroupFilterCounts(countItems),
    [countItems]
  )
  const filteredItems = useMemo(
    () =>
      countItems.filter((item) =>
        publicMapItemMatchesGroupFilter({ activeGroup, item })
      ),
    [activeGroup, countItems]
  )
  const filteredOrganizations = queryMatchedOrganizations

  return { filteredItems, filteredOrganizations, groupCounts }
}
