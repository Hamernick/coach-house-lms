import type { Metadata } from "next"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { PricingSurface } from "@/components/public/pricing-surface"
import { PublicMapIndex } from "@/components/public/public-map-index"
import { readAppSidebarDefaultOpen } from "@/components/app-shell/sidebar-state-server"
import {
  AuthenticatedFindShell,
  fetchPublicMapViewerState,
} from "@/features/find-map"
import { updatePublicMapOrganizationCurationAction } from "@/actions/public-map-organization-curation"
import { updateResourceMapCanonicalStateAction } from "@/features/resource-map-admin"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"
import { resolveDashboardLayoutState } from "@/app/(dashboard)/_lib/dashboard-layout-state"
import { completeMemberMapOnboardingAction } from "@/app/(dashboard)/onboarding/actions"

const PUBLIC_RESOURCE_MAP_ITEMS_ENDPOINT = "/api/public/resource-map/items"

export const metadata: Metadata = {
  title: "Find organizations",
  description:
    "Search public organizations and programs on the Coach House map index.",
}

export const revalidate = 300

export default async function PublicFindPage() {
  const [organizations, viewerState] = await Promise.all([
    fetchPublicMapOrganizations(),
    fetchPublicMapViewerState(),
  ])
  const candidateTokens = [
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    process.env.MAPBOX_TOKEN,
  ]
  const publicToken = candidateTokens
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0 && value.startsWith("pk."))

  if (viewerState.viewer) {
    const [shellState, defaultSidebarOpen] = await Promise.all([
      resolveDashboardLayoutState(),
      readAppSidebarDefaultOpen(),
    ])
    if (shellState.userPresent) {
      const memberOnboardingIntent =
        shellState.onboardingIntentFocus === "find" ||
        shellState.onboardingIntentFocus === "fund" ||
        shellState.onboardingIntentFocus === "support"
          ? shellState.onboardingIntentFocus
          : null
      const memberOnboardingEnabled =
        shellState.onboardingLocked && memberOnboardingIntent !== null

      return (
        <AuthenticatedFindShell
          state={shellState}
          defaultSidebarOpen={defaultSidebarOpen}
        >
          <PublicMapIndex
            presentationMode="app-shell"
            organizations={organizations}
            resourceItemsEndpoint={PUBLIC_RESOURCE_MAP_ITEMS_ENDPOINT}
            mapboxToken={publicToken}
            viewer={viewerState.viewer}
            canManageResourceMap={shellState.isAdmin}
            organizationCurationAction={
              shellState.isAdmin
                ? updatePublicMapOrganizationCurationAction
                : undefined
            }
            resourceMapCurationAction={
              shellState.isAdmin
                ? updateResourceMapCanonicalStateAction
                : undefined
            }
            adminOnboardingPreview={
              shellState.isAdmin
                ? {
                    canToggle: true,
                    hasOrganizationSwitcher:
                      shellState.memberMapOnboarding.hasOrganizationSwitcher,
                  }
                : undefined
            }
            memberOnboarding={
              memberOnboardingEnabled
                ? {
                    enabled: true,
                    intentFocus: memberOnboardingIntent,
                    hasOrganizationSwitcher:
                      shellState.memberMapOnboarding.hasOrganizationSwitcher,
                    onComplete: completeMemberMapOnboardingAction,
                  }
                : undefined
            }
          />
        </AuthenticatedFindShell>
      )
    }
  }

  return (
    <HomeCanvasPreview
      initialSection="find"
      pricingPanel={<PricingSurface embedded />}
      findPanel={
        <div className="relative h-full">
          <PublicMapIndex
            organizations={organizations}
            resourceItemsEndpoint={PUBLIC_RESOURCE_MAP_ITEMS_ENDPOINT}
            mapboxToken={publicToken}
            viewer={viewerState.viewer}
          />
        </div>
      }
    />
  )
}
