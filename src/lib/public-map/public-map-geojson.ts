import type { Feature, FeatureCollection, Point } from "geojson"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { type PublicMapResourceCategoryKey } from "@/lib/public-map/resource-categories"
import {
  resolvePublicMapItemMarkerColor,
  resolvePublicMapItemSelectableId,
  type PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import {
  PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY,
  resolvePublicMapMarkerStyleKey,
  type PublicMapMarkerStyleKey,
} from "@/lib/public-map/public-map-marker-styles"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"
import { PUBLIC_MAP_GROUP_ACCENTS } from "./groups"

import {
  buildSameLocationGroups,
  type PublicMapSameLocationCapableOrganization,
} from "./public-map-same-location"

export const PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY =
  "public-map-marker-fallback-glass-v2"
export const PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY =
  "public-map-marker-fallback-selected-glass-v2"
export const PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR = "|"
export const PUBLIC_MAP_MARKER_SPRITE_VERSION =
  "filled-glass-v20-accessible-cooling-pill-marker"

export type PublicMapPointProperties = {
  itemId: string
  itemType: PublicMapItem["itemType"] | "platform_organization"
  organizationId: string
  organizationIds: string
  name: string
  primaryGroup: PublicMapOrganization["primaryGroup"]
  primaryResourceCategory: PublicMapResourceCategoryKey
  markerAccentColor: string
  markerImageKey: string
  markerImageUrl: string | null
  markerStyleKey: PublicMapMarkerStyleKey
  verificationStatus: PublicMapItem["verificationStatus"] | "verified_platform"
  sameLocationKey: string
  sameLocationCount: number
  sameLocationLabel: string | null
}

export type PublicMapClusterProperties = {
  cluster: true
  cluster_id: number
  clusterCategoryCounts?: PublicMapClusterCategoryCounts
  clusterImageId?: string
  clusterSignature?: string
  point_count: number
  point_count_abbreviated: string | number
}

export type PublicMapClusterCategoryCounts = Partial<
  Record<PublicMapResourceCategoryKey, number>
>

export type PublicMapClusterAggregateProperties = {
  clusterCategoryCounts?: PublicMapClusterCategoryCounts
}

export type PublicMapPointFeature = Feature<Point, PublicMapPointProperties>
export type PublicMapClusterFeature = Feature<Point, PublicMapClusterProperties>
export type PublicMapClusterableFeature =
  | PublicMapPointFeature
  | PublicMapClusterFeature
export type PublicMapFeatureCollection = FeatureCollection<
  Point,
  PublicMapPointProperties | PublicMapClusterProperties
>

export function parsePublicMapOrganizationIds(value: unknown) {
  if (typeof value !== "string") return []
  return value
    .split(PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function resolvePublicMapMarkerImageUrl(
  organization: PublicMapOrganization
) {
  return (
    organization.logoUrl?.trim() ||
    organization.brandMarkUrl?.trim() ||
    organization.headerUrl?.trim() ||
    null
  )
}

function hashPublicMapMarkerImageIdentity(value: string) {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

function buildPublicMapMarkerImageIdentity(
  organization: PublicMapOrganization,
  theme: PublicMapTheme = "light"
) {
  return [
    `marker:${PUBLIC_MAP_MARKER_SPRITE_VERSION}`,
    `theme:${theme}`,
    `style:${PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY}`,
    resolvePublicMapMarkerImageUrl(organization) ?? "fallback",
    organization.primaryGroup,
    organization.name.trim(),
  ].join("|")
}

function buildPublicMapItemMarkerImageIdentity(
  item: PublicMapItem,
  theme: PublicMapTheme = "light"
) {
  const markerStyleKey = resolvePublicMapMarkerStyleKey({
    resourceCategory: item.primaryResourceCategory,
  })
  return [
    `marker:${PUBLIC_MAP_MARKER_SPRITE_VERSION}`,
    `theme:${theme}`,
    `style:${markerStyleKey}`,
    item.markerImageUrl ?? "fallback",
    item.orgCategory ?? "external",
    item.primaryResourceCategory,
    item.verificationStatus,
    item.title.trim(),
  ].join("|")
}

export function resolvePublicMapMarkerImageKey(
  organizationId: string,
  markerIdentity?: string
) {
  const baseKey = `public-map-marker-${organizationId}`
  if (!markerIdentity) return baseKey
  return `${baseKey}-${hashPublicMapMarkerImageIdentity(markerIdentity)}`
}

function organizationHasMapLocation<
  T extends Pick<PublicMapOrganization, "latitude" | "longitude">,
>(
  organization: T
): organization is T & {
  latitude: number
  longitude: number
} {
  return (
    typeof organization.latitude === "number" &&
    typeof organization.longitude === "number"
  )
}

export function isPublicMapClusterFeature(
  feature: PublicMapFeatureCollection["features"][number]
): feature is PublicMapClusterFeature {
  return "cluster" in feature.properties && feature.properties.cluster === true
}

export function buildEmptyPublicMapFeatureCollection(): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [],
  }
}

function toSameLocationCapableOrganization(
  organization: PublicMapOrganization
): PublicMapSameLocationCapableOrganization | null {
  if (!organizationHasMapLocation(organization)) return null
  return {
    id: organization.id,
    name: organization.name,
    latitude: organization.latitude,
    longitude: organization.longitude,
    address: organization.address,
    addressStreet: organization.addressStreet,
    city: organization.city,
    state: organization.state,
    country: organization.country,
  }
}

export function buildPublicMapPointFeatures(
  organizations: PublicMapOrganization[],
  options: { markerTheme?: PublicMapTheme } = {}
): PublicMapPointFeature[] {
  const markerTheme = options.markerTheme ?? "light"
  const organizationById = new Map(
    organizations.map(
      (organization) => [organization.id, organization] as const
    )
  )
  const mappableOrganizations = organizations
    .map(toSameLocationCapableOrganization)
    .filter(
      (
        organization
      ): organization is PublicMapSameLocationCapableOrganization =>
        organization !== null
    )
  const sameLocationGroups = buildSameLocationGroups(mappableOrganizations)

  return sameLocationGroups.flatMap((group) => {
    const leadOrganization = organizationById.get(
      group.organizations[0]?.id ?? ""
    )
    if (!leadOrganization || !organizationHasMapLocation(leadOrganization))
      return []

    const organizationIds = group.organizations.map(
      (organization) => organization.id
    )
    return [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: group.coordinates,
        },
        properties: {
          organizationId: leadOrganization.id,
          itemId: `platform_organization:${leadOrganization.id}`,
          itemType: "platform_organization",
          organizationIds: organizationIds.join(
            PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR
          ),
          name: leadOrganization.name,
          primaryGroup: leadOrganization.primaryGroup,
          primaryResourceCategory: "community",
          markerAccentColor:
            PUBLIC_MAP_GROUP_ACCENTS[leadOrganization.primaryGroup],
          markerImageKey: resolvePublicMapMarkerImageKey(
            leadOrganization.id,
            [
              buildPublicMapMarkerImageIdentity(leadOrganization, markerTheme),
              `members:${organizationIds.join(",")}`,
            ].join("|")
          ),
          markerImageUrl: resolvePublicMapMarkerImageUrl(leadOrganization),
          markerStyleKey: PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY,
          verificationStatus: "verified_platform",
          sameLocationKey: group.key,
          sameLocationCount: organizationIds.length,
          sameLocationLabel: group.locationLabel,
        },
      } satisfies PublicMapPointFeature,
    ]
  })
}

