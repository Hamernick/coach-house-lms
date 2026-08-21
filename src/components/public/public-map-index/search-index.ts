import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapGroupKey } from "@/lib/public-map/groups"
import {
  buildPublicMapResourceLinkSearchText,
  buildPublicMapResourceLinks,
} from "@/lib/public-map/resource-links"

import { isPointWithinBounds } from "./helpers"
import {
  normalizePublicMapSearchText,
  scorePublicMapSearchFields,
  type PublicMapWeightedSearchField,
} from "./search-text"

type PublicMapSearchField = PublicMapWeightedSearchField

const PUBLIC_MAP_NAME_COLLATOR = new Intl.Collator(undefined, {
  sensitivity: "base",
})

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

function buildProgramTitles(organization: PublicMapOrganization) {
  const activities =
    organization.activityLinks.length > 0
      ? organization.activityLinks
      : organization.programs

  return activities
    .flatMap((program) => [
      normalizePublicMapSearchText(program.title),
      normalizePublicMapSearchText(program.subtitle),
      normalizePublicMapSearchText(program.description),
      normalizePublicMapSearchText(program.activityKind),
      normalizePublicMapSearchText(program.durationLabel),
      normalizePublicMapSearchText(program.ctaLabel),
      normalizeSearchHref(program.ctaUrl),
      normalizeSearchHref(program.locationUrl),
      ...program.chips.map((chip) => normalizePublicMapSearchText(chip)),
    ])
    .filter((text) => text.length > 0)
    .join(" ")
}

function normalizeSearchHref(value: string | null | undefined) {
  if (!value) return ""
  return normalizePublicMapSearchText(
    value
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
  )
}

function buildSearchFields(
  organization: PublicMapOrganization
): PublicMapSearchField[] {
  const resourceLinks = buildPublicMapResourceLinks(organization)

  return [
    { text: normalizePublicMapSearchText(organization.name), weight: 0 },
    { text: normalizePublicMapSearchText(organization.tagline), weight: 2 },
    { text: normalizePublicMapSearchText(organization.description), weight: 3 },
    { text: normalizePublicMapSearchText(organization.mission), weight: 2 },
    { text: normalizePublicMapSearchText(organization.vision), weight: 2 },
    { text: normalizePublicMapSearchText(organization.values), weight: 3 },
    {
      text: normalizePublicMapSearchText(organization.needStatement),
      weight: 2,
    },
    { text: normalizePublicMapSearchText(organization.originStory), weight: 2 },
    {
      text: normalizePublicMapSearchText(organization.theoryOfChange),
      weight: 2,
    },
    { text: normalizePublicMapSearchText(organization.contactName), weight: 3 },
    { text: normalizePublicMapSearchText(organization.email), weight: 3 },
    { text: normalizePublicMapSearchText(organization.phone), weight: 3 },
    {
      text: normalizePublicMapSearchText(organization.addressStreet),
      weight: 2,
    },
    { text: normalizePublicMapSearchText(organization.city), weight: 2 },
    { text: normalizePublicMapSearchText(organization.state), weight: 2 },
    { text: normalizePublicMapSearchText(organization.country), weight: 2 },
    { text: normalizeSearchHref(organization.website), weight: 2 },
    { text: normalizeSearchHref(organization.locationUrl), weight: 2 },
    {
      text: normalizePublicMapSearchText(
        buildPublicMapResourceLinkSearchText(resourceLinks)
      ),
      weight: 2,
    },
    {
      text: normalizePublicMapSearchText(organization.programPreview?.title),
      weight: 1,
    },
    {
      text: normalizePublicMapSearchText(organization.programPreview?.subtitle),
      weight: 2,
    },
    { text: buildProgramTitles(organization), weight: 1 },
  ].filter((field) => field.text.length > 0)
}

export function buildPublicMapSearchIndex(
  organizations: PublicMapOrganization[]
): PublicMapSearchIndex {
  const byId = new Map<string, PublicMapSearchDocument>()
  for (const organization of organizations) {
    byId.set(organization.id, {
      id: organization.id,
      sortName: normalizePublicMapSearchText(organization.name),
      groups: organization.groups,
      isOnlineOnly: organization.isOnlineOnly,
      latitude: organization.latitude,
      longitude: organization.longitude,
      fields: buildSearchFields(organization),
    })
  }

  const orderedIds = [...organizations]
    .sort((left, right) =>
      PUBLIC_MAP_NAME_COLLATOR.compare(left.name, right.name)
    )
    .map((organization) => organization.id)

  return {
    byId,
    orderedIds,
  }
}

export function filterPublicMapOrganizationIds({
  searchIndex,
  query,
  appliedBounds,
  favorites,
  activeGroup,
  sortByFavorites = true,
}: {
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
  const normalizedQuery = normalizePublicMapSearchText(query)
  const favoriteIds = sortByFavorites ? new Set(favorites) : null

  const filteredIds: string[] = []
  for (const organizationId of searchIndex.orderedIds) {
    const document = searchIndex.byId.get(organizationId)
    if (!document) continue
    if (activeGroup !== "all" && !document.groups.includes(activeGroup))
      continue
    if (
      !Number.isFinite(
        scorePublicMapSearchFields({ fields: document.fields, query })
      )
    ) {
      continue
    }
    if (appliedBounds !== null && !document.isOnlineOnly) {
      if (
        typeof document.longitude !== "number" ||
        typeof document.latitude !== "number"
      ) {
        continue
      }
      if (
        !isPointWithinBounds(
          document.longitude,
          document.latitude,
          appliedBounds
        )
      ) {
        continue
      }
    }
    filteredIds.push(organizationId)
  }

  return filteredIds.sort((leftId, rightId) => {
    const leftDocument = searchIndex.byId.get(leftId)
    const rightDocument = searchIndex.byId.get(rightId)
    if (!leftDocument || !rightDocument) return 0

    if (normalizedQuery.length > 0) {
      const leftRelevance = scorePublicMapSearchFields({
        fields: leftDocument.fields,
        query,
      })
      const rightRelevance = scorePublicMapSearchFields({
        fields: rightDocument.fields,
        query,
      })
      if (leftRelevance !== rightRelevance)
        return leftRelevance - rightRelevance
    }

    if (favoriteIds) {
      const leftFavorite = favoriteIds.has(leftId)
      const rightFavorite = favoriteIds.has(rightId)
      if (leftFavorite !== rightFavorite) return leftFavorite ? -1 : 1
    }

    if (normalizedQuery.length > 0) {
      const leftNameStarts = leftDocument.sortName.startsWith(normalizedQuery)
      const rightNameStarts = rightDocument.sortName.startsWith(normalizedQuery)
      if (leftNameStarts !== rightNameStarts) return leftNameStarts ? -1 : 1
    }

    return PUBLIC_MAP_NAME_COLLATOR.compare(
      leftDocument.sortName,
      rightDocument.sortName
    )
  })
}
