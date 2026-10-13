"use client"

import CircleIcon from "lucide-react/dist/esm/icons/circle"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { FiscalSponsorshipProjectWorkflowEvent } from "../types"

const TIMELINE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
})

function formatTimelineEventType(eventType: string) {
  return eventType.replaceAll("_", " ")
}

function formatTimelineEventDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date pending"

  return TIMELINE_DATE_FORMATTER.format(date)
}

export function FiscalSponsorshipWorkflowTimeline({
  className,
  emptyLabel = "No fiscal activity recorded yet.",
  events,
}: {
  className?: string
  emptyLabel?: string
  events: FiscalSponsorshipProjectWorkflowEvent[]
}) {
  return (
    <section
      data-fiscal-sponsorship-workflow-timeline=""
      className={cn("min-w-0", className)}
    >
      <div className="px-1">
        <p className="text-sm font-semibold">Recent updates</p>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          Activity from applications, uploads, reviews, agreements, and
          signatures.
        </p>
      </div>

      {events.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="group hover:bg-muted/50 focus-within:bg-muted/50 flex min-w-0 items-start gap-2 rounded-xl px-2 py-2 transition-[background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              data-fiscal-sponsorship-workflow-event={event.eventType}
            >
              <CircleIcon
                className="text-primary/55 mt-1.5 size-2 shrink-0 fill-current"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="text-foreground min-w-0 flex-1 text-xs leading-snug font-medium">
                    {event.summary}
                  </p>
                  <Badge className="bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary h-6 max-w-full rounded-full border-transparent px-2 py-0.5 text-[11px] leading-none transition-[background-color,color] duration-150">
                    {formatTimelineEventType(event.eventType)}
                  </Badge>
                </div>
                <time
                  dateTime={event.createdAt}
                  className="text-muted-foreground mt-0.5 block text-[11px] tabular-nums"
                >
                  {formatTimelineEventDate(event.createdAt)}
                </time>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground px-1 pt-2 text-xs leading-snug">
          {emptyLabel}
        </p>
      )}
    </section>
  )
}
