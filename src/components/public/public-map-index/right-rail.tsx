"use client"

import { RightRailSlot } from "@/components/app-shell/right-rail"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { PublicMapMemberProfileCard, type PublicMapMemberProfile } from "./member-profile-card"
import {
  PublicMapBoardAlert,
  PublicMapJoinedOrganization,
  PublicMapMemberRail,
} from "./member-rail"
import { PublicMapSavedRail } from "./saved-rail"

export function PublicMapRightRail({
  isAuthenticated,
  memberProfile,
  savedOrganizations,
  favorites,
  recentOrganizations,
  joinedOrganizations,
  boardAlerts,
  onSelectOrganization,
  onToggleFavorite,
}: {
  isAuthenticated: boolean
  memberProfile: PublicMapMemberProfile | null
  savedOrganizations: PublicMapOrganization[]
  favorites: string[]
  recentOrganizations: PublicMapOrganization[]
  joinedOrganizations: PublicMapJoinedOrganization[]
  boardAlerts: PublicMapBoardAlert[]
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
}) {
  return (
    <RightRailSlot priority={5}>
      <div className="flex min-h-full flex-col gap-4">
        {isAuthenticated && memberProfile ? (
          <PublicMapMemberProfileCard profile={memberProfile} />
        ) : null}
        {isAuthenticated ? (
          <PublicMapMemberRail
            savedOrganizations={savedOrganizations}
            recentOrganizations={recentOrganizations}
            joinedOrganizations={joinedOrganizations}
            boardAlerts={boardAlerts}
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
