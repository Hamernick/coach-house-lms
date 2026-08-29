"use client"

import "mapbox-gl/dist/mapbox-gl.css"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import type mapboxgl from "mapbox-gl"

import {
  applyPublicMapBasemapConfig,
  applyPublicMapSpaceFog,
  resolvePublicMapBasemapConfig,
  resolvePublicMapStyleForTheme,
} from "@/components/public/public-map-index/constants"
import {
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
} from "@/components/public/public-map-index/map-view-helpers"
import { syncPublicMapMarkerArtwork } from "@/components/public/public-map-index/sync-public-map-marker-artwork"
import type { PublicMapPointFeature } from "@/lib/public-map/public-map-geojson"
import { registerPublicMapPinStyleImageMissingHandler } from "@/lib/public-map/public-map-pin-marker-images"
import { normalizePublicMapTheme } from "@/lib/public-map/public-map-theme"

type PreviewStatus = "unavailable" | "loading" | "ready"
type HomeMapCameraMode = "preview-bounds" | "collection-globe"

const HOME_MAP_PREVIEW_MAX_ZOOM = 7
const HOME_MAP_COLLECTION_MAX_ZOOM = 2.15

function fitHomeMapToPreviewFeatures({
  container,
  features,
  map,
  cameraMode,
}: {
  container: HTMLDivElement
  features: PublicMapPointFeature[]
  map: mapboxgl.Map
  cameraMode: HomeMapCameraMode
}) {
  if (features.length === 0) return

  const longitudes = features.map((feature) => feature.geometry.coordinates[0])
  const latitudes = features.map((feature) => feature.geometry.coordinates[1])
  map.fitBounds(
    [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ],
    {
      duration: 0,
      maxZoom:
        cameraMode === "collection-globe"
          ? HOME_MAP_COLLECTION_MAX_ZOOM
          : HOME_MAP_PREVIEW_MAX_ZOOM,
      padding:
        cameraMode === "collection-globe"
          ? Math.max(
              40,
              Math.min(container.clientWidth, container.clientHeight) * 0.12
            )
          : {
              top: 72,
              right: 72,
              bottom: Math.min(180, container.clientHeight * 0.22),
              left: Math.min(320, container.clientWidth * 0.24),
            },
    }
  )
}

