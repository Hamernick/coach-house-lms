"use client"

import type { ReactNode } from "react"

import { HomeCanvasSidebarSlot } from "@/components/public/home-canvas-sidebar-slot"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import {
  PublicMapDirectoryRail,
  resolvePublicMapDirectoryRailMode,
} from "./directory-rail"
import type { PublicMapPanelPresentation } from "./map-view-helpers"
import { PublicMapRightRail } from "./right-rail"
import type { PublicMapSidebarSearchContext } from "./sidebar"
import { PublicMapShellSidebarPanel } from "./sidebar-shell-panel"
import type { PublicMapListItem } from "./map-items-state"
import type { PublicMapResourceGuide } from "./resource-guides"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"

type PublicMapIndexChromeProps = {
  directoryItems: PublicMapListItem[]
  directoryOrganizations: PublicMapOrganization[]
  favorites: string[]
  isAuthenticated: boolean
  mapSurface: ReactNode
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  guides?: PublicMapResourceGuide[]
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onGuideSelect?: (guideId: string) => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: (
    orgId: string,
    options?: { preserveSearchContext?: boolean }
  ) => void
  onBackToSearch: () => void
  onQueryChange: (value: string) => void
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (orgId: string) => void
  panelPresentation: PublicMapPanelPresentation | null
  query: string
  savedOrganizations: PublicMapOrganization[]
  searchContext: PublicMapSidebarSearchContext | null
  selectedItemId: string | null
  selectedOrganization: PublicMapOrganization | null
  selectedResourceItem: ExternalResourceMapItem | null
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  resourceMapCurationAction?: PublicMapResourceCurationAction
  setSidebarMode: (mode: SidebarMode) => void
  sidebarMode: SidebarMode
  useAppShellRightRailDirectory: boolean
  useHomeCanvasSidebarSlot: boolean
}

export function PublicMapIndexChrome({
  directoryOrganizations,
  directoryItems,
  favorites,
  isAuthenticated,
  mapSurface,
  activeGroup,
  groupCounts,
  guides = [],
  onActiveGroupChange,
  onGuideSelect,
  onSelectItem,
  onOpenDetails,
  onBackToSearch,
  onQueryChange,
  onSelectOrganization,
  onToggleFavorite,
  panelPresentation,
  query,
  savedOrganizations,
  searchContext,
  selectedItemId,
  selectedOrganization,
  selectedResourceItem,
  canManageResourceMap = false,
  organizationCurationAction,
  resourceMapCurationAction,
  setSidebarMode,
  sidebarMode,
  useAppShellRightRailDirectory,
  useHomeCanvasSidebarSlot,
}: PublicMapIndexChromeProps) {
  const directoryRailMode = resolvePublicMapDirectoryRailMode({
    sidebarMode,
    selectedOrganization,
    selectedResourceItem,
  })
  const directoryRail =
    useAppShellRightRailDirectory && panelPresentation === "rail" ? (
      <PublicMapDirectoryRail
        sidebarMode={sidebarMode}
        items={directoryItems}
        organizations={directoryOrganizations}
        selectedItemId={selectedItemId}
        selectedOrganization={selectedOrganization}
        selectedResourceItem={selectedResourceItem}
        canManageResourceMap={canManageResourceMap}
        organizationCurationAction={organizationCurationAction}
        resourceMapCurationAction={resourceMapCurationAction}
        favorites={favorites}
        query={query}
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        searchContext={searchContext}
        onQueryChange={onQueryChange}
        onActiveGroupChange={onActiveGroupChange}
        onToggleFavorite={onToggleFavorite}
        onSelectItem={onSelectItem}
        onOpenDetails={onOpenDetails}
        onBackToSearch={onBackToSearch}
        setSidebarMode={setSidebarMode}
      />
    ) : null

  return (
    <>
      {useHomeCanvasSidebarSlot && panelPresentation === "rail" ? (
        <HomeCanvasSidebarSlot>
          <PublicMapShellSidebarPanel
            sidebarMode={sidebarMode}
            items={directoryItems}
            organizations={directoryOrganizations}
            selectedItemId={selectedItemId}
            selectedOrganization={selectedOrganization}
            selectedResourceItem={selectedResourceItem}
            canManageResourceMap={canManageResourceMap}
            organizationCurationAction={organizationCurationAction}
            resourceMapCurationAction={resourceMapCurationAction}
            favorites={favorites}
            query={query}
            activeGroup={activeGroup}
            groupCounts={groupCounts}
            searchContext={searchContext}
            onQueryChange={onQueryChange}
            onActiveGroupChange={onActiveGroupChange}
            onToggleFavorite={onToggleFavorite}
            onSelectItem={onSelectItem}
            onOpenDetails={onOpenDetails}
            onBackToSearch={onBackToSearch}
            setSidebarMode={setSidebarMode}
          />
        </HomeCanvasSidebarSlot>
      ) : null}

      <PublicMapRightRail
        isAuthenticated={isAuthenticated}
        directoryRail={directoryRail}
        directoryMode={directoryRail ? directoryRailMode : null}
        guides={guides}
        savedOrganizations={savedOrganizations}
        favorites={favorites}
        onGuideSelect={onGuideSelect}
        onSelectOrganization={onSelectOrganization}
        onToggleFavorite={onToggleFavorite}
      />

      {mapSurface}
    </>
  )
}
