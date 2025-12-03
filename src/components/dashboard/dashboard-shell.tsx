"use client"

import { useMemo } from "react"
import type { ReactNode } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import dynamic from "next/dynamic"

import { SidebarBody } from "@/components/app-sidebar"
import { useSidebarOpenMap } from "@/components/app-sidebar/hooks"
import { OnboardingDialogEntry } from "@/components/onboarding/onboarding-dialog-entry"
import type { OnboardingDialogProps } from "@/components/onboarding/onboarding-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import type { SidebarClass } from "@/lib/academy"

const ThemeToggle = dynamic(() => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle), {
  ssr: false,
  loading: () => null,
})

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

type DashboardShellProps = {
  breadcrumbs?: ReactNode
  children: ReactNode
  sidebarTree: SidebarClass[]
  user: {
    name: string | null
    email: string | null
    avatar?: string | null
  }
  isAdmin: boolean
  onboardingProps?: OnboardingDialogProps & { enabled: boolean }
}

export function DashboardShell({
  breadcrumbs,
  children,
  sidebarTree,
  user,
  isAdmin,
  onboardingProps,
}: DashboardShellProps) {
  const pathname = usePathname()
  const { openMap, setOpenMap } = useSidebarOpenMap(pathname ?? "/", sidebarTree)

  const navUser = useMemo(
    () => ({
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? null,
    }),
    [user.avatar, user.email, user.name],
  )

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarBody
          isAdmin={isAdmin}
          classes={sidebarTree}
          openMap={openMap}
          setOpenMap={setOpenMap}
          user={navUser}
        />
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <DashboardHeader breadcrumbs={breadcrumbs} isAdmin={isAdmin} hasUser={Boolean(user.email)} />
          <main className="flex-1 overflow-y-auto" role="main">
            <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>

      {onboardingProps?.enabled ? <OnboardingDialogEntry {...onboardingProps} /> : null}
    </SidebarProvider>
  )
}

type DashboardHeaderProps = {
  breadcrumbs?: ReactNode
  isAdmin: boolean
  hasUser: boolean
}

function DashboardHeader({ breadcrumbs, isAdmin, hasUser }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        {breadcrumbs}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div id="site-header-actions" className="flex items-center gap-2" />
        <ThemeToggle />
        {!isAdmin ? (
          <Button variant="ghost" size="sm" asChild>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm">
              Support
            </a>
          </Button>
        ) : null}
        {!hasUser ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        ) : null}
      </div>
    </header>
  )
}
