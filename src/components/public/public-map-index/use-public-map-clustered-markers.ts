"use client"

import { useEffect, useRef, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  createOrganizationClusterMarkerElement,
  createOrganizationMarkerElement,
  ORGANIZATION_CLUSTER_MARKER_OFFSET_Y,
  ORGANIZATION_MARKER_OFFSET_Y,
  updateOrganizationClusterMarkerElement,
  updateOrganizationMarkerElement,
} from "./map-markers"
import {
  buildPublicMapOrganizationFeatureCollection,
  PUBLIC_MAP_CLUSTER_MAX_ZOOM,
  PUBLIC_MAP_CLUSTER_RADIUS,
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
} from "./map-view-helpers"

type MapboxApi = typeof import("mapbox-gl")["default"]

type ClusteredMarkerEntry = {
  marker: mapboxgl.Marker
  kind: "cluster" | "organization"
  pointCount?: number
}

function clearClusteredMarkers(markersByKey: Map<string, ClusteredMarkerEntry>) {
  for (const entry of markersByKey.values()) {
    entry.marker.remove()
  }
  markersByKey.clear()
}

function resolveClusterId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function resolvePointCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function resolveOrganizationId(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : null
  }
  return null
}

function isClusterFeature(properties: Record<string, unknown>) {
  return (
    properties.cluster === true ||
    properties.cluster === 1 ||
    properties.cluster === "1" ||
    properties.cluster === "true"
  )
}

function resolveFeatureCoordinates(feature: mapboxgl.MapboxGeoJSONFeature) {
  if (!feature.geometry || feature.geometry.type !== "Point") return null
  const coordinates = feature.geometry.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude] as [number, number]
}

function resolveFitPadding(map: mapboxgl.Map) {
  if (typeof map.getPadding !== "function") {
    return { top: 24, right: 24, bottom: 24, left: 24 }
  }
  const padding = map.getPadding()
  return {
    top: Math.max(24, Math.round(padding.top ?? 24)),
    right: Math.max(24, Math.round(padding.right ?? 24)),
    bottom: Math.max(24, Math.round(padding.bottom ?? 24)),
    left: Math.max(24, Math.round(padding.left ?? 24)),
  }
}

