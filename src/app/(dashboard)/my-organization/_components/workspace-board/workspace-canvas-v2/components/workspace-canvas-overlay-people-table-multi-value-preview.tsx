"use client"

import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import type { OrganizationPeopleTag } from "@/lib/people/tags"
import { cn } from "@/lib/utils"

import { WorkspacePeopleTagBadge } from "./workspace-canvas-people-tag-badge"
import type {
  WorkspacePeopleTableContentMode,
  WorkspacePeopleTableRowHeight,
} from "./workspace-canvas-overlay-people-table-sizing"

function getPreviewItems<T>(items: T[]) {
  const visibleCount = 1
  return {
    hiddenItems: items.slice(visibleCount),
    visibleItems: items.slice(0, visibleCount),
  }
}

function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit max-w-full min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap">
      {children}
    </span>
  )
}

function PreviewOverflowBadge({ hiddenLabels }: { hiddenLabels: string[] }) {
  if (hiddenLabels.length === 0) return null

  return (
    <Badge
      variant="outline"
      className="h-5 w-fit min-w-0 shrink-0 rounded-full px-2 tabular-nums"
      aria-label={`${hiddenLabels.length} more: ${hiddenLabels.join(", ")}`}
      title={hiddenLabels.join(", ")}
    >
      +{hiddenLabels.length}
    </Badge>
  )
}

export function SegmentPreview({
  emptyLabel,
  labels,
  contentMode,
  rowHeight,
}: {
  emptyLabel: string
  labels: string[]
  contentMode: WorkspacePeopleTableContentMode
  rowHeight: WorkspacePeopleTableRowHeight
}) {
  if (labels.length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>
  }

  const { hiddenItems, visibleItems } = getPreviewItems(labels)
  const pillMaxWidth =
    contentMode === "truncate" || rowHeight === "compact"
      ? "max-w-20"
      : "max-w-28"

  return (
    <PreviewLayout>
      {visibleItems.map((label, index) => (
        <Badge
          key={`${label}:${index}`}
          variant="secondary"
          className={cn("w-fit min-w-0 rounded-full", pillMaxWidth)}
          title={label}
        >
          <span className="truncate">{label}</span>
        </Badge>
      ))}
      <PreviewOverflowBadge hiddenLabels={hiddenItems} />
    </PreviewLayout>
  )
}

export function TagPreview({
  tags,
  contentMode,
  rowHeight,
}: {
  tags: OrganizationPeopleTag[]
  contentMode: WorkspacePeopleTableContentMode
  rowHeight: WorkspacePeopleTableRowHeight
}) {
  if (tags.length === 0) {
    return <span className="text-muted-foreground text-xs">None</span>
  }

  const { hiddenItems, visibleItems } = getPreviewItems(tags)
  const pillMaxWidth =
    contentMode === "truncate" || rowHeight === "compact"
      ? "max-w-20"
      : "max-w-28"

  return (
    <PreviewLayout>
      {visibleItems.map((tag) => (
        <WorkspacePeopleTagBadge
          key={tag.id}
          tag={tag}
          className={cn("w-fit min-w-0 shrink", pillMaxWidth)}
        />
      ))}
      <PreviewOverflowBadge
        hiddenLabels={hiddenItems.map((tag) => tag.label)}
      />
    </PreviewLayout>
  )
}
