import type { Metadata } from "next"
import type { ReactNode } from "react"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { PricingSurface } from "@/components/public/pricing-surface"
import { PublicMapIndex } from "@/components/public/public-map-index"
import { AuthenticatedFindShell, fetchPublicMapViewerState } from "@/features/find-map"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"
import { resolveDashboardLayoutState } from "@/app/(dashboard)/_lib/dashboard-layout-state"

export const metadata: Metadata = {
  title: "Find organizations",
  description: "Search public organizations and programs on the Coach House map index.",
}

export const revalidate = 300

function FindMapFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100svh-8rem)] min-h-[34rem] w-full min-w-0 flex-1 overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm sm:h-[calc(100svh-8.5rem)] md:min-h-[36rem]">
      {children}
    </div>
  )
}

export default async function PublicFindPage() {
  const [organizations, viewerState] = await Promise.all([
    fetchPublicMapOrganizations(),
    fetchPublicMapViewerState(),
  ])
  const candidateTokens = [process.env.NEXT_PUBLIC_MAPBOX_TOKEN, process.env.MAPBOX_TOKEN]
  const publicToken = candidateTokens
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0 && value.startsWith("pk."))

  if (viewerState.viewer) {
    const shellState = await resolveDashboardLayoutState()
    if (shellState.userPresent) {
      return (
        <AuthenticatedFindShell state={shellState}>
          <FindMapFrame>
            <PublicMapIndex
              presentationMode="app-shell"
              organizations={organizations}
              mapboxToken={publicToken}
              viewer={viewerState.viewer}
              joinedOrganizations={viewerState.joinedOrganizations}
              boardAlerts={viewerState.boardAlerts}
              memberProfile={viewerState.memberProfile}
            />
          </FindMapFrame>
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
            mapboxToken={publicToken}
            viewer={viewerState.viewer}
            joinedOrganizations={viewerState.joinedOrganizations}
            boardAlerts={viewerState.boardAlerts}
            memberProfile={viewerState.memberProfile}
          />
        </div>
      }
    />
  )
}
