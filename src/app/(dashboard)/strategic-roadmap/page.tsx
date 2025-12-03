import { redirect } from "next/navigation"

import { NewsGradientThumb } from "@/components/news/gradient-thumb"
import { RoadmapSectionEditor } from "@/components/roadmap/roadmap-section-editor"
import { RoadmapVisibilityToggle } from "@/components/roadmap/roadmap-visibility-toggle"
import { Badge } from "@/components/ui/badge"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveRoadmapSections } from "@/lib/roadmap"

export const dynamic = "force-dynamic"

export default async function StrategicRoadmapPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/login?redirect=/strategic-roadmap")
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile, public_slug, is_public_roadmap")
    .eq("user_id", user.id)
    .maybeSingle<{
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public_roadmap: boolean | null
    }>()

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile)

  const orgName = typeof profile["name"] === "string" && profile["name"].trim().length > 0 ? (profile["name"] as string) : "Your organization"
  const subtitle =
    typeof profile["tagline"] === "string" && profile["tagline"].trim().length > 0
      ? (profile["tagline"] as string)
      : "Coach House Accelerator"

  const publicSlug = orgRow?.public_slug ?? null
  const isPublic = Boolean(orgRow?.is_public_roadmap)

  return (
    <div className="space-y-8 px-4 pb-10 pt-4 lg:px-8 lg:max-w-5xl mx-auto">
      <RoadmapHero orgName={orgName} subtitle={subtitle} />
      <RoadmapVisibilityToggle initialPublic={isPublic} publicSlug={publicSlug} />
      <div className="space-y-6">
        {sections.map((section) => (
          <RoadmapSectionEditor key={section.id} section={section} publicSlug={publicSlug} />
        ))}
      </div>
    </div>
  )
}

function RoadmapHero({ orgName, subtitle }: { orgName: string; subtitle: string }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 shadow-xl">
      <div className="relative h-64 w-full">
        <NewsGradientThumb seed={orgName} className="h-full w-full" />
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/30 via-black/60 to-black/70 p-6 text-white">
          <div className="space-y-3">
            <Badge variant="secondary" className="bg-white/20 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Strategic Roadmap
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-tight">
                Share a narrative that travels beyond the cohort
              </h1>
              <p className="text-base text-white/80">
                Craft each section as if you were pitching your work to a partner or funder — we will take care of the layout, theming, and public view.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <span className="font-medium">{orgName}</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-white/70" />
            <span>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
