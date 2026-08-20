"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import { cn } from "@/lib/utils"

import {
  buildPublicMapGroupFilterCounts,
  type PublicMapGroupFilterKey,
} from "./category-filter"
import {
  buildPlatformOrganizationMapItem,
  publicMapItemMatchesGroupFilter,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapDirectoryRailMode } from "./directory-rail"
import { PublicMapOrganizationsRailSection } from "./member-rail-organization-section"
import {
  PublicMapGuidesRail,
  type PublicMapResourceGuide,
} from "./resource-guides"
import { PublicMapSearchCard } from "./search-card"
import {
  buildPublicMapSearchIndex,
  filterPublicMapOrganizationIds,
} from "./search-index"
import { publicMapListItemMatchesQuery } from "./map-items-state"
import type { PublicMapResourceItemsLoadStatus } from "./use-resource-map-items"

const PUBLIC_MAP_MEMBER_TABS_LIST_CLASSNAME =
  "mx-auto h-7 w-fit max-w-full min-w-0 justify-center gap-0 self-center p-0"

const PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME =
  "h-7 min-w-0 flex-none rounded-none bg-transparent px-2 py-1 text-center text-xs leading-none text-muted-foreground shadow-none transition-[color] after:pointer-events-none group-data-[orientation=horizontal]/tabs:after:bottom-0 hover:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:!bg-transparent [html.light_&]:!text-zinc-700 [html.light_&]:hover:!text-zinc-950 [html.light_&]:data-[state=active]:!text-zinc-950"

type PublicMapMemberRailProps = {
  activeTab?: PublicMapMemberTab
  directoryHeaderEnd?: ReactNode
  directoryHeaderStart?: ReactNode
  directoryRail?: ReactNode
  directoryMode?: PublicMapDirectoryRailMode | null
  guides?: PublicMapResourceGuide[]
  savedOrganizations: PublicMapOrganization[]
  savedResources?: ExternalResourceMapItem[]
  unresolvedCollectedResourceCount?: number
  resourceItemsLoadStatus?: PublicMapResourceItemsLoadStatus
  resourceItemsLoadError?: string | null
  onRetryResourceItems?: () => void
  onActiveTabChange?: (tab: PublicMapMemberTab) => void
  onGuideSelect?: (guideId: string) => void
  onSelectOrganization: (organizationId: string) => void
  onSelectResource?: (resourceId: string) => void
  onToggleFavorite: (organizationId: string) => void
  onToggleCollectedResource?: (resourceId: string) => void
}

export function filterPublicMapSavedResources({
  activeGroup,
  query,
  savedResources,
}: {
  activeGroup: PublicMapGroupFilterKey
  query: string
  savedResources: ExternalResourceMapItem[]
}) {
  return savedResources.filter(
    (item) =>
      publicMapListItemMatchesQuery({ item, query }) &&
      publicMapItemMatchesGroupFilter({ activeGroup, item })
  )
}

export type PublicMapMemberTab = "directory" | "guides" | "saved"

export function filterPublicMapSavedOrganizations({
  activeGroup,
  query,
  savedOrganizations,
}: {
  activeGroup: PublicMapGroupFilterKey
  query: string
  savedOrganizations: PublicMapOrganization[]
}) {
  if (savedOrganizations.length === 0) return []

  const savedOrganizationById = new Map(
    savedOrganizations.map((organization) => [organization.id, organization])
  )
  const filteredIds = filterPublicMapOrganizationIds({
    searchIndex: buildPublicMapSearchIndex(savedOrganizations),
    query,
    appliedBounds: null,
    favorites: savedOrganizations.map((organization) => organization.id),
    activeGroup: "all",
    sortByFavorites: false,
  })

  return filteredIds
    .map((organizationId) => savedOrganizationById.get(organizationId) ?? null)
    .filter((organization): organization is PublicMapOrganization =>
      Boolean(organization)
    )
    .filter((organization) =>
      publicMapItemMatchesGroupFilter({
        activeGroup,
        item: buildPlatformOrganizationMapItem(organization),
      })
    )
}

