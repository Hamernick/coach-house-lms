"use client"

import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import CheckCircle2Icon from "lucide-react/dist/esm/icons/check-circle-2"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import CircleAlertIcon from "lucide-react/dist/esm/icons/circle-alert"
import CircleDashedIcon from "lucide-react/dist/esm/icons/circle-dashed"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { describeWorkspaceOntologyNodeActivation } from "../lib"
import type {
  WorkspaceOntologyDetailLevel,
  WorkspaceOntologyListItem,
} from "../types"

const STATUS_META = {
  missing: {
    icon: CircleIcon,
    className: "text-red-700 dark:text-red-300",
  },
  blocked: {
    icon: CircleAlertIcon,
    className: "text-amber-700 dark:text-amber-300",
  },
  "in-progress": {
    icon: CircleDashedIcon,
    className: "text-blue-700 dark:text-blue-300",
  },
  complete: {
    icon: CheckCircle2Icon,
    className: "text-emerald-700 dark:text-emerald-300",
  },
} as const

const LIST_ROW_CLASSNAME =
  "group/list-row nodrag nopan h-10 w-full touch-manipulation justify-start rounded-lg px-2 text-left text-xs shadow-none transition-transform duration-150 hover:bg-accent active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none"

function WorkspaceOntologyListRow({
  active,
  detailLevel,
  dimmed,
  item,
  onActivate,
}: {
  active: boolean
  detailLevel: WorkspaceOntologyDetailLevel
  dimmed: boolean
  item: WorkspaceOntologyListItem
  onActivate?: (nodeId: string) => void
}) {
  const statusMeta = STATUS_META[item.status]
  const StatusIcon = statusMeta.icon
  const actionLabel = describeWorkspaceOntologyNodeActivation({
    node: item,
    expanded: active,
  })
  const content = (
    <>
      <StatusIcon
        className={cn("size-3.5 shrink-0", statusMeta.className)}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      {detailLevel === "full" ? (
        <span
          className={cn(
            "max-w-24 shrink-0 truncate font-medium",
            statusMeta.className
          )}
          title={item.statusLabel}
        >
          {item.statusLabel}
        </span>
      ) : null}
      {item.hasChildren ? (
        <ChevronRightIcon
          className={cn("size-3.5 shrink-0", active && "rotate-90")}
          aria-hidden="true"
        />
      ) : (
        <ArrowUpRightIcon
          className="size-3.5 shrink-0 opacity-60"
          aria-hidden="true"
        />
      )}
    </>
  )
  const ariaLabel = `${item.label}. ${item.statusLabel}. ${actionLabel}.`

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(LIST_ROW_CLASSNAME, dimmed && "opacity-55")}
      aria-label={ariaLabel}
      aria-current={active ? "step" : undefined}
      aria-expanded={item.hasChildren ? active : undefined}
      data-workspace-ontology-list-item={item.id}
      data-workspace-ontology-list-item-dimmed={dimmed ? "true" : undefined}
      onClick={(event) => {
        event.stopPropagation()
        onActivate?.(item.id)
      }}
    >
      {content}
    </Button>
  )
}

export function WorkspaceOntologyList({
  activeItemId,
  detailLevel,
  items,
  onActivateItem,
}: {
  activeItemId?: string
  detailLevel: WorkspaceOntologyDetailLevel
  items: WorkspaceOntologyListItem[]
  onActivateItem?: (nodeId: string) => void
}) {
  const primaryItems = items.filter(
    (item) => item.presentation === "action" || item.presentation === "group"
  )
  const summaryItems = items.filter(
    (item) => item.presentation === "more" || item.presentation === "rollup"
  )

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-workspace-ontology-list="true"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {primaryItems.map((item) => (
          <WorkspaceOntologyListRow
            key={item.id}
            active={item.id === activeItemId}
            detailLevel={detailLevel}
            dimmed={Boolean(activeItemId && item.id !== activeItemId)}
            item={item}
            onActivate={onActivateItem}
          />
        ))}
      </div>
      {summaryItems.length > 0 ? (
        <div className="border-border/60 flex h-8 shrink-0 items-end gap-1 border-t px-1 pt-1">
          {summaryItems.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              className="nodrag nopan text-muted-foreground hover:text-foreground h-7 rounded-md px-2 text-xs"
              data-workspace-ontology-list-item={item.id}
              data-workspace-ontology-list-summary={item.presentation}
              onClick={(event) => {
                event.stopPropagation()
                onActivateItem?.(item.id)
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
