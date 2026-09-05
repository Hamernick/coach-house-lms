"use client"

import Image from "next/image"
import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import { type ReactNode, useState } from "react"

import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

import { BUILD_NAVIGATION_ITEMS, COLLECT_NAVIGATION_ITEMS } from "../lib"
import type {
  BuildCollectActiveArea,
  BuildCollectNavigationItem,
} from "../types"

function BuildCollectBrand({
  hideOnDesktop = false,
}: {
  hideOnDesktop?: boolean
}) {
  return (
    <Link
      href="/"
      aria-label="Coach House home"
      className={cn(
        "hover:bg-accent flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        hideOnDesktop && "md:hidden"
      )}
    >
      <span className="relative flex size-8 shrink-0 items-center justify-center">
        <Image
          src="/coach-house-logo-light.png"
          alt=""
          width={32}
          height={32}
          className="block dark:hidden"
          priority
        />
        <Image
          src="/coach-house-logo-dark.png"
          alt=""
          width={32}
          height={32}
          className="hidden dark:block"
          priority
        />
      </span>
      <span className="hidden min-w-0 flex-col leading-none sm:flex">
        <span className="truncate text-sm font-bold tracking-tight">
          Coach House
        </span>
        <span className="text-muted-foreground pt-1 text-[9px] font-semibold tracking-[0.18em]">
          ALPHA
        </span>
      </span>
    </Link>
  )
}

function NavigationCards({ items }: { items: BuildCollectNavigationItem[] }) {
  return (
    <ul className="grid w-[min(32rem,calc(100vw-2rem))] gap-1 p-1 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.href}>
          <NavigationMenuLink asChild>
            <Link href={item.href} className="h-full p-3">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground leading-5">
                {item.description}
              </span>
            </Link>
          </NavigationMenuLink>
        </li>
      ))}
    </ul>
  )
}

function BuildCollectDesktopNavigation({
  activeArea,
}: {
  activeArea: BuildCollectActiveArea
}) {
  const [openMenu, setOpenMenu] = useState("")

  return (
    <NavigationMenu
      className="hidden md:flex"
      delayDuration={100}
      onPointerLeave={() => setOpenMenu("")}
      onValueChange={setOpenMenu}
      skipDelayDuration={100}
      value={openMenu}
      viewport={false}
    >
      <NavigationMenuList className="bg-background/90 rounded-xl border p-1 shadow-xs backdrop-blur">
        <NavigationMenuItem value="collect">
          <NavigationMenuTrigger
            className="data-[active=true]:bg-accent rounded-lg"
            data-active={activeArea === "collect"}
            onPointerEnter={() => setOpenMenu("collect")}
          >
            Collect
          </NavigationMenuTrigger>
          <NavigationMenuContent className="left-1/2 -translate-x-1/2">
            <NavigationCards items={COLLECT_NAVIGATION_ITEMS} />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="build">
          <NavigationMenuTrigger
            className="data-[active=true]:bg-accent rounded-lg"
            data-active={activeArea === "build"}
            onPointerEnter={() => setOpenMenu("build")}
          >
            Build
          </NavigationMenuTrigger>
          <NavigationMenuContent className="right-0 left-auto">
            <NavigationCards items={BUILD_NAVIGATION_ITEMS} />
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function BuildCollectMobileNavigation({
  activeArea,
}: {
  activeArea: BuildCollectActiveArea
}) {
  return (
    <nav
      aria-label="Public navigation"
      className="flex items-center gap-1 md:hidden"
    >
      <Button
        asChild
        size="sm"
        variant={activeArea === "collect" ? "secondary" : "ghost"}
        className="rounded-full"
      >
        <Link
          href="/"
          aria-current={activeArea === "collect" ? "page" : undefined}
        >
          Collect
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={activeArea === "build" ? "secondary" : "ghost"}
        className="rounded-full"
      >
        <Link
          href="/build"
          aria-current={activeArea === "build" ? "page" : undefined}
        >
          Build
        </Link>
      </Button>
    </nav>
  )
}

export function BuildCollectPublicHeader({
  activeArea,
  authAction,
  hideBrandOnDesktop = false,
  showResourceSearch = true,
  searchAction,
  shellActions,
  themeAction,
}: {
  activeArea: BuildCollectActiveArea
  authAction?: ReactNode
  hideBrandOnDesktop?: boolean
  showResourceSearch?: boolean
  searchAction?: ReactNode
  shellActions?: ReactNode
  themeAction?: ReactNode
}) {
  const builderCta =
    activeArea === "build"
      ? { href: "/sign-up?intent=build", label: "Start free" }
      : { href: "/build", label: "Build" }
  const hasSearch = searchAction != null || showResourceSearch

  return (
    <header
      data-build-collect-public-header=""
      className={cn(
        "grid min-h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 px-[var(--shell-content-pad,1rem)] py-2",
        hasSearch && "grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto]"
      )}
    >
      <BuildCollectBrand hideOnDesktop={hideBrandOnDesktop} />

      <div className="flex min-w-0 items-center justify-center">
        <BuildCollectMobileNavigation activeArea={activeArea} />
        <BuildCollectDesktopNavigation activeArea={activeArea} />
      </div>

      <div
        className={cn(
          "flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2",
          hasSearch && "col-span-2 lg:col-span-1"
        )}
      >
        {searchAction ??
          (showResourceSearch ? (
            <form
              action="/"
              method="get"
              className="min-w-0 flex-1 lg:w-52 lg:flex-none"
              role="search"
              aria-label="Organizations and resources"
            >
              <label
                htmlFor={`public-header-search-${activeArea}`}
                className="sr-only"
              >
                Search organizations and resources
              </label>
              <SearchInput
                id={`public-header-search-${activeArea}`}
                name="q"
                autoComplete="off"
                placeholder="Search…"
              />
            </form>
          ) : null)}

        {authAction}
        <Button
          asChild
          className={cn(
            "rounded-full",
            hasSearch && activeArea === "collect" && "hidden sm:inline-flex"
          )}
        >
          <Link href={builderCta.href}>
            {builderCta.label}
            <ArrowUpRightIcon data-icon="inline-end" aria-hidden />
          </Link>
        </Button>
        {themeAction ?? (
          <PublicThemeToggle
            variant="ghost"
            size="icon"
            className="hidden size-10 shrink-0 sm:inline-flex"
          />
        )}
        {shellActions}
      </div>
    </header>
  )
}
