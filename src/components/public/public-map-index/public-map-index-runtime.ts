"use client"

import { useEffect, useRef, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { MAP_STYLE } from "./constants"
import { organizationHasMapLocation, type PublicMapBounds } from "./helpers"
import {
  observePublicMapContainer,
  resolveMapBounds,
} from "./layout-sync"
import {
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  focusChicagoFallback,
  focusOrganizationOnMap,
  resolvePublicMapCameraPadding,
} from "./map-view-helpers"
import type { UserLocationStatus } from "./user-location"

export type PublicMapMapboxApi = typeof import("mapbox-gl")["default"]

const MAPBOX_LOAD_ERROR_MESSAGE =
  "Mapbox couldn't load the map. Check your token and domain restrictions."

type PublicMapRuntimeErrorLike = {
  message?: unknown
  status?: unknown
  statusCode?: unknown
  url?: unknown
  request?: {
    url?: unknown
  }
}

function readMapboxRuntimeError(error: unknown): PublicMapRuntimeErrorLike {
  return error && typeof error === "object" ? error as PublicMapRuntimeErrorLike : {}
}

function readMapboxRuntimeErrorStatus(error: unknown) {
  const candidate = readMapboxRuntimeError(error)
  const status = candidate.status ?? candidate.statusCode
  return typeof status === "number" && Number.isFinite(status) ? status : null
}

function readMapboxRuntimeErrorMessage(error: unknown) {
  const message = readMapboxRuntimeError(error).message
  return typeof message === "string" ? message : ""
}

function readMapboxRuntimeErrorUrl(error: unknown) {
  const candidate = readMapboxRuntimeError(error)
  const url = candidate.url ?? candidate.request?.url
  return typeof url === "string" ? url : ""
}

export function isRecoverablePublicMapTileError(error: unknown) {
  const status = readMapboxRuntimeErrorStatus(error)
  if (status !== 401 && status !== 403) return false

  const details = `${readMapboxRuntimeErrorUrl(error)} ${readMapboxRuntimeErrorMessage(error)}`
  return (
    details.includes("/v4/") ||
    details.includes(".pbf") ||
    details.includes("vector.pbf") ||
    details.includes("mapbox.mapbox-")
  )
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
  }, [
    organizationById,
    selectedOrgId,
    setSelectedOrgId,
  ])
}

export function resolvePublicMapSelectedOrganization({
  organizationById,
  selectedOrgId,
}: {
  organizationById: Map<string, PublicMapOrganization>
  selectedOrgId: string | null
}) {
  return selectedOrgId ? organizationById.get(selectedOrgId) ?? null : null
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
  status,
  hasResolvedInitialViewportRef,
  setUserLocationStatus,
  setInitialViewportResolved,
}: {
  status: UserLocationStatus
  hasResolvedInitialViewportRef: RefObject<boolean>
  setUserLocationStatus: (status: UserLocationStatus) => void
  setInitialViewportResolved: (resolved: boolean) => void
}) {
  setUserLocationStatus(status)
  hasResolvedInitialViewportRef.current = true
  setInitialViewportResolved(true)
}

export function useResolveInitialPublicMapViewport({
  mapRef,
  mapLoadedRef,
  hasResolvedInitialViewportRef,
  initialOrganization,
  setUserLocationStatus,
  setInitialViewportResolved,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  hasResolvedInitialViewportRef: RefObject<boolean>
  initialOrganization: PublicMapOrganization | null
  setUserLocationStatus: (status: UserLocationStatus) => void
  setInitialViewportResolved: (resolved: boolean) => void
}) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current || hasResolvedInitialViewportRef.current) {
      return
    }

    if (initialOrganization && organizationHasMapLocation(initialOrganization)) {
      focusOrganizationOnMap({ map, organization: initialOrganization })
      markInitialViewportResolved({
        status: "idle",
        hasResolvedInitialViewportRef,
        setUserLocationStatus,
        setInitialViewportResolved,
      })
      return
    }

    if (typeof window === "undefined" || !("geolocation" in window.navigator)) {
      focusChicagoFallback({ map })
      markInitialViewportResolved({
        status: "unavailable",
        hasResolvedInitialViewportRef,
        setUserLocationStatus,
        setInitialViewportResolved,
      })
      return
    }

    setUserLocationStatus("requesting")
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const activeMap = mapRef.current
        if (!activeMap) return
        activeMap.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 9.25,
          duration: 900,
          essential: true,
        })
        markInitialViewportResolved({
          status: "centered",
          hasResolvedInitialViewportRef,
          setUserLocationStatus,
          setInitialViewportResolved,
        })
      },
      (error) => {
        const activeMap = mapRef.current
        if (!activeMap) return
        focusChicagoFallback({ map: activeMap })
        markInitialViewportResolved({
          status: error.code === 1 ? "denied" : "error",
          hasResolvedInitialViewportRef,
          setUserLocationStatus,
          setInitialViewportResolved,
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 60_000,
      },
    )
  }, [
    hasResolvedInitialViewportRef,
    initialOrganization,
    mapLoadedRef,
    mapRef,
    setInitialViewportResolved,
    setUserLocationStatus,
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
}) {
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
        const mapboxgl = (mapboxModule.default ?? mapboxModule) as PublicMapMapboxApi
        if (!mapboxgl?.Map) {
          throw new Error("Mapbox failed to initialize.")
        }

        mapboxgl.accessToken = token
        mapboxRef.current = mapboxgl
        if (!containerRef.current || cancelled) return

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: FALLBACK_CENTER,
          zoom: FALLBACK_ZOOM,
          projection: "globe",
          cooperativeGestures: false,
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
          if (isRecoverablePublicMapTileError(event.error)) return

          console.error("Public map error:", event.error)
          setMapError(MAPBOX_LOAD_ERROR_MESSAGE)
        })

        map.on("style.load", () => {
          map.setProjection("globe")
          if (typeof map.setRenderWorldCopies === "function") {
            map.setRenderWorldCopies(false)
          }
          markMapReady()
        })

        map.on("load", () => {
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
        setMapError("Mapbox couldn't start. Check your token and domain restrictions.")
      }
    }

    void initializeMap()

    return () => {
      cancelled = true
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
