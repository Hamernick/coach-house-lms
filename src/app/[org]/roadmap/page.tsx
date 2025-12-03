import { notFound } from "next/navigation"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { ShareButton } from "@/components/shared/share-button"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { RoadmapAnalyticsTracker } from "@/components/roadmap/public-roadmap-tracker"
import { RoadmapCtaButton } from "@/components/roadmap/public-roadmap-cta"

export const revalidate = 300

export default async function PublicRoadmapPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const slug = String(org)
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
  const sections = resolveRoadmapSections(profile).filter((section) => section.isPublic && section.content.trim().length > 0)

  const orgName = typeof profile["name"] === "string" && profile["name"].trim().length > 0 ? (profile["name"] as string) : "Coach House organization"
  const subtitle =
    typeof profile["tagline"] === "string" && profile["tagline"].trim().length > 0
      ? (profile["tagline"] as string)
      : "Strategic Roadmap"

  const shareUrl = `/org/${slug}/roadmap`

  return (
    <div className="min-h-screen bg-[color:var(--app-surface)]">
      <div className="absolute left-0 top-0 w-full p-4 text-right">
        <ShareButton url={shareUrl} title={`${orgName} · Roadmap`} />
        <PublicThemeToggle />
      </div>
      <article className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-4 pb-16 pt-24 sm:px-6 lg:px-10">
        <RoadmapHero orgName={orgName} subtitle={subtitle} />
        {sections.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
            <p className="text-lg font-semibold">Roadmap coming soon</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This organization has enabled their roadmap, but hasn&apos;t published any sections yet. Check back for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => {
              const rawUrl = typeof section.ctaUrl === "string" ? section.ctaUrl.trim() : ""
              const ctaHref =
                rawUrl.length > 0
                  ? rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
                    ? rawUrl
                    : `https://${rawUrl}`
                  : null
              return (
              <section
                key={section.id}
                id={section.slug}
                data-roadmap-section={section.slug}
                className="scroll-mt-32 rounded-3xl border border-border/50 bg-card/80 p-8 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Section</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">{section.title}</h2>
                <div
                  className="prose prose-lg mt-6 max-w-none text-foreground/90 dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                />
                {section.ctaLabel && ctaHref ? (
                  <div className="mt-6">
                    <RoadmapCtaButton orgSlug={slug} sectionSlug={section.slug} href={ctaHref} label={section.ctaLabel} />
                  </div>
                ) : null}
              </section>
            )})}
          </div>
        )}
        <RoadmapAnalyticsTracker
          orgSlug={slug}
          sections={sections.map((section) => ({ slug: section.slug, id: section.id }))}
        />
      </article>
    </div>
  )
}

function RoadmapHero({ orgName, subtitle }: { orgName: string; subtitle: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/50 shadow-lg">
      <div className="relative h-72 w-full">
        <NewsGradientThumb seed={orgName} className="h-full w-full" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-black/10 via-black/70 to-black/90 p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/80">Strategic Roadmap</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">{orgName}</h1>
          <p className="mt-2 text-base text-white/75">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
