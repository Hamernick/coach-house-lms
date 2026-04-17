"use client"

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
import { useCoachingBooking } from "@/hooks/use-coaching-booking"

const COACH_SCHEDULING_SIDEBAR_ITEM_SOURCE =
  "src/components/coaching/coach-scheduling-sidebar-item.tsx"

export function CoachSchedulingSidebarItem() {
  const { schedule, pending } = useCoachingBooking()
  const ownerId = buildAppSidebarOwnerId("utility", "coaching")
  const notes = "Sidebar utility nav item: Coaching"

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip={buildAppSidebarTooltipProps({
                ownerId,
                component: "AppSidebarUtilityNavItem",
                source: COACH_SCHEDULING_SIDEBAR_ITEM_SOURCE,
                children: "Coaching",
                className: "whitespace-nowrap",
                notes,
              })}
              className="justify-start gap-2"
              onClick={() => {
                void schedule()
              }}
              aria-label="Open coaching scheduling"
              disabled={pending}
              {...buildAppSidebarMenuButtonOwnerProps({
                ownerId,
                component: "AppSidebarUtilityNavItem",
                source: COACH_SCHEDULING_SIDEBAR_ITEM_SOURCE,
                variant: "action",
                notes,
              })}
            >
              <CoachingAvatarGroup
                size="sm"
                label="Coach House coaching team"
                className="shrink-0"
              />
              <span className="min-w-0 flex-1 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                {pending ? "Opening…" : "Coaching"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
