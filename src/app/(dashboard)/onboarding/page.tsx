import { redirect } from "next/navigation"

import { OnboardingWorkspaceCard } from "@/components/onboarding/onboarding-workspace-card"
import { resolveDashboardLayoutState } from "../_lib/dashboard-layout-state"
import { completeOnboardingAction } from "./actions"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const state = await resolveDashboardLayoutState()

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
        defaultBuilderPlanTier={state.currentPlanTier}
        mode="post_signup_access"
        onSubmit={completeOnboardingAction}
      />
    </div>
  )
}
