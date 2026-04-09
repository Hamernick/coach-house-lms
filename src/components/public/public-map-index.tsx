"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { MAP_STYLE, RECENT_ORGANIZATIONS_LIMIT } from "./public-map-index/constants"
import { organizationHasMapLocation, type PublicMapBounds } from "./public-map-index/helpers"
import {
  useSyncPublicMapAuthFavorite,
  useSyncPublicMapLayout,
} from "./public-map-index/layout-sync"
import type { PublicMapMemberProfile } from "./public-map-index/member-profile-card"
import {
  buildMapHref,
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  focusChicagoFallback,
  focusOrganizationOnMap,
  normalizeSlug,
  removeAuthParams,
  resolveBounds,
} from "./public-map-index/map-view-helpers"
import {
  type PublicMapMapboxApi,
  useInitializePublicMap,
  useResolveInitialPublicMapViewport,
  useSyncSelectedOrganization,
  useSyncSidebarCameraPadding,
} from "./public-map-index/public-map-index-runtime"
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
  const [initialViewportResolved, setInitialViewportResolved] = useState(false)
  const [mapLoadVersion, setMapLoadVersion] = useState(0)
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
  useSyncSelectedOrganization({
    filteredOrganizations,
    organizationById,
    selectedOrgId,
    selectedOrganization,
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
    mapboxRef,
    mapLoadedRef,
    organizations,
    organizationById,
    mapLoadVersion,
    selectedOrganizationId: selectedOrganization?.id ?? null,
    onSelectOrganization: (organizationId) => {
      setSelectedOrgId(organizationId)
      setCameraTargetOrgId(organizationId)
      setSidebarMode("details")
      setRecentOrganizationIds((current) => {
        const next = [organizationId, ...current.filter((entry) => entry !== organizationId)]
        return next.slice(0, RECENT_ORGANIZATIONS_LIMIT)
      })
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
            shouldFocusMap: false,
          })
        }
        onSidebarModeChange={setSidebarMode}
        onAuthSheetOpenChange={setAuthSheetOpen}
        onSidebarInsetChange={setSidebarInsetLeft}
      />
    </>
  )
}
