"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { HomeCanvasSidebarSlot } from "@/components/public/home-canvas-sidebar-slot"
import { organizationHasMapLocation, type PublicMapBounds } from "./public-map-index/helpers"
import {
  useSyncPublicMapAuthFavorite,
  useSyncPublicMapLayout,
} from "./public-map-index/layout-sync"
import type { PublicMapMemberProfile } from "./public-map-index/member-profile-card"
import {
  focusOrganizationOnMap,
  normalizeSlug,
  resolveBounds,
} from "./public-map-index/map-view-helpers"
import {
  type PublicMapMapboxApi,
  useInitializePublicMap,
  useResolveInitialPublicMapViewport,
  resolvePublicMapSelectedOrganization,
  useSyncSelectedOrganization,
  useSyncSidebarCameraPadding,
} from "./public-map-index/public-map-index-runtime"
import { PublicMapSurface } from "./public-map-index/map-surface"
import type { PublicMapPanelPresentation } from "./public-map-index/map-view-helpers"
import {
  PublicMapBoardAlert,
  PublicMapJoinedOrganization,
} from "./public-map-index/member-rail"
import { PublicMapRightRail } from "./public-map-index/right-rail"
import { PublicMapShellSidebarPanel } from "./public-map-index/sidebar"
import {
  buildLocationFeedback,
  type UserLocationStatus,
} from "./public-map-index/user-location"
import { usePublicMapActions } from "./public-map-index/use-public-map-actions"
import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"
import { usePublicMapClusteredMarkers } from "./public-map-index/use-public-map-clustered-markers"
import { usePublicMapPreferences } from "./public-map-index/use-public-map-preferences"
import {
  buildPublicMapSearchIndex,
  filterPublicMapOrganizationIds,
} from "./public-map-index/search-index"

type PublicMapIndexProps = {
  organizations: PublicMapOrganization[]
  mapboxToken?: string
  initialPublicSlug?: string
  viewer?: { id: string; email: string | null } | null
  joinedOrganizations?: PublicMapJoinedOrganization[]
  boardAlerts?: PublicMapBoardAlert[]
  memberProfile?: PublicMapMemberProfile | null
}

