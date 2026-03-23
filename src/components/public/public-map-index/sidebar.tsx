"use client"

import type { CSSProperties } from "react"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
} from "@/components/ui/sidebar"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import { PublicMapOrganizationDetail } from "./organization-detail"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapSearchCard } from "./search-card"

type PublicMapSidebarProps = {
  sidebarMode: SidebarMode
  sidebarWidth: number
  filteredOrganizations: PublicMapOrganization[]
  selectedOrganization: PublicMapOrganization | null
  favorites: string[]
  query: string
  setQuery: (value: string) => void
  toggleFavorite: (orgId: string) => void
  setSelectedOrgId: (orgId: string) => void
  setSidebarMode: (mode: SidebarMode) => void
}

export function PublicMapSidebar({
  sidebarMode,
  sidebarWidth,
  filteredOrganizations,
  selectedOrganization,
  favorites,
  query,
  setQuery,
  toggleFavorite,
  setSelectedOrgId,
  setSidebarMode,
}: PublicMapSidebarProps) {
  const mapSidebarProviderStyle = {
    "--sidebar-width": "100%",
  } as CSSProperties

  return (
    <>
      <div
        className={cn(
          "absolute left-4 top-4 z-20 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarMode === "hidden"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none -translate-x-1 opacity-0",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSidebarMode("search")}
          className="h-10 rounded-full border border-white/35 bg-background/60 px-3 text-foreground shadow-sm backdrop-blur-xl hover:bg-background/75"
        >
          <SearchIcon className="h-4 w-4" aria-hidden />
          <span className="sr-only">Open resource map panel</span>
        </Button>
      </div>

      <aside
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 top-0 z-20 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarMode === "hidden"
            ? "-translate-x-[calc(100%+1rem)] opacity-0"
            : "translate-x-0 opacity-100",
        )}
        style={{ width: `${Math.max(0, Math.round(sidebarWidth))}px` }}
      >
      <SidebarProvider
        defaultOpen
        className="h-full min-h-0 w-full bg-transparent"
        style={mapSidebarProviderStyle}
      >
        <Sidebar
          collapsible="none"
          className="pointer-events-auto h-full w-full border-r border-white/30 bg-background/40 shadow-[0_20px_45px_-28px_hsl(var(--foreground)/0.6)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/34"
        >
          {sidebarMode === "search" ? (
            <SidebarContent className="h-full min-h-0 gap-2 overflow-hidden pt-0 pb-2 pl-1 pr-2">
              <SidebarGroup className="px-0 pt-0 pb-0">
                <SidebarGroupContent>
                  <PublicMapSearchCard
                    query={query}
                    onQueryChange={setQuery}
                    onHidePanel={() => setSidebarMode("hidden")}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup className="min-h-0 flex-1 overflow-hidden px-2 py-0">
                <SidebarGroupContent className="h-full min-h-0 pl-0">
                  <ScrollArea className="h-full min-h-0">
                    <div className="pt-1 pb-1 pl-1 pr-1">
                      <PublicMapOrganizationList
                        organizations={filteredOrganizations}
                        selectedOrgId={selectedOrganization?.id ?? null}
                        favorites={favorites}
                        query={query}
                        onSelectOrg={setSelectedOrgId}
                        onToggleFavorite={toggleFavorite}
                        onOpenDetails={(orgId) => {
                          setSelectedOrgId(orgId)
                          setSidebarMode("details")
                        }}
                      />
                    </div>
                  </ScrollArea>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          ) : selectedOrganization ? (
            <SidebarContent className="h-full min-h-0 overflow-hidden pt-0 pb-2 pl-0 pr-1">
              <SidebarGroup className="h-full min-h-0 px-1 py-0">
                <SidebarGroupContent className="h-full min-h-0 overflow-y-auto pl-0 pr-0 [scrollbar-width:thin]">
                  <PublicMapOrganizationDetail
                    organization={selectedOrganization}
                    onBack={() => setSidebarMode("search")}
                    onHidePanel={() => setSidebarMode("hidden")}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          ) : null}
        </Sidebar>
      </SidebarProvider>
      </aside>
    </>
  )
}
