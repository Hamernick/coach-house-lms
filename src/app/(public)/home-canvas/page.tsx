import type { Metadata } from "next"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { PricingSurface } from "@/components/public/pricing-surface"

export const metadata: Metadata = {
  title: "Home Canvas Preview",
  description: "A homepage preview that mirrors the internal canvas and side navigation model.",
}

export const runtime = "nodejs"
export const revalidate = 86400

type HomeCanvasPreviewPageProps = {
  searchParams?: Promise<{ section?: string }>
}

export default async function HomeCanvasPreviewPage({ searchParams }: HomeCanvasPreviewPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const initialSection = typeof resolvedSearchParams?.section === "string" ? resolvedSearchParams.section : undefined

  return <HomeCanvasPreview initialSection={initialSection} pricingPanel={<PricingSurface embedded />} />
}
