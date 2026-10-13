import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { resolvePublicAuthCallbackHref } from "@/components/public/public-auth-callback"
import { PricingSurface } from "@/components/public/pricing-surface"

export const metadata: Metadata = {
  title: "Home Canvas Preview",
  description: "A homepage preview that mirrors the internal canvas and side navigation model.",
}

export const runtime = "nodejs"
export const revalidate = 86400

type HomeCanvasPreviewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomeCanvasPreviewPage({ searchParams }: HomeCanvasPreviewPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const searchParamsObject = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
    if (typeof value === "string") {
      searchParamsObject.set(key, value)
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParamsObject.append(key, item)
      }
    }
  }
  const authCallbackHref = resolvePublicAuthCallbackHref({
    pathname: "/home-canvas",
    searchParams: searchParamsObject,
  })
  if (authCallbackHref) {
    redirect(authCallbackHref)
  }
  const initialSection = typeof resolvedSearchParams?.section === "string" ? resolvedSearchParams.section : undefined

  return <HomeCanvasPreview initialSection={initialSection} pricingPanel={<PricingSurface embedded />} />
}
