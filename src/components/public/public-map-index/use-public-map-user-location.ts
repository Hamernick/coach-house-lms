"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import {
  addMapLayerSafely,
  addMapSourceSafely,
  getMapSourceSafely,
  isMapStyleAccessError,
} from "./map-style-guards"
import {
  buildLocationFeedback,
  hasGrantedPublicMapLocation,
  hasRunPublicMapLocationEntrance,
  markPublicMapLocationGranted,
  markPublicMapLocationEntranceRun,
  normalizePublicMapUserCoordinates,
  PUBLIC_MAP_GEOLOCATION_OPTIONS,
  resolvePublicMapLocationPermissionAction,
  resolveUserLocationStatusFromError,
  type PublicMapUserCoordinates,
  type UserLocationStatus,
} from "./user-location"

export const PUBLIC_MAP_USER_LOCATION_SOURCE_ID = "public-map-user-location"
export const PUBLIC_MAP_USER_LOCATION_HALO_LAYER_ID =
  "public-map-user-location-halo"
export const PUBLIC_MAP_USER_LOCATION_CORE_LAYER_ID =
  "public-map-user-location-core"

const PUBLIC_MAP_USER_LOCATION_ZOOM = 13
const PUBLIC_MAP_GLOBE_SECONDS_PER_REVOLUTION = 180
const PUBLIC_MAP_GLOBE_MAX_SPIN_ZOOM = 5

function buildUserLocationFeature(
  coordinates: PublicMapUserCoordinates
): GeoJSON.Feature<GeoJSON.Point> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: [coordinates.longitude, coordinates.latitude],
    },
  }
}

function syncUserLocationLayers(
  map: mapboxgl.Map,
  coordinates: PublicMapUserCoordinates
) {
  const data = buildUserLocationFeature(coordinates)
  const source = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    map,
    PUBLIC_MAP_USER_LOCATION_SOURCE_ID
  )

  if (isMapStyleAccessError(source)) return
  if (source) {
    source.setData(data)
  } else if (
    !addMapSourceSafely(map, PUBLIC_MAP_USER_LOCATION_SOURCE_ID, {
      type: "geojson",
      data,
    })
  ) {
    return
  }

  if (!map.getLayer(PUBLIC_MAP_USER_LOCATION_HALO_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_USER_LOCATION_HALO_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_USER_LOCATION_SOURCE_ID,
      paint: {
        "circle-color": "#2563eb",
        "circle-emissive-strength": 1,
        "circle-opacity": 0.2,
        "circle-radius": 12,
      },
    })
  }

  if (!map.getLayer(PUBLIC_MAP_USER_LOCATION_CORE_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_USER_LOCATION_CORE_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_USER_LOCATION_SOURCE_ID,
      paint: {
        "circle-color": "#2563eb",
        "circle-emissive-strength": 1,
        "circle-radius": 6,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 3,
      },
    })
  }
}

function focusUserLocation(
  map: mapboxgl.Map,
  coordinates: PublicMapUserCoordinates
) {
  map.flyTo({
    center: [coordinates.longitude, coordinates.latitude],
    zoom: Math.max(map.getZoom(), PUBLIC_MAP_USER_LOCATION_ZOOM),
    duration: 900,
    essential: false,
  })
}

