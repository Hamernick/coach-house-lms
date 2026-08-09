import type mapboxgl from "mapbox-gl"
import type { PublicMapMarkerRelevanceTier } from "@/lib/public-map/public-map-marker-relevance"

const PUBLIC_MAP_NO_SELECTION_FILTER_ID = "__public-map-no-selection__"

export function resolveVisiblePointFilter() {
  return ["!", ["has", "point_count"]] as mapboxgl.FilterSpecification
}

function resolveSelectedPointPredicate({
  activeSameLocationGroupKey,
  selectedOrganizationId,
}: {
  selectedOrganizationId: string | null
  activeSameLocationGroupKey?: string | null
}) {
  const selectedId = selectedOrganizationId ?? PUBLIC_MAP_NO_SELECTION_FILTER_ID
  const selectedGroupKey =
    activeSameLocationGroupKey ?? PUBLIC_MAP_NO_SELECTION_FILTER_ID

  return [
    "any",
    ["==", ["get", "organizationId"], selectedId],
    ["==", ["get", "sameLocationKey"], selectedGroupKey],
  ] as const
}

export function resolveUnselectedPointFilter({
  activeSameLocationGroupKey,
  selectedOrganizationId,
}: {
  selectedOrganizationId: string | null
  activeSameLocationGroupKey?: string | null
}) {
  if (!selectedOrganizationId && !activeSameLocationGroupKey) {
    return resolveVisiblePointFilter()
  }

  return [
    "all",
    ["!", ["has", "point_count"]],
    [
      "!",
      resolveSelectedPointPredicate({
        activeSameLocationGroupKey,
        selectedOrganizationId,
      }),
    ],
  ] as mapboxgl.FilterSpecification
}

export function resolveRelevantUnselectedPointFilter({
  activeSameLocationGroupKey,
  maxRelevanceTier,
  selectedOrganizationId,
}: {
  activeSameLocationGroupKey?: string | null
  maxRelevanceTier: PublicMapMarkerRelevanceTier
  selectedOrganizationId: string | null
}) {
  const unselectedFilter = resolveUnselectedPointFilter({
    activeSameLocationGroupKey,
    selectedOrganizationId,
  })
  const unselectedPredicates =
    unselectedFilter[0] === "all"
      ? unselectedFilter.slice(1)
      : [unselectedFilter]

  return [
    "all",
    ...unselectedPredicates,
    ["<=", ["get", "markerRelevanceTier"], maxRelevanceTier],
    ["!=", ["get", "isSaved"], true],
  ] as mapboxgl.FilterSpecification
}

export function resolveSavedPointFilter({
  activeSameLocationGroupKey,
  selectedOrganizationId,
}: {
  activeSameLocationGroupKey?: string | null
  selectedOrganizationId: string | null
}) {
  const unselectedFilter = resolveUnselectedPointFilter({
    activeSameLocationGroupKey,
    selectedOrganizationId,
  })
  const unselectedPredicates =
    unselectedFilter[0] === "all"
      ? unselectedFilter.slice(1)
      : [unselectedFilter]

  return [
    "all",
    ...unselectedPredicates,
    ["==", ["get", "isSaved"], true],
  ] as mapboxgl.FilterSpecification
}

export function resolveSameLocationBadgeFilter() {
  return [
    "all",
    ["!", ["has", "point_count"]],
    [">", ["get", "sameLocationCount"], 1],
  ] as mapboxgl.FilterSpecification
}

export function resolveSelectedPointFilter({
  selectedOrganizationId,
  activeSameLocationGroupKey,
}: {
  selectedOrganizationId: string | null
  activeSameLocationGroupKey?: string | null
}) {
  return [
    "all",
    ["!", ["has", "point_count"]],
    resolveSelectedPointPredicate({
      activeSameLocationGroupKey,
      selectedOrganizationId,
    }),
  ] as mapboxgl.FilterSpecification
}

export function resolveSelectedSameLocationBadgeFilter(
  selectedFilter: mapboxgl.FilterSpecification
) {
  return [
    "all",
    ...selectedFilter.slice(1),
    [">", ["get", "sameLocationCount"], 1],
  ] as mapboxgl.FilterSpecification
}
