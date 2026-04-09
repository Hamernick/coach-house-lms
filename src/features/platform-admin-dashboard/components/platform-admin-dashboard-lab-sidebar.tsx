"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import PanelTop from "lucide-react/dist/esm/icons/panel-top"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import ListChecksIcon from "lucide-react/dist/esm/icons/list-checks"
import MessageCircleIcon from "lucide-react/dist/esm/icons/message-circle"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ProjectDashboardProgressCircle } from "./upstream/project-dashboard-progress-circle"
import { usePlatformAdminDashboardController } from "../hooks/use-platform-admin-dashboard-controller"
import type { PlatformAdminDashboardLabSection } from "../types"

type PlatformAdminDashboardLabSidebarProps = {
  controller: ReturnType<typeof usePlatformAdminDashboardController>
}

const NAV_ITEM_ICONS: Record<
  PlatformAdminDashboardLabSection,
  ComponentType<{ className?: string }>
> = {
  inbox: MessageCircleIcon,
  "my-tasks": ListChecksIcon,
  projects: LayoutGridIcon,
  clients: UsersIcon,
  performance: PanelTop,
}

export function PlatformAdminDashboardLabSidebar({
  controller,
}: PlatformAdminDashboardLabSidebarProps) {
  const displayName = controller.user.name ?? "Coach House Admin"
  const displayEmail = controller.user.email ?? "internal@coach.house"
  const avatarFallback =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CH"

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r-0 bg-background/95 shadow-none"
    >
      <SidebarHeader className="gap-4 border-b border-border/60 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#0f172a,#1d4ed8)] text-white shadow-[inset_0_-5px_10px_rgba(15,23,42,0.45)]">
              <PanelTop className="h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                Platform Lab
              </p>
              <p className="text-xs text-muted-foreground">Donor shell sandbox</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            value={controller.state.query}
            onChange={(event) =>
              controller.replaceSearch({ query: event.currentTarget.value })
            }
            className="h-9 rounded-xl border-border/70 bg-muted/40 pr-3 text-sm shadow-none"
            placeholder="Search imported projects…"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-3">
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {controller.navItems.map((item) => {
                const Icon = NAV_ITEM_ICONS[item.id]
                const isActive = controller.state.section === item.id

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10 rounded-xl px-3 font-normal"
                    >
                      <Link href={controller.buildHref({ section: item.id })}>
                        <Icon className="h-4 w-4" aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge className="rounded-full bg-muted px-2 text-muted-foreground">
                        {item.badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Active Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {controller.activeProjects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <div
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-foreground/85 transition-colors",
                      "hover:bg-accent/60",
                    )}
                  >
                    <ProjectDashboardProgressCircle
                      progress={project.progress}
                      color={project.color}
                      size={18}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {project.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {project.progress}%
                    </span>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-3">
        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border border-border/70">
              {controller.user.avatar ? (
                <AvatarImage src={controller.user.avatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="rounded-xl">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/internal">
              <PanelTop className="h-4 w-4" aria-hidden />
              Back to Internal
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
