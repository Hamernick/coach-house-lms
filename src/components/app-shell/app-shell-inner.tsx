"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { SidebarBody } from "@/components/app-sidebar"
import { ClassesSection } from "@/components/app-sidebar/classes-section"
import {
  CaseStudyAutofillFab,
  GlobalSearch,
  OnboardingWelcome,
  PaywallOverlay,
  TutorialManager,
} from "@/components/app-shell/dynamic-components"
import {
  AppShellHeader,
  AppShellMobileNav,
  ShellRightRail,
  SidebarAutoCollapse,
  SidebarBrand,
} from "@/components/app-shell/components"
import { RightRailSlot, useRightRailPresence } from "@/components/app-shell/right-rail"
import { AppShellRightRailControlsProvider } from "@/components/app-shell/right-rail-controls"
import { Sidebar, SidebarHeader, SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { resolveDevtoolsAccess } from "@/lib/devtools/access"
import { releaseStaleInteractionLocks } from "@/lib/ui/interaction-lock-guard"
import { cn } from "@/lib/utils"
import { resolveAppShellOnboardingRedirectTarget } from "./onboarding-redirect"
import { useAppShellRightRailState } from "./use-app-shell-right-rail-state"

import type { AppShellProps } from "./types"

export function AppShellInner({
  children,
  breadcrumbs,
  sidebarTree,
  user,
  isAdmin,
  isTester = false,
  showOrgAdmin = false,
  canAccessOrgAdmin = true,
  acceleratorProgress,
  showAccelerator,
  hasActiveSubscription,
  hasAcceleratorAccess,
  hasElectiveAccess,
  ownedElectiveModuleSlugs = [],
  currentPlanTier = "free",
  organizationName = null,
  onboardingLocked = false,
  onboardingIntentFocus = null,
  context,
  formationStatus,
}: AppShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const hasUser = Boolean(user?.email)
  const derivedContext = context ?? (pathname?.startsWith("/accelerator") ? "accelerator" : "platform")
  const isAdminContext = derivedContext === "admin"
  const isAcceleratorContext = derivedContext === "accelerator"
  const isAcceleratorRoadmapRoute = Boolean(pathname?.startsWith("/accelerator/roadmap"))
  const isModulePage = pathname?.includes("/module/")
  const showClasses = Boolean(pathname?.includes("/class/"))
  const showLeftClasses = showClasses && !isAcceleratorContext
  const showAcceleratorTrackRail = false
  const showAcceleratorRail =
    showAcceleratorTrackRail &&
    isAcceleratorContext &&
    !isAcceleratorRoadmapRoute &&
    sidebarTree.length > 0

  const hasRightRail = useRightRailPresence()
  const isMobile = useIsMobile()
  const { rightOpen, handleRightOpenChangeUser, handleRightOpenChangeAuto } =
    useAppShellRightRailState({
      hasRightRail,
      isMobile,
      autoOpenOnDesktopWhenAvailable: hasUser,
    })
  const rightRailControls = useMemo(
    () => ({
      rightOpen,
      setRightOpenUser: handleRightOpenChangeUser,
      setRightOpenAuto: handleRightOpenChangeAuto,
    }),
    [handleRightOpenChangeAuto, handleRightOpenChangeUser, rightOpen],
  )

  const navUser = useMemo(
    () => ({
      name: user?.name ?? null,
      title: user?.title ?? null,
      email: user?.email ?? null,
      avatar: user?.avatar ?? null,
    }),
    [user?.avatar, user?.email, user?.name, user?.title],
  )

  const classesBasePath = isAcceleratorContext ? "/accelerator" : ""
  const tutorialKey = isAcceleratorContext ? "accelerator" : "platform"
  const resolvedHasAcceleratorAccess =
    hasAcceleratorAccess ?? Boolean(hasActiveSubscription || showAccelerator || isAdmin)
  const resolvedHasElectiveAccess = hasElectiveAccess ?? resolvedHasAcceleratorAccess
  const devtoolsAccess = resolveDevtoolsAccess({ isAdmin, isTester })
  const isOrganizationRoute = Boolean(
    pathname?.startsWith("/organization") ||
      pathname?.startsWith("/workspace") ||
      pathname?.startsWith("/my-organization")
  )
  const hasOrganizationEditorParams = Boolean(
    searchParams.get("view") === "editor" || searchParams.get("tab") || searchParams.get("programId"),
  )
  const useFullBleedContentBody = isOrganizationRoute && hasOrganizationEditorParams
  const contentPadding = isMobile ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : "pb-4"
  const contentHorizontalPadding = isMobile ? "px-[var(--shell-gutter)]" : "pl-[var(--shell-outer-gutter)]"
  const onboardingRedirectTarget = resolveAppShellOnboardingRedirectTarget({
    onboardingLocked,
    onboardingIntentFocus,
    isAdminContext,
    pathname,
  })

  const brandHref = hasUser ? (isAcceleratorContext ? "/accelerator" : "/workspace") : "/"

  useEffect(() => {
    const run = () => releaseStaleInteractionLocks()
    const timeoutId = window.setTimeout(run, 0)
    const rafId = window.requestAnimationFrame(run)

    window.addEventListener("focus", run)
    window.addEventListener("pageshow", run)
    document.addEventListener("visibilitychange", run)
    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("focus", run)
      window.removeEventListener("pageshow", run)
      document.removeEventListener("visibilitychange", run)
    }
  }, [pathname, searchParamsKey])

  useEffect(() => {
    if (!onboardingRedirectTarget) return
    const currentTarget = `${window.location.pathname}${window.location.search}`
    if (currentTarget === onboardingRedirectTarget) return
    window.location.replace(onboardingRedirectTarget)
  }, [onboardingRedirectTarget])

  return (
    <AppShellRightRailControlsProvider value={rightRailControls}>
      <SidebarProvider
      defaultOpen={!isAcceleratorContext}
      data-shell-root
      className={cn(
        "h-svh min-h-0 overflow-hidden text-foreground bg-[var(--shell-bg)]",
        "[--shell-bg:var(--background)] [--shell-rail:var(--background)] [--shell-panel:var(--background)]",
        "[--shell-card:var(--background)] [--shell-border:var(--border)]",
        "[--shell-gutter:1.25rem] [--shell-content-pad:1rem] sm:[--shell-content-pad:1.25rem] lg:[--shell-content-pad:1.5rem] [--shell-rail-padding:0.75rem] [--shell-rail-item-padding:0.5rem] [--shell-rail-gap:1rem]",
        "[--shell-right-rail-width:var(--sidebar-width)]",
        "[--sidebar:var(--background)] [--sidebar-foreground:var(--foreground)] [--sidebar-border:var(--border)]",
        isAcceleratorContext && "[--shell-right-rail-width:16rem]",
        isModulePage && "[--shell-right-rail-width:17rem]",
      )}
      >
      <SidebarAutoCollapse active={isAcceleratorContext} />
      {showAcceleratorRail ? (
        <RightRailSlot priority={1}>
          <ClassesSection
            classes={sidebarTree}
            isAdmin={isAdmin}
            basePath={classesBasePath}
            hasAcceleratorAccess={resolvedHasAcceleratorAccess}
            hasElectiveAccess={resolvedHasElectiveAccess}
            ownedElectiveModuleSlugs={ownedElectiveModuleSlugs}
            formationStatus={formationStatus}
          />
        </RightRailSlot>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsible="icon"
          variant="sidebar"
          className="bg-[var(--shell-rail)] border-0"
        >
          <SidebarHeader>
            <SidebarBrand href={brandHref} />
          </SidebarHeader>
          <SidebarBody
            isAdmin={isAdmin}
            isTester={isTester}
            showOrgAdmin={showOrgAdmin}
            canAccessOrgAdmin={canAccessOrgAdmin}
            classes={sidebarTree}
            user={navUser}
            showAccelerator={showAccelerator}
            showClasses={showLeftClasses}
            classesBasePath={classesBasePath}
            hasAcceleratorAccess={resolvedHasAcceleratorAccess}
            hasElectiveAccess={resolvedHasElectiveAccess}
            ownedElectiveModuleSlugs={ownedElectiveModuleSlugs}
            formationStatus={formationStatus}
            onboardingLocked={onboardingLocked}
            organizationName={organizationName}
            showCoachScheduling={!isAcceleratorContext}
          />
        </Sidebar>

        <SidebarInset
          className={cn(
            "h-full min-h-0 overflow-hidden text-foreground bg-[var(--shell-bg)]",
            "[--shell-max-w:min(1400px,100%)] md:peer-data-[state=collapsed]:[--shell-max-w:min(1600px,100%)]",
            "[--shell-outer-gutter:0px] md:peer-data-[state=collapsed]:[--shell-outer-gutter:0px]",
          )}
        >
          <AppShellHeader
            breadcrumbs={breadcrumbs}
            hasUser={hasUser}
            isAdmin={isAdmin}
            onboardingLocked={onboardingLocked}
            rightOpen={rightOpen}
            onRightOpenChange={handleRightOpenChangeUser}
          />
          <div className="flex h-full min-h-0 flex-col">
            <div
              className={cn(
                "flex min-h-0 flex-1 gap-0",
                contentPadding,
                contentHorizontalPadding,
                !isMobile && (!hasRightRail || !rightOpen) && "pr-[var(--shell-gutter)]",
              )}
            >
              <div className="flex min-h-0 w-full flex-1 flex-col">
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--shell-bg)] shadow-none",
                    isMobile ? "rounded-none border-0" : "rounded-[28px] border border-[color:var(--shell-border)]",
                  )}
                >
                  <div
                    data-shell-scroll
                    data-tour-scroll
                    data-accelerator-scroll={isAcceleratorContext ? "" : undefined}
                    role="main"
                    className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    <div className="@container/shell flex min-h-full w-full flex-col">
                      <div
                        id="shell-content-header"
                        className="empty:hidden border-b border-[color:var(--shell-border)] bg-[var(--shell-card)] px-[var(--shell-content-pad)] py-1"
                      />
                      <div
                        data-shell-content-body
                        data-shell-mode="default"
                        className={cn(
                          "flex min-h-0 flex-1 flex-col",
                          useFullBleedContentBody
                            ? "gap-0 px-0 py-0"
                            : "gap-6 px-[var(--shell-content-pad)] py-[var(--shell-content-pad)]",
                        )}
                      >
                        {onboardingRedirectTarget ? (
                          <div className="flex min-h-[40svh] flex-1 items-center justify-center px-6 py-16">
                            <p className="text-sm text-muted-foreground">
                              Redirecting to workspace setup…
                            </p>
                          </div>
                        ) : (
                          children
                        )}
                      </div>
                      <div
                        id="shell-content-footer"
                        className="empty:hidden border-t border-[color:var(--shell-border)] bg-[var(--shell-card)] px-[var(--shell-content-pad)] py-3"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <ShellRightRail
                open={rightOpen}
                onOpenChange={handleRightOpenChangeUser}
                onAutoClose={handleRightOpenChangeAuto}
              />
            </div>
          </div>
        </SidebarInset>
      </div>

      <AppShellMobileNav rightOpen={rightOpen} onRightOpenChange={handleRightOpenChangeUser} />
      {hasUser && !onboardingLocked && !isAdminContext ? (
        <GlobalSearch
          isAdmin={isAdmin}
          showOrgAdmin={showOrgAdmin}
          context={isAcceleratorContext ? "accelerator" : "platform"}
          classes={sidebarTree}
          showAccelerator={showAccelerator}
        />
      ) : null}
      {!isAdminContext && devtoolsAccess.canUseAutofillTools ? (
        <CaseStudyAutofillFab userEmail={navUser.email} />
      ) : null}
      {!isAdminContext ? <PaywallOverlay currentPlanTier={currentPlanTier} /> : null}
      {!isAdminContext ? <TutorialManager /> : null}
      {hasUser && !isAdminContext ? (
        <OnboardingWelcome
          tutorial={tutorialKey}
          hasActiveSubscription={hasActiveSubscription}
        />
      ) : null}
      </SidebarProvider>
    </AppShellRightRailControlsProvider>
  )
}
