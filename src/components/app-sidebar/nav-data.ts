"use client"

import type { LucideIcon } from "lucide-react"
import DatabaseIcon from "lucide-react/dist/esm/icons/database"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import MessageCircleIcon from "lucide-react/dist/esm/icons/message-circle"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import ShieldIcon from "lucide-react/dist/esm/icons/shield"
import ShoppingBagIcon from "lucide-react/dist/esm/icons/shopping-bag"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import type { SidebarClass } from "@/lib/academy"

export function buildMainNav({
  isAdmin,
  showOrgAdmin,
  canAccessOrgAdmin,
}: {
  isAdmin: boolean
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
}): Array<{
  title: string
  href?: string
  icon?: LucideIcon
  locked?: boolean
  badge?: string
  upgradeHref?: string
  upgradeLabel?: string
}> {
  const items: Array<{
    title: string
    href?: string
    icon?: LucideIcon
    locked?: boolean
    badge?: string
    upgradeHref?: string
    upgradeLabel?: string
  }> = [
    { title: "Workspace", href: "/workspace", icon: LayoutGridIcon },
    { title: "People", href: "/people", icon: UsersIcon },
    { title: "Documents", href: "/organization/documents", icon: LockIcon },
  ]

  if (showOrgAdmin) {
    if (canAccessOrgAdmin) {
      items.push({ title: "Admin", href: "/admin", icon: ShieldIcon })
    } else {
      items.push({
        title: "Admin",
        icon: ShieldIcon,
        locked: true,
        badge: "Upgrade",
        upgradeLabel: "Upgrade",
        upgradeHref: "?paywall=organization&plan=organization&upgrade=admin-access&source=nav-admin",
      })
    }
  }
  if (isAdmin) {
    items.push({ title: "Platform", href: "/admin/platform", icon: DatabaseIcon })
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
    url: "mailto:joel@coachhousesolutions.org",
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