export function usePublicMapClusteredMarkers({
  mapRef,
  mapboxRef,
  mapLoadedRef,
  organizations,
  organizationById,
  mapLoadVersion,
  selectedOrganizationId,
  onSelectOrganization,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapboxRef: RefObject<MapboxApi | null>
  mapLoadedRef: RefObject<boolean>
  organizations: PublicMapOrganization[]
  organizationById: Map<string, PublicMapOrganization>
  mapLoadVersion: number
  selectedOrganizationId: string | null
  onSelectOrganization: (organizationId: string) => void
}) {
  const clusteredMarkersRef = useRef<Map<string, ClusteredMarkerEntry>>(new Map())
  const renderMarkersRef = useRef<(() => void) | null>(null)
  const onSelectOrganizationRef = useRef(onSelectOrganization)
  const selectedOrganizationIdRef = useRef<string | null>(selectedOrganizationId)
  const organizationByIdRef = useRef(organizationById)

  useEffect(() => {
    onSelectOrganizationRef.current = onSelectOrganization
  }, [onSelectOrganization])

  useEffect(() => {
    selectedOrganizationIdRef.current = selectedOrganizationId
    renderMarkersRef.current?.()
  }, [selectedOrganizationId])

  useEffect(() => {
    organizationByIdRef.current = organizationById
    renderMarkersRef.current?.()
  }, [organizationById])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const sourceData = buildPublicMapOrganizationFeatureCollection(organizations)
    const existingSource = map.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined

    if (existingSource) {
      existingSource.setData(sourceData)
    } else {
      map.addSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID, {
        type: "geojson",
        data: sourceData,
        cluster: true,
        clusterRadius: PUBLIC_MAP_CLUSTER_RADIUS,
        clusterMaxZoom: PUBLIC_MAP_CLUSTER_MAX_ZOOM,
      })
    }

    if (!map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID)) {
      map.addLayer({
        id: PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
        type: "circle",
        source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": 1,
          "circle-opacity": 0,
        },
      })
    }

    if (!map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID)) {
      map.addLayer({
        id: PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
        type: "circle",
        source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 1,
          "circle-opacity": 0,
        },
      })
    }

    renderMarkersRef.current?.()
  }, [mapLoadVersion, mapLoadedRef, mapRef, organizations])

  useEffect(() => {
    const map = mapRef.current
    const mapboxgl = mapboxRef.current
    if (!map || !mapboxgl || !mapLoadedRef.current) return

    let animationFrame = 0
    const markersByKey = clusteredMarkersRef.current

    const renderMarkers = () => {
      const activeMap = mapRef.current
      const activeMapbox = mapboxRef.current
      if (!activeMap || !activeMapbox || !mapLoadedRef.current) return
      if (!activeMap.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)) return

      const nextKeys = new Set<string>()
      const seenOrganizationIds = new Set<string>()
      const seenClusterIds = new Set<number>()
      const features = activeMap.querySourceFeatures(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)

      for (const feature of features) {
        const coordinates = resolveFeatureCoordinates(feature)
        if (!coordinates) continue
        const properties = (feature.properties ?? {}) as Record<string, unknown>

        if (isClusterFeature(properties)) {
          const clusterId = resolveClusterId(properties.cluster_id)
          if (clusterId === null || seenClusterIds.has(clusterId)) continue
          seenClusterIds.add(clusterId)

          const markerKey = `cluster:${clusterId}`
          const pointCount = resolvePointCount(properties.point_count)
          nextKeys.add(markerKey)

          const existing = markersByKey.get(markerKey)
          if (existing && existing.kind === "cluster") {
            existing.marker.setLngLat(coordinates)
            if (existing.pointCount !== pointCount) {
              updateOrganizationClusterMarkerElement({
                element: existing.marker.getElement(),
                pointCount,
              })
              existing.pointCount = pointCount
            }
            continue
          }

          const element = createOrganizationClusterMarkerElement({
            pointCount,
            onSelect: () => {
              const source = activeMap.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID) as
                | mapboxgl.GeoJSONSource
                | undefined

              if (!source || typeof source.getClusterExpansionZoom !== "function") {
                activeMap.easeTo({
                  center: coordinates,
                  zoom: Math.max(activeMap.getZoom() + 1.25, 6),
                  duration: 420,
                  essential: true,
                })
                return
              }

              if (typeof source.getClusterLeaves !== "function") {
                source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                  const expansionZoom =
                    typeof zoom === "number" && Number.isFinite(zoom) ? zoom : null
                  if (error || expansionZoom === null) {
                    activeMap.easeTo({
                      center: coordinates,
                      zoom: Math.max(activeMap.getZoom() + 1.25, 6),
                      duration: 420,
                      essential: true,
                    })
                    return
                  }

                  activeMap.easeTo({
                    center: coordinates,
                    zoom: Math.min(expansionZoom, 15.5),
                    duration: 480,
                    essential: true,
                  })
                })
                return
              }

              const leafLimit = Math.max(2, Math.min(pointCount, 128))
              source.getClusterLeaves(clusterId, leafLimit, 0, (leafError, leaves) => {
                if (!leafError && Array.isArray(leaves) && leaves.length > 1) {
                  const bounds = new activeMapbox.LngLatBounds()
                  for (const leaf of leaves) {
                    const leafCoordinates = resolveFeatureCoordinates(
                      leaf as mapboxgl.MapboxGeoJSONFeature,
                    )
                    if (!leafCoordinates) continue
                    bounds.extend(leafCoordinates)
                  }

                  if (!bounds.isEmpty()) {
                    activeMap.fitBounds(bounds, {
                      padding: resolveFitPadding(activeMap),
                      maxZoom: 13.5,
                      duration: 520,
                    })
                    return
                  }
                }

                source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                  const expansionZoom =
                    typeof zoom === "number" && Number.isFinite(zoom) ? zoom : null
                  if (error || expansionZoom === null) {
                    activeMap.easeTo({
                      center: coordinates,
                      zoom: Math.max(activeMap.getZoom() + 1.25, 6),
                      duration: 420,
                      essential: true,
                    })
                    return
                  }

                  activeMap.easeTo({
                    center: coordinates,
                    zoom: Math.min(expansionZoom, 15.5),
                    duration: 480,
                    essential: true,
                  })
                })
              })
            },
          })

          const marker = new activeMapbox.Marker({
            element,
            anchor: "center",
            offset: [0, ORGANIZATION_CLUSTER_MARKER_OFFSET_Y],
          })
            .setLngLat(coordinates)
            .addTo(activeMap)

          markersByKey.set(markerKey, {
            marker,
            kind: "cluster",
            pointCount,
          })
          continue
        }

        const organizationId = resolveOrganizationId(properties.organizationId)
        if (!organizationId || seenOrganizationIds.has(organizationId)) continue
        seenOrganizationIds.add(organizationId)

        const organization = organizationByIdRef.current.get(organizationId)
        if (!organization) continue

        const markerKey = `organization:${organizationId}`
        nextKeys.add(markerKey)
        const selected = organizationId === selectedOrganizationIdRef.current
        const existing = markersByKey.get(markerKey)

        if (existing && existing.kind === "organization") {
          existing.marker.setLngLat([organization.longitude ?? coordinates[0], organization.latitude ?? coordinates[1]])
          updateOrganizationMarkerElement({
            element: existing.marker.getElement(),
            organization,
            selected,
          })
          continue
        }

        const element = createOrganizationMarkerElement({
          organization,
          selected,
          onSelect: () => onSelectOrganizationRef.current(organizationId),
        })
        const marker = new activeMapbox.Marker({
          element,
          anchor: "bottom",
          offset: [0, ORGANIZATION_MARKER_OFFSET_Y],
        })
          .setLngLat([organization.longitude ?? coordinates[0], organization.latitude ?? coordinates[1]])
          .addTo(activeMap)

        markersByKey.set(markerKey, {
          marker,
          kind: "organization",
        })
      }

      for (const [key, entry] of markersByKey.entries()) {
        if (nextKeys.has(key)) continue
        entry.marker.remove()
        markersByKey.delete(key)
      }
    }

    const scheduleRender = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(renderMarkers)
    }

    renderMarkersRef.current = scheduleRender
    scheduleRender()

    map.on("move", scheduleRender)
    map.on("moveend", scheduleRender)
    map.on("zoom", scheduleRender)
    map.on("sourcedata", scheduleRender)

    return () => {
      cancelAnimationFrame(animationFrame)
      map.off("move", scheduleRender)
      map.off("moveend", scheduleRender)
      map.off("zoom", scheduleRender)
      map.off("sourcedata", scheduleRender)
      renderMarkersRef.current = null
      clearClusteredMarkers(markersByKey)
    }
  }, [mapLoadVersion, mapLoadedRef, mapRef, mapboxRef])
}
