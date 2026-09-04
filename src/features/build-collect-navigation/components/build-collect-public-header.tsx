"use client"

import Image from "next/image"
import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import { type ReactNode, useState } from "react"

import { PublicThemeToggle } from "@/components/organization/public-theme-toggle"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  shellActions,
  themeAction,
}: {
  activeArea: BuildCollectActiveArea
  authAction?: ReactNode
  hideBrandOnDesktop?: boolean
  shellActions?: ReactNode
  themeAction?: ReactNode
}) {
  const builderCta =
    activeArea === "build"
      ? { href: "/sign-up?intent=build", label: "Start free" }
      : { href: "/build", label: "Build" }

  return (
    <header
      data-build-collect-public-header=""
      className="grid min-h-16 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 px-[var(--shell-content-pad,1rem)] py-2"
    >
      <BuildCollectBrand hideOnDesktop={hideBrandOnDesktop} />

      <div className="flex min-w-0 items-center justify-center">
        <BuildCollectMobileNavigation activeArea={activeArea} />
        <BuildCollectDesktopNavigation activeArea={activeArea} />
      </div>

      <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2">
        <form action="/" method="get" className="hidden w-52 xl:block">
          <label
            htmlFor={`public-header-search-${activeArea}`}
            className="sr-only"
          >
            Search organizations and resources
          </label>
          <InputGroup className="gap-1">
            <InputGroupInput
              id={`public-header-search-${activeArea}`}
              name="q"
              type="search"
              autoComplete="off"
              placeholder="Start searching"
              className="h-10 rounded-full pl-4"
            />
            <InputGroupAddon>
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="size-10 rounded-full"
                aria-label="Search"
              >
                <SearchIcon data-icon="inline-start" aria-hidden />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </form>

        {authAction}
        <Button asChild className="rounded-full">
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
