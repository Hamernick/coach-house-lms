import type { ReactNode } from "react"

import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"
import { fetchSidebarTree, type SidebarClass } from "@/lib/academy"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { AppShell } from "@/components/app-shell"
import { FrameEscape } from "@/components/navigation/frame-escape"
import { publicSharingEnabled } from "@/lib/feature-flags"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { resolveProfileAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import { resolvePricingPlanTier, type PricingPlanTier } from "@/lib/billing/plan-tier"
import type { Json } from "@/lib/supabase"

export default async function DashboardLayout({
  children,
  breadcrumbs,
}: {
  children: ReactNode
  breadcrumbs?: ReactNode
}) {
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
  let isTester = false
  let needsOnboarding = false
  let acceleratorProgress: number | null = null
  let showLiveBadges = false
  let showAccelerator = false
  let tutorialWelcomePlatform = false
  let tutorialWelcomeAccelerator = false
  let hasActiveSubscription = false
  let hasAcceleratorAccess = false
  let hasElectiveAccess = false
  let ownedElectiveModuleSlugs: string[] = []
  let showOrgAdmin = false
  let canAccessOrgAdmin = false
  let formationStatus: string | null = null
  let organizationName: string | null = null
  let currentPlanTier: PricingPlanTier = "free"

  if (user) {
    const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
    const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
    const completed = Boolean(userMeta?.onboarding_completed)

    const [profileAudience, activeOrg] = await Promise.all([
      resolveProfileAudience({
        supabase,
        userId: user.id,
        fallbackIsTester,
      }),
      resolveActiveOrganization(supabase, user.id),
    ])

    displayName =
      profileAudience.fullName ?? (user.user_metadata?.full_name as string | undefined) ?? null
    isAdmin = profileAudience.isAdmin
    isTester = profileAudience.isTester

    if (!email && typeof user.user_metadata?.email === "string") {
      email = user.user_metadata.email as string
    }

    avatar =
      profileAudience.avatarUrl ??
      (typeof user.user_metadata?.avatar_url === "string"
        ? (user.user_metadata.avatar_url as string)
        : null)

    // Admins never see onboarding; students see it until completed.
    needsOnboarding = !isAdmin && !completed

    const { orgId, role } = activeOrg
    showOrgAdmin = role === "owner" || role === "admin"
    if (isAdmin) {
      showOrgAdmin = true
    }
    if (orgId !== user.id) {
      // Invited staff/board accounts should not see the owner onboarding flow.
      needsOnboarding = false
    }

    const [orgRowResult, entitlements] = await Promise.all([
      supabase
        .from("organizations")
        .select("profile, public_slug, is_public, is_public_roadmap")
        .eq("user_id", orgId)
        .maybeSingle<{
          profile: Json | null
          public_slug: string | null
          is_public: boolean | null
          is_public_roadmap: boolean | null
        }>(),
      fetchLearningEntitlements({
        supabase,
        userId: user.id,
        orgUserId: orgId,
        isAdmin,
      }),
    ])

    const orgProfile = (orgRowResult.data?.profile as Record<string, unknown> | null) ?? null
    const fs = typeof orgProfile?.formationStatus === "string" ? orgProfile.formationStatus : null
    formationStatus = fs
    const orgName = typeof orgProfile?.name === "string" ? orgProfile.name.trim() : ""
    organizationName = orgName.length > 0 ? orgName : null

    if (publicSharingEnabled) {
      const hasSlug = Boolean(
        orgRowResult.data?.public_slug && orgRowResult.data.public_slug.trim().length > 0,
      )
      showLiveBadges =
        hasSlug &&
        Boolean(orgRowResult.data?.is_public) &&
        Boolean(orgRowResult.data?.is_public_roadmap)
    }

    hasActiveSubscription = entitlements.hasActiveSubscription
    hasAcceleratorAccess = entitlements.hasAcceleratorAccess
    hasElectiveAccess = entitlements.hasElectiveAccess
    ownedElectiveModuleSlugs = entitlements.ownedElectiveModuleSlugs
    showAccelerator = hasAcceleratorAccess || hasElectiveAccess
    canAccessOrgAdmin = showOrgAdmin && (isAdmin || hasActiveSubscription)

    if (hasActiveSubscription) {
      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("status, metadata")
        .eq("user_id", orgId)
        .in("status", ["active", "trialing", "past_due", "incomplete"])
        .not("stripe_subscription_id", "ilike", "stub_%")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ status: string | null; metadata: Json | null }>()

      currentPlanTier = resolvePricingPlanTier(activeSubscription ?? null)
      if (currentPlanTier === "free") {
        currentPlanTier = "organization"
      }
    }

    const tutorialsCompleted = Array.isArray(userMeta?.tutorials_completed)
      ? (userMeta?.tutorials_completed as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : []
    const tutorialsDismissed = Array.isArray(userMeta?.tutorials_dismissed)
      ? (userMeta?.tutorials_dismissed as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : []

    const welcomeEligible = !needsOnboarding && !isAdmin && completed
    tutorialWelcomePlatform =
      welcomeEligible &&
      !tutorialsCompleted.includes("platform") &&
      !tutorialsDismissed.includes("platform")
    tutorialWelcomeAccelerator =
      welcomeEligible &&
      showAccelerator &&
      !tutorialsCompleted.includes("accelerator") &&
      !tutorialsDismissed.includes("accelerator")
  }

  let sidebarTree: SidebarClass[] = []
  if (user && (isAdmin || showAccelerator)) {
    sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })
  }

  if (user && showAccelerator && sidebarTree.length > 0) {
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
    <>
      <FrameEscape />
      <AppShell
        breadcrumbs={breadcrumbs}
        sidebarTree={sidebarTree}
        user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
        isAdmin={isAdmin}
        showOrgAdmin={showOrgAdmin}
        canAccessOrgAdmin={canAccessOrgAdmin}
        acceleratorProgress={acceleratorProgress}
        showAccelerator={showAccelerator}
        showLiveBadges={showLiveBadges}
        hasActiveSubscription={hasActiveSubscription}
        hasAcceleratorAccess={hasAcceleratorAccess}
        hasElectiveAccess={hasElectiveAccess}
        ownedElectiveModuleSlugs={ownedElectiveModuleSlugs}
        currentPlanTier={currentPlanTier}
        organizationName={organizationName}
        tutorialWelcome={{ platform: tutorialWelcomePlatform, accelerator: tutorialWelcomeAccelerator }}
        isTester={isTester}
        onboardingProps={{
          enabled: Boolean(user),
          open: needsOnboarding,
          defaultEmail: email,
          onSubmit: completeOnboardingAction,
        }}
        onboardingLocked={needsOnboarding}
        formationStatus={formationStatus}
        context="platform"
      >
        {children}
      </AppShell>
    </>
  )
}
