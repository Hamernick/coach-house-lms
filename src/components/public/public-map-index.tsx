"use client"

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

import { useIsMobile } from "@/hooks/use-mobile"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import {
  organizationHasMapLocation,
  type PublicMapBounds,
} from "./public-map-index/helpers"
import type { SidebarMode } from "./public-map-index/constants"
import {
  useSyncPublicMapAuthFavorite,
  useSyncPublicMapLayout,
} from "./public-map-index/layout-sync"
import {
  focusOrganizationOnMap,
  resolveInitialPublicMapOrganization,
  resolveBounds,
  resolvePublicMapboxToken,
} from "./public-map-index/map-view-helpers"
import {
  type PublicMapMapboxApi,
  useInitializePublicMap,
  useResolveInitialPublicMapViewport,
  resolvePublicMapSelectedOrganization,
  useSyncSidebarCameraPadding,
} from "./public-map-index/public-map-index-runtime"
import { normalizePublicMapTheme } from "@/lib/public-map/public-map-theme"
import { PublicMapSurface } from "./public-map-index/map-surface"
import { usePublicMapMemberOnboardingMapOverlay } from "./public-map-index/member-onboarding-preview-controls"
import { PublicMapIndexChrome } from "./public-map-index/public-map-index-chrome"
import {
  buildLocationFeedback,
  type UserLocationStatus,
} from "./public-map-index/user-location"
import { usePublicMapActions } from "./public-map-index/use-public-map-actions"
import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"
import { usePublicMapClusteredMarkers } from "./public-map-index/use-public-map-clustered-markers"
import { usePublicMapFilterUrlState } from "./public-map-index/use-filter-url-state"
import { usePublicMapPreferences } from "./public-map-index/use-public-map-preferences"
import {
  useFilteredPublicMapItems,
  usePublicMapSavedOrganizations,
  usePublicMapSelectableItemMap,
} from "./public-map-index/map-items-state"
import { usePublicMapSameLocationSearchContext } from "./public-map-index/same-location-state"
import {
  usePublicMapOrganizationById,
  usePublicMapOrganizationFilterState,
} from "./public-map-index/public-map-index-filter-state"
import { usePublicMapResourceGuideState } from "./public-map-index/resource-guides"
import type { PublicMapIndexProps } from "./public-map-index/public-map-index-types"
import {
  resolveInitialCameraTarget,
  resolvePublicMapPresentationFlags,
  usePublicMapIndexNavigationHandlers,
  usePublicMapListItemSelection,
  useSyncPublicMapSelectedListItem,
  type PublicMapCameraTarget,
} from "./public-map-index/public-map-index-selection"
import {
  EMPTY_PUBLIC_MAP_RESOURCE_ITEMS,
  usePublicMapResourceItems,
} from "./public-map-index/use-resource-map-items"

function useFocusPublicMapCameraTarget(
  mapRef: RefObject<mapboxgl.Map | null>,
  cameraTarget: PublicMapCameraTarget | null,
  organizationById: Map<string, PublicMapOrganization>
) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !cameraTarget) return
    const organization = organizationById.get(cameraTarget.organizationId)
    if (!organization || !organizationHasMapLocation(organization)) return
    focusOrganizationOnMap({ map, organization })
  }, [cameraTarget, mapRef, organizationById])
}

