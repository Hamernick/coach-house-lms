"use client"

import type { LucideIcon } from "lucide-react"
import BuildingIcon from "lucide-react/dist/esm/icons/building-2"
import CircleDollarSignIcon from "lucide-react/dist/esm/icons/circle-dollar-sign"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
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
  organizationName,
}: {
  isAdmin: boolean
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
  organizationName?: string | null
}): Array<{
  title: string
  href?: string
  icon?: LucideIcon
  locked?: boolean
  badge?: string
  upgradeHref?: string
  upgradeLabel?: string
}> {
  const organizationLabel =
    typeof organizationName === "string" && organizationName.trim().length > 0
      ? organizationName.trim()
      : "Organization"

  const items: Array<{
    title: string
    href?: string
    icon?: LucideIcon
    locked?: boolean
    badge?: string
    upgradeHref?: string
    upgradeLabel?: string
  }> = [
    { title: organizationLabel, href: "/organization", icon: BuildingIcon },
    { title: "People", href: "/people", icon: UsersIcon },
    { title: "Documents", href: "/organization/documents", icon: LockIcon },
    { title: "Fundraising", icon: CircleDollarSignIcon, locked: true, badge: "Coming soon" },
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
