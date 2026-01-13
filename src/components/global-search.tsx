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

type SearchItem = {
  label: string
  href: string
  group: string
  keywords?: string[]
}

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

  const items = useMemo(() => {
    const baseItems: SearchItem[] = [
      { label: "Dashboard", href: "/dashboard", group: "Pages", keywords: ["home", "overview"] },
      { label: "Accelerator", href: "/accelerator", group: "Pages", keywords: ["classes", "modules"] },
      { label: "My organization", href: "/my-organization", group: "Pages", keywords: ["profile"] },
      { label: "Roadmap", href: "/my-organization/roadmap", group: "Pages", keywords: ["strategic"] },
      { label: "Programs", href: "/my-organization?tab=programs", group: "Pages" },
      { label: "People", href: "/my-organization?tab=people", group: "Pages", keywords: ["team", "org chart"] },
      { label: "Supporters", href: "/my-organization?tab=supporters", group: "Pages" },
      { label: "Documents", href: "/my-organization/documents", group: "Pages" },
      { label: "Billing", href: "/billing", group: "Pages", keywords: ["subscription", "plan"] },
    ]

    const adminItems: SearchItem[] = isAdmin
      ? [
          { label: "Admin dashboard", href: "/admin", group: "Admin" },
          { label: "Admin users", href: "/admin/users", group: "Admin" },
          { label: "Admin settings", href: "/admin/settings", group: "Admin" },
        ]
      : []

    if (context !== "accelerator") {
      return [...baseItems, ...adminItems]
    }

    const acceleratorItems: SearchItem[] = [
      { label: "Accelerator overview", href: "/accelerator#overview", group: "Accelerator", keywords: ["overview"] },
      { label: "Accelerator roadmap", href: "/accelerator/roadmap", group: "Accelerator", keywords: ["roadmap"] },
    ]

    const acceleratorClasses = classes
      .filter((klass) => (isAdmin ? true : klass.published))
      .flatMap((klass) => {
        const classTitle = formatClassTitle(klass.title)
        const classItem: SearchItem = {
          label: classTitle,
          href: `/accelerator/class/${klass.slug}`,
          group: "Classes",
          keywords: [klass.slug, klass.title],
        }
        const moduleItems = klass.modules
          .filter((module) => (isAdmin ? true : module.published))
          .map((module) => ({
            label: `${classTitle}: ${module.title}`,
            href: `/accelerator/class/${klass.slug}/module/${module.index}`,
            group: "Modules",
            keywords: [classTitle, module.title, `${module.index}`],
          }))
        return [classItem, ...moduleItems]
      })

    return [...acceleratorItems, ...acceleratorClasses, ...baseItems, ...adminItems]
  }, [classes, context, isAdmin])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>()
    items.forEach((item) => {
      const list = map.get(item.group) ?? []
      list.push(item)
      map.set(item.group, list)
    })
    return Array.from(map.entries())
  }, [items])

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
        <CommandInput placeholder="Search the platform..." />
        <CommandList className="max-h-[320px] px-2 pb-2">
          <CommandEmpty className="py-6 text-sm text-white/50">No matches found.</CommandEmpty>
          {grouped.map(([group, groupItems], index) => (
            <div key={group}>
              <CommandGroup heading={group}>
                {groupItems.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={[item.label, ...(item.keywords ?? [])].join(" ")}
                    onSelect={() => {
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
                    <span className="flex-1">{item.label}</span>
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
