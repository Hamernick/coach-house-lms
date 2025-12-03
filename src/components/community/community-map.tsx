"use client"

import { useEffect, useRef, useState } from "react"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import type { CommunityOrganization } from "@/lib/queries/community"

const MAP_STYLE = "mapbox://styles/mapbox/satellite-v9"
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""

export function CommunityMap({ organizations }: { organizations: CommunityOrganization[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapboxRef = useRef<typeof mapboxgl | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [tokenAvailable] = useState(() => Boolean(MAPBOX_TOKEN))

  useEffect(() => {
    if (!tokenAvailable) return
    if (!containerRef.current) return
    if (mapRef.current) return

    let cancelled = false

    async function initMap() {
      const mapboxModule = await import("mapbox-gl")
      const mapboxgl = mapboxModule.default
      mapboxRef.current = mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN

      if (!containerRef.current || cancelled) return

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [0, 20],
        zoom: 1.2,
        projection: "globe",
        cooperativeGestures: true,
      })

      map.dragRotate.disable()
      map.boxZoom.disable()
      if (typeof map.touchZoomRotate.disableRotation === "function") {
        map.touchZoomRotate.disableRotation()
      }
      map.scrollZoom.disable()

      map.on("style.load", () => {
        map.setFog({ color: "rgba(12, 24, 36, 0.95)", "high-color": "rgba(36, 72, 96, 0.6)", "space-color": "#010104" })
      })

      mapRef.current = map
    }

    initMap()

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [tokenAvailable])

  useEffect(() => {
    if (!tokenAvailable) return
    const map = mapRef.current
    const mapboxgl = mapboxRef.current
    if (!map || !mapboxgl) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    organizations.forEach((org) => {
      const el = document.createElement("div")
      el.className = "community-marker"
      if (org.logoUrl) {
        el.style.backgroundImage = `url(${org.logoUrl})`
      } else {
        el.textContent = org.name?.charAt(0)?.toUpperCase() ?? ""
        el.classList.add("community-marker--fallback")
      }

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([org.longitude, org.latitude])
        .addTo(map)

      markersRef.current.push(marker)
    })

    if (organizations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      organizations.forEach((org) => bounds.extend([org.longitude, org.latitude]))
      if (!bounds.isEmpty()) {
        const padding = organizations.length === 1 ? 160 : 120
        map.fitBounds(bounds, { padding, maxZoom: 4, duration: 800 })
      }
    }
  }, [organizations, tokenAvailable])

  if (!tokenAvailable) {
    return (
      <div className="flex h-[480px] w-full items-center justify-center rounded-3xl border bg-card/70 text-sm text-muted-foreground">
        Map unavailable. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the community globe.
      </div>
    )
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-3xl border bg-card/70">
      <div ref={containerRef} className="absolute inset-0" aria-label="Community map" />
      {!organizations.length ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex w-[min(320px,90%)] -translate-x-1/2 items-center justify-center rounded-full border border-border/60 bg-background/85 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
          No public organizations yet. Publish a profile to place your first marker.
        </div>
      ) : null}
    </div>
  )
}
