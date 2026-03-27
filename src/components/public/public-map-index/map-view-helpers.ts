import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { SidebarMode } from "./constants"
import { organizationHasMapLocation } from "./helpers"

import {
  ORGANIZATION_MARKER_OFFSET_Y,
} from "./map-markers"

type MapboxApi = typeof import("mapbox-gl")["default"]

export const FALLBACK_CENTER: [number, number] = [-96.5, 38.4]
export const FALLBACK_ZOOM = 3.15
export const CHICAGO_FALLBACK_CENTER: [number, number] = [-87.6298, 41.8781]
export const CHICAGO_FALLBACK_ZOOM = 4.85
export const ORGANIZATION_PADDING = 120
export const PUBLIC_MAP_SIDEBAR_MAX_WIDTH = 390
export const PUBLIC_MAP_SIDEBAR_MIN_WIDTH = 220
export const PUBLIC_MAP_SIDEBAR_MIN_VISIBLE_MAP_WIDTH = 56
export const PUBLIC_MAP_CAMERA_EDGE_PADDING = 24
export const PUBLIC_MAP_ORGANIZATION_SOURCE_ID = "public-map-organizations"
export const PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID =
  "public-map-organizations-cluster"
export const PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID =
  "public-map-organizations-cluster-count"
export const PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID =
  "public-map-organizations-point"
export const PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID =
  "public-map-organizations-selected-halo"
export const PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID =
  "public-map-organizations-selected-core"
export const PUBLIC_MAP_CLUSTER_RADIUS = 16
export const PUBLIC_MAP_CLUSTER_MAX_ZOOM = 6

export type PublicMapOrganizationFeatureCollection = {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    geometry: {
      type: "Point"
      coordinates: [number, number]
    }
    properties: {
      organizationId: string
      name: string
      primaryGroup: PublicMapOrganization["primaryGroup"]
    }
  }>
}

export function normalizeSlug(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function buildMapHref({
  slug,
  searchParams,
}: {
  slug: string | null | undefined
  searchParams: URLSearchParams
}) {
  const nextParams = new URLSearchParams(searchParams)
  const query = nextParams.toString()
  const pathname = slug ? `/find/${slug}` : "/find"
  return query.length > 0 ? `${pathname}?${query}` : pathname
}

export function removeAuthParams(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams)
  next.delete("auth_action")
  next.delete("auth_org")
  next.delete("member_onboarding")
  return next
}

export function buildPublicMapOrganizationFeatureCollection(
  organizations: PublicMapOrganization[],
): PublicMapOrganizationFeatureCollection {
  return {
    type: "FeatureCollection",
    features: organizations
      .filter(organizationHasMapLocation)
      .map((organization) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [organization.longitude, organization.latitude] as [number, number],
        },
        properties: {
          organizationId: organization.id,
          name: organization.name,
          primaryGroup: organization.primaryGroup,
        },
      })),
  }
}

export function resolveMarkerOrganizations(organizations: PublicMapOrganization[]) {
  return organizations.filter(
    (
      organization,
    ): organization is PublicMapOrganization & {
      latitude: number
      longitude: number
    } => typeof organization.latitude === "number" && typeof organization.longitude === "number",
  )
}

export function fitMapToOrganizations({
  map,
  mapboxgl,
  organizations,
  duration = 800,
}: {
  map: mapboxgl.Map
  mapboxgl: MapboxApi
  organizations: PublicMapOrganization[]
  duration?: number
}) {
  const markerOrganizations = resolveMarkerOrganizations(organizations)
  if (markerOrganizations.length === 0) {
    map.easeTo({
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      duration,
    })
    return
  }

  if (markerOrganizations.length === 1) {
    const only = markerOrganizations[0]
    map.flyTo({
      center: [only.longitude, only.latitude],
      zoom: 8.6,
      offset: [0, ORGANIZATION_MARKER_OFFSET_Y],
      duration,
      essential: true,
    })
    return
  }

  const bounds = new mapboxgl.LngLatBounds()
  markerOrganizations.forEach((organization) => {
    bounds.extend([organization.longitude, organization.latitude])
  })
  if (bounds.isEmpty()) {
    map.easeTo({
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      duration,
    })
    return
  }

  map.fitBounds(bounds, {
    padding: ORGANIZATION_PADDING,
    maxZoom: 7,
    duration,
  })
}

export function resolvePublicMapSidebarWidth({
  surfaceWidth,
  sidebarMode,
}: {
  surfaceWidth: number
  sidebarMode: SidebarMode
}) {
  if (sidebarMode === "hidden") return 0
  if (!Number.isFinite(surfaceWidth) || surfaceWidth <= 0) {
    return PUBLIC_MAP_SIDEBAR_MAX_WIDTH
  }

  const preferredWidth = Math.round(surfaceWidth * 0.34)
  const maxWidthForViewport = Math.max(
    0,
    surfaceWidth - PUBLIC_MAP_SIDEBAR_MIN_VISIBLE_MAP_WIDTH,
  )

  return Math.max(
    0,
    Math.min(
      PUBLIC_MAP_SIDEBAR_MAX_WIDTH,
      Math.max(PUBLIC_MAP_SIDEBAR_MIN_WIDTH, preferredWidth),
      maxWidthForViewport,
    ),
  )
}

export function focusChicagoFallback({
  map,
  duration = 800,
}: {
  map: mapboxgl.Map
  duration?: number
}) {
  map.easeTo({
    center: CHICAGO_FALLBACK_CENTER,
    zoom: CHICAGO_FALLBACK_ZOOM,
    duration,
  })
}

export function resolvePublicMapCameraPadding(sidebarInsetLeft: number) {
  const normalizedInset = Math.max(0, Math.round(sidebarInsetLeft))
  return {
    top: PUBLIC_MAP_CAMERA_EDGE_PADDING,
    right: PUBLIC_MAP_CAMERA_EDGE_PADDING,
    bottom: PUBLIC_MAP_CAMERA_EDGE_PADDING,
    left:
      normalizedInset > 0
        ? normalizedInset + PUBLIC_MAP_CAMERA_EDGE_PADDING
        : PUBLIC_MAP_CAMERA_EDGE_PADDING,
  }
}

export function focusOrganizationOnMap({
  map,
  organization,
}: {
  map: mapboxgl.Map
  organization: PublicMapOrganization & { latitude: number; longitude: number }
}) {
  map.flyTo({
    center: [organization.longitude, organization.latitude],
    zoom: 9.2,
    offset: [0, ORGANIZATION_MARKER_OFFSET_Y],
    duration: 780,
    essential: true,
  })
}

export function resolveBounds(map: mapboxgl.Map) {
  const bounds = map.getBounds()
  if (!bounds) return null
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}
