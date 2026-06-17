"use client"

import Image from "next/image"
import Link from "next/link"
import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import PanelLeftCloseIcon from "lucide-react/dist/esm/icons/panel-left-close"
import PanelLeftOpenIcon from "lucide-react/dist/esm/icons/panel-left-open"
import PanelRightCloseIcon from "lucide-react/dist/esm/icons/panel-right-close"
import PanelRightOpenIcon from "lucide-react/dist/esm/icons/panel-right-open"

import { RIGHT_RAIL_ID } from "@/components/app-shell/constants"
import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { HomeCanvasLoginButton } from "@/components/public/home-canvas-login-button"
import type { CanvasSectionId } from "@/components/public/home-canvas-preview-config"
import { Button } from "@/components/ui/button"
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

function HomeCanvasMobileSidebarTrigger() {
  const { isMobile, openMobile, toggleSidebar } = useSidebar()

  if (!isMobile) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground size-11 touch-manipulation rounded-md border-[color:var(--shell-border)] bg-transparent shadow-none md:hidden"
      aria-label={openMobile ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={openMobile}
      onClick={toggleSidebar}
    >
      {openMobile ? (
        <PanelLeftCloseIcon aria-hidden />
      ) : (
        <PanelLeftOpenIcon aria-hidden />
      )}
    </Button>
  )
}

function HomeCanvasLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center",
        className
      )}
    >
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
  )
}

function HomeCanvasBrandLink({ showText = true }: { showText?: boolean }) {
  return (
    <Link
      href="/"
      className="text-foreground hover:bg-sidebar-accent flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 transition-colors"
      aria-label="Coach House home"
    >
      <HomeCanvasLogoMark />
      {showText ? (
        <span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
          <span className="truncate text-base font-bold tracking-tight">
            Coach House
          </span>
          <span className="text-muted-foreground pt-1 text-[10px] font-semibold tracking-[0.18em]">
            ALPHA
          </span>
        </span>
      ) : null}
    </Link>
  )
}

export function HomeCanvasSidebarHeader() {
  return (
    <SidebarHeader>
      <div className="flex items-center justify-between gap-2">
        <HomeCanvasBrandLink />
        <PublicThemeToggle
          variant="outline"
          size="icon"
          className="size-10 touch-manipulation md:hidden"
        />
      </div>
    </SidebarHeader>
  )
}

function HomeCanvasMobileHeaderBrand() {
  return (
    <Link
      href="/"
      className="flex size-11 touch-manipulation items-center justify-center rounded-md md:hidden"
      aria-label="Coach House home"
    >
      <HomeCanvasLogoMark />
    </Link>
  )
}

type HomeCanvasPreviewHeaderProps = {
  activeSection: CanvasSectionId
  changeSection: (section: CanvasSectionId) => void
  hideShellSidebar: boolean
  onRightOpenChange: (open: boolean) => void
  railToggleClassName: string
  rightOpen: boolean
  showRightRailToggle: boolean
}

export function HomeCanvasPreviewHeader({
  activeSection,
  changeSection,
  hideShellSidebar,
  onRightOpenChange,
  railToggleClassName,
  rightOpen,
  showRightRailToggle,
}: HomeCanvasPreviewHeaderProps) {
  return (
    <header className="text-muted-foreground flex min-h-14 shrink-0 items-center justify-between gap-2 px-[var(--shell-content-pad)] py-2 text-sm">
      <HomeCanvasMobileHeaderBrand />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <HomeCanvasLoginButton
          activeSection={activeSection}
          changeSection={changeSection}
        />
        <PublicThemeToggle
          variant="outline"
          size="icon"
          className="hidden md:inline-flex"
        />
        {hideShellSidebar ? null : <HomeCanvasMobileSidebarTrigger />}
        {showRightRailToggle ? (
          <Button
            variant="ghost"
            size="icon"
            className={railToggleClassName}
            aria-controls={RIGHT_RAIL_ID}
            aria-expanded={rightOpen}
            onClick={() => onRightOpenChange(!rightOpen)}
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
  )
}

export function HomeCanvasFindRoutePendingToast() {
  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex justify-center md:justify-start">
      <div
        className="border-border/70 bg-background/92 text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur"
        aria-live="polite"
      >
        <LoaderCircleIcon
          className="text-muted-foreground h-4 w-4 animate-spin"
          aria-hidden
        />
        <span>Opening Find...</span>
      </div>
    </div>
  )
}
