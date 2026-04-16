"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import PanelRightCloseIcon from "lucide-react/dist/esm/icons/panel-right-close"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"
import { useEffect, useState, type CSSProperties, type ReactNode } from "react"

import { RIGHT_RAIL_ID } from "@/components/app-shell/constants"
import { ShellRightRail } from "@/components/app-shell/components/shell-right-rail"
import { RightRailProvider, useRightRailPresence } from "@/components/app-shell/right-rail"
import { useAppShellRightRailState } from "@/components/app-shell/use-app-shell-right-rail-state"
import {
  HomeCanvasSidebarSlotProvider,
  useHomeCanvasSidebarContent,
  useHomeCanvasSidebarPresence,
} from "@/components/public/home-canvas-sidebar-slot"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import {
  ABOUT_LINK_HREF,
  SIDEBAR_CANVAS_NAV,
  isHomeSectionId,
} from "@/components/public/home-canvas-preview-config"
import { isPrimaryPlainNavigationIntent } from "@/components/public/home-canvas-route-link-helpers"
import { useHomeCanvasNavigation } from "@/components/public/home-canvas-preview-navigation"
import { CanvasAuthPanel, HomeSectionPanel } from "@/components/public/home-canvas-preview-panels"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type HomeCanvasPreviewProps = {
  initialSection?: string
  pricingPanel?: ReactNode
  findPanel?: ReactNode
}

const HOME_CANVAS_NAV_MENU_CLASSNAME = "gap-1"

export function HomeCanvasPreview({ initialSection, pricingPanel, findPanel }: HomeCanvasPreviewProps) {
  return (
    <RightRailProvider>
      <HomeCanvasSidebarSlotProvider>
        <HomeCanvasPreviewContent
          initialSection={initialSection}
          pricingPanel={pricingPanel}
          findPanel={findPanel}
        />
      </HomeCanvasSidebarSlotProvider>
    </RightRailProvider>
  )
}

