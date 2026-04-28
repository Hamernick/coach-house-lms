import type { Metadata } from "next"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { PricingSurface } from "@/components/public/pricing-surface"
import { PublicMapIndex } from "@/components/public/public-map-index"
import { fetchPublicMapViewerState } from "@/features/find-map"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"

export const metadata: Metadata = {
  title: "Find organizations",
  description: "Search public organizations and programs on the Coach House map index.",
}

export const revalidate = 300

export default async function PublicFindPage() {
  const [organizations, viewerState] = await Promise.all([
    fetchPublicMapOrganizations(),
    fetchPublicMapViewerState(),
  ])
  const candidateTokens = [process.env.NEXT_PUBLIC_MAPBOX_TOKEN, process.env.MAPBOX_TOKEN]
  const publicToken = candidateTokens
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0 && value.startsWith("pk."))

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
