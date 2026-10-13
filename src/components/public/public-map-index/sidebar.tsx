"use client"

import type { CSSProperties } from "react"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
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

  if (sidebarMode === "hidden") {
    return (
      <div className="absolute left-4 top-4 z-20">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSidebarMode("search")}
          className="h-10 rounded-full border border-border/80 bg-background/90 px-3 text-foreground shadow-sm backdrop-blur hover:bg-muted"
        >
          <SearchIcon className="h-4 w-4" aria-hidden />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    )
  }

  return (
    <aside className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-[min(390px,100%)]">
      <SidebarProvider
        defaultOpen
        className="h-full min-h-0 w-full bg-transparent"
        style={mapSidebarProviderStyle}
      >
        <Sidebar
          collapsible="none"
          className="pointer-events-auto h-full w-full border-r border-border/70 bg-card/95 shadow-none"
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
              <SidebarGroup className="min-h-0 flex-1 px-2 py-0">
                <SidebarGroupContent className="h-full min-h-0 pl-0">
                  <div className="h-full min-h-0 overflow-y-auto pt-1 pl-1 pr-1 pb-1 [scrollbar-width:thin]">
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
  )
}
