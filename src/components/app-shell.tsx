"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import PanelLeftCloseIcon from "lucide-react/dist/esm/icons/panel-left-close"
import PanelLeftOpenIcon from "lucide-react/dist/esm/icons/panel-left-open"
import PanelRightCloseIcon from "lucide-react/dist/esm/icons/panel-right-close"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"

import { SidebarBody } from "@/components/app-sidebar"
import { ClassesSection } from "@/components/app-sidebar/classes-section"
import { GlobalSearch } from "@/components/global-search"
import { OnboardingDialogEntry } from "@/components/onboarding/onboarding-dialog-entry"
import { OnboardingWelcome } from "@/components/onboarding/onboarding-welcome"
import { NotificationsMenu } from "@/components/notifications/notifications-menu"
import { SupportMenu } from "@/components/support-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { TutorialManager } from "@/components/tutorial/tutorial-manager"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Sidebar, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SidebarClass } from "@/lib/academy"
import type { OnboardingDialogProps } from "@/components/onboarding/onboarding-dialog"
import { cn } from "@/lib/utils"

import { RightRailProvider, RightRailSlot, useRightRailContent, useRightRailPresence } from "@/components/app-shell/right-rail"

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"
const RIGHT_RAIL_ID = "app-shell-right-rail"

type AppShellProps = {
  children: ReactNode
  breadcrumbs?: ReactNode
  sidebarTree: SidebarClass[]
  user?: {
    name: string | null
    email: string | null
    avatar?: string | null
  } | null
  isAdmin: boolean
  showOrgAdmin?: boolean
  acceleratorProgress?: number | null
  showAccelerator?: boolean
  hasActiveSubscription?: boolean
  tutorialWelcome?: { platform: boolean; accelerator: boolean }
  onboardingProps?: OnboardingDialogProps & { enabled: boolean }
  context?: "platform" | "accelerator" | "public"
  formationStatus?: string | null
}

export function AppShell(props: AppShellProps) {
  return (
    <RightRailProvider>
      <AppShellInner {...props} />
    </RightRailProvider>
  )
}

type SidebarBrandProps = {
  href: string
}

function SidebarAutoCollapse({ active }: { active: boolean }) {
  const { setOpen } = useSidebar()
  const collapsedOnceRef = useRef(false)

  useEffect(() => {
    if (active && !collapsedOnceRef.current) {
      setOpen(false)
      collapsedOnceRef.current = true
    }
  }, [active, setOpen])

  return null
}

function SidebarBrand({ href }: SidebarBrandProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Link
      href={href}
      aria-label="Coach House home"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-sidebar-accent",
        isCollapsed && "justify-center",
      )}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <Image
          src="/coach-house-logo-light.png"
          alt="Coach House logo"
          width={32}
          height={32}
          className="block dark:hidden"
          priority
        />
        <Image
          src="/coach-house-logo-dark.png"
          alt="Coach House logo"
          width={32}
          height={32}
          className="hidden dark:block"
          priority
        />
      </span>
      {isCollapsed ? null : (
        <span className="text-sm font-semibold leading-none tracking-tight">Coach House</span>
      )}
    </Link>
  )
}

