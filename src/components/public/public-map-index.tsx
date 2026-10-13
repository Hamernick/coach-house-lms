"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import HeartIcon from "lucide-react/dist/esm/icons/heart"
import Loader2Icon from "lucide-react/dist/esm/icons/loader-2"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12"
const FAVORITES_STORAGE_KEY = "public-map:favorites:v1"
type MapboxApi = typeof import("mapbox-gl")["default"]

function normalizeText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function formatLocation(org: PublicMapOrganization) {
  return [org.city, org.state, org.country]
    .filter((entry) => Boolean(entry && entry.trim().length > 0))
    .join(", ")
}

export function PublicMapIndex({
  organizations,
  mapboxToken,
}: {
  organizations: PublicMapOrganization[]
  mapboxToken?: string
}) {
  const [query, setQuery] = useState("")
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(organizations[0]?.id ?? null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapboxRef = useRef<MapboxApi | null>(null)
  const markerMapRef = useRef<Map<string, mapboxgl.Marker>>(new Map())

  const token = (mapboxToken ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
  const tokenAvailable = Boolean(token)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setFavorites(parsed.filter((entry): entry is string => typeof entry === "string"))
      }
    } catch {
      setFavorites([])
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const base = normalizedQuery.length === 0
      ? organizations
      : organizations.filter((org) => {
          const haystacks = [
            normalizeText(org.name),
            normalizeText(org.tagline),
            normalizeText(org.city),
            normalizeText(org.state),
            normalizeText(org.country),
            normalizeText(org.programPreview?.title),
            normalizeText(org.programPreview?.subtitle),
          ]
          return haystacks.some((entry) => entry.includes(normalizedQuery))
        })

    return [...base].sort((left, right) => {
      const leftFavorite = favorites.includes(left.id)
      const rightFavorite = favorites.includes(right.id)
      if (leftFavorite !== rightFavorite) {
        return leftFavorite ? -1 : 1
      }
      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" })
    })
  }, [favorites, organizations, query])

  useEffect(() => {
    if (!selectedOrgId) {
      setSelectedOrgId(filteredOrganizations[0]?.id ?? null)
      return
    }
    const stillVisible = filteredOrganizations.some((org) => org.id === selectedOrgId)
    if (!stillVisible) {
      setSelectedOrgId(filteredOrganizations[0]?.id ?? null)
    }
  }, [filteredOrganizations, selectedOrgId])

  const selectedOrganization = useMemo(
    () => filteredOrganizations.find((org) => org.id === selectedOrgId) ?? filteredOrganizations[0] ?? null,
    [filteredOrganizations, selectedOrgId],
  )

  useEffect(() => {
    if (!tokenAvailable || !containerRef.current || mapRef.current) return
    let cancelled = false
    const markerMap = markerMapRef.current

    async function initMap() {
      try {
        const mapboxModule = await import("mapbox-gl")
        const mapboxgl = (mapboxModule.default ?? mapboxModule) as MapboxApi
        if (!mapboxgl?.Map) {
          throw new Error("Mapbox failed to initialize.")
        }

        mapboxRef.current = mapboxgl
        mapboxgl.accessToken = token

        if (!containerRef.current || cancelled) return

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: [-98, 38],
          zoom: 2.4,
          cooperativeGestures: true,
        })

        map.dragRotate.disable()
        map.boxZoom.disable()
        if (typeof map.touchZoomRotate.disableRotation === "function") {
          map.touchZoomRotate.disableRotation()
        }
        map.on("load", () => setIsMapReady(true))
        map.on("error", (event) => {
          if (!event?.error) return
          console.error("Mapbox error:", event.error)
          setMapError("Unable to load map tiles.")
        })

        mapRef.current = map
      } catch (error) {
        console.error("Mapbox init error:", error)
        setMapError("Mapbox could not initialize. Check token configuration.")
      }
    }

    void initMap()

    return () => {
      cancelled = true
      for (const marker of markerMap.values()) {
        marker.remove()
      }
      markerMap.clear()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [token, tokenAvailable])

  useEffect(() => {
    const map = mapRef.current
    const mapboxgl = mapboxRef.current
    if (!map || !mapboxgl || !isMapReady) return

    for (const marker of markerMapRef.current.values()) {
      marker.remove()
    }
    markerMapRef.current.clear()

    const bounds = new mapboxgl.LngLatBounds()
    for (const org of filteredOrganizations) {
      const markerElement = document.createElement("button")
      markerElement.type = "button"
      markerElement.style.width = "26px"
      markerElement.style.height = "26px"
      markerElement.style.borderRadius = "9999px"
      markerElement.style.border = org.id === selectedOrgId ? "2px solid rgb(15, 23, 42)" : "2px solid rgba(15, 23, 42, 0.45)"
      markerElement.style.background = org.id === selectedOrgId ? "rgb(15, 23, 42)" : "rgba(255, 255, 255, 0.92)"
      markerElement.style.color = org.id === selectedOrgId ? "white" : "rgb(15, 23, 42)"
      markerElement.style.fontSize = "10px"
      markerElement.style.fontWeight = "700"
      markerElement.style.cursor = "pointer"
      markerElement.style.display = "inline-flex"
      markerElement.style.alignItems = "center"
      markerElement.style.justifyContent = "center"
      markerElement.title = org.name
      markerElement.textContent = org.name.charAt(0).toUpperCase()
      markerElement.onclick = () => setSelectedOrgId(org.id)

      const marker = new mapboxgl.Marker({ element: markerElement, anchor: "center" })
        .setLngLat([org.longitude, org.latitude])
        .addTo(map)

      markerMapRef.current.set(org.id, marker)
      bounds.extend([org.longitude, org.latitude])
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: filteredOrganizations.length === 1 ? 180 : 96,
        maxZoom: 6,
        duration: 650,
      })
    }
  }, [filteredOrganizations, isMapReady, selectedOrgId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedOrganization) return
    map.flyTo({
      center: [selectedOrganization.longitude, selectedOrganization.latitude],
      zoom: Math.max(map.getZoom(), 5),
      duration: 550,
      essential: true,
    })
  }, [selectedOrganization])

  const toggleFavorite = (orgId: string) => {
    setFavorites((previous) =>
      previous.includes(orgId) ? previous.filter((entry) => entry !== orgId) : [...previous, orgId],
    )
  }

  return (
    <section className="space-y-4">
      <Card className="border-border/70 bg-card/75">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Public index</CardTitle>
            <Badge variant="secondary" className="text-[11px]">
              {filteredOrganizations.length} results
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Search public organizations by name, location, or program. Open any card to view the full public profile.
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="relative block">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                className="pl-8"
                placeholder="Search organizations, cities, or programs…"
                aria-label="Search public organizations"
              />
            </label>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/sign-up?redirect=/find">Sign up to save favorites</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="order-2 min-h-0 space-y-2 lg:order-1">
          {filteredOrganizations.length === 0 ? (
            <Card className="border-border/70 bg-card/75">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No organizations matched your search.
              </CardContent>
            </Card>
          ) : (
            filteredOrganizations.map((org) => {
              const selected = selectedOrganization?.id === org.id
              const location = formatLocation(org)
              const isFavorite = favorites.includes(org.id)
              return (
                <Card
                  key={org.id}
                  className={cn(
                    "border-border/70 bg-card/75 transition-colors",
                    selected && "border-primary/40 bg-primary/5",
                  )}
                >
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => setSelectedOrgId(org.id)}
                      >
                        <p className="truncate text-sm font-semibold text-foreground">{org.name}</p>
                        {org.tagline ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{org.tagline}</p>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                          isFavorite
                            ? "border-primary/45 bg-primary/10 text-primary"
                            : "border-border/65 text-muted-foreground hover:bg-muted/35",
                        )}
                        onClick={() => toggleFavorite(org.id)}
                        aria-label={isFavorite ? `Remove ${org.name} from favorites` : `Add ${org.name} to favorites`}
                      >
                        <HeartIcon className={cn("h-4 w-4", isFavorite && "fill-current")} aria-hidden />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {location ? (
                        <Badge variant="outline" className="text-[10px]">
                          {location}
                        </Badge>
                      ) : null}
                      {org.programPreview?.title ? (
                        <Badge variant="secondary" className="max-w-full truncate text-[10px]">
                          {org.programPreview.title}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {org.publicSlug ? (
                        <Button asChild variant="outline" size="sm" className="h-7 rounded-full px-2.5 text-[11px]">
                          <Link href={`/${org.publicSlug}`}>Open profile</Link>
                        </Button>
                      ) : null}
                      {org.publicSlug ? (
                        <Button asChild variant="ghost" size="sm" className="h-7 rounded-full px-2 text-[11px]">
                          <Link href={`/${org.publicSlug}/roadmap`}>Roadmap</Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <Card className="order-1 min-h-[420px] overflow-hidden border-border/70 bg-card/75 lg:order-2">
          <CardContent className="relative h-[460px] p-0 sm:h-[520px]">
            {!tokenAvailable ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Map unavailable. Add `MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_TOKEN`.
              </div>
            ) : mapError ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                {mapError}
              </div>
            ) : (
              <>
                <div ref={containerRef} className="absolute inset-0" aria-label="Public organizations map" />
                {!isMapReady ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/45 text-sm text-muted-foreground backdrop-blur-[1px]">
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Loading map...
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
