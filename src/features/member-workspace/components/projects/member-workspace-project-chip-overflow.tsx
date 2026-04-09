"use client"

import { X } from "@phosphor-icons/react/dist/ssr"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { MemberWorkspaceProjectFilterChip } from "./member-workspace-project-view-options"

function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <div className="flex h-8 min-w-0 max-w-[200px] items-center gap-1.5 rounded-md border border-border/60 bg-muted px-3 text-sm">
      <span className="truncate">{label}</span>
      <button onClick={onRemove} className="ml-0.5 flex-shrink-0 rounded-md p-0.5 hover:bg-accent">
        <X className="h-3.5 w-3.5" weight="bold" />
      </button>
    </div>
  )
}

export function MemberWorkspaceProjectChipOverflow({
  chips,
  onRemove,
  maxVisible = 4,
  className,
}: {
  chips: MemberWorkspaceProjectFilterChip[]
  onRemove: (key: string, value: string) => void
  maxVisible?: number
  className?: string
}) {
  const visible = chips.slice(0, Math.max(0, maxVisible))
  const hidden = chips.slice(Math.max(0, maxVisible))

  if (chips.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2 overflow-hidden", className)}>
      {visible.map((chip) => (
        <FilterChip
          key={`${chip.key}-${chip.value}`}
          label={`${chip.key}: ${chip.value}`}
          onRemove={() => onRemove(chip.key, chip.value)}
        />
      ))}
      {hidden.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-8 items-center rounded-full border border-border/60 bg-background px-3 text-sm text-muted-foreground hover:bg-accent">
              +{hidden.length} more
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 rounded-xl p-2">
            <div className="flex max-h-64 flex-col gap-2 overflow-auto pr-1">
              {hidden.map((chip) => (
                <div key={`${chip.key}-${chip.value}`} className="shrink-0">
                  <FilterChip
                    label={`${chip.key}: ${chip.value}`}
                    onRemove={() => onRemove(chip.key, chip.value)}
                  />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}