export function PublicMapMemberRail({
  activeTab: controlledActiveTab,
  directoryHeaderEnd = null,
  directoryHeaderStart = null,
  directoryRail = null,
  directoryMode = null,
  guides = [],
  savedOrganizations,
  savedResources = [],
  unresolvedCollectedResourceCount = 0,
  resourceItemsLoadStatus = "ready",
  resourceItemsLoadError = null,
  onRetryResourceItems,
  onActiveTabChange,
  onGuideSelect,
  onSelectOrganization,
  onSelectResource,
  onToggleFavorite,
  onToggleCollectedResource,
}: PublicMapMemberRailProps) {
  const hasDirectoryRail = Boolean(directoryRail)
  const hasGuides = Boolean(onGuideSelect)
  const defaultTab: PublicMapMemberTab = hasDirectoryRail
    ? "directory"
    : hasGuides
      ? "guides"
      : "saved"
  const [uncontrolledActiveTab, setUncontrolledActiveTab] =
    useState<PublicMapMemberTab>(defaultTab)
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab
  const setActiveTab = useCallback(
    (nextTab: PublicMapMemberTab) => {
      setUncontrolledActiveTab(nextTab)
      onActiveTabChange?.(nextTab)
    },
    [onActiveTabChange]
  )
  const [savedQuery, setSavedQuery] = useState("")
  const [savedActiveGroup, setSavedActiveGroup] =
    useState<PublicMapGroupFilterKey>("all")
  const previousHasDirectoryRailRef = useRef(hasDirectoryRail)
  const savedItems = useMemo(
    () => [
      ...savedOrganizations.map(buildPlatformOrganizationMapItem),
      ...savedResources,
    ],
    [savedOrganizations, savedResources]
  )
  const savedGroupCounts = useMemo(
    () => buildPublicMapGroupFilterCounts(savedItems),
    [savedItems]
  )
  const filteredSavedOrganizations = useMemo(
    () =>
      filterPublicMapSavedOrganizations({
        activeGroup: savedActiveGroup,
        query: savedQuery,
        savedOrganizations,
      }),
    [savedActiveGroup, savedOrganizations, savedQuery]
  )
  const filteredSavedResources = useMemo(
    () =>
      filterPublicMapSavedResources({
        activeGroup: savedActiveGroup,
        query: savedQuery,
        savedResources,
      }),
    [savedActiveGroup, savedQuery, savedResources]
  )
  const hasSavedFilters =
    savedQuery.trim().length > 0 || savedActiveGroup !== "all"
  const showDirectoryHeaderControls =
    activeTab === "directory" &&
    Boolean(directoryHeaderStart || directoryHeaderEnd)

  useEffect(() => {
    const didAddDirectoryRail =
      hasDirectoryRail && !previousHasDirectoryRailRef.current
    previousHasDirectoryRailRef.current = hasDirectoryRail

    if (!hasDirectoryRail) {
      setActiveTab(hasGuides ? "guides" : "saved")
      return
    }
    if (didAddDirectoryRail || directoryMode === "details") {
      setActiveTab("directory")
    }
  }, [directoryMode, hasDirectoryRail, hasGuides, setActiveTab])

  useEffect(() => {
    if (
      savedActiveGroup === "all" ||
      (savedGroupCounts[savedActiveGroup] ?? 0) > 0
    ) {
      return
    }

    setSavedActiveGroup("all")
  }, [savedActiveGroup, savedGroupCounts])

  const handleSelectOrganization = (organizationId: string) => {
    onSelectOrganization(organizationId)
    if (hasDirectoryRail) {
      setActiveTab("directory")
    }
  }
  const handleGuideSelect = (guideId: string) => {
    onGuideSelect?.(guideId)
    if (hasDirectoryRail) {
      setActiveTab("directory")
    }
  }
  const handleSelectResource = (resourceId: string) => {
    onSelectResource?.(resourceId)
    if (hasDirectoryRail) {
      setActiveTab("directory")
    }
  }

  return (
    <div
      data-public-map-tabbed-rail=""
      className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PublicMapMemberTab)}
        className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
      >
        <div
          data-public-map-tab-header=""
          className={cn(
            "grid shrink-0 grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center gap-1 px-2",
            showDirectoryHeaderControls ? "min-h-11" : "h-7"
          )}
        >
          <div className="flex min-w-0 items-center justify-start">
            {showDirectoryHeaderControls ? directoryHeaderStart : null}
          </div>
          <TabsList
            data-public-map-tab-list=""
            variant="line"
            className={cn("shrink-0", PUBLIC_MAP_MEMBER_TABS_LIST_CLASSNAME)}
          >
            {hasDirectoryRail ? (
              <TabsTrigger
                value="directory"
                className={PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME}
              >
                <span className="truncate">Find</span>
              </TabsTrigger>
            ) : null}
            {hasGuides ? (
              <TabsTrigger
                value="guides"
                className={PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME}
              >
                <span className="truncate">Guides</span>
              </TabsTrigger>
            ) : null}
            <TabsTrigger
              value="saved"
              className={PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME}
            >
              <span className="truncate">My Map</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex min-w-0 items-center justify-end">
            {showDirectoryHeaderControls ? directoryHeaderEnd : null}
          </div>
        </div>

        {hasDirectoryRail ? (
          <TabsContent
            value="directory"
            className="mt-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          >
            {directoryRail}
          </TabsContent>
        ) : null}

        {hasGuides ? (
          <TabsContent
            value="guides"
            className="mt-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          >
            <PublicMapGuidesRail
              guides={guides}
              onGuideSelect={handleGuideSelect}
            />
          </TabsContent>
        ) : null}

        <TabsContent
          value="saved"
          className="mt-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div
            data-public-map-member-rail-section="saved-panel"
            className="flex h-full min-h-0 flex-col gap-3 overflow-hidden"
          >
            <div
              data-public-map-member-rail-section="saved-search-controls"
              className="shrink-0 px-2.5"
            >
              <PublicMapSearchCard
                query={savedQuery}
                onQueryChange={setSavedQuery}
                activeGroup={savedActiveGroup}
                groupCounts={savedGroupCounts}
                onActiveGroupChange={setSavedActiveGroup}
                compact
              />
            </div>

            <PublicMapOrganizationsRailSection
              title="My Map"
              icon={
                <BookmarkIcon
                  className="text-muted-foreground h-4 w-4"
                  aria-hidden
                />
              }
              organizations={filteredSavedOrganizations}
              resources={filteredSavedResources}
              emptyTitle={
                unresolvedCollectedResourceCount > 0 && !hasSavedFilters
                  ? resourceItemsLoadStatus === "loading"
                    ? "Loading My Map"
                    : "Collected resources unavailable"
                  : hasSavedFilters
                    ? "No collected results"
                    : "Nothing collected yet"
              }
              emptyDescription={
                unresolvedCollectedResourceCount > 0 && !hasSavedFilters
                  ? resourceItemsLoadStatus === "loading"
                    ? "Your collected resources will appear here."
                    : (resourceItemsLoadError ??
                      "Try again to restore your collected resources.")
                  : hasSavedFilters
                    ? "Try a different search or category filter."
                    : "Collect nonprofits and resources to keep them here."
              }
              className="mx-2 min-h-0 flex-1 bg-transparent"
              onSelectOrganization={handleSelectOrganization}
              onSelectResource={handleSelectResource}
              onToggleFavorite={onToggleFavorite}
              onToggleCollectedResource={onToggleCollectedResource}
              removable
            />
            {unresolvedCollectedResourceCount > 0 ? (
              <div
                role="status"
                aria-live="polite"
                className="border-border/70 bg-background/80 text-muted-foreground mx-2 flex shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs"
              >
                <span className="min-w-0 break-words">
                  {resourceItemsLoadStatus === "loading"
                    ? "Loading collected resources…"
                    : (resourceItemsLoadError ??
                      "Some collected resources are temporarily unavailable.")}
                </span>
                {resourceItemsLoadStatus === "error" && onRetryResourceItems ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 shrink-0"
                    onClick={onRetryResourceItems}
                  >
                    Try again
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
