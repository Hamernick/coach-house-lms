import type { Metadata } from "next"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { PricingSurface } from "@/components/public/pricing-surface"

export const metadata: Metadata = {
  title: {
    absolute: "Coach House",
  },
  description: "A nonprofit platform for formation, planning, and public-ready storytelling.",
}

export const runtime = "nodejs"
export const revalidate = 86400

type LandingPageProps = {
  searchParams?: Promise<{ section?: string }>
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const initialSection = typeof resolvedSearchParams?.section === "string" ? resolvedSearchParams.section : undefined

  return <HomeCanvasPreview initialSection={initialSection} pricingPanel={<PricingSurface embedded />} />
}
