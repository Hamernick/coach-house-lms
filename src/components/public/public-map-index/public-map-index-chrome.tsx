"use client"

import type { ReactNode } from "react"

import { HomeCanvasSidebarSlot } from "@/components/public/home-canvas-sidebar-slot"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import {
  PublicMapDirectoryRail,
  resolvePublicMapDirectoryRailMode,
} from "./directory-rail"
import type { PublicMapPanelPresentation } from "./map-view-helpers"
import { PublicMapRightRail } from "./right-rail"
import {
  PublicMapShellSidebarPanel,
  type PublicMapSidebarSearchContext,
} from "./sidebar"

type PublicMapIndexChromeProps = {
  directoryOrganizations: PublicMapOrganization[]
  favorites: string[]
  isAuthenticated: boolean
  mapSurface: ReactNode
  onOpenDetails: (orgId: string, options?: { preserveSearchContext?: boolean }) => void
  onQueryChange: (value: string) => void
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (orgId: string) => void
  panelPresentation: PublicMapPanelPresentation | null
  query: string
  savedOrganizations: PublicMapOrganization[]
  searchContext: PublicMapSidebarSearchContext | null
  selectedOrganization: PublicMapOrganization | null
  setSidebarMode: (mode: SidebarMode) => void
  sidebarMode: SidebarMode
  useAppShellRightRailDirectory: boolean
  useHomeCanvasSidebarSlot: boolean
}

export function PublicMapIndexChrome({
  directoryOrganizations,
  favorites,
  isAuthenticated,
  mapSurface,
  onOpenDetails,
  onQueryChange,
  onSelectOrganization,
  onToggleFavorite,
  panelPresentation,
  query,
  savedOrganizations,
  searchContext,
  selectedOrganization,
  setSidebarMode,
  sidebarMode,
  useAppShellRightRailDirectory,
  useHomeCanvasSidebarSlot,
}: PublicMapIndexChromeProps) {
  const directoryRailMode = resolvePublicMapDirectoryRailMode({
    sidebarMode,
    selectedOrganization,
  })
  const directoryRail =
    useAppShellRightRailDirectory && panelPresentation === "rail" ? (
      <PublicMapDirectoryRail
        sidebarMode={sidebarMode}
        organizations={directoryOrganizations}
        selectedOrganization={selectedOrganization}
        favorites={favorites}
        query={query}
        searchContext={searchContext}
        onQueryChange={onQueryChange}
        onToggleFavorite={onToggleFavorite}
        onOpenDetails={onOpenDetails}
        setSidebarMode={setSidebarMode}
      />
    ) : null

  return (
    <>
      {useHomeCanvasSidebarSlot && panelPresentation === "rail" ? (
        <HomeCanvasSidebarSlot>
          <PublicMapShellSidebarPanel
            sidebarMode={sidebarMode}
            organizations={directoryOrganizations}
            selectedOrganization={selectedOrganization}
            favorites={favorites}
            query={query}
            searchContext={searchContext}
            onQueryChange={onQueryChange}
            onToggleFavorite={onToggleFavorite}
            onOpenDetails={onOpenDetails}
            setSidebarMode={setSidebarMode}
          />
        </HomeCanvasSidebarSlot>
      ) : null}

      <PublicMapRightRail
        isAuthenticated={isAuthenticated}
        directoryRail={directoryRail}
        directoryMode={directoryRail ? directoryRailMode : null}
        savedOrganizations={savedOrganizations}
        favorites={favorites}
        onSelectOrganization={onSelectOrganization}
        onToggleFavorite={onToggleFavorite}
      />

      {mapSurface}
    </>
  )
}
