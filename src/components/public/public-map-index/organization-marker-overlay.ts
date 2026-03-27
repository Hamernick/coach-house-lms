"use client"

import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  createOrganizationMarkerElement,
  updateOrganizationMarkerElement,
} from "./map-markers"
import {
  animateMarkerEntrance,
  animateMarkerPositionTransition,
} from "./marker-motion"
import {
  clearSpiderfyOverlay,
  type SpiderfyOverlayState,
} from "./overlap-expansion"
import { resolveFeatureCoordinatesForMap } from "./map-coordinate-normalization"
import {
  queryVisibleUnclusteredOrganizationFeatures,
  resolveOrganizationId,
} from "./public-map-cluster-runtime"
import { resolveUnclusteredDisplayCoordinates } from "./unclustered-display-coordinates"

type MapboxApi = typeof import("mapbox-gl")["default"]

export type OrganizationMarkerEntry = {
  marker: mapboxgl.Marker
  missCount: number
}

export const ORGANIZATION_MARKER_RECONCILE_MAX_MISSES = 1

export function clearOrganizationMarkers(
  markersByKey: Map<string, OrganizationMarkerEntry>,
) {
  for (const entry of markersByKey.values()) {
    entry.marker.remove()
  }
  markersByKey.clear()
}

export function reconcileOrganizationMarkers({
  map,
  mapbox,
  markersByKey,
  organizationById,
  selectedOrganizationId,
  onSelectOrganization,
  spiderfyOverlayState,
  spiderfyRequestIdRef,
}: {
  map: mapboxgl.Map
  mapbox: MapboxApi
  markersByKey: Map<string, OrganizationMarkerEntry>
  organizationById: Map<string, PublicMapOrganization>
  selectedOrganizationId: string | null
  onSelectOrganization: (organizationId: string) => void
  spiderfyOverlayState: SpiderfyOverlayState
  spiderfyRequestIdRef: { current: number }
}) {
  const features = queryVisibleUnclusteredOrganizationFeatures({ map })
  const displayCoordinatesById = resolveUnclusteredDisplayCoordinates({
    map,
    features,
    organizationById,
  })
  const nextKeys = new Set<string>()

  for (const feature of features) {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const organizationId = resolveOrganizationId(properties.organizationId)
    if (!organizationId) continue
    const organization = organizationById.get(organizationId)
    if (!organization) continue

    const baseCoordinates = resolveFeatureCoordinatesForMap({
      map,
      feature,
    })
    if (!baseCoordinates) continue
    const displayCoordinates =
      displayCoordinatesById.get(organizationId) ?? baseCoordinates

    const markerKey = `organization:${organizationId}`
    nextKeys.add(markerKey)
    const selected = selectedOrganizationId === organizationId
    const existing = markersByKey.get(markerKey)

    if (existing) {
      const previousCoordinates: [number, number] = [
        existing.marker.getLngLat().lng,
        existing.marker.getLngLat().lat,
      ]
      existing.marker.setLngLat(displayCoordinates)
      animateMarkerPositionTransition({
        map,
        marker: existing.marker,
        previousCoordinates,
        nextCoordinates: displayCoordinates,
      })
      updateOrganizationMarkerElement({
        element: existing.marker.getElement(),
        organization,
        selected,
      })
      existing.missCount = 0
      continue
    }

    const marker = new mapbox.Marker({
      element: createOrganizationMarkerElement({
        organization,
        selected,
        onSelect: () => {
          clearSpiderfyOverlay({
            map,
            state: spiderfyOverlayState,
          })
          spiderfyRequestIdRef.current += 1
          onSelectOrganization(organizationId)
        },
      }),
      anchor: "center",
      offset: [0, 0],
    })
      .setLngLat(displayCoordinates)
      .addTo(map)

    if (displayCoordinates[0] !== baseCoordinates[0] || displayCoordinates[1] !== baseCoordinates[1]) {
      animateMarkerPositionTransition({
        map,
        marker,
        previousCoordinates: baseCoordinates,
        nextCoordinates: displayCoordinates,
        entering: true,
      })
    } else {
      animateMarkerEntrance({
        marker,
      })
    }

    markersByKey.set(markerKey, {
      marker,
      missCount: 0,
    })
  }

  for (const [key, entry] of markersByKey.entries()) {
    if (nextKeys.has(key)) {
      entry.missCount = 0
      continue
    }
    const misses = entry.missCount + 1
    entry.missCount = misses
    if (misses < ORGANIZATION_MARKER_RECONCILE_MAX_MISSES) continue
    entry.marker.remove()
    markersByKey.delete(key)
  }
}
