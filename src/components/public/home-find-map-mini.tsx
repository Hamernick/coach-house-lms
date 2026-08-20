"use client"

import "mapbox-gl/dist/mapbox-gl.css"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import type mapboxgl from "mapbox-gl"

import {
  applyPublicMapBasemapConfig,
  applyPublicMapSpaceFog,
  PUBLIC_MAP_STANDARD_STYLE,
  resolvePublicMapBasemapConfig,
} from "@/components/public/public-map-index/constants"
import {
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
} from "@/components/public/public-map-index/map-view-helpers"
import { startSpinningMapGlobe } from "@/components/public/public-map-index/spinning-globe"
import { syncPublicMapMarkerArtwork } from "@/components/public/public-map-index/sync-public-map-marker-artwork"
import type { PublicMapPointFeature } from "@/lib/public-map/public-map-geojson"
import { registerPublicMapPinStyleImageMissingHandler } from "@/lib/public-map/public-map-pin-marker-images"
import { normalizePublicMapTheme } from "@/lib/public-map/public-map-theme"

type PreviewStatus = "unavailable" | "loading" | "ready"

const HOME_MAP_DEVELOPMENT_FALLBACK_STYLE = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/positron",
} as const
function isMapboxAuthorizationError(event: mapboxgl.ErrorEvent) {
  const error = event.error as Error & { status?: number; url?: string }
  return (
    (error.status === 401 || error.status === 403) &&
    (error.url?.includes("api.mapbox.com") ?? true)
  )
}

export function HomeFindMapMini({ mapboxToken }: { mapboxToken?: string }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [previewFeatures, setPreviewFeatures] = useState<
    PublicMapPointFeature[]
  >([])
  const previewFeaturesRef = useRef(previewFeatures)
  const mapTheme = normalizePublicMapTheme(useTheme().resolvedTheme)
  const [status, setStatus] = useState<PreviewStatus>(
    mapboxToken?.startsWith("pk.") ? "loading" : "unavailable"
  )
  previewFeaturesRef.current = previewFeatures

  useEffect(() => {
    const controller = new AbortController()
    void fetch("/api/public/home-map-preview", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { features?: PublicMapPointFeature[] } | null) => {
        if (payload?.features && payload.features.length > 0) {
          setPreviewFeatures(payload.features)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  useEffect(() => {
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
    let rotation: ReturnType<typeof startSpinningMapGlobe> | null = null
    let stopStyleImageMissing = () => {}
    let mapReady = false
    let developmentFallbackActive =
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
    let previewVisible = false

    setStatus("loading")

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        previewVisible = entries.some((entry) => entry.isIntersecting)
        rotation?.refresh()
      },
      { threshold: 0.01 }
    )
    visibilityObserver.observe(container)

    const initialize = async () => {
      try {
        const mapboxModule = await import("mapbox-gl")
        if (cancelled || !mapContainerRef.current) return

        const mapboxgl = (mapboxModule.default ??
          mapboxModule) as (typeof import("mapbox-gl"))["default"]
        mapboxgl.accessToken = token

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: developmentFallbackActive
            ? HOME_MAP_DEVELOPMENT_FALLBACK_STYLE[mapTheme]
            : PUBLIC_MAP_STANDARD_STYLE,
          ...(developmentFallbackActive
            ? {}
            : {
                config: {
                  basemap: resolvePublicMapBasemapConfig(mapTheme),
                },
              }),
          center: FALLBACK_CENTER,
          zoom: FALLBACK_ZOOM,
          projection: "globe",
          interactive: false,
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
          if (!developmentFallbackActive) {
            applyPublicMapBasemapConfig(map, mapTheme)
          }
          applyPublicMapSpaceFog(map)
          const { profileImageLoads, updated } = syncPublicMapMarkerArtwork({
            features: previewFeaturesRef.current,
            map,
            maxRelevanceTier: 3,
            showLabels: false,
            theme: mapTheme,
          })
          if (!updated) return
          void Promise.all(profileImageLoads)

          requestAnimationFrame(() => {
            if (mapRef.current === map) map.resize()
          })
        }

        const markGlobeReady = () => {
          if (cancelled || mapRef.current !== map || mapReady) return
          if (!map.areTilesLoaded()) return

          mapReady = true
          if (loadTimer !== null) {
            window.clearTimeout(loadTimer)
            loadTimer = null
          }
          rotation = startSpinningMapGlobe({
            map,
            shouldRotate: () => previewVisible,
          })
          setStatus("ready")
        }

        const activateDevelopmentFallback = () => {
          if (
            process.env.NODE_ENV === "production" ||
            developmentFallbackActive
          ) {
            return false
          }

          developmentFallbackActive = true
          mapReady = false
          rotation?.stop()
          rotation = null
          setStatus("loading")
          map.setStyle(HOME_MAP_DEVELOPMENT_FALLBACK_STYLE[mapTheme])
          if (loadTimer !== null) window.clearTimeout(loadTimer)
          loadTimer = window.setTimeout(() => {
            if (!cancelled && mapRef.current === map && !mapReady) {
              setStatus("unavailable")
            }
          }, 20_000)
          return true
        }

        const handleMapError = (event: mapboxgl.ErrorEvent) => {
          if (
            isMapboxAuthorizationError(event) &&
            activateDevelopmentFallback()
          ) {
            return
          }

          if (!mapReady) {
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
        loadTimer = window.setTimeout(
          () => {
            if (!cancelled && mapRef.current === map && !mapReady) {
              setStatus("unavailable")
            }
          },
          developmentFallbackActive ? 20_000 : 12_000
        )
      } catch {
        if (!cancelled) setStatus("unavailable")
      }
    }

    startTimer = window.setTimeout(() => void initialize(), 60)

    return () => {
      cancelled = true
      visibilityObserver.disconnect()
      if (startTimer !== null) window.clearTimeout(startTimer)
      if (loadTimer !== null) window.clearTimeout(loadTimer)
      resizeObserver?.disconnect()
      rotation?.stop()
      stopStyleImageMissing()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapTheme, mapboxToken])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const { profileImageLoads } = syncPublicMapMarkerArtwork({
      features: previewFeatures,
      map,
      maxRelevanceTier: 3,
      showLabels: false,
      theme: mapTheme,
    })
    void Promise.all(profileImageLoads)
  }, [mapTheme, previewFeatures])

  return (
    <div
      data-home-map-preview=""
      data-home-map-marker-count={previewFeatures.length}
      data-home-map-status={status}
      data-home-map-controls-position="bottom-right"
      role="img"
      aria-label="Public organizations and community resources on a rotating globe"
      className="absolute inset-0 overflow-hidden bg-[#05070d] [&_.mapboxgl-canvas]:pointer-events-none [&_.mapboxgl-ctrl-attrib]:!bg-black/55 [&_.mapboxgl-ctrl-attrib]:!px-1 [&_.mapboxgl-ctrl-attrib]:!text-[10px] [&_.mapboxgl-ctrl-attrib]:!leading-4 [&_.mapboxgl-ctrl-attrib_a]:!text-white/70 [&_.mapboxgl-ctrl-attrib_a:hover]:!text-white"
    >
      <div
        ref={mapContainerRef}
        data-home-map-preview-map=""
        className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  )
}
