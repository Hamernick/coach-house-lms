import {
  buildPublicMapItemPointFeatures,
  type PublicMapPointFeature,
} from "@/lib/public-map/public-map-geojson"
import { buildPublicMapMarkerRelevance } from "@/lib/public-map/public-map-marker-relevance"
import { resolvePublicMapResourceTopLevelCategory } from "@/lib/public-map/resource-categories"
import {
  buildPublicMapItems,
  type ExternalResourceMapItem,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

export const HOME_MAP_PREVIEW_MARKER_LIMIT = 18

function hashPreviewIdentity(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function isUsablePreviewFeature(feature: PublicMapPointFeature) {
  const [longitude, latitude] = feature.geometry.coordinates
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -85 &&
    latitude <= 85 &&
    !(longitude === 0 && latitude === 0)
  )
}

function squaredCoordinateDistance(
  first: readonly number[],
  second: readonly number[]
) {
  const averageLatitudeRadians =
    (((first[1] ?? 0) + (second[1] ?? 0)) / 2) * (Math.PI / 180)
  const longitudeDelta =
    ((first[0] ?? 0) - (second[0] ?? 0)) * Math.cos(averageLatitudeRadians)
  const latitudeDelta = (first[1] ?? 0) - (second[1] ?? 0)
  return longitudeDelta ** 2 + latitudeDelta ** 2
}

function resolveCandidateSpreadScore({
  candidate,
  centroid,
  selected,
}: {
  candidate: PublicMapPointFeature
  centroid: [number, number]
  selected: PublicMapPointFeature[]
}) {
  if (selected.length === 0) {
    return squaredCoordinateDistance(candidate.geometry.coordinates, centroid)
  }
  return Math.min(
    ...selected.map((feature) =>
      squaredCoordinateDistance(
        candidate.geometry.coordinates,
        feature.geometry.coordinates
      )
    )
  )
}

export function selectHomeMapPreviewFeatures(
  features: PublicMapPointFeature[],
  limit = HOME_MAP_PREVIEW_MARKER_LIMIT
) {
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(0, Math.trunc(limit))
    : HOME_MAP_PREVIEW_MARKER_LIMIT
  if (normalizedLimit === 0) return []

  const candidates = features
    .filter(isUsablePreviewFeature)
    .sort(
      (first, second) =>
        hashPreviewIdentity(first.properties.itemId) -
        hashPreviewIdentity(second.properties.itemId)
    )
  if (candidates.length === 0) return []

  const centroid = candidates.reduce<[number, number]>(
    (center, feature) => [
      center[0] + feature.geometry.coordinates[0] / candidates.length,
      center[1] + feature.geometry.coordinates[1] / candidates.length,
    ],
    [0, 0]
  )

  const selected: PublicMapPointFeature[] = []
  const selectedCategoryCounts = new Map<string, number>()
  while (selected.length < normalizedLimit && candidates.length > 0) {
    let bestIndex = 0
    let bestCategoryCount = Number.POSITIVE_INFINITY
    let bestScore = Number.NEGATIVE_INFINITY
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index]
      if (!candidate) continue
      const score = resolveCandidateSpreadScore({
        candidate,
        centroid,
        selected,
      })
      const category = resolvePublicMapResourceTopLevelCategory(
        candidate.properties.primaryResourceCategory
      )
      const categoryCount = selectedCategoryCounts.get(category) ?? 0
      if (
        score > bestScore ||
        (score === bestScore && categoryCount < bestCategoryCount)
      ) {
        bestIndex = index
        bestCategoryCount = categoryCount
        bestScore = score
      }
    }

    const [feature] = candidates.splice(bestIndex, 1)
    if (!feature) break
    const selectedCategory = resolvePublicMapResourceTopLevelCategory(
      feature.properties.primaryResourceCategory
    )
    selectedCategoryCounts.set(
      selectedCategory,
      (selectedCategoryCounts.get(selectedCategory) ?? 0) + 1
    )
    selected.push({
      ...feature,
      properties: {
        ...feature.properties,
        isSaved: false,
        markerOverviewOffsetIndex: 0,
        markerRelevanceTier: 0,
      },
    })
  }

  return selected
}

export function buildHomeMapPreviewFeatures({
  organizations,
  resourceItems,
}: {
  organizations: PublicMapOrganization[]
  resourceItems: ExternalResourceMapItem[]
}) {
  const items = buildPublicMapItems({
    includeSeedItems: false,
    organizations,
    resourceItems: resourceItems.filter(
      (item) => item.visibility === "published"
    ),
  })
  return selectHomeMapPreviewFeatures(
    buildPublicMapMarkerRelevance({
      features: buildPublicMapItemPointFeatures(items),
    })
  )
}
