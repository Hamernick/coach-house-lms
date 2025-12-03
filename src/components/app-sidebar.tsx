"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, type Dispatch, type SetStateAction } from "react"
import { usePathname } from "next/navigation"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ClassesSection } from "@/components/app-sidebar/classes-section"
import type { SidebarClass } from "@/lib/academy"

import { useSidebarOpenMap } from "@/components/app-sidebar/hooks"
import { RESOURCE_NAV, SECONDARY_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
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
  openMap?: Record<string, boolean>
  setOpenMap?: Dispatch<SetStateAction<Record<string, boolean>>>
}

export function AppSidebar({ user, isAdmin = false, classes, openMap: controlledOpenMap, setOpenMap: controlledSetOpenMap }: AppSidebarProps) {
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

  return (
    <aside className="hidden h-full w-72 shrink-0 border-r border-border/70 bg-sidebar px-3 py-6 md:flex md:flex-col md:gap-6">
      <SidebarBody
        isAdmin={isAdmin}
        classes={classes}
        openMap={openMap}
        setOpenMap={setOpenMap}
        user={resolvedUser}
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
}

export function SidebarBody({ isAdmin, classes, openMap, setOpenMap, user }: SidebarBodyProps) {
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
                  <span className="truncate text-xs text-muted-foreground">Accelerator</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-4">
        <NavMain items={buildMainNav(isAdmin)} label="Platform" />
        <ClassesSection classes={classes} isAdmin={isAdmin} openMap={openMap} setOpenMap={setOpenMap} />
        {!isAdmin ? (
          <div className="space-y-4 pt-2">
            <NavDocuments items={RESOURCE_NAV} label="Resources" />
            <NavSecondary items={SECONDARY_NAV} />
          </div>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <NavUser user={user} isAdmin={isAdmin} />
      </SidebarFooter>
    </>
  )
}
