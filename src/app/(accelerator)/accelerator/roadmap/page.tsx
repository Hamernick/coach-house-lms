import { redirect } from "next/navigation"

import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { HeaderTitlePortal } from "@/components/header-title-portal"
import { RoadmapShell } from "@/components/roadmap/roadmap-shell"
import { resolveRoadmapHeroUrl, resolveRoadmapSections } from "@/lib/roadmap"
import { resolveRoadmapHomework } from "@/lib/roadmap/homework"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function AcceleratorRoadmapPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/login?redirect=/accelerator/roadmap")
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

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  if (orgRow?.profile) {
    const { nextProfile, changed } = cleanupOrgProfileHtml(profile)
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert({ user_id: user.id, profile: nextProfile as Json }, { onConflict: "user_id" })
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  const roadmapHomework = await resolveRoadmapHomework(user.id, supabase)
  const roadmapSections = resolveRoadmapSections(profile).map((section) => {
    const withHomework = {
      ...section,
      homework: roadmapHomework[section.id] ?? null,
    }
    return publicSharingEnabled ? withHomework : { ...withHomework, isPublic: false }
  })
  const roadmapIsPublic = publicSharingEnabled ? Boolean(orgRow?.is_public_roadmap) : false
  const roadmapPublicSlug = orgRow?.public_slug ?? null
  const roadmapHeroUrl = resolveRoadmapHeroUrl(profile)

  return (
    <section className="flex flex-col gap-6">
      <HeaderTitlePortal>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground">
            <WaypointsIcon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground truncate">Strategic roadmap</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              A pitch-ready snapshot of what you are building for funders.
            </p>
          </div>
        </div>
      </HeaderTitlePortal>
      <RoadmapShell
        sections={roadmapSections}
        publicSlug={roadmapPublicSlug}
        initialPublic={roadmapIsPublic}
        heroUrl={roadmapHeroUrl ?? null}
        showHeroEditor={false}
        showHeader={false}
      />
    </section>
  )
}
