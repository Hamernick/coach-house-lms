"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import GlobeIcon from "lucide-react/dist/esm/icons/globe"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import MoreVerticalIcon from "lucide-react/dist/esm/icons/more-vertical"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { WorkspaceCardSize } from "./workspace-board-types"

type AtlasLocation = {
  id: string
  label: string
  mode: "onsite" | "online"
  lat: number | null
  lng: number | null
}

const MAPBOX_GEOCODE_ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places"
const MAPBOX_STATIC_STYLE = "mapbox/light-v11"
const DEFAULT_MAP_CENTER = { lng: -98.5795, lat: 39.8283, zoom: 2.1 }

async function geocodeAtlasLocation({
  query,
  token,
}: {
  query: string
  token: string
}): Promise<{ lat: number; lng: number } | null> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery || !token) return null

  const url =
    `${MAPBOX_GEOCODE_ENDPOINT}/${encodeURIComponent(normalizedQuery)}.json` +
    `?access_token=${token}&limit=1`
  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" })
    if (!response.ok) return null
    const payload = (await response.json()) as {
      features?: Array<{ center?: [number, number] }>
    }
    const center = payload.features?.[0]?.center
    if (!center || center.length < 2) return null
    const [lng, lat] = center
    if (typeof lat !== "number" || typeof lng !== "number") return null
    return { lat, lng }
  } catch {
    return null
  }
}

function buildAtlasStaticMapUrl({
  token,
  locations,
}: {
  token: string
  locations: AtlasLocation[]
}) {
  if (!token) return null
  const markerLocations = locations.filter(
    (location) => location.mode === "onsite" && typeof location.lat === "number" && typeof location.lng === "number",
  )

  if (markerLocations.length === 0) {
    return `https://api.mapbox.com/styles/v1/${MAPBOX_STATIC_STYLE}/static/${DEFAULT_MAP_CENTER.lng},${DEFAULT_MAP_CENTER.lat},${DEFAULT_MAP_CENTER.zoom},0/1200x600?access_token=${token}&logo=false&attribution=false`
  }

  const markers = markerLocations
    .slice(0, 6)
    .map((location) => `pin-s+111827(${location.lng!.toFixed(5)},${location.lat!.toFixed(5)})`)
    .join(",")
  return `https://api.mapbox.com/styles/v1/${MAPBOX_STATIC_STYLE}/static/${encodeURIComponent(markers)}/auto/1200x600?padding=48,48,48,48&access_token=${token}&logo=false&attribution=false`
}

function createRuntimeId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`
}

export function WorkspaceBoardAtlasCard({
  presentationMode,
}: {
  size: WorkspaceCardSize
  presentationMode: boolean
}) {
  const mapboxToken = (process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
  const tokenAvailable = mapboxToken.length > 0
  const [locations, setLocations] = useState<AtlasLocation[]>([])
  const [draftMode, setDraftMode] = useState<AtlasLocation["mode"]>("onsite")
  const [draftLabel, setDraftLabel] = useState("")
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)

  const mapPreviewUrl = useMemo(
    () => buildAtlasStaticMapUrl({ token: mapboxToken, locations }),
    [locations, mapboxToken],
  )
  const onsiteLocations = useMemo(
    () => locations.filter((location) => location.mode === "onsite"),
    [locations],
  )
  const onlineLocations = useMemo(
    () => locations.filter((location) => location.mode === "online"),
    [locations],
  )

  const addLocation = async () => {
    const nextLabel = draftLabel.replace(/\s+/g, " ").trim()
    if (!nextLabel) return
    let lat: number | null = null
    let lng: number | null = null
    if (draftMode === "onsite" && tokenAvailable) {
      setIsResolvingLocation(true)
      const geocoded = await geocodeAtlasLocation({
        query: nextLabel,
        token: mapboxToken,
      })
      setIsResolvingLocation(false)
      if (geocoded) {
        lat = geocoded.lat
        lng = geocoded.lng
      }
    }
    const nextLocation: AtlasLocation = {
      id: createRuntimeId("atlas-location"),
      label: nextLabel,
      mode: draftMode,
      lat,
      lng,
    }
    setLocations((previous) => [nextLocation, ...previous].slice(0, 24))
    setDraftLabel("")
  }

  const removeLocation = (locationId: string) => {
    setLocations((previous) => previous.filter((location) => location.id !== locationId))
  }

  return (
    <div
      className={cn(
        "relative -mb-4 min-h-0 flex-1 overflow-hidden rounded-[14px] border border-border/60 bg-[radial-gradient(circle_at_18%_20%,hsl(var(--muted))_0%,transparent_42%),radial-gradient(circle_at_78%_22%,hsl(var(--muted))_0%,transparent_38%),linear-gradient(145deg,hsl(var(--background))_0%,hsl(var(--muted)/0.6)_100%)]",
        presentationMode && "-mb-3",
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full border border-border/60 bg-background/85 backdrop-blur-sm"
            aria-label="Manage locations"
            disabled={presentationMode}
          >
            <MoreVerticalIcon className="h-4 w-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="z-30 w-[332px] p-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Locations</p>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {onsiteLocations.length} on-site · {onlineLocations.length} online
              </span>
            </div>

            {!tokenAvailable ? (
              <p className="rounded-md border border-border/60 bg-muted/35 px-2 py-1.5 text-[11px] text-muted-foreground">
                Add `NEXT_PUBLIC_MAPBOX_TOKEN` to enable live map previews.
              </p>
            ) : null}

            <div className="grid grid-cols-[116px_minmax(0,1fr)_auto] gap-1.5">
              <Select value={draftMode} onValueChange={(value) => setDraftMode(value === "online" ? "online" : "onsite")}>
                <SelectTrigger className="h-8 text-xs" disabled={presentationMode}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite" className="text-xs">On-site</SelectItem>
                  <SelectItem value="online" className="text-xs">Online</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                className="h-8 text-xs"
                placeholder={draftMode === "online" ? "Program URL or platform" : "City, state or venue"}
                disabled={presentationMode}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => void addLocation()}
                disabled={presentationMode || isResolvingLocation}
              >
                <PlusIcon className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">{isResolvingLocation ? "Resolving location" : "Add location"}</span>
              </Button>
            </div>

            {locations.length > 0 ? (
              <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
                {locations.map((location) => (
                  <li
                    key={location.id}
                    className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-2 py-1.5"
                  >
                    {location.mode === "online" ? (
                      <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                      <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs text-foreground">{location.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeLocation(location.id)}
                      aria-label={`Remove ${location.label}`}
                      disabled={presentationMode}
                    >
                      <Trash2Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <div className="absolute inset-0">
        {mapPreviewUrl ? (
          <Image
            src={mapPreviewUrl}
            alt="Location preview map"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover"
            quality={92}
            unoptimized
          />
        ) : null}
        <div
          className={cn(
            "absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--border)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_35%,transparent)_1px,transparent_1px)] bg-[size:26px_26px]",
            mapPreviewUrl ? "opacity-15" : "opacity-35",
          )}
        />
        <div className="absolute left-3 top-3 z-10 rounded-full border border-border/60 bg-background/78 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md">
          {onsiteLocations.length} on-site · {onlineLocations.length} online
        </div>
      </div>
    </div>
  )
}