export function PublicMapIndex({
  organizations,
  mapboxToken,
  initialPublicSlug,
  viewer: initialViewer = null,
  includeSeedResources = false,
  resourceItems: initialResourceItems = EMPTY_PUBLIC_MAP_RESOURCE_ITEMS,
  resourceItemsEndpoint,
  canManageResourceMap = false,
  organizationCurationAction,
  resourceMapCurationAction,
  presentationMode = "home-canvas",
  memberOnboarding = undefined,
  adminOnboardingPreview = undefined,
}: PublicMapIndexProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const mapTheme = normalizePublicMapTheme(useTheme().resolvedTheme)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapboxRef = useRef<PublicMapMapboxApi | null>(null)
  const hasResolvedInitialViewportRef = useRef(false)
  const mapLoadedRef = useRef(false)
  const appliedBoundsRef = useRef<PublicMapBounds | null>(null)
  const token = resolvePublicMapboxToken(mapboxToken)
  const tokenAvailable = Boolean(token)
  const [mapError, setMapError] = useState<string | null>(null)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(
    initialPublicSlug ? "details" : "search"
  )
  const initialOrganization = resolveInitialPublicMapOrganization({
    organizations,
    publicSlug: initialPublicSlug,
  })
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialOrganization?.id ?? null
  )
  const [cameraTarget, setCameraTarget] =
    useState<PublicMapCameraTarget | null>(
      resolveInitialCameraTarget(initialOrganization)
    )
  const [userLocationStatus, setUserLocationStatus] =
    useState<UserLocationStatus>("idle")
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [pendingAuthOrgId, setPendingAuthOrgId] = useState<string | null>(null)
  const [sidebarInsetLeft, setSidebarInsetLeft] = useState(0)
  const [initialViewportResolved, setInitialViewportResolved] = useState(false)
  const [mapLoadVersion, setMapLoadVersion] = useState(0)
  const [sameLocationSelection, setSameLocationSelection] =
    useState<PublicMapSameLocationSelection | null>(null)
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(
    initialOrganization?.id ?? null
  )
  const clearMapTransientSelection = useCallback(() => {
    setSameLocationSelection(null)
    setSelectedListItemId(null)
  }, [])
  const {
    activeGroup,
    handleActiveGroupChange,
    handleQueryChange,
    query,
    searchParams,
  } = usePublicMapFilterUrlState({
    onFilterChange: clearMapTransientSelection,
  })
  const resourceItems = usePublicMapResourceItems({
    initialResourceItems,
    resourceItemsEndpoint,
  })
  const deferredQuery = useDeferredValue(query)
  const {
    favorites,
    isSavingPreferences,
    preferencesSaveError,
    viewer,
    setFavorites,
    setRecentOrganizationIds,
  } = usePublicMapPreferences({ initialViewer })
  const isAuthenticated = Boolean(viewer ?? initialViewer)
  const locationFeedback = buildLocationFeedback(userLocationStatus)
  const organizationById = usePublicMapOrganizationById(organizations)
  const { filteredOrganizations, groupCounts } =
    usePublicMapOrganizationFilterState({
      activeGroup,
      query: deferredQuery,
      favorites,
      includeSeedResources,
      organizationById,
      organizations,
      resourceItems,
    })
  const filteredMapItems = useFilteredPublicMapItems({
    activeGroup,
    filteredOrganizations,
    includeSeedResources,
    resourceItems,
  })
  const {
    activeGuideSearchContext,
    clearActiveGuide,
    filteredListItems,
    handleGuideSelect,
    resourceGuides,
    visibleMapItems,
  } = usePublicMapResourceGuideState({
    activeGroup,
    deferredQuery,
    filteredMapItems,
    filteredOrganizations,
    includeSeedResources,
    resourceItems,
    setSameLocationSelection,
    setSelectedListItemId,
    setSelectedOrgId,
    setSidebarMode,
  })
  const selectableMapItemById = usePublicMapSelectableItemMap(visibleMapItems)
  const selectedOrganization = resolvePublicMapSelectedOrganization({
    organizationById,
    selectedOrgId,
  })
  const selectedResourceItem = useMemo((): ExternalResourceMapItem | null => {
    if (!selectedListItemId) return null
    const item = selectableMapItemById.get(selectedListItemId)
    return item?.itemType === "external_resource" ? item : null
  }, [selectableMapItemById, selectedListItemId])
  const savedOrganizations = usePublicMapSavedOrganizations({
    favorites,
    organizationById,
  })
  const authAction = searchParams.get("auth_action")
  const authOrganizationId = searchParams.get("auth_org")
  const handleSameLocationSelectionChange = useCallback(
    (selection: PublicMapSameLocationSelection | null) => {
      setSameLocationSelection(selection)
      if (selection) {
        clearActiveGuide()
      }
    },
    [clearActiveGuide]
  )
  const sameLocationSearchContext = usePublicMapSameLocationSearchContext({
    itemBySelectableId: selectableMapItemById,
    sameLocationSelection,
    setSameLocationSelection: handleSameLocationSelectionChange,
  })
  const activeSearchContext =
    sameLocationSearchContext ?? activeGuideSearchContext
  const setAppliedBounds = useCallback((bounds: PublicMapBounds | null) => {
    appliedBoundsRef.current = bounds
  }, [])
  const handleViewportChange = useCallback((map: mapboxgl.Map) => {
    appliedBoundsRef.current = resolveBounds(map)
  }, [])
  const handleSetCameraTargetOrgId = useCallback((organizationId: string) => {
    setCameraTarget((current) => ({
      organizationId,
      requestId: (current?.requestId ?? 0) + 1,
    }))
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
      setCameraTargetOrgId: handleSetCameraTargetOrgId,
      setRecentOrganizationIds,
      setPendingAuthOrgId,
      setAuthSheetOpen,
      setFavorites,
    })
  const {
    handleBackToSearch,
    handleOpenDetails,
    handleRailSelectOrganization,
  } = usePublicMapIndexNavigationHandlers({
    handleSelectOrganization,
    setSameLocationSelection,
    setSelectedListItemId,
    setSelectedOrgId,
    setSidebarMode,
  })
  const {
    handleOpenSameLocationGroup,
    handleSelectListItem,
    handleSelectMapMarker,
  } = usePublicMapListItemSelection({
    handleSelectOrganization,
    mapRef,
    selectableMapItemById,
    setSameLocationSelection: handleSameLocationSelectionChange,
    setSelectedListItemId,
    setSelectedOrgId,
    setSidebarMode,
  })
  useSyncPublicMapSelectedListItem({
    organizationById,
    selectableMapItemById,
    selectedListItemId,
    selectedOrgId,
    setSelectedListItemId,
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
    organizations: filteredOrganizations,
    mapItems: visibleMapItems,
    mapLoadVersion,
    markerTheme: mapTheme,
    selectedOrganizationId:
      selectedListItemId ?? selectedOrganization?.id ?? null,
    activeSameLocationGroupKey: sameLocationSelection?.key ?? null,
    onSelectOrganization: handleSelectMapMarker,
    onOpenSameLocationGroup: handleOpenSameLocationGroup,
  })

  useResolveInitialPublicMapViewport({
    mapRef,
    mapLoadedRef,
    hasResolvedInitialViewportRef,
    initialOrganization,
    preferNationalFallback: includeSeedResources && !initialPublicSlug,
    setUserLocationStatus,
    setInitialViewportResolved,
  })

  useSyncSidebarCameraPadding({
    mapRef,
    mapLoadedRef,
    initialViewportResolved,
    sidebarInsetLeft,
  })

  useFocusPublicMapCameraTarget(mapRef, cameraTarget, organizationById)

  const directoryListItems = activeSearchContext?.items ?? filteredListItems
  const flags = resolvePublicMapPresentationFlags(presentationMode)
  const memberOnboardingMapOverlay = usePublicMapMemberOnboardingMapOverlay({
    isAuthenticated,
    memberOnboarding,
    adminOnboardingPreview,
  })
  const mapSurface = (
    <PublicMapSurface
      containerRef={containerRef}
      sidebarMode={sidebarMode}
      filteredItems={directoryListItems}
      filteredOrganizations={filteredOrganizations}
      selectedItemId={selectedListItemId}
      selectedOrganization={selectedOrganization}
      selectedResourceItem={selectedResourceItem}
      canManageResourceMap={canManageResourceMap}
      organizationCurationAction={organizationCurationAction}
      resourceMapCurationAction={resourceMapCurationAction}
      favorites={favorites}
      query={query}
      activeGroup={activeGroup}
      groupCounts={groupCounts}
      searchContext={activeSearchContext}
      tokenAvailable={tokenAvailable}
      mapError={mapError}
      locationFeedback={locationFeedback}
      preferencesSaveError={preferencesSaveError}
      isSavingPreferences={isSavingPreferences}
      authSheetOpen={authSheetOpen}
      authRedirectTo={authRedirectTo}
      onQueryChange={handleQueryChange}
      onActiveGroupChange={handleActiveGroupChange}
      onToggleFavorite={toggleFavorite}
      onSelectItem={handleSelectListItem}
      onOpenOrgDetails={handleOpenDetails}
      onBackToSearch={handleBackToSearch}
      onSidebarModeChange={setSidebarMode}
      onAuthSheetOpenChange={setAuthSheetOpen}
      onSidebarInsetChange={setSidebarInsetLeft}
      renderDesktopSidebar={flags.renderMapOverlaySidebar}
      renderMobileDrawer={!flags.useHomeCanvasSidebarSlot || isMobile}
      mapOverlay={memberOnboardingMapOverlay}
    />
  )

  return (
    <PublicMapIndexChrome
      directoryItems={directoryListItems}
      directoryOrganizations={filteredOrganizations}
      favorites={favorites}
      isAuthenticated={isAuthenticated}
      mapSurface={mapSurface}
      canManageResourceMap={canManageResourceMap}
      organizationCurationAction={organizationCurationAction}
      resourceMapCurationAction={resourceMapCurationAction}
      activeGroup={activeGroup}
      groupCounts={groupCounts}
      onActiveGroupChange={handleActiveGroupChange}
      guides={resourceGuides}
      onGuideSelect={handleGuideSelect}
      onSelectItem={handleSelectListItem}
      onOpenDetails={handleOpenDetails}
      onQueryChange={handleQueryChange}
      onSelectOrganization={handleRailSelectOrganization}
      onToggleFavorite={toggleFavorite}
      onBackToSearch={handleBackToSearch}
      query={query}
      savedOrganizations={savedOrganizations}
      searchContext={activeSearchContext}
      selectedItemId={selectedListItemId}
      selectedOrganization={selectedOrganization}
      selectedResourceItem={selectedResourceItem}
      setSidebarMode={setSidebarMode}
      sidebarMode={sidebarMode}
      useAppShellRightRailDirectory={flags.useAppShellRightRailDirectory}
      useHomeCanvasSidebarSlot={flags.useHomeCanvasSidebarSlot}
    />
  )
}
