"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarContent } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapSearchCard } from "./search-card"
import { PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME } from "./sidebar-theme"
import type { PublicMapListItem } from "./map-items-state"
import {
  PUBLIC_MAP_RESOURCE_ITEMS_OFFLINE_ERROR,
  type PublicMapResourceItemsLoadStatus,
} from "./use-resource-map-items"

export {
  PublicMapDrawerDetailPanel,
  PublicMapRailDetailPanel,
  PublicMapResourceDrawerDetailPanel,
  PublicMapResourceRailDetailPanel,
} from "./sidebar-detail-panels"

export type PublicMapSidebarSearchContext = {
  title: string
  description?: string | null
  items: PublicMapListItem[]
  onClear: () => void
}

const noopPublicMapSearchAction = () => undefined

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
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrgId?: string | null
  query: string
  activeGroup: PublicMapGroupFilterKey
  resourceItemsLoadStatus: PublicMapResourceItemsLoadStatus
  resourceItemsLoadError?: string | null
  constrainedLayout?: boolean
  className?: string
  onClearCategory: () => void
  onClearQuery: () => void
  onRetryResourceItems: () => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: (orgId: string) => void
}

function PublicMapOrganizationsStack({
  items,
  organizations,
  selectedItemId,
  selectedOrgId = null,
  query,
  activeGroup,
  resourceItemsLoadStatus,
  resourceItemsLoadError = null,
  constrainedLayout = false,
  className,
  onClearCategory,
  onClearQuery,
  onRetryResourceItems,
  onSelectItem,
  onOpenDetails,
}: PublicMapOrganizationsStackProps) {
  return (
    <div
      data-public-map-sidebar-section="organization-stack"
      className={cn("flex w-full max-w-full min-w-0 flex-col gap-3", className)}
    >
      <PublicMapOrganizationList
        items={items}
        organizations={organizations}
        selectedItemId={selectedItemId}
        selectedOrgId={selectedOrgId}
        query={query}
        activeGroup={activeGroup}
        loadStatus={resourceItemsLoadStatus}
        loadError={resourceItemsLoadError}
        constrainedLayout={constrainedLayout}
        incrementalLoading
        onClearCategory={onClearCategory}
        onClearQuery={onClearQuery}
        onRetryLoad={onRetryResourceItems}
        onSelectItem={onSelectItem}
        onSelectOrg={() => undefined}
        onOpenDetails={onOpenDetails}
      />
    </div>
  )
}

function PublicMapSearchResultsStatus({
  hasStaleResourceItems,
  resourceItemsLoadStatus,
  resultCount,
  searchPending,
}: {
  hasStaleResourceItems: boolean
  resourceItemsLoadStatus: PublicMapResourceItemsLoadStatus
  resultCount: number
  searchPending: boolean
}) {
  const formattedCount = resultCount.toLocaleString()
  const resultLabel = `${formattedCount} ${resultCount === 1 ? "result" : "results"}`
  const statusLabel = searchPending
    ? `${resultLabel} · Updating map…`
    : resourceItemsLoadStatus === "loading"
      ? resultCount > 0
        ? `${formattedCount} available · Loading more…`
        : "Loading resources…"
      : resourceItemsLoadStatus === "error" && hasStaleResourceItems
        ? `${resultLabel} · Last loaded results`
        : resultLabel

  return (
    <div
      data-public-map-search-results-status="true"
      data-public-map-directory-status-header="true"
      className="flex h-8 min-w-0 shrink-0 items-center justify-between gap-3 px-1"
    >
      <p className="text-muted-foreground text-xs font-medium">Resources</p>
      <p
        className="text-muted-foreground min-w-0 truncate text-right text-xs tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusLabel}
      </p>
    </div>
  )
}