function mapItemHasMapLocation(item: PublicMapItem): item is PublicMapItem & {
  latitude: number
  longitude: number
} {
  return typeof item.latitude === "number" && typeof item.longitude === "number"
}

function toSameLocationCapableMapItem(item: PublicMapItem) {
  if (!mapItemHasMapLocation(item)) return null
  return {
    id: item.id,
    name: item.title,
    latitude: item.latitude,
    longitude: item.longitude,
    address: item.address,
    addressStreet: item.addressStreet,
    city: item.city,
    state: item.state,
    country: item.country,
  } satisfies PublicMapSameLocationCapableOrganization
}

export function buildPublicMapItemPointFeatures(
  items: PublicMapItem[],
  options: { markerTheme?: PublicMapTheme } = {}
): PublicMapPointFeature[] {
  const markerTheme = options.markerTheme ?? "light"
  const itemById = new Map(items.map((item) => [item.id, item] as const))
  const mappableItems = items
    .map(toSameLocationCapableMapItem)
    .filter(
      (item): item is PublicMapSameLocationCapableOrganization => item !== null
    )
  const sameLocationGroups = buildSameLocationGroups(mappableItems)

  return sameLocationGroups.flatMap((group) => {
    const leadItem = itemById.get(group.organizations[0]?.id ?? "")
    if (!leadItem || !mapItemHasMapLocation(leadItem)) return []

    const selectableIds = group.organizations.map((item) => {
      const sourceItem = itemById.get(item.id)
      return sourceItem ? resolvePublicMapItemSelectableId(sourceItem) : item.id
    })
    const markerAccentColor = resolvePublicMapItemMarkerColor(leadItem)
    const markerStyleKey = resolvePublicMapMarkerStyleKey({
      resourceCategory: leadItem.primaryResourceCategory,
    })
    return [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: group.coordinates,
        },
        properties: {
          itemId: leadItem.id,
          itemType: leadItem.itemType,
          organizationId: resolvePublicMapItemSelectableId(leadItem),
          organizationIds: selectableIds.join(
            PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR
          ),
          name: leadItem.title,
          primaryGroup: leadItem.orgCategory ?? "community",
          primaryResourceCategory: leadItem.primaryResourceCategory,
          markerAccentColor,
          markerImageKey: resolvePublicMapMarkerImageKey(
            leadItem.id,
            [
              buildPublicMapItemMarkerImageIdentity(leadItem, markerTheme),
              `members:${selectableIds.join(",")}`,
            ].join("|")
          ),
          markerImageUrl: leadItem.markerImageUrl,
          markerStyleKey,
          verificationStatus: leadItem.verificationStatus,
          sameLocationKey: group.key,
          sameLocationCount: selectableIds.length,
          sameLocationLabel: group.locationLabel,
        },
      } satisfies PublicMapPointFeature,
    ]
  })
}

function normalizePublicMapVersionCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(6) : "na"
}

export function buildPublicMapDataVersion(
  organizations: PublicMapOrganization[],
  options: { markerTheme?: PublicMapTheme } = {}
) {
  const markerTheme = options.markerTheme ?? "light"
  const entries = organizations.flatMap((organization) => {
    if (!organizationHasMapLocation(organization)) return []
    return [
      [
        organization.id,
        normalizePublicMapVersionCoordinate(organization.longitude),
        normalizePublicMapVersionCoordinate(organization.latitude),
        resolvePublicMapMarkerImageKey(
          organization.id,
          buildPublicMapMarkerImageIdentity(organization, markerTheme)
        ),
        organization.publicSlug ?? "",
      ].join(":"),
    ]
  })

  entries.sort()
  return entries.length > 0 ? entries.join("|") : "empty"
}

export function buildPublicMapItemDataVersion(
  items: PublicMapItem[],
  options: { markerTheme?: PublicMapTheme } = {}
) {
  const markerTheme = options.markerTheme ?? "light"
  const entries = items.flatMap((item) => {
    if (!mapItemHasMapLocation(item)) return []
    return [
      [
        item.id,
        markerTheme,
        normalizePublicMapVersionCoordinate(item.longitude),
        normalizePublicMapVersionCoordinate(item.latitude),
        item.markerImageUrl ?? "",
        resolvePublicMapMarkerStyleKey({
          resourceCategory: item.primaryResourceCategory,
        }),
        item.title.trim(),
        item.orgCategory ?? "",
        item.primaryResourceCategory,
        item.verificationStatus,
        item.visibility,
      ].join(":"),
    ]
  })

  entries.sort()
  return entries.length > 0 ? entries.join("|") : "empty"
}

export function buildPublicMapOrganizationFeatureCollection(
  organizations: PublicMapOrganization[]
): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: buildPublicMapPointFeatures(organizations),
  }
}
