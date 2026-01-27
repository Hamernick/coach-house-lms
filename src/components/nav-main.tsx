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
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  label?: string
  className?: string
}) {
  const pathname = usePathname()
  const activeHref = pathname
    ? items.reduce<string | null>((current, item) => {
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
            const isActive = item.href === activeHref
            const tourId =
              item.href === "/my-organization"
                ? "nav-my-organization"
                : item.href === "/roadmap"
                  ? "nav-roadmap"
                  : undefined

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
