"use client"

import { memo } from "react"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"

import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { Separator } from "@/components/ui/separator"
import {
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarEventType,
} from "@/lib/roadmap/calendar"
import { cn } from "@/lib/utils"

import { RoadmapCalendarDayWithEventDots } from "./roadmap-calendar-day-with-event-dots"
import {
  ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE,
  ROADMAP_CALENDAR_EVENT_TYPE_ORDER,
} from "./roadmap-calendar-event-style"
import {
  addMonths,
  formatAgendaHeading,
  formatMonthLabel,
  isSameCalendarMonth,
  RoadmapCalendarAddEventMenu,
  RoadmapCalendarAgendaRow,
  RoadmapCalendarAgendaScroll,
} from "./roadmap-calendar-month-agenda-panel-parts"

type RoadmapCalendarMonthAgendaPanelProps = {
  month: Date
  selectedDate: Date | undefined
  events: RoadmapCalendarEvent[]
  dayEvents: RoadmapCalendarEvent[]
  isLoading: boolean
  canManageCalendar: boolean
  eventDatesByType: Record<RoadmapCalendarEventType, Date[]>
  onMonthChange: (date: Date) => void
  onSelectDate: (date: Date | undefined) => void
  onGoToToday: () => void
  onOpenCreate: (preset?: {
    title?: string
    eventType?: RoadmapCalendarEventInput["eventType"]
  }) => void
  onEditEvent: (event: RoadmapCalendarEvent) => void
  formatDate: (value: string, options?: Intl.DateTimeFormatOptions) => string
  formatTimeRange: (event: RoadmapCalendarEvent) => string
  className?: string
}

const ROADMAP_CALENDAR_MONTH_AGENDA_PANEL_SOURCE =
  "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx"

export const RoadmapCalendarMonthAgendaPanel = memo(
  function RoadmapCalendarMonthAgendaPanel({
    month,
    selectedDate,
    events,
    dayEvents,
    isLoading,
    canManageCalendar,
    eventDatesByType,
    onMonthChange,
    onSelectDate,
    onGoToToday,
    onOpenCreate,
    onEditEvent,
    formatDate,
    formatTimeRange,
    className,
  }: RoadmapCalendarMonthAgendaPanelProps) {
    const eventModifiers = ROADMAP_CALENDAR_EVENT_TYPE_ORDER.reduce(
      (acc, eventType) => {
        acc[ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE[eventType]] =
          eventDatesByType[eventType]
        return acc
      },
      {} as Record<string, Date[]>
    )
    const showTodayButton = !isSameCalendarMonth(month, new Date())

    return (
      <section
        className={cn(
          "border-border/60 bg-muted/45 flex max-h-[min(42rem,calc(100svh-5.5rem))] min-h-0 w-full flex-col overflow-hidden rounded-[30px] border p-2.5",
          className
        )}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 pt-1 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-foreground shrink-0 text-lg font-semibold tracking-normal whitespace-nowrap">
              {formatMonthLabel(month)}
            </h2>
            <Badge
              variant="secondary"
              className="bg-muted-foreground/10 text-muted-foreground h-6 min-w-8 rounded-full border-0 px-2 text-xs tabular-nums"
            >
              {events.length}
            </Badge>
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-1.5">
            {showTodayButton ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full px-3 text-sm shadow-none"
                onClick={onGoToToday}
              >
                Today
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-full shadow-none"
              onClick={() => onMonthChange(addMonths(month, -1))}
              aria-label="Show previous month"
            >
              <ChevronLeftIcon data-icon aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-full shadow-none"
              onClick={() => onMonthChange(addMonths(month, 1))}
              aria-label="Show next month"
            >
              <ChevronRightIcon data-icon aria-hidden />
            </Button>
          </div>
        </div>

        <div
          className="bg-background flex min-h-0 flex-col rounded-[24px] px-3 py-3"
          {...getReactGrabOwnerProps({
            ownerId: "roadmap-calendar-month-agenda:month-grid",
            component: "RoadmapCalendarMonthAgendaPanel",
            source:
              "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
            slot: "month-grid",
            primitiveImport: "@/components/ui/calendar",
          })}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            month={month}
            onMonthChange={onMonthChange}
            onSelect={(date) => onSelectDate(date ?? undefined)}
            modifiers={eventModifiers}
            className="w-full shrink-0 bg-transparent p-0 [--cell-size:2.45rem] sm:[--cell-size:2.55rem]"
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              month_grid: "w-full table-fixed border-collapse",
              month_caption: "sr-only",
              nav: "hidden",
              weekdays: "w-full border-b border-border/40",
              weekday:
                "w-[14.285714%] pb-2 text-center text-xs font-semibold text-muted-foreground/62",
              weeks: "w-full",
              week: "w-full",
              day: "w-[14.285714%] min-w-0 p-0 pt-2 text-center align-middle",
              today:
                "rounded-xl bg-transparent text-foreground data-[selected=true]:rounded-xl",
              outside: "text-muted-foreground/35",
            }}
            components={{ DayButton: RoadmapCalendarDayWithEventDots }}
          />

          <Separator className="bg-border/40 mt-3" />

          <div className="flex min-h-0 flex-col pt-3">
            <p className="text-muted-foreground/70 text-xs font-semibold tracking-[0.2em] uppercase">
              {formatAgendaHeading({
                selectedDate,
                eventCount: dayEvents.length,
              })}
            </p>
            <RoadmapCalendarAgendaScroll
              fadeEligible={dayEvents.length > 1 && !isLoading}
            >
              {isLoading ? (
                <p className="text-muted-foreground px-2 py-3 text-sm">
                  Loading…
                </p>
              ) : dayEvents.length > 0 ? (
                dayEvents.map((event) => (
                  <RoadmapCalendarAgendaRow
                    key={event.id}
                    event={event}
                    canManageCalendar={canManageCalendar}
                    formatTimeRange={formatTimeRange}
                    onEditEvent={onEditEvent}
                  />
                ))
              ) : (
                <p className="text-muted-foreground px-2 py-3 text-sm">
                  {selectedDate
                    ? `No events for ${formatDate(selectedDate.toISOString(), {
                        month: "long",
                        day: "numeric",
                      })}.`
                    : "Select a date to see scheduled events."}
                </p>
              )}
            </RoadmapCalendarAgendaScroll>

            <div className="border-border/40 mt-3 shrink-0 border-t pt-3">
              <RoadmapCalendarAddEventMenu
                disabled={!canManageCalendar}
                onOpenCreate={onOpenCreate}
              />
            </div>
          </div>
        </div>
      </section>
    )
  }
)
