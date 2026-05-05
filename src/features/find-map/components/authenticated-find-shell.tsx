import type { ReactNode } from "react"

import { AppShell } from "@/components/app-shell"
import { AppBreadcrumbs } from "@/components/app-shell/breadcrumbs"
import { FrameEscape } from "@/components/navigation/frame-escape"
import type { AppPricingFeedbackPromptState } from "@/features/app-pricing-feedback"
import type { SidebarClass } from "@/lib/academy"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"

type AuthenticatedFindShellState = {
  sidebarTree: SidebarClass[]
  user: {
    name: string | null
    title: string | null
    email: string | null
    avatar: string | null
  }
  isAdmin: boolean
  isTester: boolean
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
  acceleratorProgress: number | null
  showAccelerator: boolean
  showLiveBadges: boolean
  hasActiveSubscription: boolean
  hasAcceleratorAccess: boolean
  hasElectiveAccess: boolean
  ownedElectiveModuleSlugs: string[]
  currentPlanTier: PricingPlanTier
  organizationName: string | null
  tutorialWelcome: {
    platform: boolean
    accelerator: boolean
  }
  appPricingFeedbackPrompt: AppPricingFeedbackPromptState | null
  onboardingLocked: boolean
  onboardingIntentFocus: "build" | "find" | "fund" | "support" | null
  formationStatus: string | null
}

export function AuthenticatedFindShell({
  children,
  state,
  organizationDetail = false,
}: {
  children: ReactNode
  state: AuthenticatedFindShellState
  organizationDetail?: boolean
}) {
  const segments = organizationDetail
    ? [{ label: "Find", href: "/find" }, { label: "Organization" }]
    : [{ label: "Find" }]

  return (
    <>
      <FrameEscape />
      <AppShell
        breadcrumbs={<AppBreadcrumbs segments={segments} />}
        sidebarTree={state.sidebarTree}
        user={state.user}
        isAdmin={state.isAdmin}
        isTester={state.isTester}
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
        pricingFeedbackPrompt={state.appPricingFeedbackPrompt}
        onboardingLocked={state.onboardingLocked}
        onboardingIntentFocus={state.onboardingIntentFocus}
        formationStatus={state.formationStatus}
        context="public"
        brandHref="/find"
        showWorkspaceHome={state.isAdmin || state.hasActiveSubscription}
      >
        {children}
      </AppShell>
    </>
  )
}
