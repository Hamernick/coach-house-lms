"use client"

import type { LucideIcon } from "lucide-react"
import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import MessageCircleIcon from "lucide-react/dist/esm/icons/message-circle"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import ShoppingBagIcon from "lucide-react/dist/esm/icons/shopping-bag"
import UsersIcon from "lucide-react/dist/esm/icons/users"
import WaypointsIcon from "lucide-react/dist/esm/icons/waypoints"

import type { SidebarClass } from "@/lib/academy"

export function buildMainNav(isAdmin: boolean): Array<{ title: string; href: string; icon?: LucideIcon }> {
  const items: Array<{ title: string; href: string; icon?: LucideIcon }> = []

  if (!isAdmin) {
    items.push(
      { title: "My Organization", href: "/my-organization", icon: BuildingIcon },
      { title: "People", href: "/people", icon: UsersIcon },
      { title: "Roadmap", href: "/my-organization/roadmap", icon: WaypointsIcon },
      { title: "Documents", href: "/my-organization/documents", icon: LockIcon },
    )
  }

  return items
}

export const RESOURCE_NAV = [
  {
    name: "Knowledge base",
    url: "https://coach-house.gitbook.io/coach-house",
    icon: NotebookIcon,
    external: true,
  },
  {
    name: "Community",
    url: "/community",
    icon: MessageCircleIcon,
  },
  {
    name: "Marketplace",
    url: "/marketplace",
    icon: ShoppingBagIcon,
  },
]

export const SECONDARY_NAV = [
  {
    title: "Support",
    url: "mailto:contact@coachhousesolutions.org",
    icon: HelpCircleIcon,
  },
]

export function computeActiveOpenMap(pathname: string, classes?: SidebarClass[] | null): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  if (!classes) return map
  const basePath = pathname.startsWith("/accelerator/") ? "/accelerator" : ""

  for (const klass of classes) {
    const classHref = `${basePath}/class/${klass.slug}`
    const isClassActive = pathname === classHref
    const moduleActive = klass.modules.some(
      (module) => pathname === `${basePath}/class/${klass.slug}/module/${module.index}`,
    )
    if (isClassActive || moduleActive) {
      map[klass.slug] = true
    }
  }

  return map
}
