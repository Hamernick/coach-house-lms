"use client"

import Link from "next/link"
import { useMemo } from "react"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"

import { CoachSchedulingCard } from "@/components/coaching/coach-scheduling-card"
import { CoachSchedulingSidebarItem } from "@/components/coaching/coach-scheduling-sidebar-item"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { SidebarClass } from "@/lib/academy"

import { ClassesSection } from "@/components/app-sidebar/classes-section"
import { RESOURCE_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"
import { Button } from "@/components/ui/button"
import { SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import { resolveMemberWorkspaceNavAccess } from "@/lib/workspace/member-workspace-nav-access"

export type AppSidebarProps = {
  user?: {
    name?: string | null
    title?: string | null
    email?: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
  isTester?: boolean
  showOrgAdmin?: boolean
  canAccessOrgAdmin?: boolean
  classes?: SidebarClass[]
  acceleratorProgress?: number | null
  showAccelerator?: boolean
  hasActiveSubscription?: boolean
  hasBillingCancellationRisk?: boolean
  hasAcceleratorAccess?: boolean
  hasElectiveAccess?: boolean
  ownedElectiveModuleSlugs?: string[]
  formationStatus?: string | null
  onboardingLocked?: boolean
  onboardingIntentFocus?: "build" | "find" | "fund" | "support" | null
  organizationName?: string | null
  showCoachScheduling?: boolean
  showWorkspaceHome?: boolean
  showMemberWorkspace?: boolean
}

export function AppSidebar({
  user,
  isAdmin = false,
  isTester = false,
  showOrgAdmin = false,
  canAccessOrgAdmin = true,
  classes,
  showAccelerator,
  hasActiveSubscription = false,
  hasBillingCancellationRisk = false,
  hasAcceleratorAccess,
  hasElectiveAccess,
  ownedElectiveModuleSlugs,
  formationStatus,
  onboardingLocked = false,
  onboardingIntentFocus = null,
  organizationName = null,
  showCoachScheduling = false,
  showWorkspaceHome = true,
  showMemberWorkspace,
}: AppSidebarProps) {
  const resolvedUser = useMemo(
    () => ({
      name: user?.name ?? null,
      title: user?.title ?? null,
      email: user?.email ?? null,
      avatar: user?.avatar ?? null,
    }),
    [user?.avatar, user?.email, user?.name, user?.title],
  )

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-border/70 bg-sidebar px-3 pb-0 pt-0 md:flex md:flex-col md:gap-6">
      <SidebarBody
        isAdmin={isAdmin}
        isTester={isTester}
        classes={classes}
        user={resolvedUser}
        showAccelerator={showAccelerator}
        hasActiveSubscription={hasActiveSubscription}
        hasBillingCancellationRisk={hasBillingCancellationRisk}
        showOrgAdmin={showOrgAdmin}
        canAccessOrgAdmin={canAccessOrgAdmin}
        hasAcceleratorAccess={hasAcceleratorAccess}
        hasElectiveAccess={hasElectiveAccess}
        ownedElectiveModuleSlugs={ownedElectiveModuleSlugs}
        formationStatus={formationStatus}
        onboardingLocked={onboardingLocked}
        onboardingIntentFocus={onboardingIntentFocus}
        organizationName={organizationName}
        showCoachScheduling={showCoachScheduling}
        showWorkspaceHome={showWorkspaceHome}
        showMemberWorkspace={showMemberWorkspace}
      />
    </aside>
  )
}

type SidebarBodyProps = {
  isAdmin: boolean
  isTester: boolean
  classes?: SidebarClass[]
  user: {
    name: string | null
    title: string | null
    email: string | null
    avatar?: string | null
  }
  showAccelerator?: boolean
  hasActiveSubscription?: boolean
  hasBillingCancellationRisk?: boolean
  showClasses?: boolean
  classesBasePath?: string
  showOrgAdmin?: boolean
  canAccessOrgAdmin?: boolean
  hasAcceleratorAccess?: boolean
  hasElectiveAccess?: boolean
  ownedElectiveModuleSlugs?: string[]
  formationStatus?: string | null
  onboardingLocked?: boolean
  onboardingIntentFocus?: "build" | "find" | "fund" | "support" | null
  organizationName?: string | null
  showCoachScheduling?: boolean
  showWorkspaceHome?: boolean
  showMemberWorkspace?: boolean
}

export function SidebarBody({
  isAdmin,
  isTester,
  classes,
  user,
  showAccelerator,
  hasActiveSubscription = false,
  hasBillingCancellationRisk = false,
  showClasses = false,
  classesBasePath,
  showOrgAdmin = false,
  canAccessOrgAdmin = true,
  hasAcceleratorAccess = false,
  hasElectiveAccess = false,
  ownedElectiveModuleSlugs = [],
  formationStatus = null,
  onboardingLocked = false,
  onboardingIntentFocus = null,
  organizationName = null,
  showCoachScheduling = false,
  showWorkspaceHome = true,
  showMemberWorkspace,
}: SidebarBodyProps) {
  const shouldShowAccelerator = !onboardingLocked && Boolean(isAdmin || showAccelerator)
  const hasUser = Boolean(user.email)
  const showMemberWorkspaceNav =
    !onboardingLocked &&
    onboardingIntentFocus !== "fund" &&
    resolveMemberWorkspaceNavAccess({
      isAdmin,
      showMemberWorkspace,
      hasActiveSubscription,
    })
  const hasMemberWorkspaceAccess = showMemberWorkspaceNav
  const showAccountUpgradeCta =
    hasUser && (isAdmin || (!hasActiveSubscription && !showMemberWorkspaceNav))
  const mainNavItems = buildMainNav({
    isAdmin,
    showOrgAdmin,
    canAccessOrgAdmin,
    showMemberWorkspace: showMemberWorkspaceNav,
    hasMemberWorkspaceAccess,
    showWorkspaceHome,
  })

  return (
    <>
      <SidebarContent className="gap-0">
        {onboardingLocked ? null : (
          <NavMain items={mainNavItems} className="py-0" />
        )}
        {shouldShowAccelerator && showClasses ? (
          <ClassesSection
            classes={classes}
            isAdmin={isAdmin}
            basePath={classesBasePath}
            hasAcceleratorAccess={hasAcceleratorAccess}
            hasElectiveAccess={hasElectiveAccess}
            ownedElectiveModuleSlugs={ownedElectiveModuleSlugs}
            formationStatus={formationStatus}
          />
        ) : null}
      </SidebarContent>

      <SidebarFooter className="mt-auto pb-[var(--shell-rail-padding,0.75rem)]">
        {onboardingLocked ? null : (
          <div className="flex flex-col gap-4 pt-2">
            {showCoachScheduling ? (
              <>
                <div className="hidden group-data-[collapsible=icon]:hidden [@media(min-height:56rem)]:block">
                  <CoachSchedulingCard />
                </div>
                <div className="[@media(min-height:56rem)]:hidden">
                  <CoachSchedulingSidebarItem />
                </div>
              </>
            ) : null}
            {showAccountUpgradeCta ? <FreeAccountUpgradeCta /> : null}
            <NavDocuments items={RESOURCE_NAV} label="Resources" />
          </div>
        )}
        {hasUser ? (
          <NavUser
            user={user}
            isAdmin={isAdmin}
            isTester={isTester}
            showDivider={false}
            hasActiveSubscription={hasBillingCancellationRisk}
          />
        ) : null}
      </SidebarFooter>
    </>
  )
}

function FreeAccountUpgradeCta() {
  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <Button asChild size="sm" className="w-full justify-between px-3">
        <Link
          href="/find?paywall=organization&plan=organization&source=sidebar_upgrade&redirect=%2Fworkspace&cancel=%2Ffind&paywall_preview=1"
          prefetch={false}
        >
          <span className="truncate">Upgrade account</span>
          <ArrowUpRightIcon data-icon="inline-end" aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
