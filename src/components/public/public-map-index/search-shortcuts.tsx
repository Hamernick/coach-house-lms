"use client"

import { Button } from "@/components/ui/button"
import {
  PUBLIC_MAP_RESOURCE_CATEGORY_DEFINITIONS,
  resolvePublicMapResourceCategoryColor,
  type PublicMapResourceCategoryDefinition,
} from "@/lib/public-map/resource-categories"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import type { PublicMapResourceGuide } from "./resource-guide-model"
import { PublicMapResourceCategoryIcon } from "./resource-category-icon"
import { normalizePublicMapSearchText } from "./search-text"

function normalizeIntentQuery(query: string) {
  return normalizePublicMapSearchText(query)
    .replace(/^(?:find|show|browse|search for) /, "")
    .replace(/ (?:nearby|near me)$/, "")
}

export function resolvePublicMapCategorySearchIntent(query: string) {
  const normalizedQuery = normalizeIntentQuery(query)
  if (!normalizedQuery) return null

  return (
    PUBLIC_MAP_RESOURCE_CATEGORY_DEFINITIONS.find((definition) =>
      [definition.label, ...definition.aliases].some(
        (candidate) =>
          normalizePublicMapSearchText(candidate) === normalizedQuery
      )
    ) ?? null
  )
}

export function resolvePublicMapGuideSearchIntent({
  guides,
  query,
}: {
  guides: PublicMapResourceGuide[]
  query: string
}) {
  const normalizedQuery = normalizeIntentQuery(query)
  if (!normalizedQuery) return null
  const queryTokens = normalizedQuery.split(" ")

  return (
    guides.find((guide) => {
      const title = normalizePublicMapSearchText(guide.title)
      return (
        title === normalizedQuery ||
        (queryTokens.length > 1 &&
          queryTokens.every((token) => title.includes(token)))
      )
    }) ?? null
  )
}

function PublicMapSearchShortcutRow({
  category,
  label,
  metadata,
  onSelect,
}: {
  category: PublicMapResourceCategoryDefinition["key"]
  label: string
  metadata: string
  onSelect: () => void
}) {
  const markerColor = resolvePublicMapResourceCategoryColor(category)

  return (
    <div className="h-20 min-w-0">
      <Button
        type="button"
        variant="ghost"
        data-public-map-result-trigger="true"
        className="group hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent flex h-full w-full min-w-0 justify-start gap-3 rounded-none px-4 text-left whitespace-normal focus-visible:ring-2 focus-visible:ring-inset"
        onClick={onSelect}
      >
        <span
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm"
          style={{ backgroundColor: markerColor }}
        >
          <PublicMapResourceCategoryIcon
            category={category}
            className="size-5 text-white"
            aria-hidden
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate text-base leading-snug font-semibold">
            {label}
          </span>
          <span className="text-muted-foreground truncate text-sm leading-snug">
            {metadata}
          </span>
        </span>
      </Button>
    </div>
  )
}

export function PublicMapSearchShortcuts({
  activeGroup,
  counts,
  guides,
  onCategorySelect,
  onGuideSelect,
  query,
}: {
  activeGroup: PublicMapGroupFilterKey
  counts: PublicMapGroupFilterCounts
  guides: PublicMapResourceGuide[]
  onCategorySelect: (group: PublicMapGroupFilterKey) => void
  onGuideSelect?: (guideId: string) => void
  query: string
}) {
  const categoryIntent = resolvePublicMapCategorySearchIntent(query)
  const guideIntent = resolvePublicMapGuideSearchIntent({ guides, query })
  const showCategoryIntent =
    categoryIntent &&
    activeGroup !== categoryIntent.key &&
    counts[categoryIntent.key] > 0

  if (!showCategoryIntent && (!guideIntent || !onGuideSelect)) return null

  return (
    <>
      {showCategoryIntent ? (
        <PublicMapSearchShortcutRow
          category={categoryIntent.key}
          label={`${categoryIntent.label} nearby`}
          metadata={`${counts[categoryIntent.key].toLocaleString()} published resources`}
          onSelect={() => onCategorySelect(categoryIntent.key)}
        />
      ) : null}
      {guideIntent && onGuideSelect ? (
        <PublicMapSearchShortcutRow
          category={guideIntent.primaryResourceCategory}
          label={guideIntent.title}
          metadata={`Guide · ${guideIntent.itemCount.toLocaleString()} places`}
          onSelect={() => onGuideSelect(guideIntent.id)}
        />
      ) : null}
    </>
  )
}
