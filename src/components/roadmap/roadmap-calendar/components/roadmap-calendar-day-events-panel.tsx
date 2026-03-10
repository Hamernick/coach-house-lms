import PencilIcon from "lucide-react/dist/esm/icons/pencil"

import { Button } from "@/components/ui/button"
import { formatCalendarRecurrence, type RoadmapCalendarEvent } from "@/lib/roadmap/calendar"

type RoadmapCalendarDayEventsPanelProps = {
  selectedDate: Date | undefined
  dayEvents: RoadmapCalendarEvent[]
  isLoading: boolean
  canManageCalendar: boolean
  formatDate: (value: string, options?: Intl.DateTimeFormatOptions) => string
  formatTimeRange: (event: RoadmapCalendarEvent) => string
  onEditEvent: (event: RoadmapCalendarEvent) => void
}

export function RoadmapCalendarDayEventsPanel({
  selectedDate,
  dayEvents,
  isLoading,
  canManageCalendar,
  formatDate,
  formatTimeRange,
  onEditEvent,
}: RoadmapCalendarDayEventsPanelProps) {
  return (
    <div className="flex min-h-0 flex-col rounded-lg border border-border/60 bg-background/30 p-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {selectedDate ? formatDate(selectedDate.toISOString(), { weekday: "long" }) : "Events"}
        </p>
        <p className="text-xs text-muted-foreground">{selectedDate ? formatDate(selectedDate.toISOString()) : ""}</p>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : dayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events for this day.</p>
        ) : (
          dayEvents.map((event) => {
            const dateLabel = event.allDay
              ? formatDate(event.startsAt, { month: "short", day: "numeric", year: "numeric" })
              : `${formatDate(event.startsAt, { month: "short", day: "numeric", year: "numeric" })} · ${formatTimeRange(event)}`

            return (
              <div
                key={event.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/20 px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{dateLabel}</p>
                  {event.recurrence ? (
                    <p className="text-xs text-muted-foreground">{formatCalendarRecurrence(event.recurrence)}</p>
                  ) : null}
                </div>
                {canManageCalendar ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEditEvent(event)}
                    aria-label={`Edit ${event.title}`}
                  >
                    <PencilIcon className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
