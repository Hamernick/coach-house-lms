"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down"
import { useEffect, useState, type CSSProperties, type ReactNode } from "react"

import { ShellRightRail } from "@/components/app-shell/components/shell-right-rail"
import {
  RightRailProvider,
  useRightRailPresence,
} from "@/components/app-shell/right-rail"
import { useAppShellRightRailState } from "@/components/app-shell/use-app-shell-right-rail-state"
import {
  HomeCanvasFindRoutePendingToast,
  HomeCanvasPreviewHeader,
} from "@/components/public/home-canvas-preview-shell"
import { HomeCanvasPreviewSidebar } from "@/components/public/home-canvas-preview-sidebar"
import { useHomeCanvasSectionLinkController } from "@/components/public/home-canvas-section-link-controller"
import {
  HomeCanvasSidebarSlotProvider,
  useHomeCanvasSidebarContent,
  useHomeCanvasSidebarPresence,
} from "@/components/public/home-canvas-sidebar-slot"
import {
  isHomeSectionId,
} from "@/components/public/home-canvas-preview-config"
import { isPrimaryPlainNavigationIntent } from "@/components/public/home-canvas-route-link-helpers"
import { useHomeCanvasNavigation } from "@/components/public/home-canvas-preview-navigation"
import {
  CanvasAuthPanel,
  HomeSectionPanel,
} from "@/components/public/home-canvas-preview-panels"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import type {
  SignupBuilderPlanTier,
  SignupIntentFocus,
} from "@/lib/onboarding/signup-plan"
import { cn } from "@/lib/utils"

type HomeCanvasPreviewProps = {
  initialSection?: string
  loginRedirectTo?: string
  pricingPanel?: ReactNode
  findPanel?: ReactNode
  signupIntentFocus?: SignupIntentFocus | null
  signupPlanTier?: SignupBuilderPlanTier | null
}

export function HomeCanvasPreview({
  initialSection,
  loginRedirectTo,
  pricingPanel,
  findPanel,
  signupIntentFocus,
  signupPlanTier,
}: HomeCanvasPreviewProps) {
  return (
    <RightRailProvider>
      <HomeCanvasSidebarSlotProvider>
        <HomeCanvasPreviewContent
          initialSection={initialSection}
          loginRedirectTo={loginRedirectTo}
          pricingPanel={pricingPanel}
          findPanel={findPanel}
          signupIntentFocus={signupIntentFocus}
          signupPlanTier={signupPlanTier}
        />
      </HomeCanvasSidebarSlotProvider>
    </RightRailProvider>
  )
}

