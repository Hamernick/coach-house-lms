"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { isSameDay, isWithinInterval } from "date-fns"

import {
  createRoadmapCalendarEvent,
  deleteRoadmapCalendarEvent,
  listRoadmapCalendarEvents,
  updateRoadmapCalendarEvent,
} from "@/actions/roadmap-calendar"
import Calendar01 from "@/components/calendar-01"
import { toast } from "@/lib/toast"
import {
  ROADMAP_CALENDAR_PRESETS,
  type RoadmapCalendarAssignedRole,
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarRecurrence,
  type RoadmapCalendarType,
} from "@/lib/roadmap/calendar"
import { DEMO_SEED_KEY, DURATION_OPTIONS } from "@/components/roadmap/roadmap-calendar/constants"
import {
  addMinutesToDatetimeLocal,
  buildDraft,
  eventDurationMinutes,
  fromDatetimeLocal,
  getMonthRange,
} from "@/components/roadmap/roadmap-calendar/helpers"
import type { EventDraft } from "@/components/roadmap/roadmap-calendar/types"
import {
  CalendarDayWithDot,
  RoadmapCalendarDayEventsPanel,
  RoadmapCalendarEventDrawer,
  RoadmapCalendarHeader,
  RoadmapCalendarOverviewPanel,
} from "@/components/roadmap/roadmap-calendar/components"