function HomeCanvasPreviewContent({ initialSection, pricingPanel, findPanel }: HomeCanvasPreviewProps) {
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
    useAppShellRightRailState({
      hasRightRail,
      isMobile,
    })
  const showFindSidebarShell = activeSection === "find" && hasSidebarSlot
  const hideShellSidebar = activeSection === "find" && !hasSidebarSlot
  const showRightRailToggle = hasRightRail && !isMobile
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
        "h-svh min-h-0 overflow-hidden text-foreground bg-[var(--shell-bg)]",
        "[--shell-bg:var(--background)] [--shell-rail:var(--background)] [--shell-border:var(--border)]",
        "[--sidebar:var(--background)] [--sidebar-foreground:var(--foreground)] [--sidebar-border:var(--border)]",
        "[--shell-content-pad:1rem] sm:[--shell-content-pad:1.25rem] [--shell-rail-padding:0.75rem] [--shell-rail-item-padding:0.5rem] [--shell-rail-item-gap:0.5rem] [--shell-rail-gap:1rem] [--shell-right-rail-width:20rem]",
      )}
    >
      <div className="flex min-h-0 flex-1">
        {hideShellSidebar ? null : (
          <Sidebar
            collapsible={showFindSidebarShell ? "offcanvas" : "icon"}
            variant="sidebar"
            className="border-0 bg-[var(--shell-rail)]"
          >
            <SidebarHeader>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-sidebar-accent"
                aria-label="Coach House home"
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
                <span className="truncate text-base font-bold leading-none tracking-tight group-data-[collapsible=icon]:hidden">
                  Coach House
                </span>
              </Link>
            </SidebarHeader>

            {showFindSidebarShell ? (
              sidebarSlotContent ?? <SidebarContent className="min-h-0 flex-1" />
            ) : (
              <SidebarContent className="pt-3">
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu className={HOME_CANVAS_NAV_MENU_CLASSNAME}>
                      {SIDEBAR_CANVAS_NAV.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            type="button"
                            isActive={activeSection === item.id}
                            tooltip={item.label}
                            aria-current={activeSection === item.id ? "page" : undefined}
                            onClick={() => changeSection(item.id)}
                          >
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          tooltip="Find organizations"
                          isActive={activeSection === "find"}
                          aria-current={activeSection === "find" ? "page" : undefined}
                        >
                          <Link
                            href="/find"
                            prefetch
                            aria-busy={isFindRoutePending || undefined}
                            onClick={handleFindRouteClick}
                            onFocus={primeFindRoute}
                            onMouseEnter={primeFindRoute}
                            onTouchStart={primeFindRoute}
                            className="flex w-full items-center gap-2"
                          >
                            {isFindRoutePending ? (
                              <>
                                <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden />
                                <span>Opening…</span>
                              </>
                            ) : (
                              <span>Find</span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="mt-auto pt-1 pb-[calc(var(--shell-rail-padding,0.75rem)+0.25rem)]">
                  <SidebarGroupContent>
                    <SidebarMenu className={HOME_CANVAS_NAV_MENU_CLASSNAME}>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          type="button"
                          isActive={activeSection === "signup"}
                          tooltip="Sign up"
                          className="h-8 w-fit justify-center rounded-full border px-3 bg-background hover:bg-accent hover:text-accent-foreground data-[active=true]:border-transparent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                          onClick={() => changeSection("signup")}
                        >
                          <span>Sign up</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a href={ABOUT_LINK_HREF} target="_blank" rel="noreferrer noopener">
                            <span className="truncate">About</span>
                            <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground/65" aria-hidden />
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            )}
          </Sidebar>
        )}

        <div className="flex min-h-0 flex-1">
          <SidebarInset className="h-full min-h-0 overflow-hidden bg-[var(--shell-bg)]">
            <header
              className="flex min-h-14 shrink-0 items-center justify-end gap-2 py-2 px-[var(--shell-content-pad)] text-sm text-muted-foreground"
            >
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant={activeSection === "login" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => changeSection("login")}
                >
                  Login
                </Button>
                <PublicThemeToggle variant="outline" size="icon" />
                {showRightRailToggle ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={railToggleClassName}
                    aria-controls={RIGHT_RAIL_ID}
                    aria-expanded={rightOpen}
                    onClick={() => handleRightOpenChangeUser(!rightOpen)}
                  >
                    {rightOpen ? (
                      <PanelRightCloseIcon className="h-4 w-4" />
                    ) : (
                      <PanelRightOpenIcon className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle details panel</span>
                  </Button>
                ) : null}
              </div>
            </header>

            <div className="flex min-h-0 flex-1 p-[var(--shell-content-pad)] md:pb-[var(--shell-content-pad)] md:pr-[var(--shell-content-pad)] md:pl-0 md:pt-0">
              <div className="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-[28px] border border-[color:var(--shell-border)] bg-[var(--shell-bg)]">
                {isFindRoutePending ? (
                  <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex justify-center md:justify-start">
                    <div
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/92 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur"
                      aria-live="polite"
                    >
                      <LoaderCircleIcon className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                      <span>Opening Find…</span>
                    </div>
                  </div>
                ) : null}
                <AnimatePresence custom={direction} initial={false} mode="wait">
                  <motion.div
                    key={activeSection}
                    custom={direction}
                    initial={{ opacity: 0, y: direction > 0 ? 56 : -56 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: direction > 0 ? -56 : 56 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "absolute inset-0 overscroll-contain",
                      activeSectionBehavior.scrollable ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
                    )}
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
                    style={{ touchAction: activeSectionBehavior.touchAction }}
                    ref={(node) => {
                      setActivePanelRef(activeSection, node)
                    }}
                  >
                    {activeSection === "login" ? (
                      <CanvasAuthPanel mode="login" />
                    ) : activeSection === "signup" ? (
                      <CanvasAuthPanel mode="signup" />
                    ) : activeSection === "pricing" ? (
                      pricingPanel ?? (
                        <div className="mx-auto flex min-h-full w-full max-w-[960px] items-center justify-center px-4 py-6 md:px-6 lg:px-8">
                          <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
                            <p className="text-sm text-muted-foreground">
                              Pricing is currently unavailable in this preview.
                            </p>
                            <Button asChild className="mt-4 rounded-xl">
                              <Link href="/?section=pricing">Open pricing</Link>
                            </Button>
                          </div>
                        </div>
                      )
                    ) : activeSection === "find" ? (
                      findPanel ?? (
                        <div className="mx-auto flex min-h-full w-full max-w-[960px] items-center justify-center px-4 py-6 md:px-6 lg:px-8">
                          <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card/60 p-6 text-center">
                            <p className="text-sm text-muted-foreground">Find organizations is currently unavailable.</p>
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
                      )
                    ) : isHomeSectionId(activeSection) ? (
                      <HomeSectionPanel sectionId={activeSection} />
                    ) : (
                      <HomeSectionPanel sectionId="hero" />
                    )}
                  </motion.div>
                </AnimatePresence>
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
