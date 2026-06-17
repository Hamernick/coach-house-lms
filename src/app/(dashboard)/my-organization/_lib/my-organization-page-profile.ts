import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { resolveRoadmapSections } from "@/lib/roadmap"
import type { Json } from "@/lib/supabase"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"

import { buildInitialOrganizationProfile } from "./helpers"

type MyOrganizationSupabase = NonNullable<
  Awaited<ReturnType<typeof resolveOptionalAuthenticatedAppContext>>
>["supabase"]

export async function loadMyOrganizationProfileContext({
  orgId,
  supabase,
}: {
  orgId: string
  supabase: MyOrganizationSupabase
}) {
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("ein, profile, public_slug, is_public")
    .eq("user_id", orgId)
    .maybeSingle<{
      ein: string | null
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public: boolean | null
    }>()

  let profile = (orgRow?.profile ?? {}) as Record<string, unknown>

  if (orgRow?.profile) {
    const { nextProfile, changed } = cleanupOrgProfileHtml(profile)
    if (changed) {
      const { error: cleanupError } = await supabase
        .from("organizations")
        .upsert(
          { user_id: orgId, profile: nextProfile as Json },
          { onConflict: "user_id" }
        )
      if (!cleanupError) {
        profile = nextProfile
      }
    }
  }

  const initialProfile = buildInitialOrganizationProfile({
    profile,
    organization: orgRow ?? null,
  })
  const roadmapSections = resolveRoadmapSections(profile)

  return {
    initialProfile,
    orgRow,
    profile,
    roadmapSections,
  }
}
