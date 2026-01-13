"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Home from "lucide-react/dist/esm/icons/home"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import { ClassesSection } from "@/components/app-sidebar/classes-section"
import { useSidebarOpenMap } from "@/components/app-sidebar/hooks"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import type { SidebarClass } from "@/lib/academy"

type AcceleratorSidebarProps = {
  classes: SidebarClass[]
  isAdmin: boolean
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
}

const STARTER_LINKS = [
  { id: "overview", label: "Overview", href: "/accelerator#overview" },
  { id: "roadmap", label: "Roadmap", href: "/accelerator/roadmap" },
]

export function AcceleratorSidebar({ classes, isAdmin, user }: AcceleratorSidebarProps) {
  const pathname = usePathname()
  const { openMap, setOpenMap } = useSidebarOpenMap(pathname ?? "/accelerator", classes)
  const [activeSection, setActiveSection] = useState<string>(STARTER_LINKS[0]?.id ?? "overview")
  const sectionObserverState = useRef<Record<string, IntersectionObserverEntry>>({})

  const sectionIds = useMemo(() => STARTER_LINKS.map((item) => item.id), [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (pathname?.startsWith("/accelerator/roadmap")) {
      setActiveSection("roadmap")
      return
    }
    const hash = window.location.hash.replace("#", "")
    if (hash && sectionIds.includes(hash)) {
      setActiveSection(hash)
      return
    }
    setActiveSection("overview")
  }, [pathname, sectionIds])

  useEffect(() => {
    if (pathname !== "/accelerator") return
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element))
    if (elements.length === 0) return

    sectionObserverState.current = {}
    const root =
      document.querySelector<HTMLElement>("[data-accelerator-scroll]") ?? null
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionObserverState.current[entry.target.id] = entry
        })
        const nextId = sectionIds.find((id) => sectionObserverState.current[id]?.isIntersecting)
        if (nextId) {
          setActiveSection(nextId)
        }
      },
      { root, rootMargin: "-20% 0px -60% 0px", threshold: [0.15, 0.35, 0.55, 0.75] },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [pathname, sectionIds])

  return (
    <>
      <SidebarHeader className="gap-3 px-3 pb-2 pt-4">
        <SidebarMenu>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton
              asChild
              size="lg"
              className="justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent">
                  <Image
                    src="/coach-house-logo-dark.png"
                    alt="Coach House logo"
                    width={36}
                    height={36}
                    className="h-full w-full"
                    priority
                  />
                </span>
                <div className="grid text-left text-sm leading-tight">
                  <span className="font-semibold text-sidebar-foreground">Coach House</span>
                  <span className="text-xs text-muted-foreground">Accelerator</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-4">
            <SidebarMenuButton
              asChild
              className="justify-start gap-2 bg-sidebar-accent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground/70 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
            >
              <Link href="/my-organization" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Return home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-6 px-3 pb-4">
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground">
            Get started
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {STARTER_LINKS.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeSection === item.id}
                    className="justify-between text-muted-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                  >
                    <Link
                      href={item.href}
                      className="flex w-full items-center justify-between"
                      onClick={() => setActiveSection(item.id)}
                    >
                      <span className="flex items-center gap-2">
                        {item.id === "roadmap" ? <WaypointsIcon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                        <span>{item.label}</span>
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <ClassesSection
          classes={classes}
          isAdmin={isAdmin}
          openMap={openMap}
          setOpenMap={setOpenMap}
          basePath="/accelerator"
        />
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-border/60 px-3 py-4">
        <NavUser user={user} isAdmin={isAdmin} showDivider={false} />
      </SidebarFooter>
    </>
  )
}
