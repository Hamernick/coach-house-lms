import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type PublicMapMemberProfile = {
  name: string | null
  email: string | null
  avatarUrl: string | null
  title: string | null
  company: string | null
  contact: string | null
  about: string | null
}

export type PublicMapViewerState = {
  viewer: { id: string; email: string | null } | null
  memberProfile: PublicMapMemberProfile | null
  needsMemberOnboarding: boolean
  onboardingDefaults: ReturnType<typeof buildOnboardingFlowDefaults> | null
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function fetchPublicMapViewerState(): Promise<PublicMapViewerState> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      viewer: null,
      memberProfile: null,
      needsMemberOnboarding: false,
      onboardingDefaults: null,
    }
  }

  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const completed = Boolean(userMeta?.onboarding_completed)
  const intentFocus = normalizeString(userMeta?.onboarding_intent_focus)

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, headline, company, contact, about")
    .eq("id", user.id)
    .maybeSingle<{
      full_name: string | null
      avatar_url: string | null
      headline: string | null
      company: string | null
      contact: string | null
      about: string | null
    }>()

  const memberProfile = {
    name: profileRow?.full_name ?? user.user_metadata?.full_name?.toString?.() ?? null,
    email: user.email ?? null,
    avatarUrl: profileRow?.avatar_url ?? null,
    title: profileRow?.headline ?? null,
    company: profileRow?.company ?? null,
    contact: profileRow?.contact ?? null,
    about: profileRow?.about ?? null,
  } satisfies PublicMapMemberProfile

  const onboardingDefaults = buildOnboardingFlowDefaults({
    userId: user.id,
    email: user.email ?? null,
    displayName: memberProfile.name,
    avatarUrl: memberProfile.avatarUrl,
    userMetadata: userMeta,
    orgProfile: null,
    orgSlug: null,
  })

  return {
    viewer: { id: user.id, email: user.email ?? null },
    memberProfile,
    needsMemberOnboarding:
      !completed &&
      (intentFocus === "find" || intentFocus === "fund" || intentFocus === "support"),
    onboardingDefaults,
  }
}
