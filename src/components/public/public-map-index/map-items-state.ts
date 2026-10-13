import {
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import {
  buildPublicMapItems,
  publicMapItemMatchesGroupFilter,
  resolvePublicMapItemSelectableId,
  type ExternalResourceMapItem,
  type PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import {
  PUBLIC_MAP_RESOURCE_CATEGORY_LABELS,
  type PublicMapResourceCategoryKey,
  type PublicMapResourceTopLevelCategoryKey,
} from "@/lib/public-map/resource-categories"

type PublicMapGroupFilterKey = PublicMapResourceTopLevelCategoryKey | "all"

export type PublicMapListItem = PublicMapItem

export function buildPublicMapSelectableItemMap(items: PublicMapItem[]) {
  return new Map(
    items.map((item) => [resolvePublicMapItemSelectableId(item), item] as const)
  )
}

export function usePublicMapSelectableItemMap(items: PublicMapItem[]) {
  return useMemo(() => buildPublicMapSelectableItemMap(items), [items])
}

function normalizePublicMapListSearchText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function buildPublicMapResourceCategorySearchText(
  categories: PublicMapResourceCategoryKey[] | null | undefined
) {
  return (categories ?? [])
    .map((category) => PUBLIC_MAP_RESOURCE_CATEGORY_LABELS[category])
    .join(" ")
}

function normalizePublicMapListEnumSearchText(
  value: string | null | undefined
) {
  return normalizePublicMapListSearchText(value?.replaceAll("_", " "))
}

const publicMapListItemSearchTextCache = new WeakMap<
  ExternalResourceMapItem,
  string
>()

function buildPublicMapExternalResourceSearchText(
  item: ExternalResourceMapItem
) {
  const cached = publicMapListItemSearchTextCache.get(item)
  if (cached !== undefined) return cached

  const searchText = [
    item.title,
    item.subtitle,
    item.description,
    item.address,
    item.city,
    item.state,
    item.country,
    item.sourceLabel,
    normalizePublicMapListEnumSearchText(item.verificationStatus),
    normalizePublicMapListEnumSearchText(item.visibility),
    buildPublicMapResourceCategorySearchText(item.resourceCategories),
  ]
    .map(normalizePublicMapListSearchText)
    .join("\n")

  publicMapListItemSearchTextCache.set(item, searchText)
  return searchText
}

export function warmPublicMapListItemSearchCache(
  items: ExternalResourceMapItem[]
) {
  for (const item of items) {
    buildPublicMapExternalResourceSearchText(item)
  }
}

export function publicMapListItemMatchesQuery({
  item,
  query,
}: {
  item: PublicMapListItem
  query: string
}) {
  const normalizedQuery = normalizePublicMapListSearchText(query)
  if (!normalizedQuery) return true
  if (item.itemType === "platform_organization") return true

  return buildPublicMapExternalResourceSearchText(item).includes(
    normalizedQuery
  )
}

export function buildPublicMapListItems({
  items,
  query,
}: {
  items: PublicMapItem[]
  query: string
}): PublicMapListItem[] {
  return items.filter((item) => publicMapListItemMatchesQuery({ item, query }))
}

export function usePublicMapListItems({
  items,
  query,
}: {
  items: PublicMapItem[]
  query: string
}) {
  return useMemo(
    () => buildPublicMapListItems({ items, query }),
    [items, query]
  )
}

export function resolvePublicMapListItemsFromSelectableIds({
  itemBySelectableId,
  selectableIds,
}: {
  itemBySelectableId: Map<string, PublicMapItem>
  selectableIds: string[]
}): PublicMapListItem[] {
  return selectableIds
    .map((selectableId) => itemBySelectableId.get(selectableId) ?? null)
    .filter((item): item is PublicMapListItem => item !== null)
}

export function buildFilteredPublicMapItems({
  activeGroup,
  filteredOrganizations,
  includeSeedResources,
  resourceItems = [],
}: {
  activeGroup: PublicMapGroupFilterKey
  filteredOrganizations: PublicMapOrganization[]
  includeSeedResources: boolean
  resourceItems?: ExternalResourceMapItem[]
}) {
  const items = buildPublicMapItems({
    organizations: filteredOrganizations,
    includeSeedItems: includeSeedResources,
    resourceItems,
  })

  return items.filter((item) =>
    publicMapItemMatchesGroupFilter({ activeGroup, item })
  )
}

export function useFilteredPublicMapItems({
  activeGroup,
  filteredOrganizations,
  includeSeedResources,
  resourceItems = [],
}: {
  activeGroup: PublicMapGroupFilterKey
  filteredOrganizations: PublicMapOrganization[]
  includeSeedResources: boolean
  resourceItems?: ExternalResourceMapItem[]
}) {
  return useMemo(
    () =>
      buildFilteredPublicMapItems({
        activeGroup,
        filteredOrganizations,
        includeSeedResources,
        resourceItems,
      }),
    [activeGroup, filteredOrganizations, includeSeedResources, resourceItems]
  )
}

export function usePublicMapSavedOrganizations({
  favorites,
  organizationById,
}: {
  favorites: string[]
  organizationById: Map<string, PublicMapOrganization>
}) {
  return useMemo(
    () =>
      favorites
        .map((organizationId) => organizationById.get(organizationId) ?? null)
        .filter((organization): organization is PublicMapOrganization =>
          Boolean(organization)
        ),
    [favorites, organizationById]
  )
}

export function usePublicMapCollectedResources({
  collectedResourceIds,
  resourceItems,
  retainMissingResources,
  setCollectedResourceIds,
}: {
  collectedResourceIds: string[]
  resourceItems: ExternalResourceMapItem[]
  retainMissingResources: boolean
  setCollectedResourceIds: Dispatch<SetStateAction<string[]>>
}) {
  const retainedResourcesRef = useRef<ExternalResourceMapItem[]>([])
  const savedResources = useMemo(() => {
    const resolvedResources = resolvePublicMapCollectedResources({
      collectedResourceIds,
      resourceItems,
      retainedResources: retainMissingResources
        ? retainedResourcesRef.current
        : [],
    })
    retainedResourcesRef.current = resolvedResources
    return resolvedResources
  }, [collectedResourceIds, resourceItems, retainMissingResources])

  const toggleCollectedResource = useCallback(
    (resourceId: string) => {
      setCollectedResourceIds((current) =>
        current.includes(resourceId)
          ? current.filter((entry) => entry !== resourceId)
          : [resourceId, ...current].slice(0, 120)
      )
    },
    [setCollectedResourceIds]
  )

  return {
    savedResources,
    toggleCollectedResource,
    unresolvedCollectedResourceCount:
      collectedResourceIds.length - savedResources.length,
  }
}

export function resolvePublicMapCollectedResources({
  collectedResourceIds,
  resourceItems,
  retainedResources = [],
}: {
  collectedResourceIds: string[]
  resourceItems: ExternalResourceMapItem[]
  retainedResources?: ExternalResourceMapItem[]
}) {
  const collectedResourceIdSet = new Set(collectedResourceIds)
  const resourceById = new Map(
    retainedResources
      .filter((item) => collectedResourceIdSet.has(item.id))
      .map((item) => [item.id, item] as const)
  )
  for (const item of resourceItems) {
    if (collectedResourceIdSet.has(item.id)) resourceById.set(item.id, item)
  }

  return collectedResourceIds.flatMap((resourceId) => {
    const item = resourceById.get(resourceId)
    return item ? [item] : []
  })
}
