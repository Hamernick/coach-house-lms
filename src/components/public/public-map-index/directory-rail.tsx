"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import { PublicMapOrganizationDetail } from "./organization-detail"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapSearchCard } from "./search-card"
import type { PublicMapSidebarSearchContext } from "./sidebar"
import { PUBLIC_MAP_SIDEBAR_CARD_CLASSNAME } from "./sidebar-theme"

export type PublicMapDirectoryRailMode = "search" | "details"

export function resolvePublicMapDirectoryRailMode({
  sidebarMode,
  selectedOrganization,
}: {
  sidebarMode: SidebarMode
  selectedOrganization: PublicMapOrganization | null
}): PublicMapDirectoryRailMode {
  return sidebarMode === "details" && selectedOrganization ? "details" : "search"
}

function PublicMapDirectorySearchContextCard({
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

export function PublicMapDirectoryRail({
  sidebarMode,
  organizations,
  selectedOrganization,
  favorites,
  query,
  searchContext = null,
  onQueryChange,
  onToggleFavorite,
  onOpenDetails,
  setSidebarMode,
}: {
  sidebarMode: SidebarMode
  organizations: PublicMapOrganization[]
  selectedOrganization: PublicMapOrganization | null
  favorites: string[]
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  onQueryChange: (value: string) => void
  onToggleFavorite: (orgId: string) => void
  onOpenDetails: (orgId: string, options?: { preserveSearchContext?: boolean }) => void
  setSidebarMode: (mode: SidebarMode) => void
}) {
  const mode = resolvePublicMapDirectoryRailMode({
    sidebarMode,
    selectedOrganization,
  })

  if (mode === "details" && selectedOrganization) {
    return (
      <div
        data-public-map-right-rail-section="directory-detail"
        className="flex min-h-0 flex-1 flex-col"
      >
        <ScrollArea
          className="min-h-0 flex-1 pr-2"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="pb-2"
        >
          <PublicMapOrganizationDetail
            organization={selectedOrganization}
            compact
            onBack={() => setSidebarMode("search")}
          />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div
      data-public-map-right-rail-section="directory-search"
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <PublicMapSearchCard
        query={query}
        onQueryChange={onQueryChange}
        compact
      />

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Organizations
          </p>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {organizations.length.toLocaleString()}
          </span>
        </div>
        <ScrollArea
          className="min-h-0 flex-1 pr-2"
          viewportClassName="[&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full [&>div]:!max-w-full"
          contentClassName="pb-2"
        >
          <div className="flex min-w-0 flex-col gap-3">
            {searchContext ? (
              <PublicMapDirectorySearchContextCard context={searchContext} />
            ) : null}
            <PublicMapOrganizationList
              organizations={organizations}
              selectedOrgId={selectedOrganization?.id ?? null}
              favorites={favorites}
              query={query}
              constrainedLayout
              onSelectOrg={() => undefined}
              onToggleFavorite={onToggleFavorite}
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
