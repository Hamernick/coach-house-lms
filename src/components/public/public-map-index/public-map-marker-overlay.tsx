"use client"

import { useEffect, useState, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { shouldScheduleClusterRenderFromSourceData } from "./public-map-cluster-runtime"
import {
  PublicMapClusterMarkerButton,
  PublicMapOrganizationMarkerButton,
  PublicMapSameLocationMarkerButton,
} from "./public-map-marker-overlay-buttons"
import {
  buildOverlayItems,
  shallowEqualOverlayItems,
  type PublicMapMarkerOverlayItem,
  type PublicMapSameLocationSelection,
} from "./public-map-marker-overlay-model"

const MARKER_REFRESH_INTERVAL_MS = 32

export type { PublicMapSameLocationSelection } from "./public-map-marker-overlay-model"

export function PublicMapMarkerOverlay({
  mapRef,
  mapLoadedRef,
  mapLoadVersion,
  organizationById,
  selectedOrganizationId,
  activeSameLocationGroupKey,
  onSelectOrganization,
  onOpenSameLocationGroup,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  organizationById: Map<string, PublicMapOrganization>
  selectedOrganizationId: string | null
  activeSameLocationGroupKey: string | null
  onSelectOrganization: (organizationId: string) => void
  onOpenSameLocationGroup: (group: PublicMapSameLocationSelection) => void
}) {
  const [overlayItems, setOverlayItems] = useState<PublicMapMarkerOverlayItem[]>([])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    let animationFrame = 0
    let renderTimeout: number | null = null
    let lastRefreshAt = 0

    const refreshItems = () => {
      const activeMap = mapRef.current
      if (!activeMap || !mapLoadedRef.current) return

      let nextItems: PublicMapMarkerOverlayItem[] = []
      try {
        nextItems = buildOverlayItems({
          map: activeMap,
          organizationById,
          selectedOrganizationId,
          activeSameLocationGroupKey,
        })
      } catch {
        return
      }

      setOverlayItems((current) => {
        if (
          nextItems.length === 0 &&
          typeof activeMap.isMoving === "function" &&
          activeMap.isMoving()
        ) {
          return current
        }
        return shallowEqualOverlayItems(current, nextItems) ? current : nextItems
      })
    }

    const flushRefresh = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        lastRefreshAt = performance.now()
        refreshItems()
      })
    }

    const scheduleRefresh = () => {
      const elapsed = performance.now() - lastRefreshAt
      if (elapsed >= MARKER_REFRESH_INTERVAL_MS) {
        if (renderTimeout !== null) {
          window.clearTimeout(renderTimeout)
          renderTimeout = null
        }
        flushRefresh()
        return
      }

      if (renderTimeout !== null) return
      renderTimeout = window.setTimeout(() => {
        renderTimeout = null
        flushRefresh()
      }, Math.max(0, MARKER_REFRESH_INTERVAL_MS - elapsed))
    }

    const handleSourceData = (event: mapboxgl.MapSourceDataEvent) => {
      if (
        !shouldScheduleClusterRenderFromSourceData({
          map,
          event,
        })
      ) {
        return
      }
      scheduleRefresh()
    }

    scheduleRefresh()
    map.on("move", scheduleRefresh)
    map.on("zoom", scheduleRefresh)
    map.on("rotate", scheduleRefresh)
    map.on("pitch", scheduleRefresh)
    map.on("resize", scheduleRefresh)
    map.on("idle", scheduleRefresh)
    map.on("style.load", scheduleRefresh)
    map.on("sourcedata", handleSourceData)

    return () => {
      cancelAnimationFrame(animationFrame)
      if (renderTimeout !== null) {
        window.clearTimeout(renderTimeout)
      }
      map.off("move", scheduleRefresh)
      map.off("zoom", scheduleRefresh)
      map.off("rotate", scheduleRefresh)
      map.off("pitch", scheduleRefresh)
      map.off("resize", scheduleRefresh)
      map.off("idle", scheduleRefresh)
      map.off("style.load", scheduleRefresh)
      map.off("sourcedata", handleSourceData)
      setOverlayItems([])
    }
  }, [
    activeSameLocationGroupKey,
    mapLoadVersion,
    mapLoadedRef,
    mapRef,
    organizationById,
    selectedOrganizationId,
  ])

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {overlayItems.map((item) => {
        if (item.kind === "organization") {
          return (
            <PublicMapOrganizationMarkerButton
              key={item.key}
              organization={item.organization}
              selected={item.selected}
              projectedX={item.projectedX}
              projectedY={item.projectedY}
              onSelect={() => onSelectOrganization(item.organization.id)}
            />
          )
        }

        if (item.kind === "cluster") {
          return (
            <PublicMapClusterMarkerButton
              key={item.key}
              clusterId={item.clusterId}
              pointCount={item.pointCount}
              coordinates={item.coordinates}
              projectedX={item.projectedX}
              projectedY={item.projectedY}
              mapRef={mapRef}
              mapLoadedRef={mapLoadedRef}
            />
          )
        }

        return (
          <PublicMapSameLocationMarkerButton
            key={item.key}
            groupKey={item.key}
            organizations={item.organizations}
            locationLabel={item.locationLabel}
            projectedX={item.projectedX}
            projectedY={item.projectedY}
            selected={item.selected}
            onOpenGroup={() =>
              onOpenSameLocationGroup({
                key: item.key,
                organizationIds: item.organizationIds,
                locationLabel: item.locationLabel,
              })
            }
          />
        )
      })}
    </div>
  )
}
