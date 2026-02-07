"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
  label,
  className,
}: {
  items: {
    title: string
    href?: string
    icon?: React.ComponentType<{ className?: string }>
    locked?: boolean
    badge?: string
  }[]
  label?: string
  className?: string
}) {
  const pathname = usePathname()
  const activeHref = pathname
    ? items.reduce<string | null>((current, item) => {
        if (!item.href) return current
        const matches = pathname === item.href || pathname.startsWith(`${item.href}/`)
        if (!matches) return current
        if (!current || item.href.length > current.length) return item.href
        return current
      }, null)
    : null

  return (
    <SidebarGroup className={cn("py-0", className)}>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = Boolean(item.href && item.href === activeHref)
            const tourId =
              item.href === "/my-organization"
                ? "nav-my-organization"
                : item.href === "/roadmap"
                  ? "nav-roadmap"
                  : undefined

            if (!item.href || item.locked) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    aria-disabled
                    className={cn(
                      "justify-start gap-2 opacity-90 cursor-not-allowed hover:bg-transparent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
                    )}
                  >
                    {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                    <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 group-data-[collapsible=icon]:hidden">
                      {item.badge ? (
                        <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Link href={item.href} title={item.title} data-tour={tourId}>
                    {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                    <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                    <span className="ml-auto flex shrink-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
                      {item.href === "/roadmap" ? (
                        <ArrowUpRightIcon className="size-3.5 text-muted-foreground" aria-hidden />
                      ) : null}
                    </span>
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
