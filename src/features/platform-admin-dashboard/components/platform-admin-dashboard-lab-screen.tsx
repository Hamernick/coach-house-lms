"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { PlatformAdminDashboardLabContent } from "./platform-admin-dashboard-lab-content"
import { PlatformAdminDashboardLabSidebar } from "./platform-admin-dashboard-lab-sidebar"
import { usePlatformAdminDashboardController } from "../hooks/use-platform-admin-dashboard-controller"
import type { PlatformAdminDashboardLabState } from "../types"

type PlatformAdminDashboardLabScreenProps = {
  initialState: PlatformAdminDashboardLabState
}

export function PlatformAdminDashboardLabScreen({
  initialState,
}: PlatformAdminDashboardLabScreenProps) {
  const controller = usePlatformAdminDashboardController(initialState)

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-transparent">
        <PlatformAdminDashboardLabSidebar controller={controller} />
        <PlatformAdminDashboardLabContent controller={controller} />
      </div>
    </SidebarProvider>
  )
}
