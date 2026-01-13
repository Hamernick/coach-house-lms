import { notFound } from "next/navigation"

import { PublicRoadmapPresentation } from "@/components/roadmap/public-roadmap-presentation"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { ROADMAP_SECTION_IDS, resolveRoadmapSections } from "@/lib/roadmap"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { RoadmapAnalyticsTracker } from "@/components/roadmap/public-roadmap-tracker"
import { publicSharingEnabled } from "@/lib/feature-flags"

export const revalidate = 300

export default async function PublicRoadmapPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const slug = String(org)
  if (!publicSharingEnabled) return notFound()
  const admin = createSupabaseAdminClient()

  const { data: orgRow } = await admin
    .from("organizations")
    .select("user_id, profile, public_slug, is_public_roadmap, is_public, ein")
    .ilike("public_slug", slug)
    .eq("is_public_roadmap", true)
    .maybeSingle<{
      user_id: string
      public_slug: string | null
      is_public_roadmap: boolean | null
      is_public: boolean | null
      profile: Record<string, unknown> | null
      ein: string | null
    }>()

  if (!orgRow) {
    return notFound()
  }

  const profile = (orgRow.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile).filter((section) => {
    if (section.content.trim().length > 0) return true
    if (section.imageUrl) return true
    const title = section.title.trim()
    const subtitle = (section.subtitle ?? "").trim()
    const hasUserTitle = !section.titleIsTemplate && title.length > 0
    const hasUserSubtitle = !section.subtitleIsTemplate && subtitle.length > 0
    return hasUserTitle || hasUserSubtitle
  })

  const orgName = typeof profile["name"] === "string" && profile["name"].trim().length > 0 ? (profile["name"] as string) : "Coach House organization"
  const subtitle =
    typeof profile["tagline"] === "string" && profile["tagline"].trim().length > 0
      ? (profile["tagline"] as string)
      : "Strategic Roadmap"
  const logoUrl = typeof profile["logoUrl"] === "string" ? (profile["logoUrl"] as string).trim() : ""

  const shareUrl = `/${slug}/roadmap`
  const slideSections = sections.map((section) => ({
    id: section.id,
    slug: section.slug,
    eyebrow: ROADMAP_SECTION_IDS.includes(section.id) ? section.templateTitle : null,
    title: section.titleIsTemplate || section.title.trim() === section.templateTitle.trim() ? "" : section.title,
    subtitle:
      section.subtitleIsTemplate ||
      (section.subtitle ?? "").trim() === section.templateSubtitle.trim()
        ? null
        : (section.subtitle ?? null),
    imageUrl: section.imageUrl ?? null,
    contentHtml: sanitizeHtml(section.content),
    ctaLabel: section.ctaLabel ?? null,
    ctaUrl: section.ctaUrl ?? null,
  }))

  return (
    <div className="min-h-screen">
      {slideSections.length === 0 ? (
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-12">
          <p className="text-lg font-semibold">Roadmap coming soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This organization has enabled their roadmap, but hasn&apos;t published any sections yet. Check back for updates.
          </p>
        </div>
      ) : (
        <>
          <PublicRoadmapPresentation
            orgName={orgName}
            subtitle={subtitle}
            orgSlug={slug}
            logoUrl={logoUrl}
            shareUrl={shareUrl}
            sections={slideSections}
          />
          <RoadmapAnalyticsTracker
            orgSlug={slug}
            sections={sections.map((section) => ({ slug: section.slug, id: section.id }))}
          />
        </>
      )}
    </div>
  )
}
