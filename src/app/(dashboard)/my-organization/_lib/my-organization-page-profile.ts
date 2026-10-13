import { cleanupOrgProfileHtml } from "@/lib/organization/profile-cleanup"
import { resolveRoadmapSections } from "@/lib/roadmap"
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

  const profile = cleanupOrgProfileHtml(orgRow?.profile ?? {}).nextProfile

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
