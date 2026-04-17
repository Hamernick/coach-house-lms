"use client"

import type { LucideIcon } from "lucide-react"

import {
  buildAppSidebarMenuButtonOwnerProps,
  buildAppSidebarOwnerId,
  buildAppSidebarTooltipProps,
} from "@/components/app-sidebar/react-grab"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const NAV_SECONDARY_SOURCE = "src/components/nav-secondary.tsx"

export function NavSecondary({
  items,
  label = "Support",
  className,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
  label?: string
  className?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const ownerId = buildAppSidebarOwnerId("secondary", item.url || item.title)
            const notes = `Sidebar secondary nav item: ${item.title}`

            return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={buildAppSidebarTooltipProps({
                  ownerId,
                  component: "AppSidebarSecondaryNavItem",
                  source: NAV_SECONDARY_SOURCE,
                  children: item.title,
                  notes,
                })}
                className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                {...buildAppSidebarMenuButtonOwnerProps({
                  ownerId,
                  component: "AppSidebarSecondaryNavItem",
                  source: NAV_SECONDARY_SOURCE,
                  variant: "link",
                  notes,
                })}
              >
                <a
                  href={item.url}
                  title={item.title}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="min-w-0 truncate whitespace-nowrap group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
