"use client"

import * as React from "react"
import type { Icon } from "@tabler/icons-react"
import {
  IconBuilding,
  IconHelp,
  IconLayoutDashboard,
  IconLifebuoy,
  IconNotebook,
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
  SidebarMenuAction,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { GraduationCap, ChevronDown, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import type { SidebarClass } from "@/lib/academy"
import { ClassWizardDialog } from "@/components/admin/class-wizard-dialog"
import { createClassWizardAction } from "@/app/(admin)/admin/classes/actions"

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

function buildMainNav(isAdmin: boolean): { title: string; href: string; icon?: Icon }[] {
  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: IconLayoutDashboard,
    },
    {
      title: "My Organization",
      href: "/my-organization",
      icon: IconBuilding,
    },
    {
      title: "People",
      href: "/people",
      icon: IconUsers,
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
  classes?: SidebarClass[]
}

export function AppSidebar({ user, isAdmin = false, classes, ...props }: AppSidebarProps) {
  const resolvedUser = {
    name: user?.name ?? null,
    email: user?.email ?? null,
    avatar: user?.avatar ?? null,
  }
  const pathname = usePathname()
  const router = useRouter()
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = window.localStorage.getItem('academyOpenMap')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  React.useEffect(() => {
    try { window.localStorage.setItem('academyOpenMap', JSON.stringify(openMap)) } catch {}
  }, [openMap])

  // Auto-expand DB-backed section when a child route is active
  React.useEffect(() => {
    if (!classes || classes.length === 0) return
    const map = { ...openMap }
    let changed = false
    for (const c of classes) {
      const isActive = pathname === `/class/${c.slug}` || c.modules.some((m) => pathname === `/class/${c.slug}/module/${m.index}`)
      if (isActive && !map[c.slug]) { map[c.slug] = true; changed = true }
    }
    if (changed) setOpenMap(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

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
        {/* Academy: DB-backed classes and modules */}
        {(() => {
          const tree = Array.isArray(classes) ? classes : []
          if (tree.length === 0) return null
          type Node = { key: string; title: string; href: string; children?: Array<{ title: string; href: string }> }
          const nodes: Node[] = tree.map((c) => ({
            key: c.slug,
            title: c.title,
            href: `/class/${c.slug}`,
            children: c.modules.map((m) => ({ title: `Module ${m.index}`, href: `/class/${c.slug}/module/${m.index}` })),
          }))

          const TopItem = ({ node }: { node: Node }) => {
            const isActive = pathname === node.href
            return (
              <SidebarMenuItem key={node.key}>
                <div className="flex items-center">
                  {node.children ? (
                    <SidebarMenuAction
                      title={openMap[node.key] ? 'Collapse' : 'Expand'}
                      className="mr-1 rounded-md hover:outline hover:outline-1 hover:outline-border"
                      onClick={(e) => { e.preventDefault(); const map = { ...openMap, [node.key]: !openMap[node.key] }; setOpenMap(map) }}
                    >
                      {openMap[node.key] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </SidebarMenuAction>
                  ) : null}
                  <SidebarMenuButton asChild isActive={isActive} className="flex-1 hover:bg-sidebar-accent rounded-md">
                    <Link
                      href={node.href}
                      prefetch
                      onMouseEnter={() => router.prefetch(node.href)}
                      onClick={() => {
                        if (node.children && !openMap[node.key]) {
                          const map = { ...openMap, [node.key]: true }
                          setOpenMap(map)
                          try { window.localStorage.setItem('academyOpenMap', JSON.stringify(map)) } catch {}
                        }
                      }}
                    >
                      <span className="relative inline-flex items-center gap-2 transition-all data-[active=true]:font-semibold data-[active=true]:text-foreground data-[active=true]:before:content-[''] data-[active=true]:before:absolute data-[active=true]:before:left-[-13px] data-[active=true]:before:top-1 data-[active=true]:before:bottom-1 data-[active=true]:before:w-0.5 data-[active=true]:before:bg-primary data-[active=true]:before:rounded data-[active=true]:before:z-10">
                        {node.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </div>
                {node.children && openMap[node.key] ? (
                  <SidebarMenuSub className="relative border-l pl-3">
                    {node.children.map((c) => {
                      const active = pathname === c.href
                      return (
                        <SidebarMenuSubItem key={c.href}>
                          <SidebarMenuSubButton asChild size="sm" isActive={active} className="relative transition-all duration-200 hover:bg-sidebar-accent rounded-md data-[active=true]:font-semibold data-[active=true]:text-foreground data-[active=true]:before:content-[''] data-[active=true]:before:absolute data-[active=true]:before:left-[-13px] data-[active=true]:before:top-1 data-[active=true]:before:bottom-1 data-[active=true]:before:w-0.5 data-[active=true]:before:bg-primary data-[active=true]:before:rounded data-[active=true]:before:z-10">
                            <Link href={c.href} prefetch className="text-muted-foreground hover:text-foreground" onMouseEnter={() => router.prefetch(c.href)}>
                              {c.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            )
          }

          return (
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 text-xs font-semibold tracking-wider">
                <GraduationCap className="size-4" />
                ACADEMY
                {isAdmin ? (
                  <div className="ml-auto inline-flex items-center gap-1">
                    <ClassWizardDialog onCreate={async (fd) => createClassWizardAction(fd)} />
                  </div>
                ) : null}
              </SidebarGroupLabel>
              <SidebarMenu>
                {nodes.map((node) => <TopItem key={node.key} node={node} />)}
              </SidebarMenu>
            </SidebarGroup>
          )
        })()}
        <NavDocuments items={RESOURCE_NAV} label="Resources" />
        <NavSecondary items={SECONDARY_NAV} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
