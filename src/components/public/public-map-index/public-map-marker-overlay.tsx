"use client"

import { useEffect, useState, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"
import { flushSync } from "react-dom"

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

      const commitItems = () => {
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

      if (typeof activeMap.isMoving === "function" && activeMap.isMoving()) {
        flushSync(commitItems)
        return
      }

      commitItems()
    }

    const handleRender = () => {
      refreshItems()
    }

    const handleStyleLoad = () => {
      setOverlayItems([])
      refreshItems()
    }

    const handleIdle = () => {
      refreshItems()
    }

    const handleResize = () => {
      refreshItems()
    }

    const handleMoveEnd = () => {
      refreshItems()
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
      refreshItems()
    }

    refreshItems()
    map.on("render", handleRender)
    map.on("moveend", handleMoveEnd)
    map.on("resize", handleResize)
    map.on("idle", handleIdle)
    map.on("style.load", handleStyleLoad)
    map.on("sourcedata", handleSourceData)

    return () => {
      map.off("render", handleRender)
      map.off("moveend", handleMoveEnd)
      map.off("resize", handleResize)
      map.off("idle", handleIdle)
      map.off("style.load", handleStyleLoad)
      map.off("sourcedata", handleSourceData)
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
