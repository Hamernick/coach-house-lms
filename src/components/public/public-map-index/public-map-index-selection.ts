"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapSameLocationSelection } from "@/lib/public-map/public-map-layer-api"
import type {
  ExternalResourceMapItem,
  PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { organizationHasMapLocation } from "./helpers"
import {
  focusOrganizationOnMap,
  ORGANIZATION_MARKER_OFFSET_Y,
  PUBLIC_MAP_FOCUS_ORGANIZATION_ZOOM,
} from "./map-view-helpers"
import { useSyncSelectedOrganization } from "./public-map-index-runtime"
import {
  shouldRenderPublicMapDesktopSidebar,
  shouldUsePublicMapHomeCanvasSidebarSlot,
  type PublicMapIndexPresentationMode,
} from "./presentation-mode"

export type PublicMapCameraTarget = {
  organizationId: string
  requestId: number
}

type PublicMapSidebarMode = "search" | "details" | "hidden"

type SelectPublicMapOrganization = (input: {
  organizationId: string
  openDetails?: boolean
  shouldFocusMap?: boolean
}) => void

export function resolveInitialCameraTarget(
  organization: PublicMapOrganization | null
): PublicMapCameraTarget | null {
  return organization ? { organizationId: organization.id, requestId: 0 } : null
}

export function useFocusPublicMapCameraTarget(
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

export function useSelectedResourceIndexItem(
  selectableMapItemById: Map<string, PublicMapItem>,
  selectedListItemId: string | null
) {
  return useMemo((): ExternalResourceMapItem | null => {
    if (!selectedListItemId) return null
    const item = selectableMapItemById.get(selectedListItemId)
    return item?.itemType === "external_resource" ? item : null
  }, [selectableMapItemById, selectedListItemId])
}

export function usePublicMapTransientSelection(initialItemId: string | null) {
  const [sameLocationSelection, setSameLocationSelection] =
    useState<PublicMapSameLocationSelection | null>(null)
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(
    initialItemId
  )
  const clearMapTransientSelection = useCallback(() => {
    setSameLocationSelection(null)
    setSelectedListItemId(null)
  }, [])
  return {
    clearMapTransientSelection,
    sameLocationSelection,
    selectedListItemId,
    setSameLocationSelection,
    setSelectedListItemId,
  }
}

export function usePublicMapSameLocationSelectionChange(
  clearActiveGuide: () => void,
  setSameLocationSelection: (
    selection: PublicMapSameLocationSelection | null
  ) => void
) {
  return useCallback(
    (selection: PublicMapSameLocationSelection | null) => {
      setSameLocationSelection(selection)
      if (selection) clearActiveGuide()
    },
    [clearActiveGuide, setSameLocationSelection]
  )
}

export function resolvePublicMapPresentationFlags(
  presentationMode: PublicMapIndexPresentationMode
) {
  const renderDesktopSidebar =
    shouldRenderPublicMapDesktopSidebar(presentationMode)
  const useAppShellRightRailDirectory = presentationMode === "app-shell"

  return {
    renderDesktopSidebar,
    renderMapOverlaySidebar:
      renderDesktopSidebar && !useAppShellRightRailDirectory,
    useAppShellRightRailDirectory,
    useHomeCanvasSidebarSlot:
      shouldUsePublicMapHomeCanvasSidebarSlot(presentationMode),
  }
}

export function usePublicMapListItemSelection({
  handleSelectOrganization,
  mapRef,
  selectableMapItemById,
  setSameLocationSelection,
  setSelectedListItemId,
  setSelectedOrgId,
  setSidebarMode,
}: {
  handleSelectOrganization: SelectPublicMapOrganization
  mapRef: RefObject<mapboxgl.Map | null>
  selectableMapItemById: Map<string, PublicMapItem>
  setSameLocationSelection: (
    selection: PublicMapSameLocationSelection | null
  ) => void
  setSelectedListItemId: (itemId: string | null) => void
  setSelectedOrgId: (organizationId: string | null) => void
  setSidebarMode: (mode: "search" | "details" | "hidden") => void
}) {
  const focusMapItemOnMap = useCallback(
    (selectableId: string) => {
      const item = selectableMapItemById.get(selectableId)
      const map = mapRef.current
      if (!map || !item) return
      if (
        typeof item.latitude !== "number" ||
        typeof item.longitude !== "number"
      ) {
        return
      }

      map.flyTo({
        center: [item.longitude, item.latitude],
        zoom: PUBLIC_MAP_FOCUS_ORGANIZATION_ZOOM,
        offset: [0, ORGANIZATION_MARKER_OFFSET_Y],
        duration: 780,
        essential: true,
      })
    },
    [mapRef, selectableMapItemById]
  )

  const handleSelectListItem = useCallback(
    (selectableId: string) => {
      const item = selectableMapItemById.get(selectableId)
      if (!item || item.itemType !== "external_resource") return

      setSelectedOrgId(null)
      setSelectedListItemId(selectableId)
      setSidebarMode("details")
      focusMapItemOnMap(selectableId)
    },
    [
      focusMapItemOnMap,
      selectableMapItemById,
      setSelectedListItemId,
      setSelectedOrgId,
      setSidebarMode,
    ]
  )

  const handleSelectMapMarker = useCallback(
    (selectableId: string) => {
      const item = selectableMapItemById.get(selectableId)
      focusMapItemOnMap(selectableId)
      if (item?.itemType === "external_resource") {
        setSameLocationSelection(null)
        setSelectedOrgId(null)
        setSelectedListItemId(selectableId)
        setSidebarMode("details")
        return
      }

      setSelectedListItemId(selectableId)
      handleSelectOrganization({
        organizationId: selectableId,
        openDetails: true,
        shouldFocusMap: false,
      })
    },
    [
      focusMapItemOnMap,
      handleSelectOrganization,
      selectableMapItemById,
      setSameLocationSelection,
      setSelectedListItemId,
      setSelectedOrgId,
      setSidebarMode,
    ]
  )

  const handleOpenSameLocationGroup = useCallback(
    (group: PublicMapSameLocationSelection) => {
      const selectableIds = group.organizationIds.filter((itemId) =>
        selectableMapItemById.has(itemId)
      )
      if (selectableIds.length === 0) return

      focusMapItemOnMap(selectableIds[0])
      setSelectedOrgId(null)
      setSelectedListItemId(null)
      setSameLocationSelection({ ...group, organizationIds: selectableIds })
      setSidebarMode("search")
    },
    [
      focusMapItemOnMap,
      selectableMapItemById,
      setSameLocationSelection,
      setSelectedListItemId,
      setSelectedOrgId,
      setSidebarMode,
    ]
  )

  return {
    handleOpenSameLocationGroup,
    handleSelectListItem,
    handleSelectMapMarker,
  }
}

export function usePublicMapIndexNavigationHandlers({
  handleSelectOrganization,
  setSameLocationSelection,
  setSelectedListItemId,
  setSelectedOrgId,
  setSidebarMode,
}: {
  handleSelectOrganization: SelectPublicMapOrganization
  setSameLocationSelection: (
    selection: PublicMapSameLocationSelection | null
  ) => void
  setSelectedListItemId: (itemId: string | null) => void
  setSelectedOrgId: (organizationId: string | null) => void
  setSidebarMode: (mode: PublicMapSidebarMode) => void
}) {
  const handleOpenDetails = useCallback(
    (organizationId: string, options?: { preserveSearchContext?: boolean }) => {
      setSelectedListItemId(organizationId)
      if (!options?.preserveSearchContext) {
        setSameLocationSelection(null)
      }
      handleSelectOrganization({
        organizationId,
        openDetails: true,
      })
    },
    [handleSelectOrganization, setSameLocationSelection, setSelectedListItemId]
  )
  const handleRailSelectOrganization = useCallback(
    (organizationId: string) => {
      setSelectedListItemId(organizationId)
      handleSelectOrganization({
        organizationId,
        openDetails: true,
      })
    },
    [handleSelectOrganization, setSelectedListItemId]
  )
  const handleBackToSearch = useCallback(() => {
    setSelectedOrgId(null)
    setSelectedListItemId(null)
    setSidebarMode("search")
  }, [setSelectedListItemId, setSelectedOrgId, setSidebarMode])

  return {
    handleBackToSearch,
    handleOpenDetails,
    handleRailSelectOrganization,
  }
}

export function useSyncPublicMapSelectedListItem({
  organizationById,
  selectableMapItemById,
  selectedListItemId,
  selectedOrgId,
  setSelectedListItemId,
  setSelectedOrgId,
}: {
  organizationById: Map<string, PublicMapOrganization>
  selectableMapItemById: Map<string, PublicMapItem>
  selectedListItemId: string | null
  selectedOrgId: string | null
  setSelectedListItemId: (itemId: string | null) => void
  setSelectedOrgId: (organizationId: string | null) => void
}) {
  useSyncSelectedOrganization({
    organizationById,
    selectedOrgId,
    setSelectedOrgId,
  })

  useEffect(() => {
    if (!selectedListItemId || selectableMapItemById.has(selectedListItemId)) {
      return
    }

    setSelectedListItemId(null)
  }, [selectableMapItemById, selectedListItemId, setSelectedListItemId])
}
