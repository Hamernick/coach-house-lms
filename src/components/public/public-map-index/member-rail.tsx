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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
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

const PUBLIC_MAP_MEMBER_TABS_LIST_CLASSNAME =
  "mx-auto h-7 w-fit max-w-full min-w-0 justify-center gap-0 self-center p-0"

const PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME =
  "h-7 min-w-0 flex-none rounded-none bg-transparent px-2 py-1 text-center text-xs leading-none text-muted-foreground shadow-none transition-[color] after:pointer-events-none hover:bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:!bg-transparent [html.light_&]:!text-zinc-700 [html.light_&]:hover:!text-zinc-950 [html.light_&]:data-[state=active]:!text-zinc-950"

type PublicMapMemberRailProps = {
  activeTab?: PublicMapMemberTab
  directoryRail?: ReactNode
  directoryMode?: PublicMapDirectoryRailMode | null
  guides?: PublicMapResourceGuide[]
  savedOrganizations: PublicMapOrganization[]
  onActiveTabChange?: (tab: PublicMapMemberTab) => void
  onGuideSelect?: (guideId: string) => void
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
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
  directoryRail = null,
  directoryMode = null,
  guides = [],
  savedOrganizations,
  onActiveTabChange,
  onGuideSelect,
  onSelectOrganization,
  onToggleFavorite,
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
    () => savedOrganizations.map(buildPlatformOrganizationMapItem),
    [savedOrganizations]
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
  const hasSavedFilters =
    savedQuery.trim().length > 0 || savedActiveGroup !== "all"

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
            <span className="truncate">Saved</span>
          </TabsTrigger>
        </TabsList>

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
              title="Saved organizations"
              icon={
                <BookmarkIcon
                  className="text-muted-foreground h-4 w-4"
                  aria-hidden
                />
              }
              organizations={filteredSavedOrganizations}
              emptyTitle={
                hasSavedFilters
                  ? "No saved results"
                  : "No saved organizations yet"
              }
              emptyDescription={
                hasSavedFilters
                  ? "Try a different search or category filter."
                  : "Tap the heart on any organization to keep it here."
              }
              className="mx-2 min-h-0 flex-1 bg-transparent"
              onSelectOrganization={handleSelectOrganization}
              onToggleFavorite={onToggleFavorite}
              removable
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
