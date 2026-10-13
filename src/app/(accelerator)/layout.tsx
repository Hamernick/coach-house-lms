import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { fetchSidebarTree } from "@/lib/academy"
import { AppShell } from "@/components/app-shell"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { resolveProfileAudience, resolveTesterMetadata } from "@/lib/devtools/audience"
import { resolvePricingPlanTier, type PricingPlanTier } from "@/lib/billing/plan-tier"
import type { Json } from "@/lib/supabase"

export default async function AcceleratorLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  if (!user) {
    redirect("/login")
  }

  let displayName: string | null = null
  let email: string | null = user.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let isTester = false
  let tutorialWelcome = false
  let showOrgAdmin = false
  let canAccessOrgAdmin = false
  let organizationName: string | null = null
  let currentPlanTier: PricingPlanTier = "free"

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const [profileAudience, activeOrg] = await Promise.all([
    resolveProfileAudience({
      supabase,
      userId: user.id,
      fallbackIsTester,
    }),
    resolveActiveOrganization(supabase, user.id),
  ])

  displayName = profileAudience.fullName ?? (user.user_metadata?.full_name as string | undefined) ?? null
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

  const { orgId, role } = activeOrg
  showOrgAdmin = role === "owner" || role === "admin" || isAdmin

  const [entitlements, orgRowResult] = await Promise.all([
    fetchLearningEntitlements({
      supabase,
      userId: user.id,
      orgUserId: orgId,
      isAdmin,
    }),
    supabase
      .from("organizations")
      .select("profile")
      .eq("user_id", orgId)
      .maybeSingle<{ profile: Json | null }>(),
  ])
  canAccessOrgAdmin = showOrgAdmin && (isAdmin || entitlements.hasActiveSubscription)

  const orgProfile = (orgRowResult.data?.profile as Record<string, unknown> | null) ?? null
  const orgName = typeof orgProfile?.name === "string" ? orgProfile.name.trim() : ""
  organizationName = orgName.length > 0 ? orgName : null

  if (entitlements.hasActiveSubscription) {
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
    if (currentPlanTier === "free" && entitlements.hasActiveSubscription) {
      currentPlanTier = "organization"
    }
  }

  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const onboardingCompleted = Boolean(userMeta?.onboarding_completed)
  const tutorialsCompleted = Array.isArray(userMeta?.tutorials_completed)
    ? (userMeta?.tutorials_completed as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  const tutorialsDismissed = Array.isArray(userMeta?.tutorials_dismissed)
    ? (userMeta?.tutorials_dismissed as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  tutorialWelcome = !isAdmin && onboardingCompleted && !tutorialsCompleted.includes("accelerator") && !tutorialsDismissed.includes("accelerator")

  if (!entitlements.hasAcceleratorAccess && !entitlements.hasElectiveAccess) {
    redirect("/organization?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator")
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })

  return (
    <AppShell
      sidebarTree={sidebarTree}
      isAdmin={isAdmin}
      showOrgAdmin={showOrgAdmin}
      canAccessOrgAdmin={canAccessOrgAdmin}
      isTester={isTester}
      tutorialWelcome={{ platform: false, accelerator: tutorialWelcome }}
      user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
      showAccelerator={true}
      hasAcceleratorAccess={entitlements.hasAcceleratorAccess}
      hasElectiveAccess={entitlements.hasElectiveAccess}
      ownedElectiveModuleSlugs={entitlements.ownedElectiveModuleSlugs}
      currentPlanTier={currentPlanTier}
      organizationName={organizationName}
      context="accelerator"
    >
      {children}
    </AppShell>
  )
}
