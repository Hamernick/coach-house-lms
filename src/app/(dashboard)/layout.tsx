import type { ReactNode } from "react"

import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"
import { fetchSidebarTree } from "@/lib/academy"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { AppShell } from "@/components/app-shell"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { Json } from "@/lib/supabase"

export default async function DashboardLayout({ children, breadcrumbs }: { children: ReactNode; breadcrumbs?: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  let displayName: string | null = null
  let email: string | null = user?.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let needsOnboarding = false
  let acceleratorProgress: number | null = null
  let showLiveBadges = false
  let showAccelerator = false
  let tutorialWelcomePlatform = false
  let tutorialWelcomeAccelerator = false
  let hasActiveSubscription = false
  let showOrgAdmin = false
  let formationStatus: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null; role: string | null; avatar_url: string | null }>()

    displayName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null
    isAdmin = profile?.role === "admin"

    if (!email && typeof user.user_metadata?.email === "string") {
      email = user.user_metadata.email as string
    }

    avatar = profile?.avatar_url ?? (typeof user.user_metadata?.avatar_url === "string" ? (user.user_metadata.avatar_url as string) : null)

    const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
    const completed = Boolean(userMeta?.onboarding_completed)
    // Admins never see onboarding; students see it until completed
    needsOnboarding = !isAdmin && !completed

    const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
    showOrgAdmin = role === "owner" || role === "admin"
    if (isAdmin) {
      showOrgAdmin = true
    }
    if (orgId !== user.id) {
      // Invited staff/board accounts should not see the owner onboarding flow.
      needsOnboarding = false
    }

    {
      const { data: orgProfileRow } = await supabase
        .from("organizations")
        .select("profile")
        .eq("user_id", orgId)
        .maybeSingle<{ profile: Json | null }>()
      const orgProfile = (orgProfileRow?.profile as Record<string, unknown> | null) ?? null
      const fs = typeof orgProfile?.formationStatus === "string" ? orgProfile.formationStatus : null
      formationStatus = fs
    }

    const tutorialsCompleted = Array.isArray(userMeta?.tutorials_completed)
      ? (userMeta?.tutorials_completed as unknown[]).filter((t): t is string => typeof t === "string")
      : []
    const tutorialsDismissed = Array.isArray(userMeta?.tutorials_dismissed)
      ? (userMeta?.tutorials_dismissed as unknown[]).filter((t): t is string => typeof t === "string")
      : []

    if (publicSharingEnabled) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("public_slug, is_public, is_public_roadmap")
        .eq("user_id", orgId)
        .maybeSingle<{ public_slug: string | null; is_public: boolean | null; is_public_roadmap: boolean | null }>()

      const hasSlug = Boolean(orgRow?.public_slug && orgRow.public_slug.trim().length > 0)
      showLiveBadges = hasSlug && Boolean(orgRow?.is_public) && Boolean(orgRow?.is_public_roadmap)
    }

    if (isAdmin) {
      showAccelerator = true
    } else {
      const { data: purchase } = await supabase
        .from("accelerator_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle<{ id: string }>()

      showAccelerator = Boolean(purchase)
    }

    if (!isAdmin) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ status: string | null }>()

      if (!subscriptionError) {
        hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing"
      }
    }

    const welcomeEligible = !needsOnboarding && !isAdmin && completed
    tutorialWelcomePlatform = welcomeEligible && !tutorialsCompleted.includes("platform") && !tutorialsDismissed.includes("platform")
    tutorialWelcomeAccelerator =
      welcomeEligible &&
      showAccelerator &&
      !tutorialsCompleted.includes("accelerator") &&
      !tutorialsDismissed.includes("accelerator")
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })

    if (user) {
      try {
        const { percent } = await fetchAcceleratorProgressSummary({
          supabase,
        userId: user.id,
        isAdmin,
        classes: sidebarTree,
      })
      acceleratorProgress = percent
    } catch {
      acceleratorProgress = null
    }
  }

  return (
    <AppShell
      breadcrumbs={breadcrumbs}
      sidebarTree={sidebarTree}
      user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
      isAdmin={isAdmin}
      showOrgAdmin={showOrgAdmin}
      acceleratorProgress={acceleratorProgress}
      showAccelerator={showAccelerator}
      showLiveBadges={showLiveBadges}
      hasActiveSubscription={hasActiveSubscription}
      tutorialWelcome={{ platform: tutorialWelcomePlatform, accelerator: tutorialWelcomeAccelerator }}
      onboardingProps={{
        enabled: Boolean(user),
        open: needsOnboarding,
        defaultEmail: email,
        onSubmit: completeOnboardingAction,
      }}
      formationStatus={formationStatus}
      context="platform"
    >
      {children}
    </AppShell>
  )
}
