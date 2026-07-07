"use client"

import { Button } from "@/components/ui/button"
import {
  PUBLIC_MAP_RESOURCE_CATEGORY_COLORS,
  PUBLIC_MAP_RESOURCE_CATEGORY_LABELS,
  PUBLIC_MAP_RESOURCE_CATEGORY_ORDER,
  publicMapResourceCategoryMatchesTopLevel,
  type PublicMapResourceCategoryKey,
  type PublicMapResourceTopLevelCategoryKey,
} from "@/lib/public-map/resource-categories"
import { cn } from "@/lib/utils"
import {
  PublicMapAllCategoryIcon,
  PublicMapResourceCategoryIcon,
} from "./resource-category-icon"

export type PublicMapGroupFilterKey =
  | PublicMapResourceTopLevelCategoryKey
  | "all"

export type PublicMapGroupFilterCounts = Record<PublicMapGroupFilterKey, number>

export const PUBLIC_MAP_GROUP_FILTER_ORDER = [
  "all",
  ...PUBLIC_MAP_RESOURCE_CATEGORY_ORDER,
] satisfies PublicMapGroupFilterKey[]

function resolvePublicMapGroupFilterLabel(key: PublicMapGroupFilterKey) {
  return key === "all" ? "All" : PUBLIC_MAP_RESOURCE_CATEGORY_LABELS[key]
}

function resolvePublicMapGroupFilterAccent(key: PublicMapGroupFilterKey) {
  return key === "all"
    ? "hsl(var(--foreground))"
    : PUBLIC_MAP_RESOURCE_CATEGORY_COLORS[key]
}

export function isPublicMapGroupFilterKey(
  value: string | null | undefined
): value is PublicMapGroupFilterKey {
  return PUBLIC_MAP_GROUP_FILTER_ORDER.some((key) => key === value)
}

export function resolvePublicMapGroupFilterParam(
  value: string | null | undefined
): PublicMapGroupFilterKey {
  return isPublicMapGroupFilterKey(value) ? value : "all"
}

export function buildPublicMapGroupFilterCounts(
  items: Array<{ resourceCategories?: readonly PublicMapResourceCategoryKey[] }>
): PublicMapGroupFilterCounts {
  const counts = Object.fromEntries(
    PUBLIC_MAP_GROUP_FILTER_ORDER.map((key) => [key, 0])
  ) as PublicMapGroupFilterCounts

  counts.all = items.length
  for (const item of items) {
    const matchedTopLevelCategories =
      new Set<PublicMapResourceTopLevelCategoryKey>()
    const categories =
      item.resourceCategories && item.resourceCategories.length > 0
        ? item.resourceCategories
        : (["community"] as const)
    for (const category of categories) {
      for (const topLevelCategory of PUBLIC_MAP_RESOURCE_CATEGORY_ORDER) {
        if (
          publicMapResourceCategoryMatchesTopLevel({
            category,
            topLevelCategory,
          })
        ) {
          matchedTopLevelCategories.add(topLevelCategory)
        }
      }
    }
    for (const category of matchedTopLevelCategories) {
      counts[category] += 1
    }
  }

  return counts
}

export function PublicMapCategoryFilter({
  activeGroup,
  counts,
  compact = false,
  onActiveGroupChange,
}: {
  activeGroup: PublicMapGroupFilterKey
  counts: PublicMapGroupFilterCounts
  compact?: boolean
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
}) {
  return (
    <div
      className={cn(
        "-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-0.5",
        "scroll-fade-effect-x [--mask-width:1.25rem] [--scroll-buffer:1rem]",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        compact ? "pt-0.5" : "pt-1"
      )}
      aria-label="Filter resources by category"
    >
      {PUBLIC_MAP_GROUP_FILTER_ORDER.map((key) => {
        const count = counts[key]
        const selected = activeGroup === key
        const label = resolvePublicMapGroupFilterLabel(key)
        const accent = resolvePublicMapGroupFilterAccent(key)
        const disabled = key !== "all" && count === 0

        return (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={selected}
            disabled={disabled}
            className={cn(
              "group border-input bg-input/30 h-7 shrink-0 gap-1.5 rounded-full border px-2.5 text-[11px] leading-none shadow-sm backdrop-blur",
              "text-muted-foreground transition-[background-color,border-color,color,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "focus-visible:!bg-input/50 focus-visible:ring-ring/45 focus-visible:ring-2 focus-visible:outline-none",
              "disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none",
              selected
                ? "!bg-input/50 text-foreground hover:!bg-input/50 hover:text-foreground focus-visible:text-foreground"
                : "hover:!bg-input/50 hover:text-foreground focus-visible:text-foreground"
            )}
            onClick={() => onActiveGroupChange(key)}
          >
            <span
              className={cn(
                "inline-flex size-4 items-center justify-center rounded-full",
                selected ? "bg-background/85 dark:bg-background/18" : "bg-muted"
              )}
              aria-hidden
            >
              {key === "all" ? (
                <PublicMapAllCategoryIcon
                  className={cn(
                    "size-3",
                    selected
                      ? "text-foreground dark:text-background"
                      : "text-muted-foreground"
                  )}
                  style={selected ? undefined : { color: accent }}
                />
              ) : (
                <PublicMapResourceCategoryIcon
                  category={key}
                  className={cn(
                    "size-3",
                    selected
                      ? "text-foreground dark:text-background"
                      : "text-muted-foreground"
                  )}
                  style={selected ? undefined : { color: accent }}
                />
              )}
            </span>
            <span>{label}</span>
            <span
              className={cn(
                "tabular-nums",
                selected ? "text-foreground" : "text-muted-foreground/72"
              )}
            >
              {count.toLocaleString()}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
