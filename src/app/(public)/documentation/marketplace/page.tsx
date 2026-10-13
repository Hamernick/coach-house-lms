import type { Metadata } from "next"
import { MarketplacePage } from "@/features/nonprofit-documentation"
import { fetchPublicPeopleDirectory } from "@/lib/queries/public-people"

const DESCRIPTION =
  "Nonprofit tools, software offers, resource banks, and coaches, with practical guides to getting started."
export const metadata: Metadata = {
  title: "Nonprofit Marketplace: tools, resources, and people",
  description: DESCRIPTION,
  alternates: { canonical: "/documentation/marketplace" },
  openGraph: {
    title: "Nonprofit Marketplace",
    description: DESCRIPTION,
    type: "website",
    url: "https://coachhouse.app/documentation/marketplace",
  },
}

type SearchParams = Record<string, string | string[] | undefined>
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function NonprofitMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const view = first(params.view) === "people" ? "people" : "resources"
  const peopleDirectory =
    view === "people"
      ? await fetchPublicPeopleDirectory(Number(first(params.peoplePage) ?? 1))
      : { status: "ready" as const, people: [], hasMore: false, page: 1 }
  return <MarketplacePage view={view} peopleDirectory={peopleDirectory} />
}