function AppShellInner({
  children,
  breadcrumbs,
  sidebarTree,
  user,
  isAdmin,
  showOrgAdmin = false,
  acceleratorProgress,
  showAccelerator,
  hasActiveSubscription,
  tutorialWelcome,
  onboardingProps,
  context,
  formationStatus,
}: AppShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const welcomeParam = searchParams.get("welcome")
  const hasUser = Boolean(user?.email)
  const derivedContext = context ?? (pathname?.startsWith("/accelerator") ? "accelerator" : "platform")
  const isAcceleratorContext = derivedContext === "accelerator"
  const isModulePage = pathname?.includes("/module/")
  const showClasses = Boolean(pathname?.includes("/class/"))
  const showLeftClasses = showClasses && !isAcceleratorContext
  const showAcceleratorRail = isAcceleratorContext && sidebarTree.length > 0

  const [forcedOnboardingOpen, setForcedOnboardingOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const hasRightRail = useRightRailPresence()
  const isMobile = useIsMobile()
  const rightRailPreferenceRef = useRef<"open" | "closed" | null>(null)
  const wasMobileRef = useRef(isMobile)
  const contentPadding = isMobile
    ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
    : "pb-4"

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = () => setForcedOnboardingOpen(true)
    window.addEventListener("coachhouse:onboarding:start", handler)
    return () => window.removeEventListener("coachhouse:onboarding:start", handler)
  }, [])

  useEffect(() => {
    if (welcomeParam === "1") {
      setForcedOnboardingOpen(false)
    }
  }, [welcomeParam])

  useEffect(() => {
    if (!hasRightRail) {
      setRightOpen(false)
      return
    }
    if (!isMobile && rightRailPreferenceRef.current === null) {
      setRightOpen(true)
    }
  }, [hasRightRail, isMobile])

  useEffect(() => {
    if (isMobile && !wasMobileRef.current) {
      setRightOpen(false)
    }
    wasMobileRef.current = isMobile
  }, [isMobile])

  const handleRightOpenChange = (open: boolean, source: "user" | "auto" = "user") => {
    if (source === "user") {
      rightRailPreferenceRef.current = open ? "open" : "closed"
    }
    setRightOpen(open)
  }

  const handleRightOpenChangeUser = (open: boolean) => handleRightOpenChange(open, "user")
  const handleRightOpenChangeAuto = (open: boolean) => handleRightOpenChange(open, "auto")

  const navUser = useMemo(
    () => ({
      name: user?.name ?? null,
      email: user?.email ?? null,
      avatar: user?.avatar ?? null,
    }),
    [user?.avatar, user?.email, user?.name],
  )

  const classesBasePath = isAcceleratorContext ? "/accelerator" : ""
  const tutorialKey = isAcceleratorContext ? "accelerator" : "platform"
  const tutorialOpen = isAcceleratorContext ? Boolean(tutorialWelcome?.accelerator) : Boolean(tutorialWelcome?.platform)
  const hasAcceleratorAccess = Boolean(hasActiveSubscription || showAccelerator || isAdmin)

  const brandHref = hasUser ? (isAcceleratorContext ? "/accelerator" : "/my-organization") : "/"

  return (
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
          isAcceleratorContext && "[--shell-right-rail-width:17rem]",
          isModulePage && "[--shell-right-rail-width:18rem]",
        )}
      >
      <SidebarAutoCollapse active={isAcceleratorContext} />
      {showAcceleratorRail ? (
        <RightRailSlot priority={1}>
          <ClassesSection
            classes={sidebarTree}
            isAdmin={isAdmin}
            basePath={classesBasePath}
            hasAcceleratorAccess={hasAcceleratorAccess}
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
            showOrgAdmin={showOrgAdmin}
            classes={sidebarTree}
            user={navUser}
            isAcceleratorActive={isAcceleratorContext}
            acceleratorProgress={acceleratorProgress}
            showAccelerator={showAccelerator}
            showClasses={showLeftClasses}
            classesBasePath={classesBasePath}
            hasAcceleratorAccess={hasAcceleratorAccess}
            formationStatus={formationStatus}
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
            rightOpen={rightOpen}
            onRightOpenChange={handleRightOpenChangeUser}
          />
          <div className="flex h-full min-h-0 flex-col">
            <div
              className={cn(
                "flex min-h-0 flex-1 gap-0",
                contentPadding,
                isMobile ? "px-[var(--shell-gutter)]" : "pl-[var(--shell-outer-gutter)]",
                !isMobile && (!hasRightRail || !rightOpen) && "pr-[var(--shell-gutter)]",
              )}
            >
              <div className="flex min-h-0 w-full flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[color:var(--shell-border)] bg-[var(--shell-bg)] shadow-none">
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
                        className="flex min-h-0 flex-1 flex-col gap-6 px-[var(--shell-content-pad)] py-[var(--shell-content-pad)]"
                      >
                        {children}
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
      {hasUser ? (
        <GlobalSearch
          isAdmin={isAdmin}
          showOrgAdmin={showOrgAdmin}
          context={isAcceleratorContext ? "accelerator" : "platform"}
          classes={sidebarTree}
          showAccelerator={showAccelerator}
        />
      ) : null}
      <TutorialManager />
      {hasUser ? (
        <OnboardingWelcome
          tutorial={tutorialKey}
          defaultOpen={tutorialOpen}
          hasActiveSubscription={hasActiveSubscription}
        />
      ) : null}
      {onboardingProps?.enabled ? (
        <OnboardingDialogEntry {...onboardingProps} open={Boolean(onboardingProps.open || forcedOnboardingOpen)} />
      ) : null}
    </SidebarProvider>
  )
}

type AppShellHeaderProps = {
  breadcrumbs?: ReactNode
  hasUser: boolean
  isAdmin: boolean
  rightOpen: boolean
  onRightOpenChange: (open: boolean) => void
}

