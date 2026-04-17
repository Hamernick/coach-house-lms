"use client"

import { useMemo } from "react"

import { CoachSchedulingCard } from "@/components/coaching/coach-scheduling-card"
import { CoachSchedulingSidebarItem } from "@/components/coaching/coach-scheduling-sidebar-item"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { SidebarClass } from "@/lib/academy"

import { ClassesSection } from "@/components/app-sidebar/classes-section"
import { RESOURCE_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"
import { SidebarContent, SidebarFooter } from "@/components/ui/sidebar"

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
  hasAcceleratorAccess?: boolean
  hasElectiveAccess?: boolean
  ownedElectiveModuleSlugs?: string[]
  formationStatus?: string | null
  onboardingLocked?: boolean
  onboardingIntentFocus?: "build" | "find" | "fund" | "support" | null
  organizationName?: string | null
  showCoachScheduling?: boolean
}

export function AppSidebar({
  user,
  isAdmin = false,
  isTester = false,
  showOrgAdmin = false,
  canAccessOrgAdmin = true,
  classes,
  showAccelerator,
  hasAcceleratorAccess,
  hasElectiveAccess,
  ownedElectiveModuleSlugs,
  formationStatus,
  onboardingLocked = false,
  onboardingIntentFocus = null,
  organizationName = null,
  showCoachScheduling = false,
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
}

export function SidebarBody({
  isAdmin,
  isTester,
  classes,
  user,
  showAccelerator,
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
}: SidebarBodyProps) {
  const shouldShowAccelerator = !onboardingLocked && Boolean(isAdmin || showAccelerator)
  const hasUser = Boolean(user.email)
  const showMemberWorkspace = !onboardingLocked && onboardingIntentFocus !== "fund"
  const mainNavItems = buildMainNav({
    isAdmin,
    showOrgAdmin,
    canAccessOrgAdmin,
    showMemberWorkspace,
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
          <div className="space-y-4 pt-2">
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
            <NavDocuments items={RESOURCE_NAV} label="Resources" />
          </div>
        )}
        {hasUser ? <NavUser user={user} isAdmin={isAdmin} isTester={isTester} showDivider={false} /> : null}
      </SidebarFooter>
    </>
  )
}
