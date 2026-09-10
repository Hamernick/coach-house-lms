"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CalendarEvent } from "../types"
export function PersonalCalendarAgenda({
  events,
}: {
  events: CalendarEvent[]
}) {
  return (
    <>
      {events.map((event) => {
        const label = event.allDay
          ? "All day"
          : new Intl.DateTimeFormat(undefined, {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(event.start))
        const content = (
          <span className="flex min-w-0 flex-col gap-1 text-left">
            <span className="line-clamp-2 text-sm font-medium">
              {event.title}
            </span>
            <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              {label}
              <Badge variant="outline">Google · Only you</Badge>
              <span className="truncate">{event.calendarName}</span>
            </span>
          </span>
        )
        return event.url ? (
          <Button
            key={event.calendarId + event.id}
            variant="ghost"
            asChild
            className="h-auto w-full justify-start px-1 py-2 whitespace-normal"
          >
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={"Open " + event.title + " in Google Calendar"}
            >
              {content}
            </a>
          </Button>
        ) : (
          <div key={event.calendarId + event.id} className="px-1 py-2">
            {content}
          </div>
        )
      })}
    </>
  )
}
