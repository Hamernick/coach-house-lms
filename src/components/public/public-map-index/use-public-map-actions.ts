"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { RECENT_ORGANIZATIONS_LIMIT } from "./constants"
import { organizationHasMapLocation } from "./helpers"
import { buildMapHref, normalizeSlug } from "./map-view-helpers"

export function applyPublicMapOrganizationSelection({
  organizationById,
  organizationId,
  openDetails = false,
  shouldFocusMap = true,
  setSelectedOrgId,
  setSidebarMode,
  setCameraTargetOrgId,
  setRecentOrganizationIds,
}: {
  organizationById: Map<string, PublicMapOrganization>
  organizationId: string
  openDetails?: boolean
  shouldFocusMap?: boolean
  setSelectedOrgId: (organizationId: string) => void
  setSidebarMode: (mode: "search" | "details" | "hidden") => void
  setCameraTargetOrgId: (organizationId: string) => void
  setRecentOrganizationIds: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const organization = organizationById.get(organizationId)
  if (!organization) return

  setSelectedOrgId(organizationId)
  if (openDetails) {
    setSidebarMode("details")
  }
  if (shouldFocusMap && organizationHasMapLocation(organization)) {
    setCameraTargetOrgId(organizationId)
  }
  setRecentOrganizationIds((current) => {
    const next = [organizationId, ...current.filter((entry) => entry !== organizationId)]
    return next.slice(0, RECENT_ORGANIZATIONS_LIMIT)
  })
}

export function usePublicMapActions({
  organizationById,
  isAuthenticated,
  searchParams,
  initialPublicSlug,
  selectedOrganization,
  pendingAuthOrgId,
  setSelectedOrgId,
  setSidebarMode,
  setCameraTargetOrgId,
  setRecentOrganizationIds,
  setPendingAuthOrgId,
  setAuthSheetOpen,
  setFavorites,
}: {
  organizationById: Map<string, PublicMapOrganization>
  isAuthenticated: boolean
  searchParams: ReturnType<typeof useSearchParams>
  initialPublicSlug?: string
  selectedOrganization: PublicMapOrganization | null
  pendingAuthOrgId: string | null
  setSelectedOrgId: (organizationId: string) => void
  setSidebarMode: (mode: "search" | "details" | "hidden") => void
  setCameraTargetOrgId: (organizationId: string) => void
  setRecentOrganizationIds: React.Dispatch<React.SetStateAction<string[]>>
  setPendingAuthOrgId: (organizationId: string) => void
  setAuthSheetOpen: (open: boolean) => void
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const handleSelectOrganization = ({
    organizationId,
    openDetails = false,
    shouldFocusMap = true,
  }: {
    organizationId: string
    openDetails?: boolean
    shouldFocusMap?: boolean
  }) => {
    applyPublicMapOrganizationSelection({
      organizationById,
      organizationId,
      openDetails,
      shouldFocusMap,
      setSelectedOrgId,
      setSidebarMode,
      setCameraTargetOrgId,
      setRecentOrganizationIds,
    })
  }

  const toggleFavorite = (organizationId: string) => {
    if (!isAuthenticated) {
      setPendingAuthOrgId(organizationId)
      setAuthSheetOpen(true)
      return
    }

    setFavorites((current) => {
      if (current.includes(organizationId)) {
        return current.filter((entry) => entry !== organizationId)
      }
      return [organizationId, ...current].slice(0, 120)
    })
  }

  const authRedirectTo = useMemo(() => {
    const baseRedirectParams = new URLSearchParams(searchParams.toString())
    if (pendingAuthOrgId) {
      baseRedirectParams.set("auth_action", "save")
      baseRedirectParams.set("auth_org", pendingAuthOrgId)
      baseRedirectParams.set("member_onboarding", "1")
    }

    return buildMapHref({
      slug:
        normalizeSlug(initialPublicSlug) || normalizeSlug(selectedOrganization?.publicSlug)
          ? selectedOrganization?.publicSlug ?? initialPublicSlug
          : null,
      searchParams: baseRedirectParams,
    })
  }, [initialPublicSlug, pendingAuthOrgId, searchParams, selectedOrganization?.publicSlug])

  return { authRedirectTo, handleSelectOrganization, toggleFavorite }
}
