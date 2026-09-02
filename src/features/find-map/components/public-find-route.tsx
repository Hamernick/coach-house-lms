import { redirect } from "next/navigation"

import { updatePublicMapOrganizationCurationAction } from "@/actions/public-map-organization-curation"
import { completeMemberMapOnboardingAction } from "@/actions/member-map-onboarding"
import { resolveDashboardLayoutState } from "@/components/app-shell/dashboard-layout-state"
import { readAppSidebarDefaultOpen } from "@/components/app-shell/sidebar-state-server"
import { resolvePublicAuthCallbackHref } from "@/components/public/public-auth-callback"
import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import { PublicMapIndex } from "@/components/public/public-map-index"
import { updateResourceMapCanonicalStateAction } from "@/features/resource-map-admin"
import { FIND_ORGANIZATION_QUERY_KEY, FIND_PATH } from "@/lib/find/routes"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"

import { fetchPublicMapViewerState } from "../viewer-state"
import { AuthenticatedFindShell } from "./authenticated-find-shell"

const PUBLIC_RESOURCE_MAP_ITEMS_ENDPOINT =
  "/api/public/resource-map/index?limit=200"

export type PublicFindRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstString(value: string | string[] | undefined) {
  if (typeof value === "string") return value
  return Array.isArray(value) ? value[0] : undefined
}

export async function PublicFindRoute({
  searchParams,
}: PublicFindRouteProps = {}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const callbackParams = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
    if (typeof value === "string") callbackParams.set(key, value)
    if (Array.isArray(value)) {
      for (const item of value) callbackParams.append(key, item)
    }
  }
  const authCallbackHref = resolvePublicAuthCallbackHref({
    pathname: FIND_PATH,
    searchParams: callbackParams,
  })
  if (authCallbackHref) redirect(authCallbackHref)

  const requestedPublicSlug = firstString(
    resolvedSearchParams?.[FIND_ORGANIZATION_QUERY_KEY]
  )
    ?.trim()
    .toLowerCase()
  const [organizations, viewerState] = await Promise.all([
    fetchPublicMapOrganizations(),
    fetchPublicMapViewerState(),
  ])
  const initialPublicSlug = requestedPublicSlug
    ? (organizations.find(
        (organization) =>
          organization.publicSlug?.trim().toLowerCase() === requestedPublicSlug
      )?.publicSlug ?? undefined)
    : undefined
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
          organizationDetail={Boolean(initialPublicSlug)}
        >
          <PublicMapIndex
            presentationMode="app-shell"
            organizations={organizations}
            resourceItemsEndpoint={PUBLIC_RESOURCE_MAP_ITEMS_ENDPOINT}
            mapboxToken={publicToken}
            initialPublicSlug={initialPublicSlug}
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
    <HomeCanvasFindShell>
      <div className="relative h-full">
        <PublicMapIndex
          organizations={organizations}
          resourceItemsEndpoint={PUBLIC_RESOURCE_MAP_ITEMS_ENDPOINT}
          mapboxToken={publicToken}
          initialPublicSlug={initialPublicSlug}
          viewer={viewerState.viewer}
        />
      </div>
    </HomeCanvasFindShell>
  )
}
