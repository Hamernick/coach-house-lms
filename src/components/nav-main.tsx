"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label = "Platform",
  showLiveBadges = false,
}: {
  items: {
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  label?: string
  showLiveBadges?: boolean
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Link href={item.href} title={item.title}>
                    {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                    <span className="flex-1 break-words leading-snug group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                    {showLiveBadges && (item.href === "/my-organization" || item.href === "/my-organization/roadmap") ? (
                      <Badge
                        variant="secondary"
                        className="ml-auto rounded-full border-emerald-500/40 bg-emerald-500/15 text-[11px] text-emerald-700 dark:text-emerald-300 group-data-[collapsible=icon]:hidden"
                      >
                        Live
                      </Badge>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
