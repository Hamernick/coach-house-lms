import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapGroupKey } from "@/lib/public-map/groups"

export type PublicMapPreferences = {
  favorites: string[]
  savedQueries: string[]
  recentOrganizationIds: string[]
}

export type PublicMapBounds = {
  west: number
  south: number
  east: number
  north: number
}

export function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function buildQueryRelevanceScore({
  organization,
  normalizedQuery,
}: {
  organization: PublicMapOrganization
  normalizedQuery: string
}) {
  if (!normalizedQuery) return Number.POSITIVE_INFINITY

  const weightedFields: Array<{ text: string; weight: number }> = [
    { text: normalizeText(organization.name), weight: 0 },
    { text: normalizeText(organization.tagline), weight: 2 },
    { text: normalizeText(organization.description), weight: 3 },
    { text: normalizeText(organization.mission), weight: 2 },
    { text: normalizeText(organization.vision), weight: 2 },
    { text: normalizeText(organization.values), weight: 3 },
    { text: normalizeText(organization.needStatement), weight: 2 },
    { text: normalizeText(organization.contactName), weight: 3 },
    { text: normalizeText(organization.email), weight: 3 },
    { text: normalizeText(organization.phone), weight: 3 },
    { text: normalizeText(organization.addressStreet), weight: 2 },
    { text: normalizeText(organization.city), weight: 2 },
    { text: normalizeText(organization.state), weight: 2 },
    { text: normalizeText(organization.country), weight: 2 },
    { text: normalizeText(organization.programPreview?.title), weight: 1 },
    { text: normalizeText(organization.programPreview?.subtitle), weight: 2 },
  ]

  let best = Number.POSITIVE_INFINITY
  for (const field of weightedFields) {
    if (!field.text) continue
    if (field.text === normalizedQuery) {
      best = Math.min(best, field.weight)
      continue
    }
    if (field.text.startsWith(normalizedQuery)) {
      best = Math.min(best, field.weight + 1)
      continue
    }
    if (field.text.includes(` ${normalizedQuery}`)) {
      best = Math.min(best, field.weight + 2)
      continue
    }
    if (field.text.includes(normalizedQuery)) {
      best = Math.min(best, field.weight + 3)
    }
  }

  return best
}

export function isPointWithinBounds(
  longitude: number,
  latitude: number,
  bounds: PublicMapBounds,
) {
  const { west, south, east, north } = bounds
  const withinLatitude = latitude >= south && latitude <= north
  if (!withinLatitude) return false

  // Handles bounds crossing the antimeridian.
  if (west <= east) {
    return longitude >= west && longitude <= east
  }
  return longitude >= west || longitude <= east
}

export function organizationHasMapLocation<T extends Pick<PublicMapOrganization, "latitude" | "longitude">>(
  organization: T,
): organization is T & {
  latitude: number
  longitude: number
} {
  return typeof organization.latitude === "number" && typeof organization.longitude === "number"
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function normalizeStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== "string") continue
    const normalized = entry.trim()
    if (!normalized) continue
    unique.add(normalized)
    if (unique.size >= limit) break
  }
  return Array.from(unique)
}

export function mergeUniqueStrings(primary: string[], secondary: string[], limit: number) {
  const unique = new Set<string>()
  for (const list of [primary, secondary]) {
    for (const entry of list) {
      const normalized = entry.trim()
      if (!normalized || unique.has(normalized)) continue
      unique.add(normalized)
      if (unique.size >= limit) return Array.from(unique)
    }
  }
  return Array.from(unique)
}

export function stringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

export function readStoredArray(key: string, limit: number) {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(key)
  if (!raw) return []
  try {
    return normalizeStringArray(JSON.parse(raw), limit)
  } catch {
    return []
  }
}

export function filterPublicMapOrganizations({
  organizations,
  query,
  appliedBounds,
  favorites,
  activeGroup,
  sortByFavorites = true,
}: {
  organizations: PublicMapOrganization[]
  query: string
  appliedBounds: PublicMapBounds | null
  favorites: string[]
  activeGroup: PublicMapGroupKey | "all"
  sortByFavorites?: boolean
}) {
  const normalizedQuery = query.trim().toLowerCase()

  const groupFiltered =
    activeGroup === "all"
      ? organizations
      : organizations.filter((organization) => organization.groups.includes(activeGroup))

  const queryFiltered =
    normalizedQuery.length === 0
      ? groupFiltered
      : groupFiltered.filter((organization) => {
          const haystacks = [
            normalizeText(organization.name),
            normalizeText(organization.tagline),
            normalizeText(organization.description),
            normalizeText(organization.mission),
            normalizeText(organization.vision),
            normalizeText(organization.values),
            normalizeText(organization.needStatement),
            normalizeText(organization.contactName),
            normalizeText(organization.email),
            normalizeText(organization.phone),
            normalizeText(organization.addressStreet),
            normalizeText(organization.city),
            normalizeText(organization.state),
            normalizeText(organization.country),
            normalizeText(organization.programPreview?.title),
            normalizeText(organization.programPreview?.subtitle),
          ]
          return haystacks.some((entry) => entry.includes(normalizedQuery))
        })

  const areaFiltered =
    appliedBounds === null
      ? queryFiltered
      : queryFiltered.filter(
          (organization) =>
            organization.isOnlineOnly ||
            (organizationHasMapLocation(organization) &&
              isPointWithinBounds(organization.longitude, organization.latitude, appliedBounds)),
        )

  return [...areaFiltered].sort((left, right) => {
    if (normalizedQuery.length > 0) {
      const leftRelevance = buildQueryRelevanceScore({
        organization: left,
        normalizedQuery,
      })
      const rightRelevance = buildQueryRelevanceScore({
        organization: right,
        normalizedQuery,
      })
      if (leftRelevance !== rightRelevance) return leftRelevance - rightRelevance
    }

    if (sortByFavorites) {
      const leftFavorite = favorites.includes(left.id)
      const rightFavorite = favorites.includes(right.id)
      if (leftFavorite !== rightFavorite) return leftFavorite ? -1 : 1
    }

    if (normalizedQuery.length > 0) {
      const leftNameStarts = normalizeText(left.name).startsWith(normalizedQuery)
      const rightNameStarts = normalizeText(right.name).startsWith(normalizedQuery)
      if (leftNameStarts !== rightNameStarts) return leftNameStarts ? -1 : 1
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
  })
}
