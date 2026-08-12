"use client"

import { useEffect, useRef, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"
import {
  applyPublicMapBasemapConfig,
  applyPublicMapSpaceFog,
  resolvePublicMapBasemapConfig,
  resolvePublicMapStyleForTheme,
} from "./constants"
import { organizationHasMapLocation, type PublicMapBounds } from "./helpers"
import { observePublicMapContainer, resolveMapBounds } from "./layout-sync"
import {
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  focusOrganizationOnMap,
  resolvePublicMapCameraPadding,
} from "./map-view-helpers"
import {
  isRecoverablePublicMapTileError,
  resolvePublicMapRuntimeErrorMessage,
} from "./public-map-runtime-errors"

export type PublicMapMapboxApi = (typeof import("mapbox-gl"))["default"]
export { isRecoverablePublicMapTileError } from "./public-map-runtime-errors"

function applyPublicMapGlobePresentation(map: mapboxgl.Map) {
  map.setProjection("globe")
  applyPublicMapSpaceFog(map)
  if (typeof map.setRenderWorldCopies === "function") {
    map.setRenderWorldCopies(false)
  }
}

export function useSyncSelectedOrganization({
  organizationById,
  selectedOrgId,
  setSelectedOrgId,
}: {
  organizationById: Map<string, PublicMapOrganization>
  selectedOrgId: string | null
  setSelectedOrgId: (value: string | null) => void
}) {
  useEffect(() => {
    const syncedSelectedOrgId = resolveSyncedPublicMapSelectedOrgId({
      organizationById,
      selectedOrgId,
    })

    if (syncedSelectedOrgId !== selectedOrgId) {
      setSelectedOrgId(null)
    }
  }, [organizationById, selectedOrgId, setSelectedOrgId])
}

export function resolvePublicMapSelectedOrganization({
  organizationById,
  selectedOrgId,
}: {
  organizationById: Map<string, PublicMapOrganization>
  selectedOrgId: string | null
}) {
  return selectedOrgId ? (organizationById.get(selectedOrgId) ?? null) : null
}

export function resolveSyncedPublicMapSelectedOrgId({
  organizationById,
  selectedOrgId,
}: {
  organizationById: Map<string, PublicMapOrganization>
  selectedOrgId: string | null
}) {
  if (!selectedOrgId) return null
  return organizationById.has(selectedOrgId) ? selectedOrgId : null
}

export function useSyncSidebarCameraPadding({
  mapRef,
  mapLoadedRef,
  initialViewportResolved,
  sidebarInsetLeft,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  initialViewportResolved: boolean
  sidebarInsetLeft: number
}) {
  const hasAppliedInitialPaddingRef = useRef(false)
  const lastMapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current || !initialViewportResolved) return

    if (lastMapRef.current !== map) {
      lastMapRef.current = map
      hasAppliedInitialPaddingRef.current = false
    }

    const duration = hasAppliedInitialPaddingRef.current ? 320 : 0
    hasAppliedInitialPaddingRef.current = true

    const frame = requestAnimationFrame(() => {
      if (mapRef.current !== map) return
      map.easeTo({
        padding: resolvePublicMapCameraPadding(sidebarInsetLeft),
        duration,
        essential: true,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [initialViewportResolved, mapLoadedRef, mapRef, sidebarInsetLeft])
}

function markInitialViewportResolved({
  hasResolvedInitialViewportRef,
  setInitialViewportResolved,
}: {
  hasResolvedInitialViewportRef: RefObject<boolean>
  setInitialViewportResolved: (resolved: boolean) => void
}) {
  hasResolvedInitialViewportRef.current = true
  setInitialViewportResolved(true)
}

export function useResolveInitialPublicMapViewport({
  mapRef,
  mapLoadedRef,
  hasResolvedInitialViewportRef,
  initialOrganization,
  preferNationalFallback = false,
  setInitialViewportResolved,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  hasResolvedInitialViewportRef: RefObject<boolean>
  initialOrganization: PublicMapOrganization | null
  preferNationalFallback?: boolean
  setInitialViewportResolved: (resolved: boolean) => void
}) {
  useEffect(() => {
    const map = mapRef.current
    if (
      !map ||
      !mapLoadedRef.current ||
      hasResolvedInitialViewportRef.current
    ) {
      return
    }

    if (
      initialOrganization &&
      organizationHasMapLocation(initialOrganization)
    ) {
      focusOrganizationOnMap({ map, organization: initialOrganization })
      markInitialViewportResolved({
        hasResolvedInitialViewportRef,
        setInitialViewportResolved,
      })
      return
    }

    if (preferNationalFallback) {
      map.easeTo({
        center: FALLBACK_CENTER,
        zoom: FALLBACK_ZOOM,
        duration: 0,
      })
      markInitialViewportResolved({
        hasResolvedInitialViewportRef,
        setInitialViewportResolved,
      })
      return
    }

    markInitialViewportResolved({
      hasResolvedInitialViewportRef,
      setInitialViewportResolved,
    })
  }, [
    hasResolvedInitialViewportRef,
    initialOrganization,
    mapLoadedRef,
    mapRef,
    preferNationalFallback,
    setInitialViewportResolved,
  ])
}

export function useInitializePublicMap({
  token,
  tokenAvailable,
  containerRef,
  mapRef,
  mapboxRef,
  mapLoadedRef,
  hasResolvedInitialViewportRef,
  setInitialViewportResolved,
  setMapLoadVersion,
  setMapError,
  setAppliedBounds,
  theme,
}: {
  token: string
  tokenAvailable: boolean
  containerRef: RefObject<HTMLDivElement | null>
  mapRef: RefObject<mapboxgl.Map | null>
  mapboxRef: RefObject<PublicMapMapboxApi | null>
  mapLoadedRef: RefObject<boolean>
  hasResolvedInitialViewportRef: RefObject<boolean>
  setInitialViewportResolved: (resolved: boolean) => void
  setMapLoadVersion: (value: number | ((current: number) => number)) => void
  setMapError: (value: string | null) => void
  setAppliedBounds: (value: PublicMapBounds | null) => void
  theme: PublicMapTheme
}) {
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return
    applyPublicMapBasemapConfig(map, theme)
  }, [mapLoadedRef, mapRef, theme])

  useEffect(() => {
    if (!tokenAvailable) return
    if (!containerRef.current) return
    if (mapRef.current) return

    let cancelled = false
    let stopObservingMapContainer = () => {}
    let hasMarkedMapReady = false
    setInitialViewportResolved(false)

    async function initializeMap() {
      try {
        const mapboxModule = await import("mapbox-gl")
        const mapboxgl = (mapboxModule.default ??
          mapboxModule) as PublicMapMapboxApi
        if (!mapboxgl?.Map) {
          throw new Error("Mapbox failed to initialize.")
        }

        mapboxgl.accessToken = token
        mapboxRef.current = mapboxgl
        if (!containerRef.current || cancelled) return

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: resolvePublicMapStyleForTheme(themeRef.current),
          config: {
            basemap: resolvePublicMapBasemapConfig(themeRef.current),
          },
          center: FALLBACK_CENTER,
          zoom: FALLBACK_ZOOM,
          projection: "globe",
          cooperativeGestures: false,
          attributionControl: false,
        })
        mapRef.current = map

        if (typeof map.setRenderWorldCopies === "function") {
          map.setRenderWorldCopies(false)
        }

        map.dragRotate.disable()
        map.boxZoom.disable()
        if (typeof map.touchZoomRotate.disableRotation === "function") {
          map.touchZoomRotate.disableRotation()
        }

        const markMapReady = () => {
          if (cancelled || mapRef.current !== map) return

          if (!hasMarkedMapReady) {
            hasMarkedMapReady = true
            mapLoadedRef.current = true
            setMapLoadVersion((current) => current + 1)
          }

          requestAnimationFrame(() => {
            if (mapRef.current !== map) return
            map.resize()
            setAppliedBounds(resolveMapBounds(map))
          })
          setAppliedBounds(resolveMapBounds(map))
        }

        map.on("error", (event) => {
          if (!event?.error) return
          const errorMessage = resolvePublicMapRuntimeErrorMessage(event.error)
          if (!errorMessage) return

          console.error("Public map error:", event.error)
          setMapError(errorMessage)
        })

        map.on("style.load", () => {
          applyPublicMapBasemapConfig(map, themeRef.current)
          applyPublicMapGlobePresentation(map)
          markMapReady()
        })

        map.on("load", () => {
          applyPublicMapGlobePresentation(map)
          markMapReady()
        })

        map.on("moveend", () => {
          setAppliedBounds(resolveMapBounds(map))
        })

        stopObservingMapContainer = observePublicMapContainer({
          containerRef,
          map,
          mapRef,
          mapLoadedRef,
          onViewportChange: (activeMap) => {
            setAppliedBounds(resolveMapBounds(activeMap))
          },
        })
      } catch (error) {
        console.error("Public map init error:", error)
        setMapError(
          "Mapbox couldn't start. Check your token and domain restrictions."
        )
      }
    }

    let initializeTimeoutId: number | null = null
    const initializeFrameId = window.requestAnimationFrame(() => {
      initializeTimeoutId = window.setTimeout(() => {
        void initializeMap()
      }, 0)
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(initializeFrameId)
      if (initializeTimeoutId !== null) {
        window.clearTimeout(initializeTimeoutId)
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      stopObservingMapContainer()
      mapLoadedRef.current = false
      hasResolvedInitialViewportRef.current = false
    }
  }, [
    containerRef,
    hasResolvedInitialViewportRef,
    mapLoadedRef,
    mapRef,
    mapboxRef,
    setAppliedBounds,
    setInitialViewportResolved,
    setMapLoadVersion,
    setMapError,
    token,
    tokenAvailable,
  ])
}
