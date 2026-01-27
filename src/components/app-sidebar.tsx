"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import Rocket from "lucide-react/dist/esm/icons/rocket"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import type { SidebarClass } from "@/lib/academy"
import { CircularProgress } from "@/components/ui/circular-progress"

import { ClassesSection } from "@/components/app-sidebar/classes-section"
import { RESOURCE_NAV, SECONDARY_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export type AppSidebarProps = {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
  showOrgAdmin?: boolean
  classes?: SidebarClass[]
  acceleratorProgress?: number | null
  showAccelerator?: boolean
  hasAcceleratorAccess?: boolean
  formationStatus?: string | null
}

export function AppSidebar({
  user,
  isAdmin = false,
  showOrgAdmin = false,
  classes,
  acceleratorProgress,
  showAccelerator,
  hasAcceleratorAccess,
  formationStatus,
}: AppSidebarProps) {
  const resolvedUser = useMemo(
    () => ({
      name: user?.name ?? null,
      email: user?.email ?? null,
      avatar: user?.avatar ?? null,
    }),
    [user?.avatar, user?.email, user?.name],
  )

  const pathname = usePathname()
  const isAcceleratorActive = (pathname ?? "").startsWith("/accelerator")

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-border/70 bg-sidebar px-3 pb-6 pt-0 md:flex md:flex-col md:gap-6">
      <SidebarBody
        isAdmin={isAdmin}
        classes={classes}
        user={resolvedUser}
        isAcceleratorActive={isAcceleratorActive}
        acceleratorProgress={acceleratorProgress}
        showAccelerator={showAccelerator}
        showOrgAdmin={showOrgAdmin}
        hasAcceleratorAccess={hasAcceleratorAccess}
        formationStatus={formationStatus}
      />
    </aside>
  )
}

type SidebarBodyProps = {
  isAdmin: boolean
  classes?: SidebarClass[]
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
  isAcceleratorActive: boolean
  acceleratorProgress?: number | null
  showAccelerator?: boolean
  showClasses?: boolean
  classesBasePath?: string
  showOrgAdmin?: boolean
  hasAcceleratorAccess?: boolean
  formationStatus?: string | null
}

export function SidebarBody({
  isAdmin,
  classes,
  user,
  isAcceleratorActive,
  acceleratorProgress,
  showAccelerator,
  showClasses = false,
  classesBasePath,
  showOrgAdmin = false,
  hasAcceleratorAccess = false,
  formationStatus = null,
}: SidebarBodyProps) {
  const pathname = usePathname()
  const progressValue =
    typeof acceleratorProgress === "number" && Number.isFinite(acceleratorProgress)
      ? Math.max(0, Math.min(100, Math.round(acceleratorProgress)))
      : null

  const shouldShowAccelerator = Boolean(isAdmin || showAccelerator)
  const hasUser = Boolean(user.email)
  const mainNavItems = buildMainNav({ isAdmin, showOrgAdmin })
  const mainNavItemsWithoutRoadmap = mainNavItems.filter((item) => item.href !== "/roadmap")
  const isRoadmapActive = pathname ? pathname === "/roadmap" || pathname.startsWith("/roadmap/") : false
  return (
    <>
      <SidebarContent className="gap-0">
        <NavMain items={mainNavItemsWithoutRoadmap} className="py-0" />
        {shouldShowAccelerator ? (
          <SidebarGroup className="pt-3 pb-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={Boolean(pathname?.startsWith("/accelerator"))}>
                  <Link href="/accelerator" className="flex w-full min-w-0 items-center gap-2">
                    <Rocket className="size-4" />
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap">Accelerator</span>
                    {progressValue !== null ? (
                      <span className="ml-auto flex shrink-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
                        <CircularProgress
                          value={progressValue}
                          size={16}
                          strokeWidth={2}
                          aria-label={`Accelerator progress ${progressValue}%`}
                        />
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isRoadmapActive} tooltip="Roadmap">
                  <Link href="/roadmap" title="Roadmap" data-tour="nav-roadmap">
                    <WaypointsIcon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                      Roadmap
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
        {shouldShowAccelerator && showClasses ? (
          <ClassesSection
            classes={classes}
            isAdmin={isAdmin}
            basePath={classesBasePath}
            hasAcceleratorAccess={hasAcceleratorAccess}
            formationStatus={formationStatus}
          />
        ) : null}
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <div className="space-y-4 pt-2">
          <NavDocuments items={RESOURCE_NAV} label="Resources" />
          <NavSecondary items={SECONDARY_NAV} />
        </div>
        {hasUser ? <NavUser user={user} isAdmin={isAdmin} showDivider={false} /> : null}
      </SidebarFooter>
    </>
  )
}
