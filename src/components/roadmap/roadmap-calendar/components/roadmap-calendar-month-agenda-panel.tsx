import { memo } from "react"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { Separator } from "@/components/ui/separator"
import {
  formatCalendarRecurrence,
  getRoadmapCalendarEventTypeLabel,
  ROADMAP_CALENDAR_PRESETS,
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarEventType,
} from "@/lib/roadmap/calendar"
import { cn } from "@/lib/utils"

import { RoadmapCalendarDayWithEventDots } from "./roadmap-calendar-day-with-event-dots"
import {
  ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE,
  ROADMAP_CALENDAR_EVENT_TYPE_META,
  ROADMAP_CALENDAR_EVENT_TYPE_ORDER,
} from "./roadmap-calendar-event-style"

type RoadmapCalendarMonthAgendaPanelProps = {
  month: Date
  selectedDate: Date | undefined
  events: RoadmapCalendarEvent[]
  dayEvents: RoadmapCalendarEvent[]
  isLoading: boolean
  canManageCalendar: boolean
  isTodaySelected: boolean
  eventDatesByType: Record<RoadmapCalendarEventType, Date[]>
  onMonthChange: (date: Date) => void
  onSelectDate: (date: Date | undefined) => void
  onGoToToday: () => void
  onOpenCreate: (preset?: { title?: string; eventType?: RoadmapCalendarEventInput["eventType"] }) => void
  onEditEvent: (event: RoadmapCalendarEvent) => void
  formatDate: (value: string, options?: Intl.DateTimeFormatOptions) => string
  formatTimeRange: (event: RoadmapCalendarEvent) => string
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatAgendaHeading({
  selectedDate,
  eventCount,
}: {
  selectedDate: Date | undefined
  eventCount: number
}) {
  if (!selectedDate) return "EVENTS"
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(selectedDate)
    .toUpperCase()

  return `${dateLabel} · ${eventCount} EVENT${eventCount === 1 ? "" : "S"}`
}

const RoadmapCalendarAddEventMenu = memo(function RoadmapCalendarAddEventMenu({
  disabled,
  onOpenCreate,
}: {
  disabled: boolean
  onOpenCreate: RoadmapCalendarMonthAgendaPanelProps["onOpenCreate"]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 justify-start rounded-full px-3 text-sm font-medium shadow-none"
          disabled={disabled}
          title={
            disabled
              ? "Only organization owners, admins, or allowed staff can add calendar events."
              : "Add event"
          }
        >
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PlusIcon data-icon="inline-start" aria-hidden />
          </span>
          Add event
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {ROADMAP_CALENDAR_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onSelect={() => onOpenCreate({ title: preset.title, eventType: preset.eventType })}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onOpenCreate({})}>
          Custom event…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const RoadmapCalendarAgendaRow = memo(function RoadmapCalendarAgendaRow({
  event,
  canManageCalendar,
  formatTimeRange,
  onEditEvent,
}: {
  event: RoadmapCalendarEvent
  canManageCalendar: boolean
  formatTimeRange: (event: RoadmapCalendarEvent) => string
  onEditEvent: (event: RoadmapCalendarEvent) => void
}) {
  const meta = ROADMAP_CALENDAR_EVENT_TYPE_META[event.eventType]
  const content = (
    <span className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 whitespace-normal">
      <span className={cn("mt-1 size-2.5 rounded-full", meta.dotClassName)} aria-hidden />
      <span className="flex min-w-0 flex-col gap-1 text-left">
        <span className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
          {event.title}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="shrink-0 text-xs text-muted-foreground/70 tabular-nums">
            {event.allDay ? "all day" : formatTimeRange(event)}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "w-fit shrink-0 rounded-full border-0 px-2 py-0.5 text-[10px] leading-none",
              meta.badgeClassName,
            )}
          >
            {getRoadmapCalendarEventTypeLabel(event.eventType)}
          </Badge>
          {event.recurrence ? (
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {formatCalendarRecurrence(event.recurrence)}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  )

  if (!canManageCalendar) {
    return <div className="rounded-xl px-1 py-2">{content}</div>
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-start whitespace-normal rounded-xl px-1 py-2 hover:bg-muted/35"
      onClick={() => onEditEvent(event)}
      aria-label={`Edit ${event.title}`}
    >
      {content}
    </Button>
  )
})

export const RoadmapCalendarMonthAgendaPanel = memo(function RoadmapCalendarMonthAgendaPanel({
  month,
  selectedDate,
  events,
  dayEvents,
  isLoading,
  canManageCalendar,
  isTodaySelected,
  eventDatesByType,
  onMonthChange,
  onSelectDate,
  onGoToToday,
  onOpenCreate,
  onEditEvent,
  formatDate,
  formatTimeRange,
}: RoadmapCalendarMonthAgendaPanelProps) {
  const eventModifiers = ROADMAP_CALENDAR_EVENT_TYPE_ORDER.reduce(
    (acc, eventType) => {
      acc[ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE[eventType]] = eventDatesByType[eventType]
      return acc
    },
    {} as Record<string, Date[]>,
  )

  return (
    <section className="flex max-h-[min(39rem,calc(100svh-6.5rem))] min-h-0 w-full flex-col rounded-[30px] border border-border/60 bg-muted/45 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-3 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-lg font-semibold tracking-normal text-foreground">
            {formatMonthLabel(month)}
          </h2>
          <Badge
            variant="secondary"
            className="h-6 min-w-8 rounded-full border-0 bg-muted-foreground/10 px-2 text-xs tabular-nums text-muted-foreground"
          >
            {events.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isTodaySelected ? "secondary" : "outline"}
            className="h-8 rounded-full px-3 text-sm shadow-none"
            onClick={onGoToToday}
          >
            Today
          </Button>
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
        className="flex min-h-0 flex-1 flex-col rounded-[24px] bg-background px-3 py-3"
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

        <Separator className="mt-3 bg-border/40" />

        <div className="flex min-h-0 flex-1 flex-col pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            {formatAgendaHeading({
              selectedDate,
              eventCount: dayEvents.length,
            })}
          </p>
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
            {isLoading ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">Loading…</p>
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
              <p className="px-2 py-3 text-sm text-muted-foreground">
                {selectedDate
                  ? `No events for ${formatDate(selectedDate.toISOString(), {
                      month: "long",
                      day: "numeric",
                    })}.`
                  : "Select a date to see scheduled events."}
              </p>
            )}
          </div>

          <div className="mt-3 shrink-0 border-t border-border/40 pt-3">
            <RoadmapCalendarAddEventMenu
              disabled={!canManageCalendar}
              onOpenCreate={onOpenCreate}
            />
          </div>
        </div>
      </div>
    </section>
  )
})
