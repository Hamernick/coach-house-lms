"use client"

import * as React from "react"
import {
  IconBook,
  IconCalendarTime,
  IconCreditCard,
  IconHelp,
  IconLayoutDashboard,
  IconLifebuoy,
  IconNotebook,
  IconSettings,
  IconShieldLock,
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

const navigation = {
  user: {
    name: "Alex Morgan",
    email: "alex@coachhouse.io",
    avatar: "/avatars/shadcn.jpg",
  },
  main: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "Classes",
      href: "/dashboard/classes",
      icon: IconBook,
    },
    {
      title: "Schedule",
      href: "/dashboard/schedule",
      icon: IconCalendarTime,
    },
    {
      title: "Billing",
      href: "/billing",
      icon: IconCreditCard,
    },
    {
      title: "Admin",
      href: "/admin",
      icon: IconShieldLock,
    },
  ],
  resources: [
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
  ],
  secondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Support",
      url: "mailto:support@coachhouse.io",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={navigation.main} label="Platform" />
        <NavDocuments items={navigation.resources} label="Resources" />
        <NavSecondary items={navigation.secondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navigation.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
