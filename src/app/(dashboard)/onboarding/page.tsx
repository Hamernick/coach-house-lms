import { redirect } from "next/navigation"

import { OnboardingWorkspaceCard } from "@/components/onboarding/onboarding-workspace-card"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { resolvePricingPlanTier, type PricingPlanTier } from "@/lib/billing/plan-tier"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { Json } from "@/lib/supabase"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveDashboardLayoutState } from "../_lib/dashboard-layout-state"
import { completeOnboardingAction } from "./actions"

export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

async function resolvePricingReturnPlanTierOverride(
  state: Awaited<ReturnType<typeof resolveDashboardLayoutState>>,
  searchParams?: SearchParams,
): Promise<PricingPlanTier | null> {
  const params = searchParams ? await searchParams : {}
  const source = typeof params?.source === "string" ? params.source : null
  if (source !== "onboarding_pricing") return null
  if (!state.userPresent || !state.onboardingLocked || state.isAdmin) return null
  if (state.onboardingIntentFocus !== "build") return null
  if (state.currentPlanTier !== "free") return state.currentPlanTier

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { orgId } = await resolveActiveOrganization(supabase, user.id)
  const entitlements = await fetchLearningEntitlements({
    supabase,
    userId: user.id,
    orgUserId: orgId,
    isAdmin: state.isAdmin,
    forceStripeSync: true,
  })
  if (!entitlements.hasActiveSubscription) return null

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("status, metadata")
    .eq("user_id", orgId)
    .in("status", ["active", "trialing", "past_due", "incomplete"])
    .not("stripe_subscription_id", "ilike", "stub_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string | null; metadata: Json | null }>()

  const resolvedPlanTier = resolvePricingPlanTier(activeSubscription ?? null)
  return resolvedPlanTier === "free" ? "organization" : resolvedPlanTier
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: SearchParams
} = {}) {
  const state = await resolveDashboardLayoutState()
  const pricingReturnPlanTierOverride = await resolvePricingReturnPlanTierOverride(
    state,
    searchParams,
  )

  if (!state.userPresent) {
    redirect("/login?redirect=/onboarding")
  }

  if (!state.onboardingLocked) {
    if (
      state.onboardingIntentFocus === "find" ||
      state.onboardingIntentFocus === "fund" ||
      state.onboardingIntentFocus === "support"
    ) {
      redirect("/find?member_onboarding=0&source=onboarding")
    }

    redirect("/workspace")
  }

  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col py-2 md:py-4">
      <OnboardingWorkspaceCard
        {...state.onboardingDefaults}
        defaultBuilderPlanTier={pricingReturnPlanTierOverride ?? state.currentPlanTier}
        mode="post_signup_access"
        onSubmit={completeOnboardingAction}
      />
    </div>
  )
}
