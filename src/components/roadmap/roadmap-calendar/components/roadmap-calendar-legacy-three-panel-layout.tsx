import Calendar01 from "@/components/calendar-01"
import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"

import { CalendarDayWithDot } from "./calendar-day-with-dot"
import { RoadmapCalendarDayEventsPanel } from "./roadmap-calendar-day-events-panel"
import { RoadmapCalendarOverviewPanel } from "./roadmap-calendar-overview-panel"

type RoadmapCalendarLegacyThreePanelLayoutProps = {
  month: Date
  selectedDate: Date | undefined
  eventDays: Date[]
  dayEvents: RoadmapCalendarEvent[]
  upcomingEvents: RoadmapCalendarEvent[]
  nextEvent: RoadmapCalendarEvent | null
  isLoading: boolean
  canManageCalendar: boolean
  timeZone: string
  timeZoneOptions: string[]
  onMonthChange: (date: Date) => void
  onSelectDate: (date: Date | undefined) => void
  onTimeZoneChange: (value: string) => void
  onEditEvent: (event: RoadmapCalendarEvent) => void
  formatDate: (value: string, options?: Intl.DateTimeFormatOptions) => string
  formatWeekday: (value: string, options?: Intl.DateTimeFormatOptions) => string
  formatTimeRange: (event: RoadmapCalendarEvent) => string
}

/**
 * Deprecated: retained as the previous three-panel calendar layout so the
 * workspace can restore or reuse it without reconstructing the old UI.
 */
export function RoadmapCalendarLegacyThreePanelLayout({
  month,
  selectedDate,
  eventDays,
  dayEvents,
  upcomingEvents,
  nextEvent,
  isLoading,
  canManageCalendar,
  timeZone,
  timeZoneOptions,
  onMonthChange,
  onSelectDate,
  onTimeZoneChange,
  onEditEvent,
  formatDate,
  formatWeekday,
  formatTimeRange,
}: RoadmapCalendarLegacyThreePanelLayoutProps) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 rounded-xl border border-border/60 bg-background/20 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <RoadmapCalendarOverviewPanel
        nextEvent={nextEvent}
        upcomingEvents={upcomingEvents}
        timeZone={timeZone}
        timeZoneOptions={timeZoneOptions}
        onTimeZoneChange={onTimeZoneChange}
        formatWeekday={formatWeekday}
        formatTimeRange={formatTimeRange}
      />

      <div className="min-w-0 rounded-lg border border-border/60 bg-background/30 p-3">
        <Calendar01
          mode="single"
          selected={selectedDate}
          month={month}
          onMonthChange={onMonthChange}
          onSelect={(date) => onSelectDate(date ?? undefined)}
          modifiers={{ hasEvent: eventDays }}
          className="mx-auto w-full"
          components={{ DayButton: CalendarDayWithDot }}
        />
      </div>

      <RoadmapCalendarDayEventsPanel
        selectedDate={selectedDate}
        dayEvents={dayEvents}
        isLoading={isLoading}
        canManageCalendar={canManageCalendar}
        formatDate={formatDate}
        formatTimeRange={formatTimeRange}
        onEditEvent={onEditEvent}
      />
    </div>
  )
}
