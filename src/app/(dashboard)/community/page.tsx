import { Suspense } from "react"

import { fetchCommunityOrganizations } from "@/lib/queries/community"
import { CommunityMap } from "@/components/community/community-map"
import { CommunityMapSkeleton } from "@/components/community/community-map-skeleton"
import { CommunityOrganizationList } from "@/components/community/community-organization-list"
import { Separator } from "@/components/ui/separator"
import { requireServerSession } from "@/lib/auth"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { getMapboxToken } from "@/lib/mapbox/token"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function CommunityPage() {
  if (!publicSharingEnabled) {
    await requireServerSession("/community")
  }
  const organizations = await fetchCommunityOrganizations()
  const mapboxToken = getMapboxToken()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Community</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Resource Map</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Explore the global network of nonprofits partnering with Coach House. Each marker represents an organization actively investing in their community.
          </p>
        </div>
        <Suspense fallback={<CommunityMapSkeleton />}>
          <CommunityMap organizations={organizations} mapboxToken={mapboxToken} />
        </Suspense>
      </section>

      <section className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Organizations</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Every nonprofit listed here has completed our training and published their public profile.
          </p>
        </div>
        <Separator />
        <CommunityOrganizationList organizations={organizations} />
      </section>
    </div>
  )
}
