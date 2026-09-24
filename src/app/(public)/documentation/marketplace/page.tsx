import type { Metadata } from "next"
import { MarketplacePage } from "@/features/nonprofit-documentation"

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

export default function NonprofitMarketplacePage() {
  return <MarketplacePage />
}
