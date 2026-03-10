import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"
import { HomeCanvasPreview } from "@/components/public/home-canvas-preview"
import { PricingSurface } from "@/components/public/pricing-surface"
import { PublicMapIndex } from "@/components/public/public-map-index"
import { PublicMapMemberOnboardingOverlay } from "@/components/public/public-map-index/member-onboarding-overlay"
import { fetchPublicMapViewerState } from "@/features/find-map"
import { fetchPublicMapOrganizations } from "@/lib/queries/public-map-index"

export const revalidate = 300

function normalizeSlug(value: string) {
  return value.trim().toLowerCase()
}

function resolvePublicOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"

  try {
    return new URL(configured).origin
  } catch {
    return "http://localhost:3000"
  }
}

function normalizeImageUrl(value: string | null | undefined, origin: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`
  return `https://${trimmed}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) {
    return {
      title: "Find organization",
      description: "Open an organization profile from the Coach House public map index.",
    }
  }

  const organizations = await fetchPublicMapOrganizations()
  const matched = organizations.find(
    (organization) =>
      typeof organization.publicSlug === "string" &&
      normalizeSlug(organization.publicSlug) === normalizedSlug,
  )

  if (!matched?.publicSlug) {
    return {
      title: "Find organization",
      description: "Open an organization profile from the Coach House public map index.",
    }
  }

  const origin = resolvePublicOrigin()
  const url = `${origin}/find/${encodeURIComponent(matched.publicSlug)}`
  const image =
    normalizeImageUrl(matched.logoUrl, origin) ??
    normalizeImageUrl(matched.headerUrl, origin)
  const description =
    matched.description?.trim() ||
    matched.tagline?.trim() ||
    "Discover this organization on the Coach House public map."

  return {
    title: matched.name,
    description,
    openGraph: {
      title: matched.name,
      description,
      url,
      type: "website",
      images: image ? [{ url: image, alt: `${matched.name} profile image` }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: matched.name,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function PublicFindOrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) return notFound()

  const [organizations, viewerState] = await Promise.all([
    fetchPublicMapOrganizations(),
    fetchPublicMapViewerState(),
  ])
  const matched = organizations.find(
    (organization) =>
      typeof organization.publicSlug === "string" &&
      normalizeSlug(organization.publicSlug) === normalizedSlug,
  )
  if (!matched?.publicSlug) {
    return notFound()
  }

  const candidateTokens = [process.env.NEXT_PUBLIC_MAPBOX_TOKEN, process.env.MAPBOX_TOKEN]
  const publicToken = candidateTokens
    .map((value) => value?.trim() ?? "")
    .find((value) => value.length > 0 && value.startsWith("pk."))

  return (
    <HomeCanvasPreview
      initialSection="find"
      pricingPanel={<PricingSurface embedded />}
      findPanel={
        <div className="relative h-full">
          <PublicMapIndex
            organizations={organizations}
            mapboxToken={publicToken}
            initialPublicSlug={matched.publicSlug}
            viewer={viewerState.viewer}
            joinedOrganizations={viewerState.joinedOrganizations}
            boardAlerts={viewerState.boardAlerts}
            memberProfile={viewerState.memberProfile}
          />
          {viewerState.needsMemberOnboarding && viewerState.onboardingDefaults ? (
            <PublicMapMemberOnboardingOverlay
              defaults={viewerState.onboardingDefaults}
              onSubmit={completeOnboardingAction}
            />
          ) : null}
        </div>
      }
    />
  )
}
