import { Suspense } from "react"

import { fetchCommunityOrganizations } from "@/lib/queries/community"
import { CommunityMap } from "@/components/community/community-map"
import { CommunityMapSkeleton } from "@/components/community/community-map-skeleton"
import { CommunityOrganizationList } from "@/components/community/community-organization-list"
import { CommunityHeader } from "@/components/community/community-header"
import { Separator } from "@/components/ui/separator"

export const runtime = "nodejs"
export const revalidate = 120

export default async function CommunityPage() {
  const organizations = await fetchCommunityOrganizations()

  return (
    <div className="min-h-screen bg-background">
      <CommunityHeader />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 pb-16 sm:px-6">
        <section className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Resource Map</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Explore the global network of nonprofits partnering with Coach House. Each marker represents an organization actively investing in their community.
            </p>
          </div>
          <Suspense fallback={<CommunityMapSkeleton />}>
            <CommunityMap organizations={organizations} />
          </Suspense>
        </section>

        <section className="space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Organizations</h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Every nonprofit listed here has completed our training and published their public profile.
            </p>
          </div>
          <Separator />
          <CommunityOrganizationList organizations={organizations} />
        </section>
      </div>
    </div>
  )
}
