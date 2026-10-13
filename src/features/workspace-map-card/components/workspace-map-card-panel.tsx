"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import ChevronUpIcon from "lucide-react/dist/esm/icons/chevron-up"
import LocateFixedIcon from "lucide-react/dist/esm/icons/locate-fixed"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

import { useWorkspaceMapCardController } from "../hooks/use-workspace-map-card-controller"
import type { WorkspaceMapCardInput, WorkspaceMapResolvedLocation } from "../types"

const MAP_STYLE = "mapbox://styles/mapbox/satellite-v9"
const FALLBACK_CENTER: [number, number] = [-98.5795, 39.8283]
const FALLBACK_ZOOM = 1.85

type MapboxApi = typeof import("mapbox-gl")["default"]

function resolveMapViewport(location: WorkspaceMapResolvedLocation | null) {
  if (!location) {
    return {
      center: FALLBACK_CENTER,
      zoom: FALLBACK_ZOOM,
      pitch: 46,
      bearing: -18,
    }
  }

  return {
    center: [location.lng, location.lat] as [number, number],
    zoom: 3.35,
    pitch: 44,
    bearing: -18,
  }
}

function MapChecklistItemRow({
  complete,
  detail,
  disableLink,
  href,
  label,
}: {
  complete: boolean
  detail: string
  disableLink: boolean
  href: string
  label: string
}) {
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md border",
          complete
            ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
            : "border-border/70 bg-background/60 text-muted-foreground",
        )}
      >
        <CheckIcon className="h-3 w-3" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs leading-5 text-muted-foreground">
          {detail}
        </span>
      </span>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-[0.14em]",
          complete
            ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
            : "border-border/70 bg-background/55 text-muted-foreground",
        )}
      >
        {complete ? "ready" : "needed"}
      </Badge>
    </>
  )

  if (disableLink) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/52 px-3 py-3">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/52 px-3 py-3 transition-colors duration-200 hover:border-border hover:bg-background/68"
    >
      {content}
    </Link>
  )
}