export function usePublicMapUserLocation({
  mapRef,
  mapLoadedRef,
  mapLoadVersion,
  suppressAutomaticEntrance,
  welcomeOpen,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  suppressAutomaticEntrance: boolean
  welcomeOpen: boolean
}) {
  const [status, setStatus] = useState<UserLocationStatus>("idle")
  const [coordinates, setCoordinates] =
    useState<PublicMapUserCoordinates | null>(null)
  const [hasGrantedLocation, setHasGrantedLocation] = useState(false)
  const [controlOpen, setControlOpen] = useState(
    !suppressAutomaticEntrance && !welcomeOpen
  )
  const entranceStartedRef = useRef(false)
  const requestSequenceRef = useRef(0)
  const userMovedMapRef = useRef(false)

  useEffect(() => {
    if (
      suppressAutomaticEntrance ||
      welcomeOpen ||
      typeof window === "undefined"
    ) {
      setControlOpen(false)
      return
    }

    const storedGrant = hasGrantedPublicMapLocation(window.sessionStorage)
    setHasGrantedLocation(storedGrant)
    setControlOpen(!storedGrant)
  }, [suppressAutomaticEntrance, welcomeOpen])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const markUserMovement = (event: mapboxgl.MapEventOf<"movestart">) => {
      if (event.originalEvent) userMovedMapRef.current = true
    }
    map.on("movestart", markUserMovement)
    return () => {
      map.off("movestart", markUserMovement)
    }
  }, [mapLoadVersion, mapLoadedRef, mapRef])

  useEffect(() => {
    const map = mapRef.current
    if (
      !map ||
      !mapLoadedRef.current ||
      coordinates ||
      hasGrantedLocation ||
      suppressAutomaticEntrance ||
      welcomeOpen ||
      userMovedMapRef.current ||
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    let cancelled = false
    const spinGlobe = () => {
      if (
        cancelled ||
        userMovedMapRef.current ||
        map.getZoom() >= PUBLIC_MAP_GLOBE_MAX_SPIN_ZOOM
      ) {
        return
      }

      const center = map.getCenter()
      map.easeTo({
        center: [
          center.lng - 360 / PUBLIC_MAP_GLOBE_SECONDS_PER_REVOLUTION,
          center.lat,
        ],
        duration: 1_000,
        easing: (progress) => progress,
        essential: false,
      })
    }
    const stopOnUserMovement = (event: mapboxgl.MapEventOf<"movestart">) => {
      if (!event.originalEvent) return
      userMovedMapRef.current = true
      map.stop()
    }

    map.on("movestart", stopOnUserMovement)
    map.on("moveend", spinGlobe)
    spinGlobe()

    return () => {
      cancelled = true
      map.off("movestart", stopOnUserMovement)
      map.off("moveend", spinGlobe)
    }
  }, [
    coordinates,
    hasGrantedLocation,
    mapLoadVersion,
    mapLoadedRef,
    mapRef,
    suppressAutomaticEntrance,
    welcomeOpen,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current || !coordinates) return
    syncUserLocationLayers(map, coordinates)
  }, [coordinates, mapLoadVersion, mapLoadedRef, mapRef])

  useEffect(
    () => () => {
      requestSequenceRef.current += 1
    },
    []
  )

  const requestPosition = useCallback(
    (source: "entrance" | "manual") => {
      if (
        typeof window === "undefined" ||
        window.isSecureContext === false ||
        !("geolocation" in window.navigator)
      ) {
        setStatus("unavailable")
        setControlOpen(true)
        return
      }

      const requestSequence = requestSequenceRef.current + 1
      requestSequenceRef.current = requestSequence
      setStatus("requesting")

      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          if (requestSequenceRef.current !== requestSequence) return
          const nextCoordinates = normalizePublicMapUserCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          if (!nextCoordinates) {
            setStatus("error")
            setControlOpen(true)
            return
          }

          const map = mapRef.current
          if (!map || !mapLoadedRef.current) return
          markPublicMapLocationGranted(window.sessionStorage)
          setHasGrantedLocation(true)
          setCoordinates(nextCoordinates)
          syncUserLocationLayers(map, nextCoordinates)
          setStatus("centered")
          setControlOpen(false)
          if (source === "manual" || !userMovedMapRef.current) {
            focusUserLocation(map, nextCoordinates)
          }
        },
        (error) => {
          if (requestSequenceRef.current !== requestSequence) return
          setStatus(resolveUserLocationStatusFromError(error))
          setControlOpen(true)
        },
        PUBLIC_MAP_GEOLOCATION_OPTIONS
      )
    },
    [mapLoadedRef, mapRef]
  )

  useEffect(() => {
    if (
      entranceStartedRef.current ||
      suppressAutomaticEntrance ||
      welcomeOpen ||
      !mapLoadedRef.current ||
      !mapRef.current ||
      typeof window === "undefined"
    ) {
      return
    }

    entranceStartedRef.current = true
    const storedGrant = hasGrantedPublicMapLocation(window.sessionStorage)
    if (storedGrant) {
      setHasGrantedLocation(true)
      setControlOpen(false)
    } else if (hasRunPublicMapLocationEntrance(window.sessionStorage)) {
      setStatus("prompt")
      setControlOpen(true)
      return
    } else {
      markPublicMapLocationEntranceRun(window.sessionStorage)
    }

    if (
      window.isSecureContext === false ||
      !("geolocation" in window.navigator)
    ) {
      setStatus("unavailable")
      setControlOpen(!storedGrant)
      return
    }

    if (!("permissions" in window.navigator)) {
      setStatus("prompt")
      setControlOpen(!storedGrant)
      return
    }

    let cancelled = false
    setStatus("checking")
    void window.navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (cancelled) return
        const action = resolvePublicMapLocationPermissionAction(
          permission.state
        )
        if (action === "request") {
          requestPosition("entrance")
          return
        }
        setStatus(action)
        setControlOpen(!storedGrant)
      })
      .catch(() => {
        if (cancelled) return
        setStatus("prompt")
        setControlOpen(!storedGrant)
      })

    return () => {
      cancelled = true
    }
  }, [
    mapLoadVersion,
    mapLoadedRef,
    mapRef,
    requestPosition,
    suppressAutomaticEntrance,
    welcomeOpen,
  ])

  useEffect(() => {
    if (suppressAutomaticEntrance || welcomeOpen) {
      setControlOpen(false)
      return
    }
    if (coordinates || hasGrantedLocation) {
      setControlOpen(false)
      return
    }
    if (!coordinates && entranceStartedRef.current) setControlOpen(true)
  }, [coordinates, hasGrantedLocation, suppressAutomaticEntrance, welcomeOpen])

  const handleControlClick = useCallback(() => {
    const map = mapRef.current
    if (coordinates && map) {
      focusUserLocation(map, coordinates)
      setStatus("centered")
      setControlOpen(false)
      return
    }
    setControlOpen(true)
    if (status === "idle" || status === "checking") setStatus("prompt")
  }, [coordinates, mapRef, status])

  const handleConfirm = useCallback(() => {
    requestPosition("manual")
  }, [requestPosition])

  return {
    active: coordinates !== null,
    coordinates,
    controlOpen,
    feedback: buildLocationFeedback(status),
    onConfirm: handleConfirm,
    onControlClick: handleControlClick,
    onOpenChange: setControlOpen,
    status,
  }
}
