"use client"

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { MAP_STYLE, RECENT_ORGANIZATIONS_LIMIT } from "./public-map-index/constants"
import { filterPublicMapOrganizations, organizationHasMapLocation, type PublicMapBounds } from "./public-map-index/helpers"
import {
  observePublicMapContainer,
  resolveMapBounds,
  useSyncPublicMapAuthFavorite,
  useSyncPublicMapLayout,
} from "./public-map-index/layout-sync"
import type { PublicMapMemberProfile } from "./public-map-index/member-profile-card"
import {
  createOrganizationMarkerElement,
  updateOrganizationMarkerElement,
  ORGANIZATION_MARKER_OFFSET_Y,
} from "./public-map-index/map-markers"
import {
  buildMapHref,
  createMarkerMap,
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  focusChicagoFallback,
  focusOrganizationOnMap,
  normalizeSlug,
  removeAuthParams,
  resolvePublicMapCameraPadding,
  resolveBounds,
  resolveMarkerOrganizations,
} from "./public-map-index/map-view-helpers"
import { PublicMapSurface } from "./public-map-index/map-surface"
import {
  PublicMapBoardAlert,
  PublicMapJoinedOrganization,
} from "./public-map-index/member-rail"
import { PublicMapRightRail } from "./public-map-index/right-rail"
import {
  buildLocationFeedback,
  type UserLocationStatus,
} from "./public-map-index/user-location"
import { usePublicMapActions } from "./public-map-index/use-public-map-actions"
import { usePublicMapPreferences } from "./public-map-index/use-public-map-preferences"

type MapboxApi = typeof import("mapbox-gl")["default"]

type PublicMapIndexProps = {
  organizations: PublicMapOrganization[]
  mapboxToken?: string
  initialPublicSlug?: string
  viewer?: { id: string; email: string | null } | null
  joinedOrganizations?: PublicMapJoinedOrganization[]
  boardAlerts?: PublicMapBoardAlert[]
  memberProfile?: PublicMapMemberProfile | null
}

