import { redirect } from "next/navigation"

import { FIND_PATH } from "@/lib/find/routes"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"
import { trackUserJourneyMilestone } from "@/lib/user-journey"

import { resolveDashboardLayoutState } from "../_lib/dashboard-layout-state"
import MyOrganizationPageContent from "../my-organization/_lib/my-organization-page-content"
import type { MyOrganizationSearchParams } from "../my-organization/_lib/types"

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams?: Promise<MyOrganizationSearchParams>
}) {
  const state = await resolveDashboardLayoutState()

  if (state.userPresent && !state.isAdmin && !state.showMemberWorkspace) {
    if (
      state.onboardingLocked &&
      (state.onboardingIntentFocus === "find" ||
        state.onboardingIntentFocus === "fund" ||
        state.onboardingIntentFocus === "support")
    ) {
      redirect(`${FIND_PATH}?member_onboarding=1&source=workspace`)
    }

    if (!state.onboardingLocked) {
      redirect(FIND_PATH)
    }
  }

  if (state.userPresent && !state.isAdmin) {
    const context = await resolveOptionalAuthenticatedAppContext()
    if (context) {
      await trackUserJourneyMilestone({
        userId: context.user.id,
        orgId: context.activeOrg.orgId,
        eventName: "workspace_viewed",
        journey: "workspace_activation",
        source: "workspace_page",
        surface: "workspace",
        planTier: state.currentPlanTier,
        checkpoint: "workspace_first_viewed",
        metadata: {
          hasActiveSubscription: state.hasActiveSubscription,
          hasAcceleratorAccess: state.hasAcceleratorAccess,
          hasElectiveAccess: state.hasElectiveAccess,
          showMemberWorkspace: state.showMemberWorkspace,
          onboardingLocked: state.onboardingLocked,
          onboardingIntentFocus: state.onboardingIntentFocus,
        },
      })
    }
  }

  return MyOrganizationPageContent({
    searchParams,
  })
}
