"use client"

import * as React from "react"
import type { Icon } from "@tabler/icons-react"
import {
  IconBuilding,
  IconHelp,
  IconLayoutDashboard,
  IconLifebuoy,
  IconNotebook,
  IconSettings,
  IconShieldLock,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

function buildMainNav(isAdmin: boolean): { title: string; href: string; icon?: Icon }[] {
  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "Organizations",
      href: "/organizations",
      icon: IconBuilding,
    },
    {
      title: "People",
      href: "/people",
      icon: IconUsers,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: IconSettings,
    },
  ]

  // Admins also see a direct link to the Admin area
  if (isAdmin) {
    return [
      ...items,
      {
        title: "Admin",
        href: "/admin",
        icon: IconShieldLock,
      },
    ]
  }

  return items
}

const RESOURCE_NAV = [
  {
    name: "Knowledge base",
    url: "https://coachhouse.example.com/docs",
    icon: IconNotebook,
  },
  {
    name: "Community",
    url: "https://coachhouse.example.com/community",
    icon: IconLifebuoy,
  },
]

const SECONDARY_NAV = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
  },
  {
    title: "Support",
    url: `mailto:${SUPPORT_EMAIL}`,
    icon: IconHelp,
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
}

export function AppSidebar({ user, isAdmin = false, ...props }: AppSidebarProps) {
  const resolvedUser = {
    name: user?.name ?? null,
    email: user?.email ?? null,
    avatar: user?.avatar ?? null,
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <span className="text-base font-semibold tracking-tight">
                  Coach House LMS
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={buildMainNav(isAdmin)} label="Platform" />
        <NavDocuments items={RESOURCE_NAV} label="Resources" />
        <NavSecondary items={SECONDARY_NAV} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
