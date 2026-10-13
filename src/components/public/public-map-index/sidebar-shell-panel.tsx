"use client"

import { useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import type { SidebarMode } from "./constants"
import { PublicMapLiquidGlassShell } from "./liquid-glass-shell"
import type { PublicMapListItem } from "./map-items-state"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import {
  PublicMapRailDetailPanel,
  PublicMapRailSearchPanel,
  PublicMapResourceRailDetailPanel,
  type PublicMapSidebarSearchContext,
} from "./sidebar-panels"
import { PUBLIC_MAP_SIDEBAR_RAIL_CLASSNAME } from "./sidebar-theme"

type OpenDetailsOptions = { preserveSearchContext?: boolean }
type OpenDetails = (orgId: string, options?: OpenDetailsOptions) => void

type PublicMapShellSidebarPanelProps = {
  sidebarMode: SidebarMode
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrganization: PublicMapOrganization | null
  selectedResourceItem?: ExternalResourceMapItem | null
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  resourceMapCurationAction?: PublicMapResourceCurationAction
  favorites: string[]
  query: string
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  searchContext?: PublicMapSidebarSearchContext | null
  onQueryChange: (value: string) => void
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onToggleFavorite: (orgId: string) => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: OpenDetails
  onBackToSearch: () => void
  setSidebarMode: (mode: SidebarMode) => void
  manageShellSidebarOpen?: boolean
  onHidePanel?: () => void
}

export function PublicMapShellSidebarPanel({
  sidebarMode,
  items,
  organizations,
  selectedItemId,
  selectedOrganization,
  selectedResourceItem = null,
  canManageResourceMap = false,
  organizationCurationAction,
  resourceMapCurationAction,
  favorites,
  query,
  activeGroup,
  groupCounts,
  searchContext = null,
  onQueryChange,
  onActiveGroupChange,
  onToggleFavorite,
  onSelectItem,
  onOpenDetails,
  onBackToSearch,
  manageShellSidebarOpen = true,
  onHidePanel,
}: PublicMapShellSidebarPanelProps) {
  const { setOpen } = useSidebar()
  const effectiveSidebarMode =
    sidebarMode === "details" && (selectedOrganization || selectedResourceItem)
      ? "details"
      : "search"
  const handleHidePanel = onHidePanel ?? (() => setOpen(false))

  useEffect(() => {
    if (!manageShellSidebarOpen) return
    if (sidebarMode === "hidden") return
    setOpen(true)
  }, [
    manageShellSidebarOpen,
    selectedOrganization?.id,
    selectedResourceItem?.id,
    setOpen,
    sidebarMode,
  ])

  const panelContent =
    effectiveSidebarMode === "details" && selectedOrganization ? (
      <PublicMapRailDetailPanel
        canManageResourceMap={canManageResourceMap}
        organizationCurationAction={organizationCurationAction}
        organization={selectedOrganization}
        favorites={favorites}
        onBack={onBackToSearch}
        onToggleFavorite={onToggleFavorite}
      />
    ) : effectiveSidebarMode === "details" && selectedResourceItem ? (
      <PublicMapResourceRailDetailPanel
        canManageResourceMap={canManageResourceMap}
        item={selectedResourceItem}
        onBack={onBackToSearch}
        resourceMapCurationAction={resourceMapCurationAction}
      />
    ) : (
      <PublicMapRailSearchPanel
        query={query}
        searchContext={searchContext}
        favorites={favorites}
        items={items}
        organizations={organizations}
        selectedItemId={selectedItemId}
        selectedOrgId={selectedOrganization?.id ?? null}
        constrainedLayout
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        onQueryChange={onQueryChange}
        onActiveGroupChange={onActiveGroupChange}
        onHidePanel={handleHidePanel}
        onSelectItem={onSelectItem}
        onOpenDetails={(organizationId) =>
          onOpenDetails(organizationId, {
            preserveSearchContext: Boolean(searchContext),
          })
        }
      />
    )

  return (
    <PublicMapLiquidGlassShell
      className={cn("h-full w-full", PUBLIC_MAP_SIDEBAR_RAIL_CLASSNAME)}
    >
      {panelContent}
    </PublicMapLiquidGlassShell>
  )
}
