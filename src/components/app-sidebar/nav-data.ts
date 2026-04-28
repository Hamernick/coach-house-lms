"use client"

import type { LucideIcon } from "lucide-react"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import DatabaseIcon from "lucide-react/dist/esm/icons/database"
import FlaskConicalIcon from "lucide-react/dist/esm/icons/flask-conical"
import FolderKanbanIcon from "lucide-react/dist/esm/icons/folder-kanban"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import LockIcon from "lucide-react/dist/esm/icons/lock"
import MapPinnedIcon from "lucide-react/dist/esm/icons/map-pinned"
import MessageCircleIcon from "lucide-react/dist/esm/icons/message-circle"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import PanelTopIcon from "lucide-react/dist/esm/icons/panel-top"
import ShieldIcon from "lucide-react/dist/esm/icons/shield"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import {
  listPrototypeLabSidebarTree,
  type PrototypeLabSidebarTreeNode,
} from "@/features/prototype-lab"
import type { SidebarClass } from "@/lib/academy"
import { platformLabEnabled } from "@/lib/feature-flags"

export function buildMainNav({
  isAdmin,
  showOrgAdmin,
  canAccessOrgAdmin,
  showMemberWorkspace = false,
  showPlatformLab = platformLabEnabled,
}: {
  isAdmin: boolean
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
  showMemberWorkspace?: boolean
  showPlatformLab?: boolean
}): Array<{
  title: string
  href?: string
  icon?: LucideIcon
  tree?: PrototypeLabSidebarTreeNode[]
  locked?: boolean
  badge?: string
  upgradeHref?: string
  upgradeLabel?: string
}> {
  const items: Array<{
    title: string
    href?: string
    icon?: LucideIcon
    tree?: PrototypeLabSidebarTreeNode[]
    locked?: boolean
    badge?: string
    upgradeHref?: string
    upgradeLabel?: string
  }> = [
    ...(showMemberWorkspace
      ? [
          { title: "Workspace", href: "/workspace", icon: LayoutGridIcon },
          { title: "Projects", href: "/projects", icon: FolderKanbanIcon },
          { title: "Tasks", href: "/tasks", icon: ClipboardListIcon },
          { title: "People", href: "/people", icon: UsersIcon },
          { title: "Documents", href: "/organization/documents", icon: LockIcon },
        ]
      : [
          { title: "Workspace", href: "/workspace", icon: LayoutGridIcon },
          { title: "People", href: "/people", icon: UsersIcon },
          { title: "Documents", href: "/organization/documents", icon: LockIcon },
        ]),
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
    if (showPlatformLab) {
      items.push({
        title: "Platform Lab",
        href: "/internal/platform-lab",
        icon: PanelTopIcon,
      })
    }
    items.push({
      title: "Prototypes",
      href: "/admin/platform/prototypes",
      icon: FlaskConicalIcon,
      tree: listPrototypeLabSidebarTree(),
    })
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
    name: "Find organizations",
    url: "/find",
    icon: MapPinnedIcon,
  },
  {
    name: "Community",
    url: "/community",
    icon: MessageCircleIcon,
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
