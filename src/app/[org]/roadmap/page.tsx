import { notFound } from "next/navigation"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { PublicOrgBodyBackground } from "@/components/organization/public-org-body-background"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { ShareButton } from "@/components/shared/share-button"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { resolveRoadmapHeroUrl, resolveRoadmapSections } from "@/lib/roadmap"
import { sanitizeHtml } from "@/lib/markdown/sanitize"
import { RoadmapAnalyticsTracker } from "@/components/roadmap/public-roadmap-tracker"
import { RoadmapCtaButton } from "@/components/roadmap/public-roadmap-cta"
import { publicSharingEnabled } from "@/lib/feature-flags"
import Image from "next/image"

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
  const sections = resolveRoadmapSections(profile).filter((section) => section.isPublic && section.content.trim().length > 0)
  const heroUrl = resolveRoadmapHeroUrl(profile)

  const orgName = typeof profile["name"] === "string" && profile["name"].trim().length > 0 ? (profile["name"] as string) : "Coach House organization"
  const subtitle =
    typeof profile["tagline"] === "string" && profile["tagline"].trim().length > 0
      ? (profile["tagline"] as string)
      : "Strategic Roadmap"

  const shareUrl = `/${slug}/roadmap`

  return (
    <div className="min-h-screen bg-dot-grid" data-public-grid>
      <PublicOrgBodyBackground />
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-2 sm:mb-6 sm:justify-start">
          <ShareButton url={shareUrl} title={`${orgName} · Roadmap`} icon="link" />
          <PublicThemeToggle />
        </div>

        <article className="flex w-full flex-col gap-8 sm:gap-12">
          <RoadmapHero orgName={orgName} subtitle={subtitle} heroUrl={heroUrl} />
          {sections.length === 0 ? (
            <div className="w-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm sm:rounded-3xl sm:p-8">
              <p className="text-lg font-semibold">Roadmap coming soon</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This organization has enabled their roadmap, but hasn&apos;t published any sections yet. Check back for updates.
              </p>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm sm:rounded-3xl sm:p-8">
              <ol className="relative space-y-8 before:absolute before:inset-y-0 before:left-2.5 before:z-0 before:w-px before:bg-gradient-to-b before:from-border/0 before:via-border/70 before:to-border/0 before:content-[''] sm:space-y-10 sm:before:left-3">
                {sections.map((section, index) => {
                  const rawUrl = typeof section.ctaUrl === "string" ? section.ctaUrl.trim() : ""
                  const ctaHref =
                    rawUrl.length > 0
                      ? rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
                        ? rawUrl
                        : `https://${rawUrl}`
                      : null

                  return (
                    <li key={section.id} className="relative z-10 pl-8 sm:pl-10">
                      <span
                        className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border/70 bg-card text-[10px] font-semibold tabular-nums text-muted-foreground sm:h-6 sm:w-6 sm:text-[11px]"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <section id={section.slug} data-roadmap-section={section.slug} className="scroll-mt-32">
                        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{section.title}</h2>
                        {section.subtitle ? (
                          <p className="mt-2 text-sm text-muted-foreground">{section.subtitle}</p>
                        ) : null}
                        <div
                          className="prose prose-base mt-6 max-w-none text-foreground/90 dark:prose-invert sm:prose-lg"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                        />
                        {section.ctaLabel && ctaHref ? (
                          <div className="mt-6">
                            <RoadmapCtaButton
                              orgSlug={slug}
                              sectionSlug={section.slug}
                              href={ctaHref}
                              label={section.ctaLabel}
                            />
                          </div>
                        ) : null}
                      </section>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
          <RoadmapAnalyticsTracker
            orgSlug={slug}
            sections={sections.map((section) => ({ slug: section.slug, id: section.id }))}
          />
        </article>
      </div>
    </div>
  )
}

function RoadmapHero({ orgName, subtitle, heroUrl }: { orgName: string; subtitle: string; heroUrl: string | null }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 shadow-lg sm:rounded-3xl">
      <div className="relative h-56 w-full sm:h-72">
        {heroUrl ? <Image src={heroUrl} alt="" fill className="object-cover" sizes="100vw" /> : null}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: heroUrl
              ? undefined
              : "linear-gradient(to bottom right,#fcc5e4,#fda34b,#ff7882,#c8699e,#7046aa,#0c1db8,#020f75)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-black/10 via-black/70 to-black/90 p-4 text-white sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80 sm:text-xs">Strategic Roadmap</p>
          <h1 className="mt-3 break-words text-3xl font-semibold leading-tight text-white sm:text-4xl">{orgName}</h1>
          <p className="mt-2 text-sm text-white/75 sm:text-base">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}
