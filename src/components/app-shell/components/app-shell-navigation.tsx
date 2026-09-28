"use client"

import { lazy, Suspense, type ComponentProps, type ReactNode } from "react"

import { useSidebar } from "@/components/ui/sidebar"
import { useRightRailPresence } from "@/components/app-shell/right-rail"

import { GlobalSearch } from "@/components/app-shell/dynamic-components"
type GlobalSearchProps = ComponentProps<typeof GlobalSearch>

const AppShellMobileNav = lazy(() =>
  import("./app-shell-mobile-nav").then((module) => ({
    default: module.AppShellMobileNav,
  }))
)
const ShellRightRail = lazy(() =>
  import("./shell-right-rail").then((module) => ({ default: module.ShellRightRail }))
)

export function AppShellRightRail(props: ComponentProps<typeof ShellRightRail>) {
  const hasRightRail = useRightRailPresence()
  if (!hasRightRail) return null
  return <Suspense fallback={null}><ShellRightRail {...props} /></Suspense>
}

export function AppShellNavigation({
  isMobile,
  showMobileNavigation = true,
  search,
  showGlobalSearch,
  ...navigation
}: {
  isMobile: boolean
  showMobileNavigation?: boolean
  search: GlobalSearchProps
  showGlobalSearch: boolean
  showWorkspace: boolean
  onboardingLocked: boolean
  rightOpen: boolean
  onRightOpenChange: (open: boolean) => void
}) {
  return (
    <>
      {isMobile && showMobileNavigation ? (
        <Suspense fallback={null}>
          <AppShellMobileNav {...navigation} />
        </Suspense>
      ) : null}
      {showGlobalSearch ? <GlobalSearch {...search} /> : null}
    </>
  )
}

export function AppShellSidebarNavigation({ children }: { children: ReactNode }) {
  const { isMobile, setOpenMobile } = useSidebar()
  return (
    <div
      className="flex min-h-0 flex-1 flex-col max-md:[&_a]:min-h-11 max-md:[&_a]:min-w-11 max-md:[&_button]:min-h-11 max-md:[&_button]:min-w-11"
      onClickCapture={(event) => {
        if (
          !isMobile ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          !(event.target instanceof Element)
        )
          return
        const link = event.target.closest("a[href]")
        if (!link || !event.currentTarget.contains(link)) return
        requestAnimationFrame(() => setOpenMobile(false))
      }}
    >
      {children}
    </div>
  )
}
