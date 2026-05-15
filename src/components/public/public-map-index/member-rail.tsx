"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"

import type { PublicMapDirectoryRailMode } from "./directory-rail"
import { PublicMapOrganizationsRailSection } from "./member-rail-organization-section"

const PUBLIC_MAP_MEMBER_TABS_LIST_CLASSNAME =
  "grid w-full gap-1 rounded-full border border-border/70 bg-background/70 p-1"

const PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME =
  "min-w-0 rounded-full border border-transparent px-1.5 py-1.5 text-[11px] text-muted-foreground transition-[color,background-color,border-color,box-shadow] data-[state=active]:border-border/70 data-[state=active]:bg-muted/55 data-[state=active]:text-foreground data-[state=active]:shadow-sm"

type PublicMapMemberRailProps = {
  directoryRail?: ReactNode
  directoryMode?: PublicMapDirectoryRailMode | null
  savedOrganizations: PublicMapOrganization[]
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
}

export function PublicMapMemberRail({
  directoryRail = null,
  directoryMode = null,
  savedOrganizations,
  onSelectOrganization,
  onToggleFavorite,
}: PublicMapMemberRailProps) {
  const hasDirectoryRail = Boolean(directoryRail)
  const defaultTab = hasDirectoryRail ? "directory" : "saved"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const previousHasDirectoryRailRef = useRef(hasDirectoryRail)
  const tabsListClassName = useMemo(
    () =>
      cn(
        PUBLIC_MAP_MEMBER_TABS_LIST_CLASSNAME,
        hasDirectoryRail ? "grid-cols-2" : "grid-cols-1",
      ),
    [hasDirectoryRail],
  )

  useEffect(() => {
    const didAddDirectoryRail = hasDirectoryRail && !previousHasDirectoryRailRef.current
    previousHasDirectoryRailRef.current = hasDirectoryRail

    if (!hasDirectoryRail) {
      setActiveTab("saved")
      return
    }
    if (didAddDirectoryRail || directoryMode === "details") {
      setActiveTab("directory")
    }
  }, [directoryMode, hasDirectoryRail])

  const handleSelectOrganization = (organizationId: string) => {
    onSelectOrganization(organizationId)
    if (hasDirectoryRail) {
      setActiveTab("directory")
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-3">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-full flex-col gap-3"
      >
        <TabsList className={tabsListClassName}>
          {hasDirectoryRail ? (
            <TabsTrigger
              value="directory"
              className={PUBLIC_MAP_MEMBER_TAB_TRIGGER_CLASSNAME}
            >
              <span className="truncate">Find</span>
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
          <TabsContent value="directory" className="mt-0 min-h-0 flex-1">
            {directoryRail}
          </TabsContent>
        ) : null}

        <TabsContent value="saved" className="mt-0 min-h-0 flex-1">
          <PublicMapOrganizationsRailSection
            title="Saved organizations"
            icon={<BookmarkIcon className="h-4 w-4 text-muted-foreground" aria-hidden />}
            organizations={savedOrganizations}
            emptyTitle="No saved organizations yet"
            emptyDescription="Tap the heart on any organization to keep it here."
            onSelectOrganization={handleSelectOrganization}
            onToggleFavorite={onToggleFavorite}
            removable
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