export function WorkspaceMapCardPanel({
  input,
}: {
  input: WorkspaceMapCardInput
}) {
  const {
    checklistItems,
    completionSummary,
    disableChecklistLinks,
    input: normalizedInput,
    locationLabel,
    previewUrl,
    resolvedLocation,
    token,
    tokenAvailable,
  } = useWorkspaceMapCardController({
    input,
    previewWidth: 1280,
    previewHeight: 760,
  })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapboxRef = useRef<MapboxApi | null>(null)
  const orgMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const viewerMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [viewerLocation, setViewerLocation] =
    useState<WorkspaceMapResolvedLocation | null>(null)
  const [locatingViewer, setLocatingViewer] = useState(false)

  const activeLocation = viewerLocation ?? resolvedLocation
  const mapViewport = useMemo(
    () => resolveMapViewport(activeLocation),
    [activeLocation],
  )

  useEffect(() => {
    if (!tokenAvailable) return
    if (!containerRef.current) return
    if (mapRef.current) return

    let cancelled = false

    async function initMap() {
      try {
        const mapboxModule = await import("mapbox-gl")
        const mapboxgl = (mapboxModule.default ?? mapboxModule) as MapboxApi
        if (!mapboxgl?.Map) {
          throw new Error("Mapbox failed to initialize.")
        }

        mapboxgl.accessToken = token
        mapboxRef.current = mapboxgl
        if (!containerRef.current || cancelled) return

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: mapViewport.center,
          zoom: mapViewport.zoom,
          pitch: mapViewport.pitch,
          bearing: mapViewport.bearing,
          projection: "globe",
          cooperativeGestures: true,
        })

        map.dragRotate.disable()
        map.boxZoom.disable()
        map.scrollZoom.disable()
        if (typeof map.touchZoomRotate.disableRotation === "function") {
          map.touchZoomRotate.disableRotation()
        }

        map.on("style.load", () => {
          map.setFog({
            color: "rgba(20, 38, 58, 0.88)",
            "high-color": "rgba(79, 124, 172, 0.35)",
            "space-color": "#02040a",
          })
        })

        map.on("error", (event) => {
          if (!event?.error) return
          setMapError("Mapbox couldn't load the map tiles.")
        })

        mapRef.current = map
      } catch {
        setMapError(
          "Mapbox couldn't start. Check your token and domain restrictions.",
        )
      }
    }

    void initMap()

    return () => {
      cancelled = true
      orgMarkerRef.current?.remove()
      viewerMarkerRef.current?.remove()
      orgMarkerRef.current = null
      viewerMarkerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapViewport.bearing, mapViewport.center, mapViewport.pitch, mapViewport.zoom, token, tokenAvailable])

  useEffect(() => {
    const map = mapRef.current
    const mapboxgl = mapboxRef.current
    if (!map || !mapboxgl) return

    if (!resolvedLocation) {
      orgMarkerRef.current?.remove()
      orgMarkerRef.current = null
      return
    }

    const markerElement = document.createElement("div")
    markerElement.className =
      "h-4 w-4 rounded-full border-2 border-white bg-sky-400 shadow-[0_0_0_8px_rgba(56,189,248,0.18)]"

    orgMarkerRef.current?.remove()
    orgMarkerRef.current = new mapboxgl.Marker({
      element: markerElement,
      anchor: "center",
    })
      .setLngLat([resolvedLocation.lng, resolvedLocation.lat])
      .addTo(map)
  }, [resolvedLocation])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.flyTo({
      center: mapViewport.center,
      zoom: mapViewport.zoom,
      pitch: mapViewport.pitch,
      bearing: mapViewport.bearing,
      duration: 900,
      essential: true,
    })
  }, [mapViewport])

  useEffect(() => {
    const map = mapRef.current
    const mapboxgl = mapboxRef.current
    if (!map || !mapboxgl) return

    if (!viewerLocation) {
      viewerMarkerRef.current?.remove()
      viewerMarkerRef.current = null
      return
    }

    const markerElement = document.createElement("div")
    markerElement.className =
      "h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.22)]"

    viewerMarkerRef.current?.remove()
    viewerMarkerRef.current = new mapboxgl.Marker({
      element: markerElement,
      anchor: "center",
    })
      .setLngLat([viewerLocation.lng, viewerLocation.lat])
      .addTo(map)
  }, [viewerLocation])

  const handleLocateViewer = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setMapError("Location access isn't available in this browser.")
      return
    }

    setLocatingViewer(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingViewer(false)
        setViewerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: "Your location",
          source: "viewer",
        })
      },
      () => {
        setLocatingViewer(false)
        setMapError("Location access was denied or unavailable.")
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000,
      },
    )
  }, [])

  return (
    <div
      className={cn(
        "group relative min-h-0 flex-1 overflow-hidden rounded-b-[24px]",
        normalizedInput.presentationMode && "rounded-b-[20px]",
      )}
    >
      <div
        className={cn(
          "relative h-full min-h-[360px] overflow-hidden rounded-[22px] border border-border/60 bg-slate-950",
          normalizedInput.presentationMode && "min-h-[344px] rounded-[20px]",
        )}
      >
        <div
          ref={containerRef}
          aria-label="Organization map"
          className={cn(
            "absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.018]",
            tokenAvailable && !mapError ? "opacity-100" : "opacity-0",
          )}
        />
        {tokenAvailable && !mapError && previewUrl ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-[1.018]"
            style={{ backgroundImage: `url(${previewUrl})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.04)_0%,rgba(2,6,23,0.42)_100%)]" />
        {!tokenAvailable || mapError ? (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_24%,rgba(148,163,184,0.18),transparent_28%),linear-gradient(160deg,rgba(15,23,42,0.95)_0%,rgba(30,41,59,0.92)_100%)]">
            <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white/85 backdrop-blur-md">
                <MapPinIcon className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Map preview unavailable</p>
                <p className="text-sm leading-6 text-white/70">
                  {mapError ??
                    "Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map surface."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          <Badge className="rounded-full border-white/12 bg-background/76 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground shadow-sm backdrop-blur-md">
            Map
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-white/12 bg-background/70 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-md"
          >
            {completionSummary.completedCount} of {completionSummary.totalCount} ready
          </Badge>
        </div>

        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 rounded-full border border-white/12 bg-background/76 px-3 text-xs backdrop-blur-md"
            onClick={() => setChecklistOpen((current) => !current)}
          >
            {checklistOpen ? (
              <ChevronDownIcon data-icon="inline-start" />
            ) : (
              <ChevronUpIcon data-icon="inline-start" />
            )}
            {checklistOpen ? "Minimize checklist" : "Show checklist"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 rounded-full border border-white/12 bg-background/76 px-3 text-xs backdrop-blur-md"
            onClick={handleLocateViewer}
            disabled={locatingViewer || normalizedInput.presentationMode}
          >
            <LocateFixedIcon data-icon="inline-start" />
            {locatingViewer ? "Locating…" : "Use my location"}
          </Button>
        </div>

        <div className="absolute bottom-4 right-4 z-20 rounded-full border border-white/12 bg-background/74 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-md">
          {locationLabel || "Location pending"}
        </div>

        <Collapsible open={checklistOpen} onOpenChange={setChecklistOpen}>
          <CollapsibleContent forceMount asChild>
            <div
              className={cn(
                "absolute bottom-4 left-4 z-20 w-[min(336px,calc(100%-2rem))] overflow-hidden rounded-[24px] border border-white/12 bg-background/74 shadow-[0_24px_60px_-30px_rgba(2,6,23,0.72)] backdrop-blur-xl transition-[opacity,transform] duration-200 ease-out",
                checklistOpen
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0",
              )}
            >
              <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Go live on the map
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Finish the public profile basics so this card can represent the organization well.
                  </p>
                </div>
                <Badge
                  variant={completionSummary.allComplete ? "default" : "secondary"}
                  className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                >
                  {completionSummary.allComplete ? "ready" : "in progress"}
                </Badge>
              </div>
              <div className="space-y-2 px-4 pb-4">
                {checklistItems.map((item) => (
                  <MapChecklistItemRow
                    key={item.id}
                    complete={item.complete}
                    detail={item.detail}
                    disableLink={disableChecklistLinks}
                    href={item.href}
                    label={item.label}
                  />
                ))}
                {disableChecklistLinks ? (
                  <p className="px-1 pt-1 text-[11px] leading-5 text-muted-foreground">
                    These links unlock after this guide step.
                  </p>
                ) : null}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {!checklistOpen ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-4 left-4 z-20 h-9 rounded-full border border-white/12 bg-background/76 px-3 text-xs backdrop-blur-md"
            onClick={() => setChecklistOpen(true)}
          >
            <ChevronUpIcon data-icon="inline-start" />
            Show checklist
          </Button>
        ) : null}
      </div>
    </div>
  )
}
