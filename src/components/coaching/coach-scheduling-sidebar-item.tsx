"use client"

import { CoachingAvatarGroup } from "@/components/coaching/coaching-avatar-group"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCoachingBooking } from "@/hooks/use-coaching-booking"

export function CoachSchedulingSidebarItem() {
  const { schedule, pending } = useCoachingBooking()

  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip={{ children: "Coaching", className: "whitespace-nowrap" }}
              className="justify-start gap-2"
              onClick={() => {
                void schedule()
              }}
              aria-label="Open coaching scheduling"
              disabled={pending}
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
