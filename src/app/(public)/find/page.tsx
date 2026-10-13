import type { Metadata } from "next"

import { PublicMapIndex } from "@/components/public/public-map-index"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"

export const metadata: Metadata = {
  title: "Find organizations",
  description: "Search public organizations and programs on the Coach House map index.",
}

export const revalidate = 300

export default async function PublicFindPage() {
  const organizations = await fetchPublicMapOrganizations()

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Discovery</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Find public organizations</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Explore publicly shared organizations, preview their active programs, and open full public profiles.
        </p>
      </div>
      <PublicMapIndex organizations={organizations} />
    </main>
  )
}
