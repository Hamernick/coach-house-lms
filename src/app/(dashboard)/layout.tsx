import type { ReactNode } from "react"

import { AppShell } from "@/components/app-shell"
import { FrameEscape } from "@/components/navigation/frame-escape"
import { MemberWorkspaceSidebarHeaderEntry } from "./_components/member-workspace-sidebar-header-entry"

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
          <MemberWorkspaceSidebarHeaderEntry state={state.memberWorkspaceHeader} />
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
        hasAcceleratorAccess={state.hasAcceleratorAccess}
        hasElectiveAccess={state.hasElectiveAccess}
        ownedElectiveModuleSlugs={state.ownedElectiveModuleSlugs}
        currentPlanTier={state.currentPlanTier}
        organizationName={state.organizationName}
        tutorialWelcome={state.tutorialWelcome}
        isTester={state.isTester}
        onboardingLocked={state.onboardingLocked}
        onboardingIntentFocus={state.onboardingIntentFocus}
        formationStatus={state.formationStatus}
        context="platform"
      >
        {children}
      </AppShell>
    </>
  )
}
