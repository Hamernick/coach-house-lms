"use client"

import type { LucideIcon } from "lucide-react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
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
    icon: LucideIcon
    external?: boolean
  }[]
  label?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <SidebarGroup className="mt-4">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                tooltip={item.name}
                className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
                <a
                  href={item.url}
                  title={item.name}
                  {...(item.external ? { target: "_blank", rel: "noreferrer" } : null)}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                    {item.name}
                  </span>
                  {item.external ? (
                    <ExternalLinkIcon
                      className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
                      aria-hidden
                    />
                  ) : null}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
