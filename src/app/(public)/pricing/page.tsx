import type { Metadata } from "next"

import { PricingSurface } from "@/components/public/pricing-surface"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for nonprofit founders and teams: start free, upgrade for seats, add the Accelerator when you're ready.",
}

export const runtime = "nodejs"
export const revalidate = 3600

type PricingPageProps = {
  searchParams?: Promise<{ embed?: string }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const isEmbedded = resolvedSearchParams?.embed === "1"

  return <PricingSurface embedded={isEmbedded} />
}
