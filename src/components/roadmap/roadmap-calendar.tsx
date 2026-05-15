"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { isSameDay } from "date-fns"

import {
  createRoadmapCalendarEvent,
  deleteRoadmapCalendarEvent,
  listRoadmapCalendarEvents,
  updateRoadmapCalendarEvent,
} from "@/actions/roadmap-calendar"
import { toast } from "@/lib/toast"
import {
  ROADMAP_CALENDAR_PRESETS,
  type RoadmapCalendarAssignedRole,
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarRecurrence,
  type RoadmapCalendarType,
  type RoadmapCalendarEventType,
} from "@/lib/roadmap/calendar"
import { DEMO_SEED_KEY, DURATION_OPTIONS } from "@/components/roadmap/roadmap-calendar/constants"
import {
  addMinutesToDatetimeLocal,
  buildDraft,
  eventDurationMinutes,
  fromDatetimeLocal,
  getFirstRoadmapCalendarEventDate,
  getMonthRange,
  getRoadmapCalendarEventDates,
  isSameRoadmapCalendarMonth,
  roadmapCalendarEventOccursOnDay,
  sortRoadmapCalendarEventsByStart,
} from "@/components/roadmap/roadmap-calendar/helpers"
import type { EventDraft } from "@/components/roadmap/roadmap-calendar/types"
import {
  RoadmapCalendarEventDrawer,
  RoadmapCalendarMonthAgendaPanel,
} from "@/components/roadmap/roadmap-calendar/components"
import { ROADMAP_CALENDAR_EVENT_TYPE_ORDER } from "@/components/roadmap/roadmap-calendar/components/roadmap-calendar-event-style"

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

  const dayEvents = useMemo(() => {
    if (!selectedDate) return []
    return events
      .filter((event) => roadmapCalendarEventOccursOnDay(event, selectedDate))
      .sort(sortRoadmapCalendarEventsByStart)
  }, [events, selectedDate])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((event) => new Date(event.startsAt).getTime() >= now.getTime())
      .slice(0, 4)
  }, [events])

  const eventDatesByType = useMemo(() => {
    const initial = ROADMAP_CALENDAR_EVENT_TYPE_ORDER.reduce(
      (acc, eventType) => {
        acc[eventType] = []
        return acc
      },
      {} as Record<RoadmapCalendarEventType, Date[]>,
    )

    for (const event of events) {
      initial[event.eventType].push(...getRoadmapCalendarEventDates(event))
    }

    return initial
  }, [events])
  const nextEvent = upcomingEvents[0] ?? null
  const selectedEvent = dayEvents[0] ?? nextEvent
  const selectedEventDuration = selectedEvent ? eventDurationMinutes(selectedEvent) : null
  const isTodaySelected = selectedDate ? isSameDay(selectedDate, new Date()) : false

  const resetDraft = useCallback((event?: RoadmapCalendarEvent | null, baseDate?: Date) => {
    setDraft(buildDraft({ event, baseDate }))
  }, [])

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
    if (isLoading || selectedDate || events.length === 0) return
    const firstEventDate = getFirstRoadmapCalendarEventDate(events, month)
    if (!firstEventDate) return
    setSelectedDate(firstEventDate)
  }, [events, isLoading, month, selectedDate])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("roadmap-calendar-timezone")
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Local time"
      setTimeZone(stored || resolved)
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

  const handleOpenCreate = useCallback((preset?: { title?: string; eventType?: RoadmapCalendarEventInput["eventType"] }) => {
    const nextDraft = buildDraft({ baseDate: selectedDate })
    if (preset?.title) nextDraft.title = preset.title
    if (preset?.eventType) nextDraft.eventType = preset.eventType
    if (!nextDraft.allDay && nextDraft.startsAt) {
      nextDraft.endsAt = addMinutesToDatetimeLocal(nextDraft.startsAt, selectedDuration)
    }
    setDraft(nextDraft)
    setEditingEvent(null)
    setDrawerOpen(true)
  }, [selectedDate, selectedDuration])

  const handleEditEvent = useCallback((event: RoadmapCalendarEvent) => {
    resetDraft(event)
    setEditingEvent(event)
    setDrawerOpen(true)
  }, [resetDraft])

  const handleSave = useCallback(() => {
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
  }, [calendarType, draft, editingEvent, startTransition])

  const handleDelete = useCallback(() => {
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
  }, [calendarType, editingEvent, startTransition])

  const handleGoToToday = useCallback(() => {
    const today = new Date()
    setMonth(today)
    setSelectedDate(today)
  }, [])

  const handleMonthChange = useCallback((date: Date) => {
    setMonth(date)
    setSelectedDate((current) =>
      current && isSameRoadmapCalendarMonth(current, date) ? current : undefined,
    )
  }, [])

  const timeZoneOption = timeZone && timeZone !== "Local time" ? timeZone : undefined
  const formatTime = useCallback((value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZoneOption,
    }).format(date)
  }, [timeZoneOption])
  const formatDate = useCallback((value: string, options?: Intl.DateTimeFormatOptions) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timeZoneOption,
      ...options,
    }).format(date)
  }, [timeZoneOption])
  const formatTimeRange = useCallback((event: RoadmapCalendarEvent) => {
    if (event.allDay) return formatDate(event.startsAt, { month: "short", day: "numeric" })
    const startLabel = formatTime(event.startsAt)
    const endLabel = event.endsAt ? formatTime(event.endsAt) : null
    return endLabel ? `${startLabel}–${endLabel}` : startLabel
  }, [formatDate, formatTime])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {hideHeaderCopy ? null : (
        <div className="px-1 pb-3">
          <p className="text-sm font-semibold text-foreground">Board calendar</p>
          <p className="text-xs text-muted-foreground">
            Track public and internal milestones in one place.
          </p>
        </div>
      )}

      <RoadmapCalendarMonthAgendaPanel
        month={month}
        selectedDate={selectedDate}
        events={events}
        dayEvents={dayEvents}
        isLoading={isLoading}
        canManageCalendar={canManageCalendar}
        isTodaySelected={isTodaySelected}
        eventDatesByType={eventDatesByType}
        onMonthChange={handleMonthChange}
        onSelectDate={setSelectedDate}
        onGoToToday={handleGoToToday}
        onOpenCreate={handleOpenCreate}
        onEditEvent={handleEditEvent}
        formatDate={formatDate}
        formatTimeRange={formatTimeRange}
      />

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
