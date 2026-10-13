"use client"

import { useRouter } from "next/navigation"
import { type CSSProperties, type ReactNode } from "react"

import { ShellRightRail } from "@/components/app-shell/components/shell-right-rail"
import {
  RightRailProvider,
  useRightRailPresence,
} from "@/components/app-shell/right-rail"
import { useAppShellRightRailState } from "@/components/app-shell/use-app-shell-right-rail-state"
import { HomeCanvasPreviewHeader } from "@/components/public/home-canvas-preview-shell"
import { HomeCanvasPreviewSidebar } from "@/components/public/home-canvas-preview-sidebar"
import {
  HomeCanvasSidebarSlotProvider,
  useHomeCanvasSidebarContent,
  useHomeCanvasSidebarPresence,
} from "@/components/public/home-canvas-sidebar-slot"
import type { CanvasSectionId } from "@/components/public/home-canvas-preview-config"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

export function HomeCanvasFindShell({ children }: { children: ReactNode }) {
  return (
    <RightRailProvider>
      <HomeCanvasSidebarSlotProvider>
        <HomeCanvasFindShellContent>{children}</HomeCanvasFindShellContent>
      </HomeCanvasSidebarSlotProvider>
    </RightRailProvider>
  )
}

function HomeCanvasFindShellContent({ children }: { children: ReactNode }) {
  const router = useRouter()
  const hasRightRail = useRightRailPresence()
  const hasSidebarSlot = useHomeCanvasSidebarPresence()
  const sidebarSlotContent = useHomeCanvasSidebarContent()
  const isMobile = useIsMobile()
  const { rightOpen, handleRightOpenChangeUser, handleRightOpenChangeAuto } =
    useAppShellRightRailState({ hasRightRail, isMobile })

  function navigateToSection(section: CanvasSectionId) {
    router.push(`/?section=${section}`)
  }

  return (
    <SidebarProvider
      defaultOpen
      data-shell-root
      style={
        {
          "--sidebar-width": "23rem",
        } as CSSProperties
      }
      className="text-foreground h-svh min-h-0 overflow-hidden bg-[var(--shell-bg)] [--shell-bg:var(--background)] [--shell-border:var(--border)] [--shell-rail:var(--background)] [--sidebar-border:var(--border)] [--sidebar-foreground:var(--foreground)] [--sidebar:var(--background)] [--shell-content-pad:1rem] [--shell-rail-gap:1rem] [--shell-rail-item-gap:0.5rem] [--shell-rail-item-padding:0.5rem] [--shell-rail-padding:0.75rem] [--shell-right-rail-width:20rem] sm:[--shell-content-pad:1.25rem]"
    >
      <div className="flex min-h-0 flex-1">
        {hasSidebarSlot ? (
          <HomeCanvasPreviewSidebar
            showFindSidebarShell
            sidebarSlotContent={sidebarSlotContent}
          />
        ) : null}

        <div className="flex min-h-0 flex-1">
          <SidebarInset className="h-full min-h-0 overflow-hidden bg-[var(--shell-bg)]">
            <HomeCanvasPreviewHeader
              activeSection="find"
              changeSection={navigateToSection}
              onRightOpenChange={handleRightOpenChangeUser}
              railToggleClassName="text-muted-foreground size-10 rounded-md border border-[color:var(--shell-border)] hover:bg-foreground/5 hover:text-foreground md:size-8"
              rightOpen={rightOpen}
              showShellSidebar={hasSidebarSlot}
              showRightRailToggle={hasRightRail}
            />

            <div className="flex min-h-0 flex-1 p-[var(--shell-content-pad)] md:pt-0 md:pr-[var(--shell-content-pad)] md:pb-[var(--shell-content-pad)] md:pl-0">
              <div className="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-[28px] border border-[color:var(--shell-border)] bg-[var(--shell-bg)]">
                <div className="absolute inset-0 overflow-hidden overscroll-contain">
                  {children}
                </div>
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
