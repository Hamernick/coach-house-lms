"use client"

import ArchiveIcon from "lucide-react/dist/esm/icons/archive"
import ArchiveRestoreIcon from "lucide-react/dist/esm/icons/archive-restore"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"

import { Button } from "@/components/ui/button"
import { CircularProgress } from "@/components/ui/circular-progress"
import { cn } from "@/lib/utils"

import type { WorkspaceTrackerTicketStatus } from "./workspace-board-types"

type SectionHeaderProps = {
  collapsed: boolean
  title: string
  count: number
  onToggle: () => void
  actionLabel: string
  onAction: () => void
  actionIcon: "archive" | "restore"
}

export function resolveNextTicketStatus(status: WorkspaceTrackerTicketStatus): WorkspaceTrackerTicketStatus {
  if (status === "todo") return "in_progress"
  if (status === "in_progress") return "done"
  return "todo"
}

export function resolveTicketMarkerClassName(status: WorkspaceTrackerTicketStatus) {
  if (status === "done") {
    return "border-foreground bg-foreground text-background"
  }
  if (status === "in_progress") {
    return "border-foreground text-foreground"
  }
  return "border-border/70 text-foreground/75"
}

export function resolveTicketStatusLabel(status: WorkspaceTrackerTicketStatus) {
  if (status === "done") return "Done"
  if (status === "in_progress") return "Active"
  return "To do"
}

function resolveStatusProgressValue(status: "completed" | "in_progress" | "not_started" | WorkspaceTrackerTicketStatus) {
  if (status === "completed" || status === "done") return 100
  if (status === "in_progress") return 64
  return 16
}

function resolveStatusProgressClassName(
  status: "completed" | "in_progress" | "not_started" | WorkspaceTrackerTicketStatus,
) {
  if (status === "completed" || status === "done") return "stroke-foreground/55 dark:stroke-foreground/75"
  if (status === "in_progress") return "stroke-primary/75 dark:stroke-primary/90"
  return "stroke-muted-foreground/45 dark:stroke-muted-foreground/70"
}

export function TrackerRowAction({
  status,
  onClick,
  disabled = false,
  label,
}: {
  status: "completed" | "in_progress" | "not_started" | WorkspaceTrackerTicketStatus
  onClick?: () => void
  disabled?: boolean
  label: string
}) {
  const content = (
    <>
      <CircularProgress
        decorative
        value={resolveStatusProgressValue(status)}
        size={18}
        strokeWidth={1.5}
        trackClassName="stroke-border/55 dark:stroke-border/65"
        progressClassName={resolveStatusProgressClassName(status)}
      />
      <ChevronRightIcon
        className="pointer-events-none absolute h-2.5 w-2.5 text-muted-foreground/75 dark:text-muted-foreground/90"
        aria-hidden
      />
    </>
  )

  if (onClick) {
    return (
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-6 w-6 shrink-0 rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-1",
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-muted/35",
        )}
      >
        {content}
      </Button>
    )
  }

  return (
    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
      {content}
    </span>
  )
}

export function TrackerSectionHeader({
  collapsed,
  title,
  count,
  onToggle,
  actionLabel,
  onAction,
  actionIcon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        type="button"
        variant="ghost"
        className="h-auto flex-1 justify-start gap-1.5 px-0.5 py-0.5"
        onClick={onToggle}
      >
        <ChevronDownIcon
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", collapsed && "-rotate-90")}
          aria-hidden
        />
        <span className="text-xs font-medium text-foreground">{title}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground"
        onClick={onAction}
        aria-label={actionLabel}
      >
        {actionIcon === "restore" ? (
          <ArchiveRestoreIcon className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ArchiveIcon className="h-3.5 w-3.5" aria-hidden />
        )}
      </Button>
    </div>
  )
}
