"use client"

import type { ReactNode } from "react"

import { HomeCanvasSidebarHeader } from "@/components/public/home-canvas-preview-shell"
import { Sidebar, SidebarContent } from "@/components/ui/sidebar"

type HomeCanvasPreviewSidebarProps = {
  showFindSidebarShell: boolean
  sidebarSlotContent: ReactNode
}

export function HomeCanvasPreviewSidebar({
  showFindSidebarShell,
  sidebarSlotContent,
}: HomeCanvasPreviewSidebarProps) {
  if (!showFindSidebarShell) return null

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      className="border-0 bg-[var(--shell-rail)]"
    >
      <HomeCanvasSidebarHeader />
      {sidebarSlotContent ?? <SidebarContent className="min-h-0 flex-1" />}
    </Sidebar>
  )
}
