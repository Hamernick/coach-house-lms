import type mapboxgl from "mapbox-gl"

const PUBLIC_MAP_NO_SELECTION_FILTER_ID = "__public-map-no-selection__"

export function resolveVisiblePointFilter() {
  return ["!", ["has", "point_count"]] as mapboxgl.FilterSpecification
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
  const selectedId = selectedOrganizationId ?? PUBLIC_MAP_NO_SELECTION_FILTER_ID
  const selectedGroupKey =
    activeSameLocationGroupKey ?? PUBLIC_MAP_NO_SELECTION_FILTER_ID

  return [
    "all",
    ["!", ["has", "point_count"]],
    [
      "any",
      ["==", ["get", "organizationId"], selectedId],
      ["==", ["get", "sameLocationKey"], selectedGroupKey],
    ],
  ] as mapboxgl.FilterSpecification
}

export function resolveSelectedSameLocationBadgeFilter(
  selectedFilter: mapboxgl.FilterSpecification,
) {
  return [
    "all",
    ...selectedFilter.slice(1),
    [">", ["get", "sameLocationCount"], 1],
  ] as mapboxgl.FilterSpecification
}
