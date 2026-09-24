import { Suspense, type ReactNode } from "react"

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
import { DocumentationSearchForm } from "./documentation-search-form"

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
  const headerSearch = (
    <Suspense
      fallback={
        <div className="h-11 min-w-0 flex-1 md:h-8 lg:max-w-56 xl:max-w-64" />
      }
    >
      <DocumentationSearchForm />
    </Suspense>
  )

  if (!state) {
    return (
      <HomeCanvasFindShell
        sidebarFallback={<DocumentationRail />}
        showPublicSearch={false}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b px-4 py-2 sm:px-6 lg:px-8">
            {headerSearch}
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
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
        onboardingLocked={false}
        onboardingIntentFocus={state.onboardingIntentFocus}
        formationStatus={state.formationStatus}
        defaultSidebarOpen={defaultSidebarOpen}
        context="public"
        contentPresentation="full-bleed"
        brandHref="/documentation"
        showWorkspaceHome={state.showMemberWorkspace}
        showMemberWorkspace={state.showMemberWorkspace}
      >
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-64 shrink-0 border-r lg:block">
            <DocumentationRail contextual />
          </aside>
          <div className="min-w-0 flex-1">
            <div className="border-b px-4 py-2 sm:px-6 lg:px-8">
              {headerSearch}
            </div>
            {children}
          </div>
        </div>
      </AppShell>
    </>
  )
}
