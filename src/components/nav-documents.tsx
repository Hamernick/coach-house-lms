"use client"

import { IconExternalLink, type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
  label = "Resources",
}: {
  items: {
    name: string
    url: string
    icon: Icon
    external?: boolean
  }[]
  label?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a
                href={item.url}
                {...(item.external ? { target: "_blank", rel: "noreferrer" } : null)}
              >
                <item.icon />
                <span className="max-w-[calc(100%-2.5rem)] leading-snug break-words text-pretty">{item.name}</span>
              </a>
            </SidebarMenuButton>
            {item.external ? (
              <SidebarMenuAction className="pointer-events-none rounded-sm text-muted-foreground">
                <IconExternalLink className="size-4" aria-hidden="true" />
                <span className="sr-only">Opens in new tab</span>
              </SidebarMenuAction>
            ) : null}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
