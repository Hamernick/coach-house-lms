"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { PublicMapOrganizationDetail } from "./organization-detail"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapSearchCard } from "./search-card"
import { PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME } from "./sidebar-theme"

export type PublicMapSidebarSearchContext = {
  title: string
  description?: string | null
  organizations: PublicMapOrganization[]
  onClear: () => void
}

function PublicMapSearchContextCard({
  context,
}: {
  context: PublicMapSidebarSearchContext
}) {
  return (
    <div className={cn("w-full max-w-full px-3 py-3", PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">{context.title}</p>
          {context.description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
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
  organizations: PublicMapOrganization[]
  selectedOrgId: string | null
  favorites: string[]
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  constrainedLayout?: boolean
  className?: string
  onToggleFavorite: (orgId: string) => void
  onOpenDetails: (orgId: string) => void
}

function PublicMapOrganizationsStack({
  organizations,
  selectedOrgId,
  favorites,
  query,
  searchContext = null,
  constrainedLayout = false,
  className,
  onToggleFavorite,
  onOpenDetails,
}: PublicMapOrganizationsStackProps) {
  return (
    <div
      data-public-map-sidebar-section="organization-stack"
      className={cn("flex w-full min-w-0 max-w-full flex-col gap-3", className)}
    >
      {searchContext ? (
        <PublicMapSearchContextCard context={searchContext} />
      ) : null}
      <PublicMapOrganizationList
        organizations={organizations}
        selectedOrgId={selectedOrgId}
        favorites={favorites}
        query={query}
        constrainedLayout={constrainedLayout}
        onSelectOrg={() => undefined}
        onToggleFavorite={onToggleFavorite}
        onOpenDetails={onOpenDetails}
      />
    </div>
  )
}

type PublicMapRailSearchPanelProps = {
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  organizations: PublicMapOrganization[]
  selectedOrgId: string | null
  favorites: string[]
  constrainedLayout: boolean
  onQueryChange: (value: string) => void
  onHidePanel: () => void
  onToggleFavorite: (orgId: string) => void
  onOpenDetails: (orgId: string) => void
}

export function PublicMapRailSearchPanel({
  query,
  searchContext = null,
  organizations,
  selectedOrgId,
  favorites,
  constrainedLayout,
  onQueryChange,
  onHidePanel,
  onToggleFavorite,
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
        />
      </div>
      <section
        data-public-map-sidebar-section="rail-organizations-shell"
        className="flex min-h-0 flex-1 flex-col gap-0 px-3 py-1.5"
      >
        <SidebarGroupLabel className="pb-1.5 text-[0.68rem]">
          Organizations
        </SidebarGroupLabel>
        <ScrollArea
          data-public-map-sidebar-section="rail-organizations-scroll"
          className="min-h-0 flex-1 pr-2.5"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="px-1 pb-4"
        >
          <PublicMapOrganizationsStack
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            favorites={favorites}
            query={query}
            searchContext={searchContext}
            constrainedLayout={constrainedLayout}
            onToggleFavorite={onToggleFavorite}
            onOpenDetails={onOpenDetails}
          />
        </ScrollArea>
      </section>
    </SidebarContent>
  )
}

type PublicMapRailDetailPanelProps = {
  organization: PublicMapOrganization
  onBack: () => void
}

export function PublicMapRailDetailPanel({
  organization,
  onBack,
}: PublicMapRailDetailPanelProps) {
  return (
    <SidebarContent className="h-full min-h-0 overflow-hidden bg-transparent pt-0 pb-0">
      <ScrollArea
        data-public-map-sidebar-section="rail-detail-scroll"
        className="min-h-0 flex-1 px-1 pr-3.5"
        viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
        contentClassName="pb-3 pr-1"
      >
        <PublicMapOrganizationDetail
          organization={organization}
          onBack={onBack}
        />
      </ScrollArea>
    </SidebarContent>
  )
}

type PublicMapDrawerSearchPanelProps = {
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  organizations: PublicMapOrganization[]
  selectedOrgId: string | null
  favorites: string[]
  drawerBodyScrollable: boolean
  onQueryChange: (value: string) => void
  onToggleFavorite: (orgId: string) => void
  onOpenDetails: (orgId: string) => void
}

export function PublicMapDrawerSearchPanel({
  query,
  searchContext = null,
  organizations,
  selectedOrgId,
  favorites,
  drawerBodyScrollable,
  onQueryChange,
  onToggleFavorite,
  onOpenDetails,
}: PublicMapDrawerSearchPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <div className="shrink-0 px-2.5">
        <PublicMapSearchCard
          query={query}
          onQueryChange={onQueryChange}
          compact
        />
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]",
          drawerBodyScrollable
            ? "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
            : "overflow-hidden",
        )}
      >
        <PublicMapOrganizationsStack
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          favorites={favorites}
          query={query}
          searchContext={searchContext}
          className="pb-1 pt-2"
          onToggleFavorite={onToggleFavorite}
          onOpenDetails={onOpenDetails}
        />
      </div>
    </div>
  )
}

type PublicMapDrawerDetailPanelProps = {
  organization: PublicMapOrganization
  drawerBodyScrollable: boolean
  onBack: () => void
}

export function PublicMapDrawerDetailPanel({
  organization,
  drawerBodyScrollable,
  onBack,
}: PublicMapDrawerDetailPanelProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 px-1 pb-[max(env(safe-area-inset-bottom),0.75rem)]",
        drawerBodyScrollable
          ? "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          : "overflow-hidden",
      )}
    >
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
        <PublicMapOrganizationDetail
          organization={organization}
          onBack={onBack}
          compact
        />
      </div>
    </div>
  )
}
