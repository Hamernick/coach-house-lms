import type { Feature, FeatureCollection, Point } from "geojson"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  buildSameLocationGroups,
  type PublicMapSameLocationCapableOrganization,
} from "./public-map-same-location"

export const PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY = "public-map-marker-fallback"
export const PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY =
  "public-map-marker-fallback-selected"
export const PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR = "|"

export type PublicMapPointProperties = {
  organizationId: string
  organizationIds: string
  name: string
  primaryGroup: PublicMapOrganization["primaryGroup"]
  markerImageKey: string
  markerImageUrl: string | null
  sameLocationKey: string
  sameLocationCount: number
  sameLocationLabel: string | null
}

export type PublicMapClusterProperties = {
  cluster: true
  cluster_id: number
  clusterImageId?: string
  clusterSignature?: string
  point_count: number
  point_count_abbreviated: string | number
}

export type PublicMapPointFeature = Feature<Point, PublicMapPointProperties>
export type PublicMapClusterFeature = Feature<Point, PublicMapClusterProperties>
export type PublicMapClusterableFeature =
  | PublicMapPointFeature
  | PublicMapClusterFeature
export type PublicMapFeatureCollection =
  FeatureCollection<Point, PublicMapPointProperties | PublicMapClusterProperties>

export function parsePublicMapOrganizationIds(value: unknown) {
  if (typeof value !== "string") return []
  return value
    .split(PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function resolvePublicMapMarkerImageUrl(organization: PublicMapOrganization) {
  return (
    organization.logoUrl?.trim() ||
    organization.brandMarkUrl?.trim() ||
    organization.headerUrl?.trim() ||
    null
  )
}

export function resolvePublicMapMarkerImageKey(organizationId: string) {
  return `public-map-marker-${organizationId}`
}

function organizationHasMapLocation<T extends Pick<PublicMapOrganization, "latitude" | "longitude">>(
  organization: T,
): organization is T & {
  latitude: number
  longitude: number
} {
  return typeof organization.latitude === "number" && typeof organization.longitude === "number"
}

export function isPublicMapClusterFeature(
  feature: PublicMapFeatureCollection["features"][number],
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
  organization: PublicMapOrganization,
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
): PublicMapPointFeature[] {
  const organizationById = new Map(
    organizations.map((organization) => [organization.id, organization] as const),
  )
  const mappableOrganizations = organizations
    .map(toSameLocationCapableOrganization)
    .filter(
      (
        organization,
      ): organization is PublicMapSameLocationCapableOrganization =>
        organization !== null,
    )
  const sameLocationGroups = buildSameLocationGroups(mappableOrganizations)

  return sameLocationGroups.flatMap((group) => {
    const leadOrganization = organizationById.get(group.organizations[0]?.id ?? "")
    if (!leadOrganization || !organizationHasMapLocation(leadOrganization)) return []

    const organizationIds = group.organizations.map((organization) => organization.id)
    return [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: group.coordinates,
        },
        properties: {
          organizationId: leadOrganization.id,
          organizationIds: organizationIds.join(PUBLIC_MAP_ORGANIZATION_ID_SEPARATOR),
          name: leadOrganization.name,
          primaryGroup: leadOrganization.primaryGroup,
          markerImageKey: resolvePublicMapMarkerImageKey(leadOrganization.id),
          markerImageUrl: resolvePublicMapMarkerImageUrl(leadOrganization),
          sameLocationKey: group.key,
          sameLocationCount: organizationIds.length,
          sameLocationLabel: group.locationLabel,
        },
      } satisfies PublicMapPointFeature,
    ]
  })
}

function normalizePublicMapVersionCoordinate(value: number) {
  return Number.isFinite(value) ? value.toFixed(6) : "na"
}

export function buildPublicMapDataVersion(organizations: PublicMapOrganization[]) {
  const entries = organizations.flatMap((organization) => {
    if (!organizationHasMapLocation(organization)) return []
    return [
      [
        organization.id,
        normalizePublicMapVersionCoordinate(organization.longitude),
        normalizePublicMapVersionCoordinate(organization.latitude),
        resolvePublicMapMarkerImageKey(organization.id),
        organization.publicSlug ?? "",
      ].join(":"),
    ]
  })

  entries.sort()
  return entries.length > 0 ? entries.join("|") : "empty"
}

export function buildPublicMapOrganizationFeatureCollection(
  organizations: PublicMapOrganization[],
): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: buildPublicMapPointFeatures(organizations),
  }
}
