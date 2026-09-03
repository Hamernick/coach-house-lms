import type { Metadata } from "next"

import {
  MarketplacePage,
  projectMarketplaceCommunityProfiles,
  sanitizeMarketplaceFilters,
} from "@/features/nonprofit-documentation"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"

const DESCRIPTION =
  "A source-backed directory of U.S. nonprofit software, discounts, funding resources, learning, coaching, and professional support."

export const metadata: Metadata = {
  title: "Nonprofit software, discounts, funding, and support marketplace",
  description: DESCRIPTION,
  alternates: { canonical: "/documentation/marketplace" },
  openGraph: {
    title: "Nonprofit Marketplace",
    description: DESCRIPTION,
    type: "website",
    url: "https://coachhouse.app/documentation/marketplace",
  },
}

type MarketplaceSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function loadCommunityProfiles() {
  try {
    const organizations = await fetchPublicMapOrganizations()
    return projectMarketplaceCommunityProfiles(organizations)
  } catch (error) {
    console.error("[documentation-marketplace] public profiles unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    })
    return []
  }
}

export default async function NonprofitMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceSearchParams>
}) {
  const [params, communityProfiles] = await Promise.all([
    searchParams,
    loadCommunityProfiles(),
  ])
  const initialFilters = sanitizeMarketplaceFilters({
    query: first(params.q),
    type: first(params.type),
    function: first(params.function),
    stage: first(params.stage),
    cost: first(params.cost),
  })

  return (
    <MarketplacePage
      communityProfiles={communityProfiles}
      initialFilters={initialFilters}
    />
  )
}
