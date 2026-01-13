"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, type Dispatch, type SetStateAction } from "react"
import { usePathname } from "next/navigation"
import Rocket from "lucide-react/dist/esm/icons/rocket"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import type { SidebarClass } from "@/lib/academy"
import { CircularProgress } from "@/components/ui/circular-progress"

import { useSidebarOpenMap } from "@/components/app-sidebar/hooks"
import { RESOURCE_NAV, SECONDARY_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"
import {
  SidebarHeader,
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
  classes?: SidebarClass[]
  acceleratorProgress?: number | null
  showLiveBadges?: boolean
  openMap?: Record<string, boolean>
  setOpenMap?: Dispatch<SetStateAction<Record<string, boolean>>>
}

export function AppSidebar({
  user,
  isAdmin = false,
  classes,
  acceleratorProgress,
  showLiveBadges = false,
  openMap: controlledOpenMap,
  setOpenMap: controlledSetOpenMap,
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
  const fallback = useSidebarOpenMap(pathname ?? "/", classes)
  const openMap = controlledOpenMap ?? fallback.openMap
  const setOpenMap = controlledSetOpenMap ?? fallback.setOpenMap
  const isAcceleratorActive = (pathname ?? "").startsWith("/accelerator")

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-border/70 bg-sidebar px-3 py-6 md:flex md:flex-col md:gap-6">
      <SidebarBody
        isAdmin={isAdmin}
        classes={classes}
        openMap={openMap}
        setOpenMap={setOpenMap}
        user={resolvedUser}
        isAcceleratorActive={isAcceleratorActive}
        acceleratorProgress={acceleratorProgress}
        showLiveBadges={showLiveBadges}
      />
    </aside>
  )
}

type SidebarBodyProps = {
  isAdmin: boolean
  classes?: SidebarClass[]
  openMap: Record<string, boolean>
  setOpenMap: Dispatch<SetStateAction<Record<string, boolean>>>
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
  isAcceleratorActive: boolean
  acceleratorProgress?: number | null
  showLiveBadges?: boolean
}

export function SidebarBody({
  isAdmin,
  classes,
  openMap,
  setOpenMap,
  user,
  isAcceleratorActive,
  acceleratorProgress,
  showLiveBadges = false,
}: SidebarBodyProps) {
  const progressValue =
    typeof acceleratorProgress === "number" && Number.isFinite(acceleratorProgress)
      ? Math.max(0, Math.min(100, Math.round(acceleratorProgress)))
      : null

  return (
    <>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="justify-start gap-2"
            >
              <Link href="/dashboard" className="flex items-center gap-2 text-foreground">
                <span className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src="/coach-house-logo-light.png"
                    alt="Coach House logo"
                    width={32}
                    height={32}
                    className="block h-full w-full dark:hidden"
                    priority
                  />
                  <Image
                    src="/coach-house-logo-dark.png"
                    alt="Coach House logo"
                    width={32}
                    height={32}
                    className="hidden h-full w-full dark:block"
                    priority
                  />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium tracking-tight">Coach House</span>
                  <span className="truncate text-xs text-muted-foreground">Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-4">
        <NavMain items={buildMainNav(isAdmin)} label="Platform" showLiveBadges={showLiveBadges} />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isAcceleratorActive}>
                <Link href="/accelerator" className="flex w-full items-center gap-2">
                  <Rocket className="size-4" />
                  <span>Accelerator</span>
                  {progressValue !== null ? (
                    <span className="ml-auto flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                      <CircularProgress
                        value={progressValue}
                        size={26}
                        strokeWidth={3}
                        aria-label={`Accelerator progress ${progressValue}%`}
                      />
                    </span>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto gap-4">
        {!isAdmin ? (
          <div className="space-y-4 pt-2">
            <NavDocuments items={RESOURCE_NAV} label="Resources" />
            <NavSecondary items={SECONDARY_NAV} />
          </div>
        ) : null}
        <NavUser user={user} isAdmin={isAdmin} />
      </SidebarFooter>
    </>
  )
}