function AppShellHeader({
  breadcrumbs,
  hasUser,
  isAdmin,
  rightOpen,
  onRightOpenChange,
}: AppShellHeaderProps) {
  const hasRightRail = useRightRailPresence()
  const { isMobile } = useSidebar()
  const showHeaderToggles = !isMobile
  const shellMaxWidth = "100%"
  const toggleButtonClass =
    "size-8 rounded-md border border-[color:var(--shell-border)] bg-transparent text-muted-foreground shadow-none transition-colors hover:bg-foreground/5 hover:text-foreground"
  const headerRightPadding = !isMobile && hasRightRail && rightOpen ? "var(--shell-right-rail-width)" : "0px"

  return (
    <header
      className="flex shrink-0 flex-col bg-[var(--shell-bg)] text-sm text-muted-foreground"
      style={
        {
          "--shell-header-max": shellMaxWidth,
          "--shell-right-rail": headerRightPadding,
        } as CSSProperties
      }
    >
      <div
        className="flex min-h-14 min-w-0 items-center py-2 transition-[padding] duration-200 ease-out motion-reduce:transition-none md:py-0 pl-[var(--shell-content-pad)] pr-[calc(var(--shell-content-pad)+var(--shell-right-rail))]"
      >
        <div className="flex w-full min-w-0 flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-2">
            {showHeaderToggles ? <SidebarTrigger className={toggleButtonClass} aria-label="Toggle sidebar" /> : null}
            {showHeaderToggles ? <Separator orientation="vertical" className="h-4 bg-border" /> : null}
            <div id="site-header-title" className="min-w-0 flex-1 overflow-hidden">
              {breadcrumbs}
            </div>
          </div>
          <div
            id="site-header-actions-center"
            className="hidden min-w-0 items-center md:flex md:justify-end lg:justify-center"
          />
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 md:flex-nowrap">
            <div id="site-header-actions-right" className="flex flex-wrap items-center gap-2 md:flex-nowrap" />
            {hasUser ? <NotificationsMenu /> : null}
            <ThemeToggle />
            {hasUser && !isAdmin ? (
              <SupportMenu
                email={SUPPORT_EMAIL}
                buttonVariant="ghost"
                buttonSize="sm"
                buttonClassName="text-sm"
              />
            ) : null}
            {!hasUser ? (
              <Button variant="outline" size="sm" asChild className="border-[color:var(--shell-border)] bg-transparent">
                <Link href="/login">Sign in</Link>
              </Button>
            ) : null}
            {hasRightRail && showHeaderToggles ? (
              <Button
                variant="ghost"
                size="icon"
                className={toggleButtonClass}
                aria-controls={RIGHT_RAIL_ID}
                aria-expanded={rightOpen}
                onClick={() => onRightOpenChange(!rightOpen)}
              >
                {rightOpen ? <PanelRightCloseIcon className="h-4 w-4" /> : <PanelRightOpenIcon className="h-4 w-4" />}
                <span className="sr-only">Toggle details panel</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div
        id="site-header-subnav"
        className="empty:hidden border-t border-[color:var(--shell-border)] bg-[var(--shell-bg)]"
      />
    </header>
  )
}

function AppShellMobileNav({
  rightOpen,
  onRightOpenChange,
}: {
  rightOpen: boolean
  onRightOpenChange: (open: boolean) => void
}) {
  const hasRightRail = useRightRailPresence()
  const { isMobile, openMobile, toggleSidebar } = useSidebar()

  if (!isMobile) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--shell-border)] bg-[var(--shell-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--shell-bg)]/80">
      <div
        className={cn(
          "grid items-center gap-6 px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
          hasRightRail ? "grid-cols-2" : "grid-cols-1 justify-items-center",
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-full border-[color:var(--shell-border)] bg-transparent"
            aria-label="Toggle sidebar"
            aria-expanded={openMobile}
            onClick={toggleSidebar}
          >
            {openMobile ? (
              <PanelLeftCloseIcon className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftOpenIcon className="h-5 w-5" aria-hidden />
            )}
          </Button>
          <span className="text-[11px] font-medium text-muted-foreground">Menu</span>
        </div>
        {hasRightRail ? (
          <div className="flex flex-col items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-full border-[color:var(--shell-border)] bg-transparent"
              aria-label="Toggle details panel"
              aria-controls={RIGHT_RAIL_ID}
              aria-expanded={rightOpen}
              onClick={() => onRightOpenChange(!rightOpen)}
            >
              {rightOpen ? (
                <PanelRightCloseIcon className="h-5 w-5" aria-hidden />
              ) : (
                <PanelRightOpenIcon className="h-5 w-5" aria-hidden />
              )}
            </Button>
            <span className="text-[11px] font-medium text-muted-foreground">Details</span>
          </div>
        ) : null}
      </div>
    </nav>
  )
}

function ShellRightRail({
  open,
  onOpenChange,
  onAutoClose,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAutoClose?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const content = useRightRailContent()
  const hasContent = Boolean(content)

  useEffect(() => {
    if (!hasContent && open) {
      if (onAutoClose) {
        onAutoClose(false)
      } else {
        onOpenChange(false)
      }
    }
  }, [hasContent, onAutoClose, onOpenChange, open])

  if (!hasContent) return null

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[var(--shell-right-rail-width)] border-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Details</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto px-4 py-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      id={RIGHT_RAIL_ID}
      data-state={open ? "open" : "closed"}
      className={cn(
        "relative z-30 hidden h-full shrink-0 flex-col overflow-hidden bg-[var(--shell-bg)] md:flex",
        "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        "data-[state=closed]:delay-150 data-[state=open]:delay-0",
        open ? "w-[var(--shell-right-rail-width)]" : "w-0 pointer-events-none",
      )}
    >
      <div
        data-state={open ? "open" : "closed"}
        className={cn(
          "h-full w-full overflow-y-auto px-[var(--shell-rail-padding)] pb-4 pt-0",
          "transition-opacity duration-150 ease-out motion-reduce:transition-none",
          "data-[state=closed]:opacity-0 data-[state=open]:opacity-100 data-[state=open]:delay-150",
        )}
      >
        {content}
      </div>
    </aside>
  )
}