function HomeCanvasPreviewContent(props: HomeCanvasPreviewProps) {
  const {
    initialSection,
    loginRedirectTo,
    pricingPanel,
    findPanel,
    signupIntentFocus,
    signupPlanTier,
  } = props
  const router = useRouter()
  const {
    activeSection,
    direction,
    activeSectionBehavior,
    setActivePanelRef,
    changeSection,
    goToAdjacentSection,
    handleWheel,
    handleTouchStart,
    handleTouchEnd,
  } = useHomeCanvasNavigation({ initialSection })
  const hasRightRail = useRightRailPresence()
  const hasSidebarSlot = useHomeCanvasSidebarPresence()
  const sidebarSlotContent = useHomeCanvasSidebarContent()
  const isMobile = useIsMobile()
  const [isFindRoutePending, setIsFindRoutePending] = useState(false)
  const { rightOpen, handleRightOpenChangeUser, handleRightOpenChangeAuto } =
    useAppShellRightRailState({ hasRightRail, isMobile })
  const showFindSidebarShell = activeSection === "find" && hasSidebarSlot
  const hideShellSidebar = activeSection === "find" && !hasSidebarSlot
  const showRightRailToggle = hasRightRail && !isMobile
  const { authPanelProps, handleCanvasPanelClick } =
    useHomeCanvasSectionLinkController({
      changeSection,
      loginRedirectTo,
      signupIntentFocus,
      signupPlanTier,
    })
  const railToggleClassName =
    "size-8 rounded-md border border-[color:var(--shell-border)] text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
  useEffect(() => {
    if (activeSection === "find") {
      setIsFindRoutePending(false)
      return
    }
    router.prefetch("/find")
  }, [activeSection, router])

  function primeFindRoute() {
    if (activeSection === "find") return
    router.prefetch("/find")
  }

  function handleFindRouteClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      !isPrimaryPlainNavigationIntent({
        defaultPrevented: event.defaultPrevented,
        button: event.button,
        metaKey: event.metaKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        target: event.currentTarget.target,
      })
    ) {
      return
    }

    setIsFindRoutePending(true)
  }

  return (
    <SidebarProvider
      defaultOpen
      data-shell-root
      style={
        showFindSidebarShell
          ? ({
              "--sidebar-width": "23rem",
            } as CSSProperties)
          : undefined
      }
      className={cn(
        "text-foreground h-svh min-h-0 overflow-hidden bg-[var(--shell-bg)]",
        "[--shell-bg:var(--background)] [--shell-border:var(--border)] [--shell-rail:var(--background)]",
        "[--sidebar-border:var(--border)] [--sidebar-foreground:var(--foreground)] [--sidebar:var(--background)]",
        "[--shell-content-pad:1rem] [--shell-rail-gap:1rem] [--shell-rail-item-gap:0.5rem] [--shell-rail-item-padding:0.5rem] [--shell-rail-padding:0.75rem] [--shell-right-rail-width:20rem] sm:[--shell-content-pad:1.25rem]"
      )}
    >
      <div className="flex min-h-0 flex-1">
        <HomeCanvasPreviewSidebar
          activeSection={activeSection}
          changeSection={changeSection}
          handleFindRouteClick={handleFindRouteClick}
          hideShellSidebar={hideShellSidebar}
          isFindRoutePending={isFindRoutePending}
          primeFindRoute={primeFindRoute}
          showFindSidebarShell={showFindSidebarShell}
          sidebarSlotContent={sidebarSlotContent}
        />

        <div className="flex min-h-0 flex-1">
          <SidebarInset className="h-full min-h-0 overflow-hidden bg-[var(--shell-bg)]">
            <HomeCanvasPreviewHeader
              activeSection={activeSection}
              changeSection={changeSection}
              hideShellSidebar={hideShellSidebar}
              onRightOpenChange={handleRightOpenChangeUser}
              railToggleClassName={railToggleClassName}
              rightOpen={rightOpen}
              showRightRailToggle={showRightRailToggle}
            />

            <div className="flex min-h-0 flex-1 p-[var(--shell-content-pad)] md:pt-0 md:pr-[var(--shell-content-pad)] md:pb-[var(--shell-content-pad)] md:pl-0">
              <div className="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-[28px] border border-[color:var(--shell-border)] bg-[var(--shell-bg)]">
                {isFindRoutePending ? (
                  <HomeCanvasFindRoutePendingToast />
                ) : null}
                <div
                  key={activeSection}
                  className={cn(
                    "absolute inset-0 overscroll-contain motion-safe:animate-[home-canvas-panel-in_220ms_cubic-bezier(0.22,1,0.36,1)_both]",
                    activeSectionBehavior.scrollable
                      ? "overflow-x-hidden overflow-y-auto"
                      : "overflow-hidden"
                  )}
                  onClickCapture={handleCanvasPanelClick}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onKeyDown={(event) => {
                    if (activeSectionBehavior.lockNavigationGestures) {
                      return
                    }
                    if (event.key === "ArrowDown" || event.key === "PageDown") {
                      event.preventDefault()
                      goToAdjacentSection(1)
                    }
                    if (event.key === "ArrowUp" || event.key === "PageUp") {
                      event.preventDefault()
                      goToAdjacentSection(-1)
                    }
                  }}
                  tabIndex={0}
                  style={
                    {
                      "--home-canvas-panel-y": direction > 0 ? "44px" : "-44px",
                      touchAction: activeSectionBehavior.touchAction,
                    } as CSSProperties
                  }
                  ref={(node) => {
                    setActivePanelRef(activeSection, node)
                  }}
                >
                  {activeSection === "login" ? (
                    <CanvasAuthPanel {...authPanelProps} mode="login" />
                  ) : activeSection === "signup" ? (
                    <CanvasAuthPanel {...authPanelProps} mode="signup" />
                  ) : activeSection === "pricing" ? (
                    (pricingPanel ?? (
                      <div className="mx-auto flex min-h-full w-full max-w-[960px] items-center justify-center px-4 py-6 md:px-6 lg:px-8">
                        <div className="border-border/60 bg-card/60 w-full max-w-xl rounded-2xl border p-6 text-center">
                          <p className="text-muted-foreground text-sm">
                            Pricing is currently unavailable in this preview.
                          </p>
                          <Button asChild className="mt-4 rounded-xl">
                            <Link href="/?section=pricing">Open pricing</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : activeSection === "find" ? (
                    (findPanel ?? (
                      <div className="mx-auto flex min-h-full w-full max-w-[960px] items-center justify-center px-4 py-6 md:px-6 lg:px-8">
                        <div className="border-border/60 bg-card/60 w-full max-w-xl rounded-2xl border p-6 text-center">
                          <p className="text-muted-foreground text-sm">
                            Find organizations is currently unavailable.
                          </p>
                          <Button asChild className="mt-4 rounded-xl">
                            <Link
                              href="/find"
                              prefetch
                              aria-busy={isFindRoutePending || undefined}
                              onClick={handleFindRouteClick}
                              onFocus={primeFindRoute}
                              onMouseEnter={primeFindRoute}
                              onTouchStart={primeFindRoute}
                            >
                              {isFindRoutePending ? "Opening…" : "Open map"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : isHomeSectionId(activeSection) ? (
                    <HomeSectionPanel sectionId={activeSection} />
                  ) : (
                    <HomeSectionPanel sectionId="hero" />
                  )}
                </div>
                {activeSectionBehavior.scrollable ? (
                  <div
                    className="pointer-events-none absolute right-4 bottom-4 z-20"
                    aria-hidden
                  >
                    <div className="bg-background/95 text-foreground border-border/80 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
                      <ArrowDownIcon className="text-muted-foreground h-3.5 w-3.5 animate-bounce" />
                      <span className="text-muted-foreground">Scroll down</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </SidebarInset>
          <ShellRightRail
            open={rightOpen}
            onOpenChange={handleRightOpenChangeUser}
            onAutoClose={handleRightOpenChangeAuto}
          />
        </div>
      </div>
    </SidebarProvider>
  )
}
