"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarContent } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import { PublicMapDirectoryStatusHeader } from "./directory-status-pill"
import { PublicMapOrganizationDetail } from "./organization-detail"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapResourceDetail } from "./resource-detail"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import { PublicMapSearchCard } from "./search-card"
import { PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME } from "./sidebar-theme"
import type { PublicMapListItem } from "./map-items-state"

export type PublicMapSidebarSearchContext = {
  title: string
  description?: string | null
  items: PublicMapListItem[]
  onClear: () => void
}

function PublicMapSearchContextCard({
  context,
}: {
  context: PublicMapSidebarSearchContext
}) {
  return (
    <div
      data-public-map-sidebar-section="search-context-card"
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

type PublicMapOrganizationsStackProps = {
  favorites: string[]
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrgId?: string | null
  query: string
  constrainedLayout?: boolean
  className?: string
  onSelectItem: (itemId: string) => void
  onOpenDetails: (orgId: string) => void
}

function PublicMapOrganizationsStack({
  favorites,
  items,
  organizations,
  selectedItemId,
  selectedOrgId = null,
  query,
  constrainedLayout = false,
  className,
  onSelectItem,
  onOpenDetails,
}: PublicMapOrganizationsStackProps) {
  return (
    <div
      data-public-map-sidebar-section="organization-stack"
      className={cn("flex w-full max-w-full min-w-0 flex-col gap-3", className)}
    >
      <PublicMapOrganizationList
        favorites={favorites}
        items={items}
        organizations={organizations}
        selectedItemId={selectedItemId}
        selectedOrgId={selectedOrgId}
        query={query}
        constrainedLayout={constrainedLayout}
        incrementalLoading
        onSelectItem={onSelectItem}
        onSelectOrg={() => undefined}
        onOpenDetails={onOpenDetails}
      />
    </div>
  )
}

type PublicMapRailSearchPanelProps = {
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  favorites: string[]
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrgId?: string | null
  constrainedLayout: boolean
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  onQueryChange: (value: string) => void
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onHidePanel: () => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: (orgId: string) => void
}

export function PublicMapRailSearchPanel({
  query,
  searchContext = null,
  favorites,
  items,
  organizations,
  selectedItemId,
  selectedOrgId = null,
  constrainedLayout,
  activeGroup,
  groupCounts,
  onQueryChange,
  onActiveGroupChange,
  onHidePanel,
  onSelectItem,
  onOpenDetails,
}: PublicMapRailSearchPanelProps) {
  return (
    <SidebarContent className="h-full min-h-0 gap-0 overflow-hidden bg-transparent pt-0 pb-0">
      <div
        data-public-map-sidebar-section="rail-search-header"
        className="shrink-0 px-3"
      >
        <PublicMapSearchCard
          query={query}
          onQueryChange={onQueryChange}
          onHidePanel={onHidePanel}
          activeGroup={activeGroup}
          groupCounts={groupCounts}
          onActiveGroupChange={onActiveGroupChange}
        />
      </div>
      <section
        data-public-map-sidebar-section="rail-organizations-shell"
        className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden px-3 py-1.5"
      >
        <div
          data-public-map-sidebar-section="rail-status-header"
          className="shrink-0 pb-1.5"
        >
          <PublicMapDirectoryStatusHeader count={items.length} />
        </div>
        {searchContext ? (
          <div className="shrink-0 pb-2">
            <PublicMapSearchContextCard context={searchContext} />
          </div>
        ) : null}
        <ScrollArea
          data-public-map-sidebar-section="rail-organizations-scroll"
          className="h-full min-h-0 flex-1 overflow-hidden pr-2.5"
          viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="px-1 pt-1 pb-4"
        >
          <PublicMapOrganizationsStack
            favorites={favorites}
            items={items}
            organizations={organizations}
            selectedItemId={selectedItemId}
            selectedOrgId={selectedOrgId}
            query={query}
            constrainedLayout={constrainedLayout}
            onSelectItem={onSelectItem}
            onOpenDetails={onOpenDetails}
          />
        </ScrollArea>
      </section>
    </SidebarContent>
  )
}

type PublicMapRailDetailPanelProps = {
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  organization: PublicMapOrganization
  favorites: string[]
  onBack: () => void
  onToggleFavorite: (orgId: string) => void
}

export function PublicMapRailDetailPanel({
  canManageResourceMap = false,
  organizationCurationAction,
  organization,
  favorites,
  onBack,
  onToggleFavorite,
}: PublicMapRailDetailPanelProps) {
  return (
    <SidebarContent className="h-full min-h-0 overflow-hidden bg-transparent pt-0 pb-0">
      <ScrollArea
        data-public-map-sidebar-section="rail-detail-scroll"
        className="h-full min-h-0 flex-1 overflow-hidden px-1 pr-3.5"
        viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
        contentClassName="pb-3 pr-1"
      >
        <PublicMapOrganizationDetail
          canManageResourceMap={canManageResourceMap}
          organizationCurationAction={organizationCurationAction}
          organization={organization}
          favorites={favorites}
          onBack={onBack}
          onToggleFavorite={onToggleFavorite}
        />
      </ScrollArea>
    </SidebarContent>
  )
}

export function PublicMapResourceRailDetailPanel({
  canManageResourceMap = false,
  item,
  onBack,
  resourceMapCurationAction,
}: {
  canManageResourceMap?: boolean
  item: ExternalResourceMapItem
  onBack: () => void
  resourceMapCurationAction?: PublicMapResourceCurationAction
}) {
  return (
    <SidebarContent className="h-full min-h-0 overflow-hidden bg-transparent pt-0 pb-0">
      <ScrollArea
        data-public-map-sidebar-section="rail-detail-scroll"
        className="h-full min-h-0 flex-1 overflow-hidden px-1 pr-3.5"
        viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
        contentClassName="pb-3 pr-1"
      >
        <PublicMapResourceDetail
          canManageResourceMap={canManageResourceMap}
          item={item}
          onBack={onBack}
          resourceMapCurationAction={resourceMapCurationAction}
        />
      </ScrollArea>
    </SidebarContent>
  )
}

type PublicMapDrawerSearchPanelProps = {
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  favorites: string[]
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrgId?: string | null
  drawerBodyScrollable: boolean
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  onQueryChange: (value: string) => void
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: (orgId: string) => void
}

export function PublicMapDrawerSearchPanel({
  query,
  searchContext = null,
  favorites,
  items,
  organizations,
  selectedItemId,
  selectedOrgId = null,
  activeGroup,
  groupCounts,
  onQueryChange,
  onActiveGroupChange,
  onSelectItem,
  onOpenDetails,
}: PublicMapDrawerSearchPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="shrink-0 px-2.5">
        <PublicMapSearchCard
          query={query}
          onQueryChange={onQueryChange}
          activeGroup={activeGroup}
          groupCounts={groupCounts}
          onActiveGroupChange={onActiveGroupChange}
          compact
        />
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden px-2")}>
        {searchContext ? (
          <div className="shrink-0 pt-2 pb-2">
            <PublicMapSearchContextCard context={searchContext} />
          </div>
        ) : null}
        <div
          data-public-map-sidebar-section="drawer-organizations-scroll"
          className={cn(
            "scroll-fade-effect-y min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-[max(env(safe-area-inset-bottom),0.75rem)] [--mask-height:1.5rem] [--scroll-buffer:1rem] [-webkit-overflow-scrolling:touch]"
          )}
        >
          <PublicMapOrganizationsStack
            favorites={favorites}
            items={items}
            organizations={organizations}
            selectedItemId={selectedItemId}
            selectedOrgId={selectedOrgId}
            query={query}
            className="pt-2 pb-1"
            onSelectItem={onSelectItem}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </div>
    </div>
  )
}

type PublicMapDrawerDetailPanelProps = {
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  organization: PublicMapOrganization
  favorites: string[]
  drawerBodyScrollable: boolean
  onBack: () => void
  onToggleFavorite: (orgId: string) => void
}

export function PublicMapDrawerDetailPanel({
  canManageResourceMap = false,
  organizationCurationAction,
  organization,
  favorites,
  onBack,
  onToggleFavorite,
}: PublicMapDrawerDetailPanelProps) {
  return (
    <ScrollArea
      data-public-map-sidebar-section="drawer-detail-scroll"
      className="h-full min-h-0 flex-1 overflow-hidden px-1"
      viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [-webkit-overflow-scrolling:touch] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
      contentClassName="pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
        <PublicMapOrganizationDetail
          canManageResourceMap={canManageResourceMap}
          organizationCurationAction={organizationCurationAction}
          organization={organization}
          favorites={favorites}
          onBack={onBack}
          onToggleFavorite={onToggleFavorite}
          compact
        />
      </div>
    </ScrollArea>
  )
}

export function PublicMapResourceDrawerDetailPanel({
  canManageResourceMap = false,
  item,
  onBack,
  resourceMapCurationAction,
}: {
  canManageResourceMap?: boolean
  item: ExternalResourceMapItem
  drawerBodyScrollable: boolean
  onBack: () => void
  resourceMapCurationAction?: PublicMapResourceCurationAction
}) {
  return (
    <ScrollArea
      data-public-map-sidebar-section="drawer-detail-scroll"
      className="h-full min-h-0 flex-1 overflow-hidden px-1"
      viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [-webkit-overflow-scrolling:touch] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
      contentClassName="pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
        <PublicMapResourceDetail
          canManageResourceMap={canManageResourceMap}
          item={item}
          onBack={onBack}
          resourceMapCurationAction={resourceMapCurationAction}
          compact
        />
      </div>
    </ScrollArea>
  )
}
