"use client"

import LoaderCircleIcon from "lucide-react/dist/esm/icons/loader-circle"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { SearchResult } from "@/lib/search/types"
import { getInitials, getResultIcon } from "./global-search-helpers"

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

type GlobalSearchCommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (value: string) => void
  isLoading: boolean
  error: string | null
  grouped: Array<[string, SearchResult[]]>
  onSelectItem: (item: SearchResult) => void
}

export function GlobalSearchCommandDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  isLoading,
  error,
  grouped,
  onSelectItem,
}: GlobalSearchCommandDialogProps) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] max-h-[calc(100dvh-9rem)] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 p-2 shadow-2xl sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl"
      commandClassName="bg-transparent text-white/90 [&_[cmdk-group-heading]]:px-5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-white/40 **:data-[slot=command-input-wrapper]:mx-3 **:data-[slot=command-input-wrapper]:my-3 **:data-[slot=command-input-wrapper]:h-12 **:data-[slot=command-input-wrapper]:rounded-2xl **:data-[slot=command-input-wrapper]:border **:data-[slot=command-input-wrapper]:border-white/10 **:data-[slot=command-input-wrapper]:bg-white/5 **:data-[slot=command-input-wrapper]:px-4 **:data-[slot=command-input-wrapper]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] **:data-[slot=command-input]:text-[15px] **:data-[slot=command-input]:text-white **:data-[slot=command-input]:placeholder:text-white/40"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search the platform..."
        value={query}
        onValueChange={onQueryChange}
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
                  onSelect={() => onSelectItem(item)}
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
  )
}
