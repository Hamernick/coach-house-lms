"use client"

import { lazy, Suspense, type ComponentProps } from "react"

import { GlobalSearch } from "@/components/app-shell/dynamic-components"
type GlobalSearchProps = ComponentProps<typeof GlobalSearch>

const AppShellMobileNav = lazy(() =>
  import("./app-shell-mobile-nav").then((module) => ({
    default: module.AppShellMobileNav,
  }))
)
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