export function HomeFindMapMini({
  cameraMode = "preview-bounds",
  deferUntilVisible = false,
  interactive = false,
  mapboxToken,
  onMarkerCountChange,
}: {
  cameraMode?: HomeMapCameraMode
  deferUntilVisible?: boolean
  interactive?: boolean
  mapboxToken?: string
  onMarkerCountChange?: (count: number) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapReadyRef = useRef(false)
  const [previewFeatures, setPreviewFeatures] = useState<
    PublicMapPointFeature[]
  >([])
  const [canInitialize, setCanInitialize] = useState(!deferUntilVisible)
  const previewFeaturesRef = useRef(previewFeatures)
  const mapTheme = normalizePublicMapTheme(useTheme().resolvedTheme)
  const [status, setStatus] = useState<PreviewStatus>(
    mapboxToken?.startsWith("pk.") ? "loading" : "unavailable"
  )
  previewFeaturesRef.current = previewFeatures

  useEffect(() => {
    const container = mapContainerRef.current
    if (!deferUntilVisible || canInitialize || !container) return
    if (!("IntersectionObserver" in window)) {
      setCanInitialize(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setCanInitialize(true)
        observer.disconnect()
      },
      { rootMargin: "320px 0px", threshold: 0.01 }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [canInitialize, deferUntilVisible])

  useEffect(() => {
    const controller = new AbortController()
    void fetch("/api/public/home-map-preview?v=5", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { features?: PublicMapPointFeature[] } | null) => {
        if (payload?.features && payload.features.length > 0) {
          setPreviewFeatures(payload.features)
          onMarkerCountChange?.(payload.features.length)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [onMarkerCountChange])

  useEffect(() => {
    if (!canInitialize) return
    const container = mapContainerRef.current
    const token = mapboxToken?.trim() ?? ""
    if (!container || !token.startsWith("pk.")) {
      setStatus("unavailable")
      return
    }

    let cancelled = false
    let startTimer: number | null = null
    let loadTimer: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let stopStyleImageMissing = () => {}

    mapReadyRef.current = false
    setStatus("loading")

    const initialize = async () => {
      try {
        const mapboxModule = await import("mapbox-gl")
        if (cancelled || !mapContainerRef.current) return

        const mapboxgl = (mapboxModule.default ??
          mapboxModule) as (typeof import("mapbox-gl"))["default"]
        mapboxgl.accessToken = token

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: resolvePublicMapStyleForTheme(mapTheme),
          config: {
            basemap: resolvePublicMapBasemapConfig(mapTheme),
          },
          center: FALLBACK_CENTER,
          zoom: FALLBACK_ZOOM,
          projection: "globe",
          interactive,
          cooperativeGestures: interactive,
          attributionControl: false,
          fadeDuration: 0,
          logoPosition: "bottom-left",
          renderWorldCopies: false,
        })
        mapRef.current = map
        map.addControl(
          new mapboxgl.AttributionControl({ compact: false }),
          "bottom-right"
        )

        const syncGlobe = () => {
          if (cancelled || mapRef.current !== map) return

          map.setProjection("globe")
          applyPublicMapBasemapConfig(map, mapTheme)
          applyPublicMapSpaceFog(map)
          const { profileImageLoads, updated } = syncPublicMapMarkerArtwork({
            features: previewFeaturesRef.current,
            map,
            maxRelevanceTier: 3,
            showLabels: false,
            theme: mapTheme,
          })
          if (!updated) return
          fitHomeMapToPreviewFeatures({
            container,
            features: previewFeaturesRef.current,
            map,
            cameraMode,
          })
          void Promise.all(profileImageLoads)

          requestAnimationFrame(() => {
            if (mapRef.current === map) map.resize()
          })
        }

        const markGlobeReady = () => {
          if (cancelled || mapRef.current !== map || mapReadyRef.current) return
          if (!map.areTilesLoaded()) return
          if (previewFeaturesRef.current.length === 0) return

          mapReadyRef.current = true
          if (loadTimer !== null) {
            window.clearTimeout(loadTimer)
            loadTimer = null
          }
          setStatus("ready")
        }

        const handleMapError = (event: mapboxgl.ErrorEvent) => {
          if (event.error && !mapReadyRef.current) {
            setStatus("unavailable")
          }
        }

        stopStyleImageMissing = registerPublicMapPinStyleImageMissingHandler({
          map,
          theme: mapTheme,
        })
        map.on("style.load", syncGlobe)
        map.on("load", syncGlobe)
        map.on("idle", markGlobeReady)
        map.on("error", handleMapError)

        resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(mapContainerRef.current)
        loadTimer = window.setTimeout(() => {
          if (!cancelled && mapRef.current === map && !mapReadyRef.current) {
            setStatus("unavailable")
          }
        }, 12_000)
      } catch {
        if (!cancelled) setStatus("unavailable")
      }
    }

    startTimer = window.setTimeout(() => void initialize(), 60)

    return () => {
      cancelled = true
      if (startTimer !== null) window.clearTimeout(startTimer)
      if (loadTimer !== null) window.clearTimeout(loadTimer)
      resizeObserver?.disconnect()
      stopStyleImageMissing()
      mapRef.current?.remove()
      mapRef.current = null
      mapReadyRef.current = false
    }
  }, [cameraMode, canInitialize, interactive, mapTheme, mapboxToken])

  useEffect(() => {
    const map = mapRef.current
    const container = mapContainerRef.current
    if (!map || !container || previewFeatures.length === 0) return
    const { profileImageLoads, updated } = syncPublicMapMarkerArtwork({
      features: previewFeatures,
      map,
      maxRelevanceTier: 3,
      showLabels: false,
      theme: mapTheme,
    })
    if (!updated) return
    fitHomeMapToPreviewFeatures({
      container,
      features: previewFeatures,
      map,
      cameraMode,
    })
    void Promise.all(profileImageLoads)
    const markPreviewReady = () => {
      if (mapRef.current !== map) return
      mapReadyRef.current = true
      setStatus("ready")
    }
    if (map.areTilesLoaded()) {
      requestAnimationFrame(markPreviewReady)
      return
    }
    map.once("idle", markPreviewReady)
    return () => map.off("idle", markPreviewReady)
  }, [cameraMode, mapTheme, previewFeatures])

  return (
    <figure
      data-home-map-preview=""
      data-home-map-marker-count={previewFeatures.length}
      data-home-map-status={status}
      data-home-map-camera={cameraMode}
      data-home-map-interactive={interactive ? "true" : "false"}
      data-home-map-controls-position="bottom-right"
      className={`absolute inset-0 m-0 overflow-hidden bg-[#05070d] [&_.mapboxgl-ctrl-attrib]:!bg-black/55 [&_.mapboxgl-ctrl-attrib]:!px-1 [&_.mapboxgl-ctrl-attrib]:!text-[10px] [&_.mapboxgl-ctrl-attrib]:!leading-4 [&_.mapboxgl-ctrl-attrib_a]:!text-white/70 [&_.mapboxgl-ctrl-attrib_a:hover]:!text-white ${interactive ? "[&_.mapboxgl-canvas]:pointer-events-auto" : "[&_.mapboxgl-canvas]:pointer-events-none"}`}
    >
      <figcaption className="sr-only">
        Public organizations and community resources across the map
      </figcaption>
      <div
        ref={mapContainerRef}
        data-home-map-preview-map=""
        className={`absolute inset-0 transition-opacity duration-200 ease-out motion-reduce:transition-none ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
    </figure>
  )
}
