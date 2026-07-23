"use client"

import "mapbox-gl/dist/mapbox-gl.css"

import { useEffect, useRef, useState } from "react"
import type mapboxgl from "mapbox-gl"

import {
  createHomeFindMapMarkerImage,
  HOME_MAP_MARKER_IMAGE_PIXEL_RATIO,
} from "@/components/public/home-find-map-marker-canvas"
import { applyPublicMapSpaceFog } from "@/components/public/public-map-index/constants"
import type { PublicMapGroupKey } from "@/lib/public-map/groups"

const HOME_MAP_STYLE = "mapbox://styles/mapbox/satellite-v9"
const HOME_MAP_CENTER: [number, number] = [-96.5, 38.4]
const HOME_MAP_ZOOM = 3.15
const HOME_MAP_SOURCE_ID = "home-map-preview-points"
const HOME_MAP_LAYER_ID = "home-map-preview-markers"

const HOME_MAP_MARKERS = [
  {
    key: "home-map-community",
    label: "Community arts",
    primaryGroup: "community",
    selected: true,
  },
  {
    key: "home-map-education",
    label: "Education",
    primaryGroup: "education",
    selected: false,
  },
  {
    key: "home-map-health",
    label: "Health access",
    primaryGroup: "health",
    selected: false,
  },
  {
    key: "home-map-funding",
    label: "Funding",
    primaryGroup: "funding",
    selected: false,
  },
] satisfies ReadonlyArray<{
  key: string
  label: string
  primaryGroup: PublicMapGroupKey
  selected: boolean
}>

const HOME_MAP_POINTS = [
  [-122.3321, 47.6062, "home-map-community"],
  [-122.6765, 45.5231, "home-map-health"],
  [-122.4194, 37.7749, "home-map-education"],
  [-118.2437, 34.0522, "home-map-community"],
  [-104.9903, 39.7392, "home-map-funding"],
  [-96.797, 32.7767, "home-map-education"],
  [-87.6298, 41.8781, "home-map-health"],
  [-83.0458, 42.3314, "home-map-community"],
  [-84.388, 33.749, "home-map-funding"],
  [-80.1918, 25.7617, "home-map-health"],
  [-74.006, 40.7128, "home-map-community"],
  [-71.0589, 42.3601, "home-map-education"],
] as const

type PreviewStatus = "unavailable" | "loading" | "ready"

export function HomeFindMapMini({ mapboxToken }: { mapboxToken?: string }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [status, setStatus] = useState<PreviewStatus>(
    mapboxToken?.startsWith("pk.") ? "loading" : "unavailable"
  )

  useEffect(() => {
    const container = mapContainerRef.current
    const token = mapboxToken?.trim() ?? ""
    if (!container || !token.startsWith("pk.")) {
      return
    }

    let cancelled = false
    let startTimer: number | null = null
    let loadTimer: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let mapReady = false

    const initialize = async () => {
      try {
        const mapboxModule = await import("mapbox-gl")
        if (cancelled || !mapContainerRef.current) return

        const mapboxgl = (mapboxModule.default ??
          mapboxModule) as (typeof import("mapbox-gl"))["default"]
        mapboxgl.accessToken = token

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: HOME_MAP_STYLE,
          center: HOME_MAP_CENTER,
          zoom: HOME_MAP_ZOOM,
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

        const markReady = () => {
          if (cancelled || mapRef.current !== map) return
          mapReady = true
          if (loadTimer !== null) {
            window.clearTimeout(loadTimer)
            loadTimer = null
          }

          applyPublicMapSpaceFog(map)
          for (const definition of HOME_MAP_MARKERS) {
            const image = createHomeFindMapMarkerImage({
              label: definition.label,
              primaryGroup: definition.primaryGroup,
              selected: definition.selected,
            })
            if (!image || map.hasImage(definition.key)) continue
            map.addImage(definition.key, image, {
              pixelRatio: HOME_MAP_MARKER_IMAGE_PIXEL_RATIO,
            })
          }

          if (!map.getSource(HOME_MAP_SOURCE_ID)) {
            map.addSource(HOME_MAP_SOURCE_ID, {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: HOME_MAP_POINTS.map(
                  ([longitude, latitude, markerImageKey]) => ({
                    type: "Feature",
                    properties: { markerImageKey },
                    geometry: {
                      type: "Point",
                      coordinates: [longitude, latitude],
                    },
                  })
                ),
              },
            })
          }

          if (!map.getLayer(HOME_MAP_LAYER_ID)) {
            map.addLayer({
              id: HOME_MAP_LAYER_ID,
              type: "symbol",
              source: HOME_MAP_SOURCE_ID,
              layout: {
                "icon-image": ["get", "markerImageKey"],
                "icon-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  0.9,
                  4.5,
                  1.3,
                ],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
              },
            })
          }

          map.resize()
          setStatus("ready")
        }

        map.once("load", markReady)
        map.on("error", () => {
          if (!cancelled && mapRef.current === map && !mapReady) {
            setStatus("unavailable")
          }
        })

        resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(mapContainerRef.current)
        loadTimer = window.setTimeout(() => {
          if (!cancelled && mapRef.current === map && !mapReady) {
            setStatus("unavailable")
          }
        }, 12_000)
      } catch {
        if (!cancelled) setStatus("unavailable")
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        startTimer = window.setTimeout(() => void initialize(), 120)
      },
      { rootMargin: "160px" }
    )
    observer.observe(container)

    return () => {
      cancelled = true
      observer.disconnect()
      if (startTimer !== null) window.clearTimeout(startTimer)
      if (loadTimer !== null) window.clearTimeout(loadTimer)
      resizeObserver?.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapboxToken])

  return (
    <div
      data-home-map-preview=""
      data-home-map-status={status}
      data-home-map-controls-position="bottom-right"
      className="absolute inset-0 overflow-hidden bg-[#07111f] [&_.mapboxgl-ctrl-attrib]:!bg-black/55 [&_.mapboxgl-ctrl-attrib]:!px-1 [&_.mapboxgl-ctrl-attrib]:!text-[10px] [&_.mapboxgl-ctrl-attrib]:!leading-4 [&_.mapboxgl-ctrl-attrib_a]:!text-white/70 [&_.mapboxgl-ctrl-attrib_a:hover]:!text-white"
    >
      <span className="sr-only">
        Coach House public map preview showing organizations and community
        resources across the United States
      </span>
      <div
        ref={mapContainerRef}
        data-home-map-preview-map=""
        className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  )
}
