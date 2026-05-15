"use client"

import type { ReactNode } from "react"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { PublicMapDirectoryRailMode } from "./directory-rail"
import { PublicMapMemberRail } from "./member-rail"
import { PublicMapSavedRail } from "./saved-rail"

export function PublicMapRightRail({
  isAuthenticated,
  directoryRail = null,
  directoryMode = null,
  savedOrganizations,
  favorites,
  onSelectOrganization,
  onToggleFavorite,
}: {
  isAuthenticated: boolean
  directoryRail?: ReactNode
  directoryMode?: PublicMapDirectoryRailMode | null
  savedOrganizations: PublicMapOrganization[]
  favorites: string[]
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
}) {
  return (
    <RightRailSlot priority={5}>
      <div className="flex min-h-full flex-col gap-4">
        {isAuthenticated ? (
          <PublicMapMemberRail
            directoryRail={directoryRail}
            directoryMode={directoryMode}
            savedOrganizations={savedOrganizations}
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
