"use client"

import CalendarClockIcon from "lucide-react/dist/esm/icons/calendar-clock"
import Repeat2Icon from "lucide-react/dist/esm/icons/repeat-2"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  formatCalendarDate,
  formatCalendarRecurrence,
  formatCalendarTime,
  getRoadmapCalendarEventTypeLabel,
} from "@/lib/roadmap/calendar"

import type { CalendarStripEventItem } from "./workspace-board-calendar-card-strip-data"

function resolveEventTimeRangeLabel(item: CalendarStripEventItem) {
  if (!item.event) {
    return item.timeLabel
  }

  if (item.event.all_day) {
    return "All day"
  }

  const startLabel = formatCalendarTime(item.event.starts_at)
  const endLabel = item.event.ends_at ? formatCalendarTime(item.event.ends_at) : null
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel
}

function resolveEventDateLabel(item: CalendarStripEventItem) {
  if (!item.event) {
    return item.timeLabel
  }

  return formatCalendarDate(item.event.starts_at, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function resolveRolesLabel(item: CalendarStripEventItem) {
  if (item.event?.assigned_roles.length) {
    return item.event.assigned_roles.join(", ")
  }

  if (item.invitesLabel?.startsWith("Invites: ")) {
    return item.invitesLabel.replace("Invites: ", "")
  }

  return "No invite roles assigned"
}

export function WorkspaceBoardCalendarCardStripEventDetailsSheet({
  item,
  open,
  onOpenChange,
}: {
  item: CalendarStripEventItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!item) {
    return null
  }

  const recurrenceLabel = item.event
    ? formatCalendarRecurrence(item.event.recurrence)
    : ""
  const eventTypeLabel = item.event
    ? getRoadmapCalendarEventTypeLabel(item.event.event_type)
    : "Preview event"
  const statusLabel = item.event?.status === "canceled" ? "Canceled" : "Active"
  const detailsCopy =
    item.detailDescription?.trim() ||
    "No additional details have been added for this event yet."

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle>{item.title}</SheetTitle>
            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">
              {eventTypeLabel}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0 text-[10px]"
            >
              {statusLabel}
            </Badge>
          </div>
          <SheetDescription>
            Calendar details from the workspace board.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-5">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground">
                <CalendarClockIcon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  When
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {resolveEventDateLabel(item)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {resolveEventTimeRangeLabel(item)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground">
                <UsersIcon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Invite roles
                </p>
                <p className="text-sm text-foreground">{resolveRolesLabel(item)}</p>
              </div>
            </div>
          </div>

          {recurrenceLabel ? (
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground">
                  <Repeat2Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recurrence
                  </p>
                  <p className="text-sm text-foreground">{recurrenceLabel}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Details
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">{detailsCopy}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
