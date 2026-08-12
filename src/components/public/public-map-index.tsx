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
import { usePublicMapActions } from "./public-map-index/use-public-map-actions"
import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"
import { usePublicMapMarkers } from "./public-map-index/use-public-map-markers"
import { usePublicMapFilterUrlState } from "./public-map-index/use-filter-url-state"
import { usePublicMapPreferences } from "./public-map-index/use-public-map-preferences"
import {
  useFilteredPublicMapItems,
  usePublicMapCollectedResources,
  usePublicMapSavedOrganizations,
  usePublicMapSelectableItemMap,
} from "./public-map-index/map-items-state"
import { usePublicMapSameLocationSearchContext } from "./public-map-index/same-location-state"
import {
  usePublicMapFilteredOrganizations,
  usePublicMapOrganizationById,
  usePublicMapOrganizationFilterState,
} from "./public-map-index/public-map-index-filter-state"
import { usePublicMapResourceGuideState } from "./public-map-index/resource-guides"
import type { PublicMapIndexProps } from "./public-map-index/public-map-index-types"
import {
  resolveInitialCameraTarget,
  usePublicMapIndexNavigationHandlers,
  usePublicMapListItemSelection,
  useSyncPublicMapSelectedListItem,
  type PublicMapCameraTarget,
} from "./public-map-index/public-map-index-selection"
import {
  EMPTY_PUBLIC_MAP_RESOURCE_ITEMS,
  usePublicMapResourceItems,
} from "./public-map-index/use-resource-map-items"
import { usePublicMapResourceItemDetail } from "./public-map-index/use-resource-item-detail"
import { usePublicMapUserLocation } from "./public-map-index/use-public-map-user-location"

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
  memberOnboarding = undefined,
  adminOnboardingPreview = undefined,
}: PublicMapIndexProps) {
  const router = useRouter()
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
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const pendingAuthOrgId: string | null = null
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
  const {
    error: resourceItemsLoadError,
    resourceItems,
    retry: retryResourceItems,
    status: resourceItemsLoadStatus,
  } = usePublicMapResourceItems({ initialResourceItems, resourceItemsEndpoint })
  const deferredQuery = useDeferredValue(query)
  const searchPending = deferredQuery !== query
  const {
    collectedResourceIds,
    favorites,
    preferencesSaveError,
    viewer,
    setFavorites,
    setCollectedResourceIds,
    setRecentOrganizationIds,
  } = usePublicMapPreferences({ initialViewer })
  const isAuthenticated = Boolean(viewer ?? initialViewer)
  const { isOpen: memberOnboardingOpen, overlay: memberOnboardingMapOverlay } =
    usePublicMapMemberOnboardingMapOverlay({
      isAuthenticated,
      memberOnboarding,
      adminOnboardingPreview,
    })
  const organizationById = usePublicMapOrganizationById(organizations)
  const {
    filteredItems: filteredDirectoryListItems,
    filteredOrganizations,
    groupCounts,
  } = usePublicMapOrganizationFilterState({
    activeGroup,
    deferredQuery: query,
    favorites,
    includeSeedResources,
    organizationById,
    organizations,
    resourceItems,
  })
  const mapFilteredOrganizations = usePublicMapFilteredOrganizations({
    deferredQuery,
    favorites,
    organizationById,
    organizations,
  })
  const filteredMapItems = useFilteredPublicMapItems({
    activeGroup,
    filteredOrganizations: mapFilteredOrganizations,
    includeSeedResources,
    resourceItems,
  })
  const {
    activeGuideSearchContext,
    clearActiveGuide,
    handleGuideSelect,
    resourceGuides,
    visibleMapItems,
  } = usePublicMapResourceGuideState({
    activeGroup,
    deferredQuery,
    filteredMapItems,
    filteredOrganizations: mapFilteredOrganizations,
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
  const selectedResourceIndexItem =
    useMemo((): ExternalResourceMapItem | null => {
      if (!selectedListItemId) return null
      const item = selectableMapItemById.get(selectedListItemId)
      return item?.itemType === "external_resource" ? item : null
    }, [selectableMapItemById, selectedListItemId])
  const selectedResourceItem = usePublicMapResourceItemDetail(
    selectedResourceIndexItem,
    resourceItemsEndpoint?.startsWith("/api/public/resource-map/index") ?? false
  )
  const savedOrganizations = usePublicMapSavedOrganizations({
    favorites,
    organizationById,
  })
  const { savedResources, toggleCollectedResource, unresolvedCollectedResourceCount } =
    usePublicMapCollectedResources({
      collectedResourceIds,
      resourceItems,
      retainMissingResources: resourceItemsLoadStatus !== "ready",
      setCollectedResourceIds,
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
      searchParams,
      initialPublicSlug,
      selectedOrganization,
      pendingAuthOrgId,
      setSelectedOrgId,
      setSidebarMode,
      setCameraTargetOrgId: handleSetCameraTargetOrgId,
      setRecentOrganizationIds,
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
    theme: mapTheme,
  })

  const locationControl = usePublicMapUserLocation({
    mapRef,
    mapLoadedRef,
    mapLoadVersion,
    suppressAutomaticEntrance:
      Boolean(initialPublicSlug) || includeSeedResources,
    welcomeOpen: memberOnboardingOpen,
  })

  usePublicMapMarkers({
    favorites,
    mapRef,
    mapLoadedRef,
    organizations: mapFilteredOrganizations,
    mapItems: visibleMapItems,
    mapLoadVersion,
    markerTheme: mapTheme,
    selectedOrganizationId:
      selectedListItemId ?? selectedOrganization?.id ?? null,
    userCoordinates: locationControl.coordinates,
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
    setInitialViewportResolved,
  })

  useSyncSidebarCameraPadding({
    mapRef,
    mapLoadedRef,
    initialViewportResolved,
    sidebarInsetLeft,
  })

  useFocusPublicMapCameraTarget(mapRef, cameraTarget, organizationById)

  const directoryListItems =
    activeSearchContext?.items ?? filteredDirectoryListItems
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
      collectedResourceIds={collectedResourceIds}
      guides={resourceGuides}
      savedOrganizations={savedOrganizations}
      savedResources={savedResources}
      unresolvedCollectedResourceCount={unresolvedCollectedResourceCount}
      query={query}
      activeGroup={activeGroup}
      groupCounts={groupCounts}
      resourceItemsLoadStatus={resourceItemsLoadStatus}
      resourceItemsLoadError={resourceItemsLoadError}
      searchPending={searchPending}
      searchContext={activeSearchContext}
      tokenAvailable={tokenAvailable}
      mapError={mapError}
      locationControl={locationControl}
      preferencesSaveError={preferencesSaveError}
      authSheetOpen={authSheetOpen}
      authRedirectTo={authRedirectTo}
      onQueryChange={handleQueryChange}
      onActiveGroupChange={handleActiveGroupChange}
      onRetryResourceItems={retryResourceItems}
      onToggleFavorite={toggleFavorite}
      onToggleCollectedResource={toggleCollectedResource}
      onGuideSelect={handleGuideSelect}
      onSelectOrganization={handleRailSelectOrganization}
      onSelectItem={handleSelectListItem}
      onOpenOrgDetails={handleOpenDetails}
      onBackToSearch={handleBackToSearch}
      onSidebarModeChange={setSidebarMode}
      onAuthSheetOpenChange={setAuthSheetOpen}
      onSidebarInsetChange={setSidebarInsetLeft}
      mapOverlay={memberOnboardingMapOverlay}
    />
  )

  return <PublicMapIndexChrome mapSurface={mapSurface} />
}
