import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  ORGANIZATION_MARKER_OFFSET_Y,
} from "./map-markers"

type MapboxApi = typeof import("mapbox-gl")["default"]

export const FALLBACK_CENTER: [number, number] = [-96.5, 38.4]
export const FALLBACK_ZOOM = 3.15
export const ORGANIZATION_PADDING = 120

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

export function createMarkerMap(
  markers: Array<{ id: string; marker: mapboxgl.Marker }>,
) {
  return new Map(markers.map((entry) => [entry.id, entry.marker] as const))
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
