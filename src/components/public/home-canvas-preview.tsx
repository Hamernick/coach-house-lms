"use client"

import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import PanelRightCloseIcon from "lucide-react/dist/esm/icons/panel-right-close"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"
import type { ReactNode } from "react"

import { RIGHT_RAIL_ID } from "@/components/app-shell/constants"
import { ShellRightRail } from "@/components/app-shell/components/shell-right-rail"
import { RightRailProvider, useRightRailPresence } from "@/components/app-shell/right-rail"
import { useAppShellRightRailState } from "@/components/app-shell/use-app-shell-right-rail-state"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import {
  ABOUT_LINK_HREF,
  SIDEBAR_CANVAS_NAV,
  isHomeSectionId,
} from "@/components/public/home-canvas-preview-config"
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type HomeCanvasPreviewProps = {
  initialSection?: string
  pricingPanel?: ReactNode
  findPanel?: ReactNode
}

const HOME_CANVAS_NAV_MENU_CLASSNAME = "gap-[var(--shell-rail-item-gap,0.5rem)]"

export function HomeCanvasPreview({ initialSection, pricingPanel, findPanel }: HomeCanvasPreviewProps) {
  return (
    <RightRailProvider>
      <HomeCanvasPreviewContent
        initialSection={initialSection}
        pricingPanel={pricingPanel}
        findPanel={findPanel}
      />
    </RightRailProvider>
  )
}

function HomeCanvasPreviewContent({ initialSection, pricingPanel, findPanel }: HomeCanvasPreviewProps) {
  const {
    activeSection,
    direction,
    activeLabel,
    activeSectionBehavior,
    setActivePanelRef,
    changeSection,
    goToAdjacentSection,
    handleWheel,
    handleTouchStart,
    handleTouchEnd,
  } = useHomeCanvasNavigation({ initialSection })
  const hasRightRail = useRightRailPresence()
  const isMobile = useIsMobile()
  const { rightOpen, handleRightOpenChangeUser, handleRightOpenChangeAuto } =
    useAppShellRightRailState({
      hasRightRail,
      isMobile,
    })
  const railToggleClassName =
    "size-8 rounded-md border border-[color:var(--shell-border)] text-muted-foreground hover:bg-foreground/5 hover:text-foreground"

  return (
    <SidebarProvider
      defaultOpen
      data-shell-root
      className={cn(
        "h-svh min-h-0 overflow-hidden text-foreground bg-[var(--shell-bg)]",
        "[--shell-bg:var(--background)] [--shell-rail:var(--background)] [--shell-border:var(--border)]",
        "[--sidebar:var(--background)] [--sidebar-foreground:var(--foreground)] [--sidebar-border:var(--border)]",
        "[--shell-content-pad:1rem] sm:[--shell-content-pad:1.25rem] [--shell-rail-padding:0.75rem] [--shell-rail-item-padding:0.5rem] [--shell-rail-item-gap:0.5rem] [--shell-rail-gap:1rem] [--shell-right-rail-width:20rem]",
      )}
    >
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsible="icon" variant="sidebar" className="border-0 bg-[var(--shell-rail)]">
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
                      <Link href="/find" className="flex w-full items-center gap-2">
                        <span>Find</span>
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
        </Sidebar>

        <div className="flex min-h-0 flex-1">
          <SidebarInset className="h-full min-h-0 overflow-hidden bg-[var(--shell-bg)]">
            <header
              className="flex min-h-14 shrink-0 items-center justify-between gap-2 py-2 px-[var(--shell-content-pad)] text-sm text-muted-foreground"
            >
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger
                  className={railToggleClassName}
                  aria-label="Toggle sidebar"
                />
                <Separator orientation="vertical" className="h-4 bg-border" />
                <div id="site-header-title" className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground">{activeLabel}</p>
                </div>
              </div>
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
                {hasRightRail && !isMobile ? (
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
                              <Link href="/find">Open map</Link>
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
