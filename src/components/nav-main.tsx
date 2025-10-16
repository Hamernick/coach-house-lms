"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
  label = "Navigation",
}: {
  items: {
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="h-auto min-h-7 py-1 items-start [&>span:last-child]:!whitespace-normal [&>span:last-child]:!break-words [&>span:last-child]:!overflow-visible"
                >
                  <Link href={item.href}>
                    {item.icon ? <item.icon /> : null}
                    <span className="leading-snug text-pretty break-words max-w-[calc(100%-2.5rem)]">{item.title}</span>
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