function PublicMapResourceItemsErrorNotice({
  error,
  hasStaleResourceItems,
  onRetry,
}: {
  error: string | null
  hasStaleResourceItems: boolean
  onRetry: () => void
}) {
  if (!error) return null
  const message = hasStaleResourceItems
    ? error === PUBLIC_MAP_RESOURCE_ITEMS_OFFLINE_ERROR
      ? "You’re offline. Showing last loaded results."
      : "Latest results are unavailable. Showing last loaded results."
    : error

  return (
    <Alert className="border-destructive/30 bg-background/45 py-2.5">
      <AlertDescription className="col-start-1 flex w-full flex-row items-center justify-between gap-3">
        <span className="text-pretty">{message}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 rounded-full"
          onClick={onRetry}
        >
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}

type PublicMapRailSearchPanelProps = {
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrgId?: string | null
  constrainedLayout: boolean
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  resourceItemsLoadStatus?: PublicMapResourceItemsLoadStatus
  resourceItemsLoadError?: string | null
  searchPending?: boolean
  onQueryChange: (value: string) => void
  onSearchEngage?: () => void
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onHidePanel: () => void
  onRetryResourceItems?: () => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: (orgId: string) => void
}

export function PublicMapRailSearchPanel({
  query,
  searchContext = null,
  items,
  organizations,
  selectedItemId,
  selectedOrgId = null,
  constrainedLayout,
  activeGroup,
  groupCounts,
  resourceItemsLoadStatus = "ready",
  resourceItemsLoadError = null,
  searchPending = false,
  onQueryChange,
  onSearchEngage,
  onActiveGroupChange,
  onHidePanel,
  onRetryResourceItems = noopPublicMapSearchAction,
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
          onSearchEngage={onSearchEngage}
          onHidePanel={onHidePanel}
          activeGroup={activeGroup}
          groupCounts={groupCounts}
          onActiveGroupChange={onActiveGroupChange}
          searchPending={searchPending}
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
          <PublicMapSearchResultsStatus
            hasStaleResourceItems={items.some(
              (item) => item.itemType === "external_resource"
            )}
            resourceItemsLoadStatus={resourceItemsLoadStatus}
            resultCount={items.length}
            searchPending={searchPending}
          />
        </div>
        {searchContext ? (
          <div className="shrink-0 pb-2">
            <PublicMapSearchContextCard context={searchContext} />
          </div>
        ) : null}
        {resourceItemsLoadStatus === "error" && items.length > 0 ? (
          <div className="shrink-0 pb-2">
            <PublicMapResourceItemsErrorNotice
              error={resourceItemsLoadError}
              hasStaleResourceItems={items.some(
                (item) => item.itemType === "external_resource"
              )}
              onRetry={onRetryResourceItems}
            />
          </div>
        ) : null}
        <ScrollArea
          data-public-map-sidebar-section="rail-organizations-scroll"
          className="h-full min-h-0 flex-1 overflow-hidden pr-2.5"
          viewportClassName="scroll-fade-effect-y [--mask-height:1.5rem] [--scroll-buffer:1rem] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="px-1 pt-1 pb-4"
        >
          <PublicMapOrganizationsStack
            items={items}
            organizations={organizations}
            selectedItemId={selectedItemId}
            selectedOrgId={selectedOrgId}
            query={query}
            activeGroup={activeGroup}
            resourceItemsLoadStatus={resourceItemsLoadStatus}
            resourceItemsLoadError={resourceItemsLoadError}
            constrainedLayout={constrainedLayout}
            onClearCategory={() => onActiveGroupChange("all")}
            onClearQuery={() => onQueryChange("")}
            onRetryResourceItems={onRetryResourceItems}
            onSelectItem={onSelectItem}
            onOpenDetails={onOpenDetails}
          />
        </ScrollArea>
      </section>
    </SidebarContent>
  )
}

type PublicMapDrawerSearchPanelProps = {
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  items: PublicMapListItem[]
  organizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrgId?: string | null
  drawerBodyScrollable?: boolean
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  resourceItemsLoadStatus?: PublicMapResourceItemsLoadStatus
  resourceItemsLoadError?: string | null
  searchPending?: boolean
  onQueryChange: (value: string) => void
  onSearchEngage?: () => void
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: (orgId: string) => void
  onRetryResourceItems?: () => void
}

export function PublicMapDrawerSearchPanel({
  query,
  searchContext = null,
  items,
  organizations,
  selectedItemId,
  selectedOrgId = null,
  activeGroup,
  groupCounts,
  resourceItemsLoadStatus = "ready",
  resourceItemsLoadError = null,
  searchPending = false,
  onQueryChange,
  onSearchEngage,
  onActiveGroupChange,
  onSelectItem,
  onOpenDetails,
  onRetryResourceItems = noopPublicMapSearchAction,
}: PublicMapDrawerSearchPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="shrink-0 px-2.5">
        <PublicMapSearchCard
          query={query}
          onQueryChange={onQueryChange}
          onSearchEngage={onSearchEngage}
          activeGroup={activeGroup}
          groupCounts={groupCounts}
          onActiveGroupChange={onActiveGroupChange}
          compact
          searchPending={searchPending}
        />
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden px-2")}>
        <PublicMapSearchResultsStatus
          hasStaleResourceItems={items.some(
            (item) => item.itemType === "external_resource"
          )}
          resourceItemsLoadStatus={resourceItemsLoadStatus}
          resultCount={items.length}
          searchPending={searchPending}
        />
        {searchContext ? (
          <div className="shrink-0 pt-2 pb-2">
            <PublicMapSearchContextCard context={searchContext} />
          </div>
        ) : null}
        {resourceItemsLoadStatus === "error" && items.length > 0 ? (
          <div className="shrink-0 pb-2">
            <PublicMapResourceItemsErrorNotice
              error={resourceItemsLoadError}
              hasStaleResourceItems={items.some(
                (item) => item.itemType === "external_resource"
              )}
              onRetry={onRetryResourceItems}
            />
          </div>
        ) : null}
        <div
          data-public-map-sidebar-section="drawer-organizations-scroll"
          className={cn(
            "scroll-fade-effect-y min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-[max(env(safe-area-inset-bottom),0.75rem)] [--mask-height:1.5rem] [--scroll-buffer:1rem] [-webkit-overflow-scrolling:touch]"
          )}
        >
          <PublicMapOrganizationsStack
            items={items}
            organizations={organizations}
            selectedItemId={selectedItemId}
            selectedOrgId={selectedOrgId}
            query={query}
            activeGroup={activeGroup}
            resourceItemsLoadStatus={resourceItemsLoadStatus}
            resourceItemsLoadError={resourceItemsLoadError}
            className="pt-2 pb-1"
            onClearCategory={() => onActiveGroupChange("all")}
            onClearQuery={() => onQueryChange("")}
            onRetryResourceItems={onRetryResourceItems}
            onSelectItem={onSelectItem}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </div>
    </div>
  )
}
