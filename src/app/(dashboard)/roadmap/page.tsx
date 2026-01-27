import { redirect } from "next/navigation"

import { RoadmapLanding } from "@/components/roadmap/roadmap-landing"
import { PageTutorialButton } from "@/components/tutorial/page-tutorial-button"
import { cleanupRoadmapTestSections, resolveRoadmapHeroUrl, resolveRoadmapSections } from "@/lib/roadmap"
import { resolveRoadmapHomework } from "@/lib/roadmap/homework"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

export const dynamic = "force-dynamic"

export default async function RoadmapPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect("/login?redirect=/roadmap")

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const canEdit = canEditOrganization(role)

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile, public_slug")
    .eq("user_id", orgId)
    .maybeSingle<{
      profile: Record<string, unknown> | null
      public_slug: string | null
    }>()

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  if (orgRow?.profile) {
    let nextProfile = profile
    let changed = false
    const htmlCleanup = cleanupOrgProfileHtml(nextProfile)
    if (htmlCleanup.changed) {
      nextProfile = htmlCleanup.nextProfile
      changed = true
    }
    const roadmapCleanup = cleanupRoadmapTestSections(nextProfile)
    if (roadmapCleanup.changed) {
      nextProfile = roadmapCleanup.nextProfile
      changed = true
    }
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert({ user_id: orgId, profile: nextProfile as Json }, { onConflict: "user_id" })
      if (!cleanupError) profile = nextProfile
    }
  }

  const roadmapHomework = await resolveRoadmapHomework(orgId, supabase)
  const sections = resolveRoadmapSections(profile).map((section) => ({
    ...section,
    homework: roadmapHomework[section.id] ?? null,
  }))
  const roadmapPublicSlug = orgRow?.public_slug ?? null
  const heroUrl = resolveRoadmapHeroUrl(profile)
  const firstSectionHref =
    sections.length > 0 ? `/roadmap/${sections[0].slug ?? sections[0].id}` : "/roadmap/origin-story"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageTutorialButton tutorial="roadmap" />
      <RoadmapLanding
        sections={sections}
        heroUrl={heroUrl ?? null}
        publicSlug={roadmapPublicSlug}
        canEdit={canEdit}
        editHref={firstSectionHref}
      />
    </div>
  )
}
