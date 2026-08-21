"use client"

import type { PublicMapSidebarProps } from "./sidebar-contract"
import {
  OrganizationDetailBackButton,
  OrganizationDetailHeaderActions,
} from "./organization-detail-shell-sections"

export function buildOrganizationDetailHeaderSlots({
  active,
  canManageResourceMap,
  favorites,
  onBack,
  onToggleFavorite,
  organization,
  organizationCurationAction,
}: {
  active: boolean
  canManageResourceMap: boolean
  favorites: string[]
  onBack: PublicMapSidebarProps["onBackToSearch"]
  onToggleFavorite: PublicMapSidebarProps["toggleFavorite"]
  organization: PublicMapSidebarProps["selectedOrganization"]
  organizationCurationAction: PublicMapSidebarProps["organizationCurationAction"]
}) {
  if (!active || !organization) return { end: null, start: null }

  return {
    start: <OrganizationDetailBackButton onBack={onBack} />,
    end: (
      <OrganizationDetailHeaderActions
        canManageResourceMap={canManageResourceMap}
        organizationCurationAction={organizationCurationAction}
        organization={organization}
        favorites={favorites}
        onBack={onBack}
        onToggleFavorite={onToggleFavorite}
      />
    ),
  }
}
