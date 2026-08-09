"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarContent } from "@/components/ui/sidebar"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { PublicMapOrganizationDetail } from "./organization-detail"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import { PublicMapResourceDetail } from "./resource-detail"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"

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

type PublicMapDrawerDetailPanelProps = {
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  organization: PublicMapOrganization
  favorites: string[]
  drawerBodyScrollable?: boolean
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
      className="h-full min-h-0 flex-1 overflow-hidden px-2 sm:px-4"
      viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [-webkit-overflow-scrolling:touch] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
      contentClassName="min-h-full pb-[max(env(safe-area-inset-bottom),1rem)]"
    >
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 mx-auto w-full max-w-3xl motion-safe:duration-200">
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
  drawerBodyScrollable?: boolean
  onBack: () => void
  resourceMapCurationAction?: PublicMapResourceCurationAction
}) {
  return (
    <ScrollArea
      data-public-map-sidebar-section="drawer-detail-scroll"
      className="h-full min-h-0 flex-1 overflow-hidden px-2 sm:px-4"
      viewportClassName="scroll-fade-effect-y overscroll-contain [--mask-height:1.5rem] [--scroll-buffer:1rem] [-webkit-overflow-scrolling:touch] [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
      contentClassName="min-h-full pb-[max(env(safe-area-inset-bottom),1rem)]"
    >
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 mx-auto w-full max-w-3xl motion-safe:duration-200">
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
