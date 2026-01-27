import { redirect } from "next/navigation"

import { RoadmapShell } from "@/components/roadmap/roadmap-shell"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { cleanupRoadmapTestSections, resolveRoadmapHeroUrl, resolveRoadmapSections } from "@/lib/roadmap"
import { resolveRoadmapHomework } from "@/lib/roadmap/homework"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { canEditOrganization, resolveActiveOrganization } from "@/lib/organization/active-org"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"

type StrategicRoadmapEditorPageProps = {
  redirectTo: string
  initialSectionSlug?: string | null
}

export async function StrategicRoadmapEditorPage({
  redirectTo,
  initialSectionSlug = null,
}: StrategicRoadmapEditorPageProps) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)

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
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  const roadmapHomework = await resolveRoadmapHomework(orgId, supabase)
  const roadmapSections = resolveRoadmapSections(profile).map((section) => {
    const withHomework = {
      ...section,
      homework: roadmapHomework[section.id] ?? null,
    }
    return publicSharingEnabled ? withHomework : { ...withHomework, isPublic: false }
  })
  const normalizedSlug = initialSectionSlug?.trim() ?? ""
  const initialSectionId = normalizedSlug.length
    ? roadmapSections.find((section) => section.slug === normalizedSlug || section.id === normalizedSlug)?.id ?? null
    : null

  const roadmapPublicSlug = orgRow?.public_slug ?? null
  const roadmapHeroUrl = resolveRoadmapHeroUrl(profile)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RoadmapShell
        sections={roadmapSections}
        publicSlug={roadmapPublicSlug}
        heroUrl={roadmapHeroUrl ?? null}
        showHeroEditor={false}
        showProgramPreview={false}
        initialSectionId={initialSectionId}
        canEdit={canEdit}
        showHeader={false}
      />
    </div>
  )
}