export function PublicMapIndex({
  organizations,
  mapboxToken,
  initialPublicSlug,
  viewer: initialViewer = null,
  joinedOrganizations = [],
  boardAlerts = [],
  memberProfile = null,
}: PublicMapIndexProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapboxRef = useRef<MapboxApi | null>(null)
  const markersRef = useRef<Array<{ id: string; marker: mapboxgl.Marker }>>([])
  const hasResolvedInitialViewportRef = useRef(false)
  const mapLoadedRef = useRef(false)
  const token = (mapboxToken ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
  const tokenAvailable = Boolean(token)
  const [mapError, setMapError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [appliedBounds, setAppliedBounds] = useState<PublicMapBounds | null>(null)
  const [sidebarMode, setSidebarMode] = useState<"search" | "details" | "hidden">(
    initialPublicSlug ? "details" : "search",
  )
  const initialOrganization =
    organizations.find(
      (organization) =>
        normalizeSlug(organization.publicSlug) === normalizeSlug(initialPublicSlug),
    ) ?? null
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialOrganization?.id ?? organizations[0]?.id ?? null,
  )
  const [cameraTargetOrgId, setCameraTargetOrgId] = useState<string | null>(
    initialOrganization?.id ?? null,
  )
  const [userLocationStatus, setUserLocationStatus] =
    useState<UserLocationStatus>("idle")
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [pendingAuthOrgId, setPendingAuthOrgId] = useState<string | null>(null)
  const [sidebarInsetLeft, setSidebarInsetLeft] = useState(0)
  const {
    favorites,
    recentOrganizationIds,
    isSavingPreferences,
    preferencesSaveError,
    viewer,
    setFavorites,
    setRecentOrganizationIds,
  } = usePublicMapPreferences({ initialViewer })

  const effectiveViewer = viewer ?? initialViewer
  const isAuthenticated = Boolean(effectiveViewer)
  const locationFeedback = buildLocationFeedback(userLocationStatus)
  const organizationById = useMemo(
    () => new Map(organizations.map((organization) => [organization.id, organization] as const)),
    [organizations],
  )

  const filteredOrganizations = useMemo(
    () =>
      filterPublicMapOrganizations({
        organizations,
        query,
        appliedBounds,
        favorites,
        activeGroup: "all",
      }),
    [appliedBounds, favorites, organizations, query],
  )

  const selectedOrganization =
    (selectedOrgId ? organizationById.get(selectedOrgId) ?? null : null) ??
    filteredOrganizations[0] ??
    null

  const savedOrganizations = useMemo(
    () =>
      favorites
        .map((organizationId) => organizationById.get(organizationId) ?? null)
        .filter((organization): organization is PublicMapOrganization => Boolean(organization)),
    [favorites, organizationById],
  )

  const recentOrganizations = useMemo(
    () =>
      recentOrganizationIds
        .map((organizationId) => organizationById.get(organizationId) ?? null)
        .filter((organization): organization is PublicMapOrganization => Boolean(organization)),
    [organizationById, recentOrganizationIds],
  )

  const authAction = searchParams.get("auth_action")
  const authOrganizationId = searchParams.get("auth_org")

  useSyncPublicMapLayout({
    containerRef,
    mapRef,
    mapLoadedRef,
    onViewportChange: (map) => setAppliedBounds(resolveBounds(map)),
    sidebarMode,
  })
  useSyncPublicMapAuthFavorite({
    authAction,
    authOrganizationId,
    initialPublicSlug,
    isAuthenticated,
    router,
    searchParams,
    setFavorites,
  })

  const { authRedirectTo, handleSelectOrganization, toggleFavorite } =
    usePublicMapActions({
      organizationById,
      isAuthenticated,
      searchParams,
      initialPublicSlug,
      selectedOrganization,
      pendingAuthOrgId,
      setSelectedOrgId,
      setSidebarMode,
      setCameraTargetOrgId,
      setRecentOrganizationIds,
      setPendingAuthOrgId,
      setAuthSheetOpen,
      setFavorites,
    })

  useEffect(() => {
    if (!selectedOrganization && filteredOrganizations.length > 0) {
      setSelectedOrgId(filteredOrganizations[0]!.id)
      return
    }

    if (selectedOrgId && !organizationById.has(selectedOrgId) && filteredOrganizations.length > 0) {
      setSelectedOrgId(filteredOrganizations[0]!.id)
    }
  }, [filteredOrganizations, organizationById, selectedOrgId, selectedOrganization])

  useEffect(() => {
    if (!tokenAvailable) return
    if (!containerRef.current) return
    if (mapRef.current) return

    let cancelled = false
    let stopObservingMapContainer = () => {}

    async function initializeMap() {
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
          center: FALLBACK_CENTER,
          zoom: FALLBACK_ZOOM,
          projection: "globe",
          cooperativeGestures: true,
        })

        map.dragRotate.disable()
        map.boxZoom.disable()
        if (typeof map.touchZoomRotate.disableRotation === "function") map.touchZoomRotate.disableRotation()

        map.on("error", (event) => {
          if (!event?.error) return
          console.error("Public map error:", event.error)
          setMapError("Mapbox couldn't load the map. Check your token and domain restrictions.")
        })

        map.on("style.load", () => map.setFog({}))

        map.on("load", () => {
          mapLoadedRef.current = true
          requestAnimationFrame(() => {
            if (mapRef.current !== map) return
            map.resize()
            setAppliedBounds(resolveMapBounds(map))
          })
          setAppliedBounds(resolveMapBounds(map))
        })

        map.on("moveend", () => {
          setAppliedBounds(resolveMapBounds(map))
        })

        mapRef.current = map

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
      markersRef.current.forEach(({ marker }) => marker.remove())
      markersRef.current = []
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      stopObservingMapContainer()
      mapLoadedRef.current = false
      hasResolvedInitialViewportRef.current = false
    }
  }, [token, tokenAvailable])

  useEffect(() => {
    const map = mapRef.current
    const mapboxgl = mapboxRef.current
    if (!map || !mapboxgl || !mapLoadedRef.current) return

    markersRef.current.forEach(({ marker }) => marker.remove())
    markersRef.current = []

    const markerOrganizations = resolveMarkerOrganizations(organizations)
    markersRef.current = markerOrganizations.map((organization) => {
      const element = createOrganizationMarkerElement({
        organization,
        selected: organization.id === selectedOrganization?.id,
        onSelect: () => {
          setSelectedOrgId(organization.id)
          setCameraTargetOrgId(organization.id)
          setSidebarMode("details")
          setRecentOrganizationIds((current) => {
            const next = [organization.id, ...current.filter((entry) => entry !== organization.id)]
            return next.slice(0, RECENT_ORGANIZATIONS_LIMIT)
          })
        },
      })

      const marker = new mapboxgl.Marker({
        element,
        anchor: "bottom",
        offset: [0, ORGANIZATION_MARKER_OFFSET_Y],
      })
        .setLngLat([organization.longitude, organization.latitude])
        .addTo(map)

      return { id: organization.id, marker }
    })
  }, [organizations, selectedOrganization?.id, setRecentOrganizationIds])

  useEffect(() => {
    const markerMap = createMarkerMap(markersRef.current)
    organizations.forEach((organization) => {
      const marker = markerMap.get(organization.id)
      if (!marker) return
      updateOrganizationMarkerElement({
        element: marker.getElement(),
        organization,
        selected: organization.id === selectedOrganization?.id,
      })
    })
  }, [organizations, selectedOrganization?.id])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current || hasResolvedInitialViewportRef.current) return

    if (initialOrganization && organizationHasMapLocation(initialOrganization)) {
      focusOrganizationOnMap({ map, organization: initialOrganization })
      setUserLocationStatus("idle")
      hasResolvedInitialViewportRef.current = true
      return
    }

    if (typeof window === "undefined" || !("geolocation" in window.navigator)) {
      focusChicagoFallback({ map })
      setUserLocationStatus("unavailable")
      hasResolvedInitialViewportRef.current = true
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
        setUserLocationStatus("centered")
        hasResolvedInitialViewportRef.current = true
      },
      (error) => {
        const activeMap = mapRef.current
        if (!activeMap) return
        focusChicagoFallback({ map: activeMap })
        setUserLocationStatus(error.code === 1 ? "denied" : "error")
        hasResolvedInitialViewportRef.current = true
      },
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 60_000,
      },
    )
  }, [initialOrganization])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const frame = requestAnimationFrame(() => {
      if (mapRef.current !== map) return
      map.easeTo({
        padding: resolvePublicMapCameraPadding(sidebarInsetLeft),
        duration: 320,
        essential: true,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [sidebarInsetLeft])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !cameraTargetOrgId) return
    const organization = organizationById.get(cameraTargetOrgId)
    if (!organization || !organizationHasMapLocation(organization)) return
    focusOrganizationOnMap({ map, organization })
  }, [cameraTargetOrgId, organizationById])

  return (
    <>
      <PublicMapRightRail
        isAuthenticated={isAuthenticated}
        memberProfile={memberProfile}
        savedOrganizations={savedOrganizations}
        favorites={favorites}
        recentOrganizations={recentOrganizations}
        joinedOrganizations={joinedOrganizations}
        boardAlerts={boardAlerts}
        onSelectOrganization={(organizationId) =>
          handleSelectOrganization({
            organizationId,
            openDetails: true,
          })
        }
        onToggleFavorite={toggleFavorite}
      />

      <PublicMapSurface
        containerRef={containerRef}
        sidebarMode={sidebarMode}
        filteredOrganizations={filteredOrganizations}
        selectedOrganization={selectedOrganization}
        favorites={favorites}
        query={query}
        tokenAvailable={tokenAvailable}
        mapError={mapError}
        locationFeedback={locationFeedback}
        preferencesSaveError={preferencesSaveError}
        isSavingPreferences={isSavingPreferences}
        authSheetOpen={authSheetOpen}
        authRedirectTo={authRedirectTo}
        onQueryChange={setQuery}
        onToggleFavorite={toggleFavorite}
        onSelectOrg={(organizationId) =>
          handleSelectOrganization({
            organizationId,
            shouldFocusMap: true,
          })
        }
        onSidebarModeChange={setSidebarMode}
        onAuthSheetOpenChange={setAuthSheetOpen}
        onSidebarInsetChange={setSidebarInsetLeft}
      />
    </>
  )
}
