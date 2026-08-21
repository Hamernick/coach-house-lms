"use client"

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react"
import type mapboxgl from "mapbox-gl"

import type {
  ExternalResourceMapItem,
  PublicMapItem,
} from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import { organizationHasMapLocation } from "./helpers"
import { focusOrganizationOnMap } from "./map-view-helpers"
import {
  usePublicMapCollectedResources,
  usePublicMapSavedOrganizations,
} from "./map-items-state"
import { usePublicMapMemberOnboardingMapOverlay } from "./member-onboarding-preview-controls"
import type { PublicMapIndexProps } from "./public-map-index-types"

export function useFocusPublicMapCameraTarget(
  mapRef: RefObject<mapboxgl.Map | null>,
  cameraTarget: { organizationId: string; requestId: number } | null,
  organizationById: Map<string, PublicMapOrganization>
) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !cameraTarget) return
    const organization = organizationById.get(cameraTarget.organizationId)
    if (!organization || !organizationHasMapLocation(organization)) return
    focusOrganizationOnMap({ map, organization })
  }, [cameraTarget, mapRef, organizationById])
}

export function useSelectedPublicMapResource(
  itemById: Map<string, PublicMapItem>,
  selectedItemId: string | null
) {
  return useMemo((): ExternalResourceMapItem | null => {
    if (!selectedItemId) return null
    const item = itemById.get(selectedItemId)
    return item?.itemType === "external_resource" ? item : null
  }, [itemById, selectedItemId])
}

export function usePublicMapSavedItems({
  collectedResourceIds,
  favorites,
  organizationById,
  resourceItems,
  retainMissingResources,
  setCollectedResourceIds,
}: {
  collectedResourceIds: string[]
  favorites: string[]
  organizationById: Map<string, PublicMapOrganization>
  resourceItems: ExternalResourceMapItem[]
  retainMissingResources: boolean
  setCollectedResourceIds: Dispatch<SetStateAction<string[]>>
}) {
  const savedOrganizations = usePublicMapSavedOrganizations({
    favorites,
    organizationById,
  })
  const collectedState = usePublicMapCollectedResources({
    collectedResourceIds,
    resourceItems,
    retainMissingResources,
    setCollectedResourceIds,
  })
  return { savedOrganizations, ...collectedState }
}

export function usePublicMapOnboardingState(
  isAuthenticated: boolean,
  memberOnboarding: PublicMapIndexProps["memberOnboarding"],
  adminOnboardingPreview: PublicMapIndexProps["adminOnboardingPreview"]
) {
  return usePublicMapMemberOnboardingMapOverlay({
    isAuthenticated,
    memberOnboarding,
    adminOnboardingPreview,
  })
}

export function useInitialSidebarMode(publicSlug: string | null | undefined) {
  return useState<SidebarMode>(publicSlug ? "details" : "search")
}
