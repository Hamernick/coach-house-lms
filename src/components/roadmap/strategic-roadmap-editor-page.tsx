import { redirect } from "next/navigation"

import { RoadmapShell } from "@/components/roadmap/roadmap-shell"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { resolveRoadmapHeroUrl, resolveRoadmapSections } from "@/lib/roadmap"
import { resolveRoadmapHomework } from "@/lib/roadmap/homework"
import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { createSupabaseServerClient, type Json } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"

type StrategicRoadmapEditorPageProps = {
  redirectTo: string
}

export async function StrategicRoadmapEditorPage({ redirectTo }: StrategicRoadmapEditorPageProps) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) throw userError
  if (!user) redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`)

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
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <RoadmapShell
        sections={roadmapSections}
        publicSlug={roadmapPublicSlug}
        initialPublic={roadmapIsPublic}
        heroUrl={roadmapHeroUrl ?? null}
        showHeroEditor={false}
        showProgramPreview={false}
      />
    </div>
  )
}
