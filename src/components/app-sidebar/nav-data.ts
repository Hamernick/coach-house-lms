"use client"

import type { LucideIcon } from "lucide-react"
import ClipboardListIcon from "lucide-react/dist/esm/icons/clipboard-list"
import DatabaseIcon from "lucide-react/dist/esm/icons/database"
import EarthIcon from "lucide-react/dist/esm/icons/earth"
import FlaskConicalIcon from "lucide-react/dist/esm/icons/flask-conical"
import FolderKanbanIcon from "lucide-react/dist/esm/icons/folder-kanban"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import LayoutGridIcon from "lucide-react/dist/esm/icons/layout-grid"
import MailIcon from "lucide-react/dist/esm/icons/mail"
import MessageCircleIcon from "lucide-react/dist/esm/icons/message-circle"
import NotebookIcon from "lucide-react/dist/esm/icons/notebook"
import PanelTopIcon from "lucide-react/dist/esm/icons/panel-top"

import {
  listPrototypeLabSidebarTree,
  type PrototypeLabSidebarTreeNode,
} from "@/features/prototype-lab"
import type { SidebarClass } from "@/lib/academy"
import {
  hasPlatformCapability,
  type PlatformAccessLevel,
} from "@/features/platform-access"
import { FIND_PATH } from "@/lib/find/routes"
import { platformLabEnabled } from "@/lib/feature-flags"

type MainNavItem = {
  title: string
  href?: string
  icon?: LucideIcon
  tree?: PrototypeLabSidebarTreeNode[]
  locked?: boolean
  badge?: string
  upgradeHref?: string
  upgradeLabel?: string
}

export function buildMainNav({
  isAdmin,
  platformAccessLevel = null,
  showMemberWorkspace = false,
  hasMemberWorkspaceAccess = true,
  showWorkspaceHome = true,
  showPlatformLab = platformLabEnabled,
}: {
  isAdmin: boolean
  platformAccessLevel?: PlatformAccessLevel | null
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
  showMemberWorkspace?: boolean
  hasMemberWorkspaceAccess?: boolean
  showWorkspaceHome?: boolean
  showPlatformLab?: boolean
}): MainNavItem[] {
  const workspaceHomeItem = showWorkspaceHome
    ? [{ title: "Workspace", href: "/workspace", icon: LayoutGridIcon }]
    : []
  const resolvedPlatformAccessLevel =
    platformAccessLevel ?? (isAdmin ? "developer" : null)
  const canAccessOrganizations = hasPlatformCapability(
    resolvedPlatformAccessLevel,
    "organizations"
  )
  const memberWorkspaceItems: MainNavItem[] = canAccessOrganizations
    ? [
        {
          title: "Organizations",
          href: "/organizations",
          icon: FolderKanbanIcon,
        },
        ...(isAdmin
          ? [
              { title: "Tasks", href: "/tasks", icon: ClipboardListIcon },
              { title: "Email", href: "/email", icon: MailIcon },
            ]
          : []),
      ]
    : []
  const items: MainNavItem[] = [
    ...(showMemberWorkspace
      ? [
          ...workspaceHomeItem,
          { title: "Find", href: FIND_PATH, icon: EarthIcon },
          ...memberWorkspaceItems,
        ]
      : [{ title: "Find", href: FIND_PATH, icon: EarthIcon }]),
  ]

  if (isAdmin) {
    items.push({
      title: "Platform",
      href: "/admin/platform",
      icon: DatabaseIcon,
    })
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

export function computeActiveOpenMap(
  pathname: string,
  classes?: SidebarClass[] | null
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  if (!classes) return map
  const basePath = pathname.startsWith("/accelerator/") ? "/accelerator" : ""

  for (const klass of classes) {
    const classHref = `${basePath}/class/${klass.slug}`
    const isClassActive = pathname === classHref
    const moduleActive = klass.modules.some(
      (module) =>
        pathname === `${basePath}/class/${klass.slug}/module/${module.index}`
    )
    if (isClassActive || moduleActive) {
      map[klass.slug] = true
    }
  }

  return map
}
