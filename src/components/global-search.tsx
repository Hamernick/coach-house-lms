"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { HeaderActionsPortal } from "@/components/header-actions-portal"
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
import type { SidebarClass } from "@/lib/academy"
import type { SearchResult } from "@/lib/search/types"

type GlobalSearchProps = {
  isAdmin?: boolean
  context?: "platform" | "accelerator"
  classes?: SidebarClass[]
}

function formatClassTitle(title: string) {
  const match = title.match(/^Session\s+[A-Za-z]\d+\s*[\u2013-]\s*(.+)$/i)
  if (match) return match[1].trim()
  return title
}

export function GlobalSearch({ isAdmin = false, context = "platform", classes = [] }: GlobalSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [remoteItems, setRemoteItems] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logEvent = (payload: {
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
  }

  const baseItems = useMemo<SearchResult[]>(() => {
    return [
      { id: "page-dashboard", label: "Dashboard", href: "/dashboard", group: "Pages", keywords: ["home", "overview"] },
      { id: "page-accelerator", label: "Accelerator", href: "/accelerator", group: "Pages", keywords: ["classes", "modules"] },
      { id: "page-organization", label: "My organization", href: "/my-organization", group: "Pages", keywords: ["profile"] },
      { id: "page-roadmap", label: "Roadmap", href: "/my-organization/roadmap", group: "Pages", keywords: ["strategic"] },
      { id: "page-programs", label: "Programs", href: "/my-organization?tab=programs", group: "Pages" },
      { id: "page-people", label: "People", href: "/people", group: "Pages", keywords: ["team", "org chart"] },
      { id: "page-supporters", label: "Supporters", href: "/my-organization?tab=supporters", group: "Pages" },
      { id: "page-documents", label: "Documents", href: "/my-organization/documents", group: "Pages" },
      { id: "page-billing", label: "Billing", href: "/billing", group: "Pages", keywords: ["subscription", "plan"] },
      { id: "page-community", label: "Community", href: "/community", group: "Pages", keywords: ["map", "network"] },
      { id: "page-marketplace", label: "Marketplace", href: "/marketplace", group: "Pages", keywords: ["tools", "resources"] },
    ]
  }, [])

  const adminItems = useMemo<SearchResult[]>(
    () =>
      isAdmin
        ? [
            { id: "admin-dashboard", label: "Admin dashboard", href: "/admin", group: "Admin" },
            { id: "admin-users", label: "Admin users", href: "/admin/users", group: "Admin" },
            { id: "admin-settings", label: "Admin settings", href: "/admin/settings", group: "Admin" },
          ]
        : [],
    [isAdmin],
  )

  const acceleratorItems = useMemo<SearchResult[]>(
    () =>
      context === "accelerator"
        ? [
            { id: "accelerator-overview", label: "Accelerator overview", href: "/accelerator#overview", group: "Accelerator", keywords: ["overview"] },
            { id: "accelerator-roadmap", label: "Accelerator roadmap", href: "/accelerator/roadmap", group: "Accelerator", keywords: ["roadmap"] },
          ]
        : [],
    [context],
  )

  const acceleratorClasses = useMemo<SearchResult[]>(() => {
    if (classes.length === 0) return []
    return classes
      .filter((klass) => (isAdmin ? true : klass.published))
      .flatMap((klass) => {
        const classTitle = formatClassTitle(klass.title)
        const classItem: SearchResult = {
          id: `class-${klass.id}`,
          label: classTitle,
          subtitle: "Class",
          href: `/accelerator/class/${klass.slug}`,
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
  }, [classes, isAdmin])

  const items = useMemo(() => {
    const merged = new Map<string, SearchResult>()
    for (const item of [...acceleratorItems, ...acceleratorClasses, ...baseItems, ...adminItems, ...remoteItems]) {
      merged.set(item.id, item)
    }
    return Array.from(merged.values())
  }, [acceleratorClasses, acceleratorItems, adminItems, baseItems, remoteItems])

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
  }, [open])

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

  return (
    <>
      <HeaderActionsPortal>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="hidden min-w-[190px] items-center justify-between gap-2 pl-3 pr-3 text-xs text-muted-foreground sm:inline-flex"
        >
          <span className="flex items-center gap-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Search</span>
          </span>
          <span className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            CMD+K
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="inline-flex sm:hidden"
          aria-label="Open search"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
      </HeaderActionsPortal>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-2 shadow-2xl"
        commandClassName="bg-transparent text-white/90 [&_[cmdk-group-heading]]:px-5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/40 **:data-[slot=command-input-wrapper]:mx-3 **:data-[slot=command-input-wrapper]:my-3 **:data-[slot=command-input-wrapper]:h-12 **:data-[slot=command-input-wrapper]:rounded-2xl **:data-[slot=command-input-wrapper]:border **:data-[slot=command-input-wrapper]:border-white/10 **:data-[slot=command-input-wrapper]:bg-white/5 **:data-[slot=command-input-wrapper]:px-4 **:data-[slot=command-input-wrapper]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] **:data-[slot=command-input]:text-[15px] **:data-[slot=command-input]:text-white **:data-[slot=command-input]:placeholder:text-white/40"
        showCloseButton={false}
      >
        <CommandInput
          placeholder="Search the platform..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[320px] px-2 pb-2">
          <CommandEmpty className="py-6 text-sm text-white/50">No matches found.</CommandEmpty>
          {isLoading && query.trim().length >= 2 ? (
            <CommandGroup heading="Searching">
              <CommandItem disabled value={query} className="opacity-60">
                Searching…
              </CommandItem>
            </CommandGroup>
          ) : null}
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
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition group-data-[selected=true]:border-white/20 group-data-[selected=true]:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
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
