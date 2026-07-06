import {
  isPublicMapResourceCategoryKey,
  PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER,
  resolvePublicMapResourceCategoryColor,
  type PublicMapResourceCategoryKey,
} from "./resource-categories"
import type {
  PublicMapClusterAggregateProperties,
  PublicMapClusterCategoryCounts,
  PublicMapClusterProperties,
  PublicMapPointProperties,
} from "./public-map-geojson"

function createClusterCategoryCounts(
  category: PublicMapResourceCategoryKey
): PublicMapClusterCategoryCounts {
  return { [category]: 1 }
}

export function mapPublicMapClusterProperties(
  properties: PublicMapPointProperties
): PublicMapClusterAggregateProperties {
  const category = isPublicMapResourceCategoryKey(
    properties.primaryResourceCategory
  )
    ? properties.primaryResourceCategory
    : "community"

  return {
    clusterCategoryCounts: createClusterCategoryCounts(category),
  }
}

export function reducePublicMapClusterProperties(
  accumulated: PublicMapClusterAggregateProperties,
  properties: Readonly<PublicMapClusterAggregateProperties>
) {
  const nextCounts = readPublicMapClusterCategoryCounts(
    properties.clusterCategoryCounts
  )
  if (!nextCounts) return

  accumulated.clusterCategoryCounts ??= {}
  for (const category of PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER) {
    const count = nextCounts[category] ?? 0
    if (count <= 0) continue
    accumulated.clusterCategoryCounts[category] =
      (accumulated.clusterCategoryCounts[category] ?? 0) + count
  }
}

export function resolvePublicMapClusterCategoryKeys(
  properties: Pick<PublicMapClusterProperties, "clusterCategoryCounts">
) {
  const counts = readPublicMapClusterCategoryCounts(
    properties.clusterCategoryCounts
  )
  if (!counts) return []

  return PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.filter(
    (category) => (counts[category] ?? 0) > 0
  ).sort((firstCategory, secondCategory) => {
    const countDifference =
      (counts[secondCategory] ?? 0) - (counts[firstCategory] ?? 0)
    if (countDifference !== 0) return countDifference
    return (
      PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(firstCategory) -
      PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(secondCategory)
    )
  })
}

function readPublicMapClusterCategoryCounts(
  value: unknown
): PublicMapClusterCategoryCounts | null {
  const parsed = (() => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value
    }
    if (typeof value !== "string" || !value.trim()) return null
    try {
      const maybeJson = JSON.parse(value)
      return maybeJson && typeof maybeJson === "object" ? maybeJson : null
    } catch {
      return null
    }
  })()
  if (!parsed) return null

  const counts: PublicMapClusterCategoryCounts = {}
  for (const [category, count] of Object.entries(parsed)) {
    if (!isPublicMapResourceCategoryKey(category)) continue
    const normalizedCount =
      typeof count === "number" && Number.isFinite(count) ? count : 0
    if (normalizedCount <= 0) continue
    counts[category] = normalizedCount
  }

  return Object.keys(counts).length > 0 ? counts : null
}

export function resolvePublicMapClusterVisibleCategoryKeys(
  properties: Pick<PublicMapClusterProperties, "clusterCategoryCounts">,
  visibleCount: number
) {
  const counts = readPublicMapClusterCategoryCounts(
    properties.clusterCategoryCounts
  )
  const normalizedVisibleCount =
    Number.isFinite(visibleCount) && visibleCount > 0
      ? Math.floor(visibleCount)
      : 0
  if (!counts || normalizedVisibleCount <= 0) return []

  const entries = resolvePublicMapClusterCategoryKeys(properties)
    .slice(0, normalizedVisibleCount)
    .map((category) => ({
      allocation: 0,
      category,
      count: counts[category] ?? 0,
      ideal: 0,
      used: 0,
    }))
  const totalCount = entries.reduce((sum, entry) => sum + entry.count, 0)
  if (totalCount <= 0) return []

  for (const entry of entries) {
    entry.ideal = (entry.count / totalCount) * normalizedVisibleCount
    entry.allocation = Math.max(1, Math.floor(entry.ideal))
  }

  balanceClusterCategoryAllocations(entries, normalizedVisibleCount)
  return buildClusterCategorySequence(entries, normalizedVisibleCount)
}

export function resolvePublicMapClusterCategoryColorKeys(
  properties: Pick<PublicMapClusterProperties, "clusterCategoryCounts">
) {
  return resolvePublicMapClusterCategoryKeys(properties).map((category) =>
    resolvePublicMapResourceCategoryColor(category)
  )
}

function balanceClusterCategoryAllocations(
  entries: Array<{
    allocation: number
    category: PublicMapResourceCategoryKey
    count: number
    ideal: number
  }>,
  visibleCount: number
) {
  let allocated = entries.reduce((sum, entry) => sum + entry.allocation, 0)
  while (allocated > visibleCount) {
    const candidate = [...entries]
      .filter((entry) => entry.allocation > 1)
      .sort((first, second) => {
        const firstSurplus = first.allocation - first.ideal
        const secondSurplus = second.allocation - second.ideal
        if (firstSurplus !== secondSurplus) {
          return secondSurplus - firstSurplus
        }
        return (
          PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(first.category) -
          PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(second.category)
        )
      })[0]
    if (!candidate) break
    candidate.allocation -= 1
    allocated -= 1
  }

  while (allocated < visibleCount) {
    const candidate = [...entries].sort((first, second) => {
      const firstRemainder = first.ideal - first.allocation
      const secondRemainder = second.ideal - second.allocation
      if (firstRemainder !== secondRemainder) {
        return secondRemainder - firstRemainder
      }
      return (
        PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(first.category) -
        PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(second.category)
      )
    })[0]
    if (!candidate) break
    candidate.allocation += 1
    allocated += 1
  }
}

function buildClusterCategorySequence(
  entries: Array<{
    allocation: number
    category: PublicMapResourceCategoryKey
    count: number
    ideal: number
    used: number
  }>,
  visibleCount: number
) {
  const sequence: PublicMapResourceCategoryKey[] = []
  for (const entry of entries) {
    if (sequence.length >= visibleCount) break
    sequence.push(entry.category)
    entry.used += 1
  }

  while (sequence.length < visibleCount) {
    const candidate = [...entries]
      .filter((entry) => entry.used < entry.allocation)
      .sort((first, second) => {
        const firstScore = (first.allocation - first.used) / (first.used + 1)
        const secondScore =
          (second.allocation - second.used) / (second.used + 1)
        if (firstScore !== secondScore) return secondScore - firstScore
        if (first.used !== second.used) return first.used - second.used
        return (
          PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(first.category) -
          PUBLIC_MAP_RESOURCE_ALL_CATEGORY_ORDER.indexOf(second.category)
        )
      })[0]
    if (!candidate) break
    sequence.push(candidate.category)
    candidate.used += 1
  }

  return sequence
}
