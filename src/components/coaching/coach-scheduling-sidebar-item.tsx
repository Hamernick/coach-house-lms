"use client"

import Link from "next/link"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import {
  buildAppSidebarMenuButtonOwnerProps,
  buildAppSidebarOwnerId,
  buildAppSidebarTooltipProps,
} from "@/components/app-sidebar/react-grab"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const COACH_SCHEDULING_SIDEBAR_ITEM_SOURCE =
  "src/components/coaching/coach-scheduling-sidebar-item.tsx"

export function CoachSchedulingSidebarItem() {
  const ownerId = buildAppSidebarOwnerId("utility", "coaching")
  const notes = "Sidebar utility nav item: Coaching"

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={buildAppSidebarTooltipProps({
                ownerId,
                component: "AppSidebarUtilityNavItem",
                source: COACH_SCHEDULING_SIDEBAR_ITEM_SOURCE,
                children: "Coaching",
                className: "whitespace-nowrap",
                notes,
              })}
              className="justify-start gap-2"
              aria-label="Open coaching scheduling"
              {...buildAppSidebarMenuButtonOwnerProps({
                ownerId,
                component: "AppSidebarUtilityNavItem",
                source: COACH_SCHEDULING_SIDEBAR_ITEM_SOURCE,
                variant: "action",
                notes,
              })}
            >
              <Link href="/coaching">
                <CoachingAvatarGroup
                  size="sm"
                  label="Coach House coaching team"
                  className="shrink-0"
                />
                <span className="min-w-0 flex-1 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                  Coaching
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