export function RoadmapCalendar({ hideHeaderCopy = false }: { hideHeaderCopy?: boolean }) {
  const calendarType: RoadmapCalendarType = "internal"
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<RoadmapCalendarEvent[]>([])
  const [canManageCalendar, setCanManageCalendar] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<RoadmapCalendarEvent | null>(null)
  const [draft, setDraft] = useState<EventDraft>(() => buildDraft({}))
  const [selectedDuration, setSelectedDuration] = useState<number>(45)
  const [timeZone, setTimeZone] = useState("")
  const [timeZoneOptions, setTimeZoneOptions] = useState<string[]>([])

  const dayEvents = useMemo(() => {
    if (!selectedDate) return []
    return events.filter((event) => {
      const start = new Date(event.startsAt)
      const end = event.endsAt ? new Date(event.endsAt) : start
      if (Number.isNaN(start.getTime())) return false
      if (Number.isNaN(end.getTime())) return isSameDay(start, selectedDate)
      return isWithinInterval(selectedDate, { start, end }) || isSameDay(start, selectedDate)
    })
  }, [events, selectedDate])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((event) => new Date(event.startsAt).getTime() >= now.getTime())
      .slice(0, 4)
  }, [events])

  const eventDays = useMemo(() => events.map((event) => new Date(event.startsAt)), [events])
  const nextEvent = upcomingEvents[0] ?? null
  const selectedEvent = dayEvents[0] ?? nextEvent
  const selectedEventDuration = selectedEvent ? eventDurationMinutes(selectedEvent) : null
  const isTodaySelected = selectedDate ? isSameDay(selectedDate, new Date()) : false

  const resetDraft = (event?: RoadmapCalendarEvent | null, baseDate?: Date) => {
    setDraft(buildDraft({ event, baseDate }))
  }

  useEffect(() => {
    if (!selectedEventDuration) return
    if (!DURATION_OPTIONS.includes(selectedEventDuration as (typeof DURATION_OPTIONS)[number])) return
    setSelectedDuration(selectedEventDuration)
  }, [selectedEventDuration])

  useEffect(() => {
    const range = getMonthRange(month)
    setIsLoading(true)
    startTransition(async () => {
      const result = await listRoadmapCalendarEvents({ calendarType, from: range.from, to: range.to })
      if ("error" in result) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }
      setEvents(result.events)
      setCanManageCalendar(result.canManageCalendar)
      setIsLoading(false)
    })
  }, [calendarType, month, startTransition])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("roadmap-calendar-timezone")
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Local time"
      setTimeZone(stored || resolved)
      const available =
        typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [stored || resolved]
      setTimeZoneOptions(available.length > 0 ? available : [stored || resolved])
    }
  }, [])

  useEffect(() => {
    if (!timeZone || typeof window === "undefined") return
    window.localStorage.setItem("roadmap-calendar-timezone", timeZone)
  }, [timeZone])

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (!canManageCalendar || isLoading || events.length > 0) return
    if (typeof window === "undefined") return
    if (window.localStorage.getItem(DEMO_SEED_KEY)) return

    const now = new Date()
    const seeds: RoadmapCalendarEventInput[] = Array.from({ length: 60 }).map((_, index) => {
      const preset = ROADMAP_CALENDAR_PRESETS[index % ROADMAP_CALENDAR_PRESETS.length]
      const start = new Date(now)
      start.setDate(now.getDate() + index * 3)
      start.setHours(9 + (index % 6), 0, 0, 0)
      const end = new Date(start)
      end.setHours(start.getHours() + 1)
      return {
        title: preset?.label ?? `Milestone ${index + 1}`,
        description: "",
        eventType: preset?.eventType ?? "meeting",
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        allDay: index % 9 === 0,
        status: "active" as const,
        assignedRoles:
          index % 5 === 0
            ? (["admin", "staff", "board"] as RoadmapCalendarAssignedRole[])
            : (["admin"] as RoadmapCalendarAssignedRole[]),
        recurrence: index % 11 === 0 ? ({ frequency: "monthly" } as RoadmapCalendarRecurrence) : null,
      }
    })

    window.localStorage.setItem(DEMO_SEED_KEY, "true")
    startTransition(async () => {
      const created: RoadmapCalendarEvent[] = []
      for (const seed of seeds) {
        const result = await createRoadmapCalendarEvent({ calendarType, event: seed })
        if ("error" in result) continue
        created.push(result.event)
      }
      if (created.length > 0) {
        setEvents((prev) => [...prev, ...created])
      }
    })
  }, [calendarType, canManageCalendar, events.length, isLoading, startTransition])

  const handleOpenCreate = (preset?: { title?: string; eventType?: RoadmapCalendarEventInput["eventType"] }) => {
    const nextDraft = buildDraft({ baseDate: selectedDate })
    if (preset?.title) nextDraft.title = preset.title
    if (preset?.eventType) nextDraft.eventType = preset.eventType
    if (!nextDraft.allDay && nextDraft.startsAt) {
      nextDraft.endsAt = addMinutesToDatetimeLocal(nextDraft.startsAt, selectedDuration)
    }
    setDraft(nextDraft)
    setEditingEvent(null)
    setDrawerOpen(true)
  }

  const handleEditEvent = (event: RoadmapCalendarEvent) => {
    resetDraft(event)
    setEditingEvent(event)
    setDrawerOpen(true)
  }

  const handleSave = () => {
    if (!draft.title.trim()) {
      toast.error("Title is required")
      return
    }
    const startsAt = fromDatetimeLocal(draft.startsAt)
    const endsAt = draft.endsAt ? fromDatetimeLocal(draft.endsAt) : ""

    startTransition(async () => {
      if (editingEvent) {
        const result = await updateRoadmapCalendarEvent({
          calendarType,
          eventId: editingEvent.id,
          updates: {
            title: draft.title,
            description: draft.description,
            eventType: draft.eventType,
            startsAt,
            endsAt: endsAt || null,
            allDay: draft.allDay,
            status: draft.status,
            assignedRoles: draft.assignedRoles,
            recurrence: draft.recurrence,
          },
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        setEvents((prev) => prev.map((event) => (event.id === result.event.id ? result.event : event)))
        toast.success("Event updated")
      } else {
        const result = await createRoadmapCalendarEvent({
          calendarType,
          event: {
            title: draft.title,
            description: draft.description,
            eventType: draft.eventType,
            startsAt,
            endsAt: endsAt || null,
            allDay: draft.allDay,
            status: draft.status,
            assignedRoles: draft.assignedRoles,
            recurrence: draft.recurrence,
          },
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        setEvents((prev) => [...prev, result.event])
        toast.success("Event added")
      }
      setDrawerOpen(false)
    })
  }

  const handleDelete = () => {
    if (!editingEvent) return
    startTransition(async () => {
      const result = await deleteRoadmapCalendarEvent({ calendarType, eventId: editingEvent.id })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setEvents((prev) => prev.filter((event) => event.id !== editingEvent.id))
      toast.success("Event removed")
      setDrawerOpen(false)
    })
  }

  const handleGoToToday = () => {
    const today = new Date()
    setMonth(today)
    setSelectedDate(today)
  }

  const timeZoneOption = timeZone && timeZone !== "Local time" ? timeZone : undefined
  const formatTime = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZoneOption,
    }).format(date)
  }
  const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timeZoneOption,
      ...options,
    }).format(date)
  }
  const formatWeekday = (value: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      timeZone: timeZoneOption,
      ...options,
    }).format(date)
  }
  const formatTimeRange = (event: RoadmapCalendarEvent) => {
    if (event.allDay) return formatDate(event.startsAt, { month: "short", day: "numeric" })
    const startLabel = formatTime(event.startsAt)
    const endLabel = event.endsAt ? formatTime(event.endsAt) : null
    return endLabel ? `${startLabel}–${endLabel}` : startLabel
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <RoadmapCalendarHeader
        canManageCalendar={canManageCalendar}
        onOpenCreate={handleOpenCreate}
        onGoToToday={handleGoToToday}
        isTodaySelected={isTodaySelected}
        hideCopy={hideHeaderCopy}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 rounded-xl border border-border/60 bg-background/20 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <RoadmapCalendarOverviewPanel
          nextEvent={nextEvent}
          upcomingEvents={upcomingEvents}
          timeZone={timeZone}
          timeZoneOptions={timeZoneOptions}
          onTimeZoneChange={setTimeZone}
          formatWeekday={formatWeekday}
          formatTimeRange={formatTimeRange}
        />

        <div className="min-w-0 rounded-lg border border-border/60 bg-background/30 p-3">
          <Calendar01
            mode="single"
            selected={selectedDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => setSelectedDate(date ?? undefined)}
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
          onEditEvent={handleEditEvent}
        />
      </div>

      <RoadmapCalendarEventDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingEvent={editingEvent}
        draft={draft}
        setDraft={setDraft}
        isPending={isPending}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </div>
  )
}
