"use client"

import Image from "next/image"
import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import type { ReactNode } from "react"

import {
  getReactGrabLinkedSurfaceProps,
  getReactGrabOwnerProps,
} from "@/components/dev/react-grab-surface"
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
    <ul className="grid w-[min(32rem,calc(100cqw-2rem))] gap-1 p-1 md:grid-cols-2">
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
  return (
    <NavigationMenu
      {...getReactGrabOwnerProps({
        ownerId: "build-collect-navigation:desktop",
        component: "BuildCollectDesktopNavigation",
        source:
          "src/features/build-collect-navigation/components/build-collect-public-header.tsx",
        slot: "navigation",
        tokenSource: "src/app/globals.css",
      })}
      className="hidden md:flex"
      delayDuration={100}
      skipDelayDuration={100}
      viewport={false}
    >
      <NavigationMenuList className="bg-background/90 rounded-xl border p-1 shadow-xs backdrop-blur">
        <NavigationMenuItem value="collect" className="static">
          <NavigationMenuTrigger
            className="data-[active=true]:bg-accent rounded-lg"
            data-active={activeArea === "collect"}
          >
            Collect
          </NavigationMenuTrigger>
          <NavigationMenuContent
            {...getReactGrabLinkedSurfaceProps({
              ownerId: "build-collect-navigation:desktop",
              component: "BuildCollectDesktopNavigation",
              source:
                "src/features/build-collect-navigation/components/build-collect-public-header.tsx",
              slot: "collect-content",
              surfaceKind: "content",
              tokenSource: "src/app/globals.css",
            })}
            className="left-1/2 -translate-x-1/2"
          >
            <NavigationCards items={COLLECT_NAVIGATION_ITEMS} />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="build" className="static">
          <NavigationMenuTrigger
            className="data-[active=true]:bg-accent rounded-lg"
            data-active={activeArea === "build"}
          >
            Build
          </NavigationMenuTrigger>
          <NavigationMenuContent
            {...getReactGrabLinkedSurfaceProps({
              ownerId: "build-collect-navigation:desktop",
              component: "BuildCollectDesktopNavigation",
              source:
                "src/features/build-collect-navigation/components/build-collect-public-header.tsx",
              slot: "build-content",
              surfaceKind: "content",
              tokenSource: "src/app/globals.css",
            })}
            className="left-1/2 -translate-x-1/2"
          >
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
      className="@container/public-header relative z-20 min-h-16 shrink-0 px-[var(--shell-content-pad,1rem)] py-2"
    >
      <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="min-w-0 justify-self-start">
          <BuildCollectBrand hideOnDesktop={hideBrandOnDesktop} />
        </div>

        <div className="flex min-w-0 items-center justify-center">
          <BuildCollectMobileNavigation activeArea={activeArea} />
          <BuildCollectDesktopNavigation activeArea={activeArea} />
        </div>

        <div
          className={cn(
            "flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2",
            hasSearch && "col-span-3 @min-[60rem]/public-header:col-span-1"
          )}
        >
          {searchAction ??
            (showResourceSearch ? (
              <form
                action="/"
                method="get"
                className="min-w-0 flex-1 lg:max-w-52"
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
      </div>
    </header>
  )
}
