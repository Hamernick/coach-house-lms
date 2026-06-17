import type { ReactNode } from "react"

import { AppShell } from "@/components/app-shell"
import { FrameEscape } from "@/components/navigation/frame-escape"
import { AppPricingFeedbackPrompt } from "@/features/app-pricing-feedback"
import { MemberWorkspaceSidebarHeader } from "@/features/member-workspace"

import { resolveDashboardLayoutState } from "./_lib/dashboard-layout-state"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const state = await resolveDashboardLayoutState()

  return (
    <>
      <FrameEscape />
      <AppShell
        sidebarHeaderContent={
          <MemberWorkspaceSidebarHeader state={state.memberWorkspaceHeader} />
        }
        sidebarTree={state.sidebarTree}
        user={state.user}
        isAdmin={state.isAdmin}
        showOrgAdmin={state.showOrgAdmin}
        canAccessOrgAdmin={state.canAccessOrgAdmin}
        acceleratorProgress={state.acceleratorProgress}
        showAccelerator={state.showAccelerator}
        showLiveBadges={state.showLiveBadges}
        hasActiveSubscription={state.hasActiveSubscription}
        hasBillingCancellationRisk={state.hasBillingCancellationRisk}
        hasAcceleratorAccess={state.hasAcceleratorAccess}
        hasElectiveAccess={state.hasElectiveAccess}
        ownedElectiveModuleSlugs={state.ownedElectiveModuleSlugs}
        currentPlanTier={state.currentPlanTier}
        showMemberWorkspace={state.showMemberWorkspace}
        organizationName={state.organizationName}
        isTester={state.isTester}
        onboardingLocked={state.onboardingLocked}
        onboardingIntentFocus={state.onboardingIntentFocus}
        formationStatus={state.formationStatus}
        context="platform"
      >
        {children}
      </AppShell>
      {state.user?.email && !state.onboardingLocked ? (
        <AppPricingFeedbackPrompt
          prompt={state.appPricingFeedbackPrompt}
          tutorial="platform"
          tutorialPending={state.tutorialWelcome.platform}
        />
      ) : null}
    </>
  )
}
