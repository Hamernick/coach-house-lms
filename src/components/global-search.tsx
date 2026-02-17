"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import LayersIcon from "lucide-react/dist/esm/icons/layers"
import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import ShieldIcon from "lucide-react/dist/esm/icons/shield"
import ShoppingBagIcon from "lucide-react/dist/esm/icons/shopping-bag"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { HeaderActionsPortal } from "@/components/header-actions-portal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SidebarClass } from "@/lib/academy"
import type { SearchResult } from "@/lib/search/types"

type GlobalSearchProps = {
  isAdmin?: boolean
  showOrgAdmin?: boolean
  context?: "platform" | "accelerator"
  classes?: SidebarClass[]
  showAccelerator?: boolean
}

const SEARCH_MIN_WIDTH = 240

function formatClassTitle(title: string) {
  const match = title.match(/^Session\s+[A-Za-z]\d+\s*[\u2013-]\s*(.+)$/i)
  if (match) return match[1].trim()
  return title
}

function getInitials(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function getResultIcon(item: SearchResult) {
  const href = item.href
  const group = item.group.toLowerCase()

  if (group === "admin") return ShieldIcon
  if (group === "accelerator") return RocketIcon
  if (group === "classes") return BookOpenIcon
  if (group === "modules") return LayersIcon
  if (group === "questions") return HelpCircleIcon
  if (group === "documents") return FileTextIcon
  if (group === "roadmap") return RouteIcon
  if (group === "programs") return LayersIcon
  if (group === "community") return MapPinIcon
  if (group === "marketplace") return ShoppingBagIcon
  if (group === "my organization" || group === "organization") return Building2Icon

  if (href.startsWith("/billing")) return CreditCardIcon
  if (href.startsWith("/internal")) return ShieldIcon
  if (href.startsWith("/admin")) return ShieldIcon
  if (href.startsWith("/people")) return UsersIcon
  if (href.startsWith("/community")) return MapPinIcon
  if (href.startsWith("/marketplace")) return ShoppingBagIcon
  if (href.startsWith("/accelerator")) return RocketIcon
  if (href.startsWith("/roadmap")) return RouteIcon
  if (href.startsWith("/organization")) return Building2Icon

  return ArrowUpRight
}

function SearchResultLeadingVisual({ item }: { item: SearchResult }) {
  const Icon = getResultIcon(item)
  const initials = getInitials(item.label)

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition group-data-[selected=true]:border-white/20 group-data-[selected=true]:text-white">
      {item.image ? (
        <Avatar className="h-9 w-9 rounded-full">
          <AvatarImage src={item.image} alt="" className="object-cover" />
          <AvatarFallback className="rounded-full bg-white/10 text-[11px] font-semibold text-white/70">
            {initials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <Icon className="h-4 w-4" aria-hidden />
      )}
    </span>
  )
}

export function GlobalSearch({
  isAdmin = false,
  showOrgAdmin = false,
  context = "platform",
  classes = [],
  showAccelerator = false,
}: GlobalSearchProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [remoteItems, setRemoteItems] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compact, setCompact] = useState(false)
  const enableAccelerator = Boolean(isAdmin || showAccelerator)

  useEffect(() => {
    if (typeof window === "undefined") return
    const node = document.getElementById("site-header-actions-center")
    if (!node) return

    const update = () => {
      const width = node.getBoundingClientRect().width
      const next = width < SEARCH_MIN_WIDTH
      setCompact((prev) => (prev === next ? prev : next))
    }

    update()

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update)
      observer.observe(node)
    } else {
      window.addEventListener("resize", update)
    }

    return () => {
      observer?.disconnect()
      if (!observer) {
        window.removeEventListener("resize", update)
      }
    }
  }, [])

  const logEvent = useCallback(
    (payload: {
      eventType: "open" | "select"
      query?: string
      resultId?: string
      resultGroup?: string
      resultHref?: string
    }) => {
      const body = {
        eventType: payload.eventType,
        query: payload.query?.slice(0, 200),
        resultId: payload.resultId,
        resultGroup: payload.resultGroup,
        resultHref: payload.resultHref,
        context,
      }
      void fetch("/api/search/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    },
    [context],
  )

  const baseItems = useMemo<SearchResult[]>(() => {
    const showOrgAdminLink = showOrgAdmin
    return [
      ...(enableAccelerator
        ? [
            {
              id: "page-accelerator",
              label: "Accelerator",
              href: "/accelerator",
              group: "Pages",
              keywords: ["classes", "modules"],
            } satisfies SearchResult,
          ]
        : []),
      { id: "page-organization", label: "Organization", href: "/organization", group: "Pages", keywords: ["profile"] },
      { id: "page-roadmap", label: "Roadmap", href: "/roadmap", group: "Pages", keywords: ["strategic"] },
      { id: "page-programs", label: "Programs", href: "/organization?tab=programs", group: "Pages" },
      { id: "page-people", label: "People", href: "/people", group: "Pages", keywords: ["team", "org chart"] },
      { id: "page-supporters", label: "Supporters", href: "/organization?tab=supporters", group: "Pages" },
      { id: "page-documents", label: "Documents", href: "/organization/documents", group: "Pages" },
      { id: "page-billing", label: "Billing", href: "/billing", group: "Pages", keywords: ["subscription", "plan"] },
      { id: "page-community", label: "Community", href: "/community", group: "Pages", keywords: ["map", "network"] },
      { id: "page-marketplace", label: "Marketplace", href: "/marketplace", group: "Pages", keywords: ["tools", "resources"] },
      ...(showOrgAdminLink
        ? [
            {
              id: "page-admin",
              label: "Admin",
              href: "/admin",
              group: "Pages",
              keywords: ["access", "invites", "roles"],
            } satisfies SearchResult,
          ]
        : []),
    ]
  }, [enableAccelerator, showOrgAdmin])

  const acceleratorItems = useMemo<SearchResult[]>(
    () =>
      context === "accelerator" && enableAccelerator
        ? [
            { id: "accelerator-overview", label: "Accelerator overview", href: "/accelerator#overview", group: "Accelerator", keywords: ["overview"] },
          ]
        : [],
    [context, enableAccelerator],
  )

  const acceleratorClasses = useMemo<SearchResult[]>(() => {
    if (!enableAccelerator || classes.length === 0) return []
    return classes
      .filter((klass) => (isAdmin ? true : klass.published))
      .flatMap((klass) => {
        const classTitle = formatClassTitle(klass.title)
        const firstModuleIndex = klass.modules[0]?.index ?? 1
        const classItem: SearchResult = {
          id: `class-${klass.id}`,
          label: classTitle,
          subtitle: "Class",
          href: `/accelerator/class/${klass.slug}/module/${firstModuleIndex}`,
          group: "Classes",
          keywords: [klass.slug, klass.title],
        }
        const moduleItems = klass.modules
          .filter((module) => (isAdmin ? true : module.published))
          .map((module) => ({
            id: `module-${module.id}`,
            label: module.title,
            subtitle: classTitle,
            href: `/accelerator/class/${klass.slug}/module/${module.index}`,
            group: "Modules",
            keywords: [classTitle, module.title, `${module.index}`],
          }))
        return [classItem, ...moduleItems]
      })
  }, [classes, enableAccelerator, isAdmin])

  const items = useMemo(() => {
    const merged = new Map<string, SearchResult>()
    for (const item of [...acceleratorItems, ...acceleratorClasses, ...baseItems, ...remoteItems]) {
      merged.set(item.id, item)
    }
    const values = Array.from(merged.values())
    return enableAccelerator ? values : values.filter((item) => !item.href.startsWith("/accelerator"))
  }, [acceleratorClasses, acceleratorItems, baseItems, enableAccelerator, remoteItems])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    items.forEach((item) => {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    })
    const orderedGroups = [
      "Pages",
      "Accelerator",
      "Classes",
      "Modules",
      "Questions",
      "Programs",
      "My organization",
      "Roadmap",
      "Documents",
      "Community",
      "Marketplace",
      "Admin",
    ]
    const entries = Array.from(map.entries())
    entries.sort((a, b) => {
      const ai = orderedGroups.indexOf(a[0])
      const bi = orderedGroups.indexOf(b[0])
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    return entries
  }, [items])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setRemoteItems([])
      setIsLoading(false)
      setError(null)
    } else {
      logEvent({ eventType: "open" })
    }
  }, [logEvent, open])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setRemoteItems([])
      setIsLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&context=${context}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error("Search unavailable.")
        }
        const payload = (await response.json().catch(() => ({}))) as { results?: SearchResult[] }
        setRemoteItems(Array.isArray(payload.results) ? payload.results : [])
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setError("Search unavailable.")
        setRemoteItems([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 180)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [context, open, query])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const showCompact = isMobile || compact
  const showCenterCompact = showCompact && !isMobile

  return (
    <>
      {!showCompact ? (
        <HeaderActionsPortal slot="center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            data-tour="global-search-button"
            className={cn(
              "hidden min-w-[240px] w-full max-w-[520px] items-center justify-between gap-2 pl-3 pr-3 text-xs text-muted-foreground md:inline-flex lg:max-w-[600px]",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate text-foreground">Search</span>
            </span>
            <span className="shrink-0 whitespace-nowrap rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              CMD+K
            </span>
          </Button>
        </HeaderActionsPortal>
      ) : showCenterCompact ? (
        <HeaderActionsPortal slot="center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            data-tour="global-search-button"
            className="hidden md:inline-flex"
            aria-label="Open search"
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        </HeaderActionsPortal>
      ) : null}
      <HeaderActionsPortal slot="right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          data-tour="global-search-button"
          className="inline-flex md:hidden"
          aria-label="Open search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
      </HeaderActionsPortal>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] max-h-[calc(100dvh-9rem)] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-2 shadow-2xl sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl"
        commandClassName="bg-transparent text-white/90 [&_[cmdk-group-heading]]:px-5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/40 **:data-[slot=command-input-wrapper]:mx-3 **:data-[slot=command-input-wrapper]:my-3 **:data-[slot=command-input-wrapper]:h-12 **:data-[slot=command-input-wrapper]:rounded-2xl **:data-[slot=command-input-wrapper]:border **:data-[slot=command-input-wrapper]:border-white/10 **:data-[slot=command-input-wrapper]:bg-white/5 **:data-[slot=command-input-wrapper]:px-4 **:data-[slot=command-input-wrapper]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] **:data-[slot=command-input]:text-[15px] **:data-[slot=command-input]:text-white **:data-[slot=command-input]:placeholder:text-white/40"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Search the platform..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[320px] px-2 pb-2">
          <CommandEmpty className="py-6 text-sm text-white/50">
            {isLoading && query.trim().length >= 2 ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </span>
            ) : (
              "No matches found."
            )}
          </CommandEmpty>
          {error ? (
            <CommandGroup heading="Status">
              <CommandItem disabled value={query} className="opacity-60">
                {error}
              </CommandItem>
            </CommandGroup>
          ) : null}
          {grouped.map(([group, groupItems], index) => (
            <div key={group}>
              <CommandGroup heading={group}>
                {groupItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={[item.label, item.subtitle ?? "", ...(item.keywords ?? [])].join(" ")}
                    onSelect={() => {
                      logEvent({
                        eventType: "select",
                        query: query.trim(),
                        resultId: item.id,
                        resultGroup: item.group,
                        resultHref: item.href,
                      })
                      setOpen(false)
                      router.push(item.href)
                    }}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-white/80",
                      "data-[selected=true]:bg-white/10 data-[selected=true]:text-white",
                    )}
                  >
                    <SearchResultLeadingVisual item={item} />
                    <span className="flex-1">
                      <span className="block">{item.label}</span>
                      {item.subtitle ? (
                        <span className="mt-0.5 block text-xs text-white/50">{item.subtitle}</span>
                      ) : null}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {index < grouped.length - 1 ? <CommandSeparator className="my-2 bg-white/10" /> : null}
            </div>
          ))}
        </CommandList>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50">
          <span className="flex h-6 min-w-[44px] items-center justify-center rounded-md border border-white/10 bg-white/10 px-2 text-[10px] font-semibold uppercase text-white/70 whitespace-nowrap">
            Enter
          </span>
          Go to page
        </div>
      </CommandDialog>
    </>
  )
}
