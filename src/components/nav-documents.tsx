"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"

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

const NAV_DOCUMENTS_SOURCE = "src/components/nav-documents.tsx"

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
    <SidebarGroup className="mt-4 px-0">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const ownerId = buildAppSidebarOwnerId("resources", item.url || item.name)
            const notes = `Sidebar resource nav item: ${item.name}`

            return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                tooltip={buildAppSidebarTooltipProps({
                  ownerId,
                  component: "AppSidebarResourceNavItem",
                  source: NAV_DOCUMENTS_SOURCE,
                  children: item.name,
                  className: "whitespace-nowrap",
                  notes,
                })}
                className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                {...buildAppSidebarMenuButtonOwnerProps({
                  ownerId,
                  component: "AppSidebarResourceNavItem",
                  source: NAV_DOCUMENTS_SOURCE,
                  variant: item.external ? "external" : "link",
                  notes,
                })}
              >
                {item.external ? (
                  <a
                    href={item.url}
                    title={item.name}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full min-w-0 items-center gap-2"
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                      {item.name}
                    </span>
                    <ExternalLinkIcon
                      className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <Link href={item.url} title={item.name} className="flex w-full min-w-0 items-center gap-2">
                    <item.icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                      {item.name}
                    </span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