type PublicMapCameraTarget = {
  organizationId: string
  requestId: number
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
  const mapboxRef = useRef<PublicMapMapboxApi | null>(null)
  const hasResolvedInitialViewportRef = useRef(false)
  const mapLoadedRef = useRef(false)
  const appliedBoundsRef = useRef<PublicMapBounds | null>(null)
  const token = (mapboxToken ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "").trim()
  const tokenAvailable = Boolean(token)
  const [mapError, setMapError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [sidebarMode, setSidebarMode] = useState<"search" | "details" | "hidden">(
    initialPublicSlug ? "details" : "search",
  )
  const initialOrganization =
    organizations.find(
      (organization) =>
        normalizeSlug(organization.publicSlug) === normalizeSlug(initialPublicSlug),
    ) ?? null
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialOrganization?.id ?? null,
  )
  const [cameraTarget, setCameraTarget] = useState<PublicMapCameraTarget | null>(
    initialOrganization ? { organizationId: initialOrganization.id, requestId: 0 } : null,
  )
  const [userLocationStatus, setUserLocationStatus] =
    useState<UserLocationStatus>("idle")
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [pendingAuthOrgId, setPendingAuthOrgId] = useState<string | null>(null)
  const [sidebarInsetLeft, setSidebarInsetLeft] = useState(0)
  const [panelPresentation, setPanelPresentation] =
    useState<PublicMapPanelPresentation | null>(null)
  const [initialViewportResolved, setInitialViewportResolved] = useState(false)
  const [mapLoadVersion, setMapLoadVersion] = useState(0)
  const [sameLocationSelection, setSameLocationSelection] =
    useState<PublicMapSameLocationSelection | null>(null)
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
  const searchIndex = useMemo(
    () => buildPublicMapSearchIndex(organizations),
    [organizations],
  )

  const filteredOrganizations = useMemo(
    () => {
      const filteredIds = filterPublicMapOrganizationIds({
        organizations,
        searchIndex,
        query,
        appliedBounds: null,
        favorites,
        activeGroup: "all",
      })
      return filteredIds
        .map((organizationId) => organizationById.get(organizationId) ?? null)
        .filter((organization): organization is PublicMapOrganization => Boolean(organization))
    },
    [favorites, organizationById, organizations, query, searchIndex],
  )

  const selectedOrganization = resolvePublicMapSelectedOrganization({
    organizationById,
    selectedOrgId,
  })

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
  const sameLocationOrganizations = useMemo(
    () =>
      sameLocationSelection?.organizationIds
        .map((organizationId) => organizationById.get(organizationId) ?? null)
        .filter((organization): organization is PublicMapOrganization => Boolean(organization)) ?? [],
    [organizationById, sameLocationSelection],
  )
  const sameLocationSearchContext = useMemo(() => {
    if (!sameLocationSelection || sameLocationOrganizations.length < 2) return null

    const title = `${sameLocationOrganizations.length.toLocaleString()} organizations here`
    return {
      title,
      description: sameLocationSelection.locationLabel,
      organizations: sameLocationOrganizations,
      onClear: () => setSameLocationSelection(null),
    }
  }, [sameLocationOrganizations, sameLocationSelection])
  const setAppliedBounds = useCallback((bounds: PublicMapBounds | null) => {
    appliedBoundsRef.current = bounds
  }, [])
  const handleViewportChange = useCallback((map: mapboxgl.Map) => {
    appliedBoundsRef.current = resolveBounds(map)
  }, [])

  useSyncPublicMapLayout({
    containerRef,
    mapRef,
    mapLoadedRef,
    onViewportChange: handleViewportChange,
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
      setCameraTargetOrgId: (organizationId) => {
        setCameraTarget((current) => ({
          organizationId,
          requestId: (current?.requestId ?? 0) + 1,
        }))
      },
      setRecentOrganizationIds,
      setPendingAuthOrgId,
      setAuthSheetOpen,
      setFavorites,
    })
  useSyncSelectedOrganization({
    organizationById,
    selectedOrgId,
    setSelectedOrgId,
  })

  useInitializePublicMap({
    token,
    tokenAvailable,
    containerRef,
    mapRef,
    mapboxRef,
    mapLoadedRef,
    hasResolvedInitialViewportRef,
    setInitialViewportResolved,
    setMapLoadVersion,
    setMapError,
    setAppliedBounds,
  })

  usePublicMapClusteredMarkers({
    mapRef,
    mapLoadedRef,
    organizations,
    mapLoadVersion,
    selectedOrganizationId: selectedOrganization?.id ?? null,
    activeSameLocationGroupKey: sameLocationSelection?.key ?? null,
    onSelectOrganization: (organizationId) => {
      setSameLocationSelection(null)
      handleSelectOrganization({
        organizationId,
        openDetails: true,
        shouldFocusMap: false,
      })
    },
    onOpenSameLocationGroup: (group) => {
      setSameLocationSelection(group)
      setSidebarMode("search")
    },
  })

  useResolveInitialPublicMapViewport({
    mapRef,
    mapLoadedRef,
    hasResolvedInitialViewportRef,
    initialOrganization,
    setUserLocationStatus,
    setInitialViewportResolved,
  })

  useSyncSidebarCameraPadding({
    mapRef,
    mapLoadedRef,
    initialViewportResolved,
    sidebarInsetLeft,
  })

  useEffect(() => {
    const map = mapRef.current
    if (!map || !cameraTarget) return
    const organization = organizationById.get(cameraTarget.organizationId)
    if (!organization || !organizationHasMapLocation(organization)) return
    focusOrganizationOnMap({ map, organization })
  }, [cameraTarget, organizationById])

  const listOrganizations = sameLocationSearchContext?.organizations ?? filteredOrganizations

  return (
    <>
      {panelPresentation === "rail" ? (
        <HomeCanvasSidebarSlot>
          <PublicMapShellSidebarPanel
            sidebarMode={sidebarMode}
            organizations={listOrganizations}
            selectedOrganization={selectedOrganization}
            favorites={favorites}
            query={query}
            searchContext={sameLocationSearchContext}
            onQueryChange={(value) => {
              setSameLocationSelection(null)
              setQuery(value)
            }}
            onToggleFavorite={toggleFavorite}
            onOpenDetails={(organizationId, options) => {
              if (!options?.preserveSearchContext) {
                setSameLocationSelection(null)
              }
              handleSelectOrganization({
                organizationId,
                openDetails: true,
              })
            }}
            setSidebarMode={setSidebarMode}
          />
        </HomeCanvasSidebarSlot>
      ) : null}

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
        searchContext={sameLocationSearchContext}
        tokenAvailable={tokenAvailable}
        mapError={mapError}
        locationFeedback={locationFeedback}
        preferencesSaveError={preferencesSaveError}
        isSavingPreferences={isSavingPreferences}
        authSheetOpen={authSheetOpen}
        authRedirectTo={authRedirectTo}
        onQueryChange={(value) => {
          setSameLocationSelection(null)
          setQuery(value)
        }}
        onToggleFavorite={toggleFavorite}
        onOpenOrgDetails={(organizationId, options) => {
          if (!options?.preserveSearchContext) {
            setSameLocationSelection(null)
          }
          handleSelectOrganization({
            organizationId,
            openDetails: true,
          })
        }}
        onSidebarModeChange={setSidebarMode}
        onAuthSheetOpenChange={setAuthSheetOpen}
        onSidebarInsetChange={setSidebarInsetLeft}
        onPanelPresentationChange={setPanelPresentation}
        renderDesktopSidebar={false}
      />
    </>
  )
}
