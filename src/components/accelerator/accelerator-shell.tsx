"use client"

import type { ReactNode } from "react"
import { AcceleratorSidebar } from "@/components/accelerator/accelerator-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationsMenu } from "@/components/notifications/notifications-menu"
import { SupportMenu } from "@/components/support-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import type { SidebarClass } from "@/lib/academy"

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

type AcceleratorShellProps = {
  children: ReactNode
  sidebarTree: SidebarClass[]
  isAdmin: boolean
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
}

export function AcceleratorShell({ children, sidebarTree, isAdmin, user }: AcceleratorShellProps) {
  return (
    <SidebarProvider className="bg-background text-foreground">
      <Sidebar collapsible="offcanvas" className="border-border/60">
        <AcceleratorSidebar classes={sidebarTree} isAdmin={isAdmin} user={user} />
      </Sidebar>
      <SidebarInset className="bg-background text-foreground">
        <div className="flex min-h-svh min-w-0 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-4 text-sm text-muted-foreground backdrop-blur">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Separator
              orientation="vertical"
              className="hidden data-[orientation=vertical]:h-4 data-[orientation=vertical]:bg-border md:block"
            />
            <div id="site-header-title" className="min-w-0 flex-1" />
            <div className="ml-auto flex items-center gap-2">
              <div id="site-header-actions" className="flex items-center gap-2" />
              <NotificationsMenu />
              <ThemeToggle />
              {!isAdmin ? (
                <SupportMenu
                  email={SUPPORT_EMAIL}
                  host="joel"
                  buttonVariant="ghost"
                  buttonSize="sm"
                  buttonClassName="text-sm"
                />
              ) : null}
            </div>
          </header>
          <main data-accelerator-scroll className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
      <GlobalSearch isAdmin={isAdmin} context="accelerator" classes={sidebarTree} />
    </SidebarProvider>
  )
}
