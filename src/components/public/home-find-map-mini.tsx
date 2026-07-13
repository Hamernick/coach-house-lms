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

const FALLBACK_MARKERS = [
  [18, 35, "bg-sky-400", "4"],
  [39, 30, "bg-indigo-400", "3"],
  [65, 37, "bg-emerald-400", "5"],
  [84, 29, "bg-sky-400", "2"],
] as const

type PreviewStatus = "fallback" | "loading" | "ready"

function HomeMapFallback() {
  return (
    <div
      data-home-map-preview-fallback=""
      className="absolute inset-0 overflow-hidden bg-[#07111f] transition-opacity duration-500 motion-reduce:transition-none"
      aria-hidden
    >
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:42px_42px] opacity-25" />
      <div className="absolute top-[9%] left-[4%] h-[72%] w-[43%] rotate-[-8deg] bg-[#1c3028] opacity-90 [clip-path:polygon(10%_6%,68%_0,96%_19%,82%_43%,96%_68%,63%_88%,39%_79%,23%_100%,8%_76%,18%_54%,0_32%)]" />
      <div className="absolute top-[16%] right-[2%] h-[64%] w-[50%] rotate-[5deg] bg-[#243328] opacity-90 [clip-path:polygon(6%_15%,36%_0,62%_11%,91%_4%,100%_31%,80%_48%,92%_73%,57%_89%,40%_100%,26%_78%,4%_68%,16%_45%,0_28%)]" />
      {FALLBACK_MARKERS.map(([left, top, color, count], index) => (
        <span
          key={`${left}-${top}`}
          className={`absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 ${color} shadow-[0_0_0_5px_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.42)]`}
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-black/65 text-[9px] font-semibold text-white">
            {count || (index % 2 === 0 ? "CH" : "•")}
          </span>
        </span>
      ))}
    </div>
  )
}

function HomeMapSelectedPreview() {
  return (
    <div
      data-home-map-selected-preview=""
      className="absolute top-[21%] right-5 hidden w-56 rounded-lg border border-white/20 bg-black/60 p-3 text-white shadow-lg backdrop-blur-xl sm:block lg:right-8"
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-500 text-[10px] font-semibold shadow-[0_0_0_4px_rgba(52,211,153,0.14)]">
          CA
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">
            Community Arts Initiative
          </p>
          <p className="mt-1 text-[10px] text-white/60">Public profile</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[9px] text-white/65">
        {[
          ["3", "Programs"],
          ["8", "People"],
          ["12", "Files"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-md border border-white/10 py-2">
            <p className="font-semibold text-white">{value}</p>
            <p className="mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeFindMapMini({ mapboxToken }: { mapboxToken?: string }) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [status, setStatus] = useState<PreviewStatus>(
    mapboxToken?.startsWith("pk.") ? "loading" : "fallback"
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
          logoPosition: "top-left",
          renderWorldCopies: false,
        })
        mapRef.current = map
        map.addControl(
          new mapboxgl.AttributionControl({ compact: true }),
          "top-left"
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
            setStatus("fallback")
          }
        })

        resizeObserver = new ResizeObserver(() => map.resize())
        resizeObserver.observe(mapContainerRef.current)
        loadTimer = window.setTimeout(() => {
          if (!cancelled && mapRef.current === map && !mapReady) {
            setStatus("fallback")
          }
        }, 12_000)
      } catch {
        if (!cancelled) setStatus("fallback")
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
      data-home-map-controls-position="top-left"
      className="absolute inset-0 overflow-hidden bg-[#07111f] [&_.mapboxgl-ctrl-top-left]:!top-16 [&_.mapboxgl-ctrl-top-left]:!left-3 [&_.mapboxgl-ctrl-top-left]:flex [&_.mapboxgl-ctrl-top-left]:flex-col [&_.mapboxgl-ctrl-top-left]:items-start [&_.mapboxgl-ctrl-top-left_.mapboxgl-ctrl]:!m-0 [&_.mapboxgl-ctrl-top-left_.mapboxgl-ctrl]:!mb-1.5"
    >
      <span className="sr-only">
        Coach House public map preview showing organizations and community
        resources across the United States
      </span>
      <HomeMapFallback />
      <div
        ref={mapContainerRef}
        data-home-map-preview-map=""
        className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className="absolute top-20 right-5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-medium text-white/75 shadow-sm backdrop-blur-lg sm:right-8"
        aria-hidden
      >
        Public resource map
      </div>
      <HomeMapSelectedPreview />
    </div>
  )
}
