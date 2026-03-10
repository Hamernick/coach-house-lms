import * as SelectPrimitive from "@radix-ui/react-select"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import GlobeIcon from "lucide-react/dist/esm/icons/globe-2"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem } from "@/components/ui/select"
import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"

type RoadmapCalendarOverviewPanelProps = {
  nextEvent: RoadmapCalendarEvent | null
  upcomingEvents: RoadmapCalendarEvent[]
  timeZone: string
  timeZoneOptions: string[]
  onTimeZoneChange: (value: string) => void
  formatWeekday: (value: string) => string
  formatTimeRange: (event: RoadmapCalendarEvent) => string
}

export function RoadmapCalendarOverviewPanel({
  nextEvent,
  upcomingEvents,
  timeZone,
  timeZoneOptions,
  onTimeZoneChange,
  formatWeekday,
  formatTimeRange,
}: RoadmapCalendarOverviewPanelProps) {
  return (
    <div className="min-w-0 space-y-4 rounded-lg border border-border/60 bg-background/30 p-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Next event</p>
        {nextEvent ? (
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{nextEvent.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatWeekday(nextEvent.startsAt)} · {formatTimeRange(nextEvent)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No events yet. Use Add event to get started.</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Upcoming</p>
        <div className="space-y-2">
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border/60 bg-background/20 px-3 py-2">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatWeekday(event.startsAt)} · {formatTimeRange(event)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <Select value={timeZone} onValueChange={onTimeZoneChange}>
        <SelectPrimitive.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-start gap-3 border-border/60 bg-background/20 px-3 py-2 text-left hover:bg-background/30"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-muted/40 text-muted-foreground">
              <GlobeIcon className="h-4 w-4" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Time zone</span>
              <span className="truncate text-sm font-normal text-foreground">{timeZone || "Local time"}</span>
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
              <ChevronDownIcon className="h-4 w-4" aria-hidden />
            </span>
          </Button>
        </SelectPrimitive.Trigger>
        <SelectContent className="max-h-72">
          {timeZoneOptions.map((zone) => (
            <SelectItem key={zone} value={zone}>
              {zone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
