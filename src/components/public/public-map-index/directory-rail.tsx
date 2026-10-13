"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import type { SidebarMode } from "./constants"
import {
  PublicMapDirectoryStatusHeader,
  resolvePublicMapDirectoryStatusCount,
} from "./directory-status-pill"
import { PublicMapOrganizationDetail } from "./organization-detail"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapResourceDetail } from "./resource-detail"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import { PublicMapSearchCard } from "./search-card"
import type { PublicMapSidebarSearchContext } from "./sidebar"
import { PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME } from "./sidebar-theme"
import type { PublicMapListItem } from "./map-items-state"

export type PublicMapDirectoryRailMode = "search" | "details"
export { resolvePublicMapDirectoryStatusCount }

export function resolvePublicMapDirectoryRailMode({
  sidebarMode,
  selectedOrganization,
  selectedResourceItem = null,
}: {
  sidebarMode: SidebarMode
  selectedOrganization: PublicMapOrganization | null
  selectedResourceItem?: ExternalResourceMapItem | null
}): PublicMapDirectoryRailMode {
  return sidebarMode === "details" &&
    (selectedOrganization || selectedResourceItem)
    ? "details"
    : "search"
}

function PublicMapDirectorySearchContextCard({
  context,
}: {
  context: PublicMapSidebarSearchContext
}) {
  return (
    <div
      data-public-map-right-rail-section="directory-search-context"
      className={cn(
        "w-full max-w-full px-3 py-3",
        PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-foreground text-sm font-semibold">
            {context.title}
          </p>
          {context.description ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {context.description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-3 text-xs"
          onClick={context.onClear}
        >
          Show all
        </Button>
      </div>
    </div>
  )
}

export function PublicMapDirectoryRail({
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
  setSidebarMode,
}: {
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
  onOpenDetails: (
    orgId: string,
    options?: { preserveSearchContext?: boolean }
  ) => void
  onBackToSearch: () => void
  setSidebarMode: (mode: SidebarMode) => void
}) {
  const mode = resolvePublicMapDirectoryRailMode({
    sidebarMode,
    selectedOrganization,
    selectedResourceItem,
  })

  if (mode === "details" && selectedOrganization) {
    return (
      <div
        data-public-map-right-rail-section="directory-detail"
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <ScrollArea
          data-public-map-right-rail-section="directory-detail-scroll"
          className="h-full min-h-0 flex-1 overflow-hidden pr-2"
          viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="pb-2"
        >
          <PublicMapOrganizationDetail
            canManageResourceMap={canManageResourceMap}
            organizationCurationAction={organizationCurationAction}
            organization={selectedOrganization}
            favorites={favorites}
            compact
            onBack={onBackToSearch}
            onToggleFavorite={onToggleFavorite}
          />
        </ScrollArea>
      </div>
    )
  }

  if (mode === "details" && selectedResourceItem) {
    return (
      <div
        data-public-map-right-rail-section="directory-detail"
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        <ScrollArea
          data-public-map-right-rail-section="directory-detail-scroll"
          className="h-full min-h-0 flex-1 overflow-hidden pr-2"
          viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="pb-2"
        >
          <PublicMapResourceDetail
            canManageResourceMap={canManageResourceMap}
            item={selectedResourceItem}
            compact
            onBack={onBackToSearch}
            resourceMapCurationAction={resourceMapCurationAction}
          />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div
      data-public-map-right-rail-section="directory-search"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
    >
      <PublicMapSearchCard
        query={query}
        onQueryChange={onQueryChange}
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        onActiveGroupChange={onActiveGroupChange}
        compact
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
        <div
          data-public-map-right-rail-section="directory-status-header"
          className="shrink-0"
        >
          <PublicMapDirectoryStatusHeader count={items.length} />
        </div>
        {searchContext ? (
          <div className="shrink-0">
            <PublicMapDirectorySearchContextCard context={searchContext} />
          </div>
        ) : null}
        <ScrollArea
          data-public-map-right-rail-section="directory-list-scroll"
          className="h-full min-h-0 flex-1 overflow-hidden pr-2"
          viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="pt-1 pb-2"
        >
          <div className="flex min-w-0 flex-col gap-3">
            <PublicMapOrganizationList
              favorites={favorites}
              items={items}
              organizations={organizations}
              selectedItemId={selectedItemId}
              selectedOrgId={selectedOrganization?.id ?? null}
              query={query}
              constrainedLayout
              incrementalLoading
              onSelectItem={onSelectItem}
              onSelectOrg={() => undefined}
              onOpenDetails={(organizationId) =>
                onOpenDetails(organizationId, {
                  preserveSearchContext: Boolean(searchContext),
                })
              }
            />
          </div>
        </ScrollArea>
      </section>
    </div>
  )
}
