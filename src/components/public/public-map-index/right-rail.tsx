"use client"

import type { ReactNode } from "react"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { PublicMapDirectoryRailMode } from "./directory-rail"
import { PublicMapMemberRail } from "./member-rail"
import type { PublicMapResourceGuide } from "./resource-guides"
import { PublicMapSavedRail } from "./saved-rail"

export function PublicMapRightRail({
  isAuthenticated,
  directoryRail = null,
  directoryMode = null,
  guides = [],
  savedOrganizations,
  favorites,
  onGuideSelect,
  onSelectOrganization,
  onToggleFavorite,
}: {
  isAuthenticated: boolean
  directoryRail?: ReactNode
  directoryMode?: PublicMapDirectoryRailMode | null
  guides?: PublicMapResourceGuide[]
  savedOrganizations: PublicMapOrganization[]
  favorites: string[]
  onGuideSelect?: (guideId: string) => void
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
}) {
  return (
    <RightRailSlot priority={5}>
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {isAuthenticated ? (
          <PublicMapMemberRail
            directoryRail={directoryRail}
            directoryMode={directoryMode}
            guides={guides}
            savedOrganizations={savedOrganizations}
            onGuideSelect={onGuideSelect}
            onSelectOrganization={onSelectOrganization}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <PublicMapSavedRail
            savedOrganizations={savedOrganizations}
            favoritesCount={favorites.length}
            onSelectOrganization={onSelectOrganization}
            onToggleFavorite={onToggleFavorite}
          />
        )}
      </div>
    </RightRailSlot>
  )
}
