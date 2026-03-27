import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapGroupKey } from "@/lib/public-map/groups"

import { isPointWithinBounds, organizationHasMapLocation } from "./helpers"

type PublicMapSearchField = {
  text: string
  weight: number
}

export type PublicMapSearchDocument = {
  id: string
  sortName: string
  groups: PublicMapGroupKey[]
  isOnlineOnly: boolean
  latitude: number | null
  longitude: number | null
  fields: PublicMapSearchField[]
}

export type PublicMapSearchIndex = {
  byId: Map<string, PublicMapSearchDocument>
  orderedIds: string[]
}

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function buildProgramTitles(organization: PublicMapOrganization) {
  return organization.programs
    .map((program) => normalizeText(program.title))
    .filter((title) => title.length > 0)
    .join(" ")
}

function buildSearchFields(organization: PublicMapOrganization): PublicMapSearchField[] {
  return [
    { text: normalizeText(organization.name), weight: 0 },
    { text: normalizeText(organization.tagline), weight: 2 },
    { text: normalizeText(organization.description), weight: 3 },
    { text: normalizeText(organization.mission), weight: 2 },
    { text: normalizeText(organization.vision), weight: 2 },
    { text: normalizeText(organization.values), weight: 3 },
    { text: normalizeText(organization.needStatement), weight: 2 },
    { text: normalizeText(organization.originStory), weight: 2 },
    { text: normalizeText(organization.theoryOfChange), weight: 2 },
    { text: normalizeText(organization.contactName), weight: 3 },
    { text: normalizeText(organization.email), weight: 3 },
    { text: normalizeText(organization.phone), weight: 3 },
    { text: normalizeText(organization.addressStreet), weight: 2 },
    { text: normalizeText(organization.city), weight: 2 },
    { text: normalizeText(organization.state), weight: 2 },
    { text: normalizeText(organization.country), weight: 2 },
    { text: normalizeText(organization.programPreview?.title), weight: 1 },
    { text: normalizeText(organization.programPreview?.subtitle), weight: 2 },
    { text: buildProgramTitles(organization), weight: 1 },
  ].filter((field) => field.text.length > 0)
}

export function buildPublicMapSearchIndex(
  organizations: PublicMapOrganization[],
): PublicMapSearchIndex {
  const byId = new Map<string, PublicMapSearchDocument>()
  for (const organization of organizations) {
    byId.set(organization.id, {
      id: organization.id,
      sortName: normalizeText(organization.name),
      groups: organization.groups,
      isOnlineOnly: organization.isOnlineOnly,
      latitude: organization.latitude,
      longitude: organization.longitude,
      fields: buildSearchFields(organization),
    })
  }

  const orderedIds = [...organizations]
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }))
    .map((organization) => organization.id)

  return {
    byId,
    orderedIds,
  }
}

function resolveQueryRelevanceScore({
  document,
  normalizedQuery,
}: {
  document: PublicMapSearchDocument
  normalizedQuery: string
}) {
  if (!normalizedQuery) return Number.POSITIVE_INFINITY

  let best = Number.POSITIVE_INFINITY
  for (const field of document.fields) {
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

function matchesQuery({
  document,
  normalizedQuery,
}: {
  document: PublicMapSearchDocument
  normalizedQuery: string
}) {
  if (!normalizedQuery) return true
  return document.fields.some((field) => field.text.includes(normalizedQuery))
}

export function filterPublicMapOrganizationIds({
  organizations,
  searchIndex,
  query,
  appliedBounds,
  favorites,
  activeGroup,
  sortByFavorites = true,
}: {
  organizations: PublicMapOrganization[]
  searchIndex: PublicMapSearchIndex
  query: string
  appliedBounds: {
    west: number
    south: number
    east: number
    north: number
  } | null
  favorites: string[]
  activeGroup: PublicMapGroupKey | "all"
  sortByFavorites?: boolean
}) {
  const organizationById = new Map(organizations.map((organization) => [organization.id, organization] as const))
  const normalizedQuery = normalizeText(query)

  const filteredIds = searchIndex.orderedIds.filter((organizationId) => {
    const document = searchIndex.byId.get(organizationId)
    const organization = organizationById.get(organizationId)
    if (!document || !organization) return false
    if (activeGroup !== "all" && !document.groups.includes(activeGroup)) return false
    if (!matchesQuery({ document, normalizedQuery })) return false
    if (appliedBounds === null) return true
    if (document.isOnlineOnly) return true
    return (
      organizationHasMapLocation(organization) &&
      isPointWithinBounds(organization.longitude, organization.latitude, appliedBounds)
    )
  })

  return filteredIds.sort((leftId, rightId) => {
    const leftDocument = searchIndex.byId.get(leftId)
    const rightDocument = searchIndex.byId.get(rightId)
    if (!leftDocument || !rightDocument) return 0

    if (normalizedQuery.length > 0) {
      const leftRelevance = resolveQueryRelevanceScore({
        document: leftDocument,
        normalizedQuery,
      })
      const rightRelevance = resolveQueryRelevanceScore({
        document: rightDocument,
        normalizedQuery,
      })
      if (leftRelevance !== rightRelevance) return leftRelevance - rightRelevance
    }

    if (sortByFavorites) {
      const leftFavorite = favorites.includes(leftId)
      const rightFavorite = favorites.includes(rightId)
      if (leftFavorite !== rightFavorite) return leftFavorite ? -1 : 1
    }

    if (normalizedQuery.length > 0) {
      const leftNameStarts = leftDocument.sortName.startsWith(normalizedQuery)
      const rightNameStarts = rightDocument.sortName.startsWith(normalizedQuery)
      if (leftNameStarts !== rightNameStarts) return leftNameStarts ? -1 : 1
    }

    return leftDocument.sortName.localeCompare(rightDocument.sortName, undefined, {
      sensitivity: "base",
    })
  })
}
