import type { ReactNode } from "react"

import { AppShell } from "@/components/app-shell"
import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"
import { FrameEscape } from "@/components/navigation/frame-escape"
import { HomeCanvasFindShell } from "@/components/public/home-canvas-find-shell"
import {
  MemberWorkspaceOrgSwitcher,
  setActiveOrganizationAction,
  type MemberWorkspaceHeaderState,
} from "@/features/member-workspace"
import type { PlatformAccessLevel } from "@/features/platform-access"
import type { SidebarClass } from "@/lib/academy"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"

import { DocumentationRail } from "./documentation-rail"

export type DocumentationShellState = {
  sidebarTree: SidebarClass[]
  user: {
    name: string | null
    title: string | null
    email: string | null
    avatar: string | null
  }
  isAdmin: boolean
  platformAccessLevel: PlatformAccessLevel | null
  isTester: boolean
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
  acceleratorProgress: number | null
  showAccelerator: boolean
  showLiveBadges: boolean
  hasActiveSubscription: boolean
  hasBillingCancellationRisk: boolean
  hasAcceleratorAccess: boolean
  hasElectiveAccess: boolean
  ownedElectiveModuleSlugs: string[]
  currentPlanTier: PricingPlanTier
  showMemberWorkspace: boolean
  memberWorkspaceHeader: MemberWorkspaceHeaderState | null
  organizationName: string | null
  onboardingLocked: boolean
  onboardingIntentFocus: "build" | "find" | "fund" | "support" | null
  formationStatus: string | null
}

export function DocumentationShell({
  children,
  state,
  defaultSidebarOpen = false,
}: {
  children: ReactNode
  state: DocumentationShellState | null
  defaultSidebarOpen?: boolean
}) {
  if (!state) {
    return (
      <HomeCanvasFindShell
        sidebarFallback={<DocumentationRail />}
        sidebarLabel="documentation navigation"
      >
        {children}
      </HomeCanvasFindShell>
    )
  }

  return (
    <>
      <FrameEscape />
      <AppShell
        breadcrumbs={<AppBreadcrumbs segments={[{ label: "Documentation" }]} />}
        sidebarHeaderContent={
          state.memberWorkspaceHeader ? (
            <MemberWorkspaceOrgSwitcher
              activeOrganization={
                state.memberWorkspaceHeader.activeOrganization
              }
              organizations={
                state.memberWorkspaceHeader.accessibleOrganizations
              }
              setActiveOrganizationAction={setActiveOrganizationAction}
            />
          ) : null
        }
        contextualNavigation={<DocumentationRail contextual />}
        sidebarTree={state.sidebarTree}
        user={state.user}
        isAdmin={state.isAdmin}
        platformAccessLevel={state.platformAccessLevel}
        isTester={state.isTester}
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
        organizationName={state.organizationName}
        onboardingLocked={state.onboardingLocked}
        onboardingIntentFocus={state.onboardingIntentFocus}
        formationStatus={state.formationStatus}
        defaultSidebarOpen={defaultSidebarOpen}
        context="public"
        contentPresentation="full-bleed"
        brandHref="/documentation"
        showWorkspaceHome={state.showMemberWorkspace}
        showMemberWorkspace={state.showMemberWorkspace}
        allowOnboardingLockedContent
      >
        {children}
      </AppShell>
    </>
  )
}
