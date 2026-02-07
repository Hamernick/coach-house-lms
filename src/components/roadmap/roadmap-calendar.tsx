"use client"

import { useEffect, useMemo, useState, useTransition, type ComponentProps } from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { endOfMonth, isSameDay, isWithinInterval, startOfMonth } from "date-fns"
import CalendarPlusIcon from "lucide-react/dist/esm/icons/calendar-plus"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import GlobeIcon from "lucide-react/dist/esm/icons/globe-2"
import PencilIcon from "lucide-react/dist/esm/icons/pencil"
import Trash2Icon from "lucide-react/dist/esm/icons/trash-2"
import RepeatIcon from "lucide-react/dist/esm/icons/repeat"
import VideoIcon from "lucide-react/dist/esm/icons/video"

import {
  createRoadmapCalendarEvent,
  deleteRoadmapCalendarEvent,
  listRoadmapCalendarEvents,
  updateRoadmapCalendarEvent,
} from "@/actions/roadmap-calendar"
import { Button } from "@/components/ui/button"
import Calendar01 from "@/components/calendar-01"
import { CalendarDayButton } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import {
  ROADMAP_CALENDAR_PRESETS,
  formatCalendarRecurrence,
  type RoadmapCalendarAssignedRole,
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarRecurrence,
  type RoadmapCalendarType,
} from "@/lib/roadmap/calendar"

const ROLE_OPTIONS: Array<{ id: RoadmapCalendarAssignedRole; label: string }> = [
  { id: "admin", label: "Admins" },
  { id: "staff", label: "Staff" },
  { id: "board", label: "Board" },
]

const DEMO_SEED_KEY = "roadmap-calendar-seeded-v2"
const DURATION_OPTIONS = [15, 30, 45, 60] as const

type EventDraft = {
  title: string
  description: string
  startsAt: string
  endsAt: string
  allDay: boolean
  status: "active" | "canceled"
  assignedRoles: RoadmapCalendarAssignedRole[]
  recurrence: RoadmapCalendarRecurrence | null
}

function CalendarDayWithDot({
  className,
  modifiers,
  ...props
}: ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton
      {...props}
      modifiers={modifiers}
      className={cn(
        className,
        "h-full rounded-md text-xs font-medium data-[selected-single=true]:!bg-zinc-800 data-[selected-single=true]:!text-white dark:data-[selected-single=true]:!bg-zinc-100 dark:data-[selected-single=true]:!text-zinc-900",
        modifiers?.hasEvent
          ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          : "text-zinc-500 hover:bg-zinc-100/60 dark:text-zinc-400 dark:hover:bg-zinc-800/50",
        modifiers?.hasEvent
          ? "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground/70 data-[selected-single=true]:after:bg-background"
          : ""
      )}
    />
  )
}

function getMonthRange(month: Date) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString()
}

function addMinutesToDatetimeLocal(value: string, minutes: number) {
  if (!value) return ""
  const start = new Date(value)
  if (Number.isNaN(start.getTime())) return ""
  start.setMinutes(start.getMinutes() + minutes)
  return toDatetimeLocal(start.toISOString())
}

function eventDurationMinutes(event: RoadmapCalendarEvent) {
  if (!event.endsAt) return null
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  return minutes > 0 ? minutes : null
}

function buildDraft({
  event,
  baseDate,
}: {
  event?: RoadmapCalendarEvent | null
  baseDate?: Date
}): EventDraft {
  if (event) {
    return {
      title: event.title,
      description: event.description ?? "",
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: event.endsAt ? toDatetimeLocal(event.endsAt) : "",
      allDay: event.allDay,
      status: event.status,
      assignedRoles: event.assignedRoles,
      recurrence: event.recurrence,
    }
  }

  const startDate = baseDate ? new Date(baseDate) : new Date()
  startDate.setHours(9, 0, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + 1)

  return {
    title: "",
    description: "",
    startsAt: toDatetimeLocal(startDate.toISOString()),
    endsAt: toDatetimeLocal(endDate.toISOString()),
    allDay: false,
    status: "active",
    assignedRoles: ["admin"],
    recurrence: null,
  }
}

export function RoadmapCalendar() {
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
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(month),
    [month],
  )

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
      const start = new Date(now)
      start.setDate(now.getDate() + index * 3)
      start.setHours(9 + (index % 6), 0, 0, 0)
      const end = new Date(start)
      end.setHours(start.getHours() + 1)
      return {
        title: ROADMAP_CALENDAR_PRESETS[index % ROADMAP_CALENDAR_PRESETS.length]?.label ?? `Milestone ${index + 1}`,
        description: "",
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        allDay: index % 9 === 0,
        status: "active" as const,
        assignedRoles: index % 5 === 0 ? (["admin", "staff", "board"] as RoadmapCalendarAssignedRole[]) : ["admin"],
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

  const handleOpenCreate = (presetTitle?: string) => {
    const nextDraft = buildDraft({ baseDate: selectedDate })
    if (presetTitle) nextDraft.title = presetTitle
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
      <div className="flex flex-col gap-2 px-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Board calendar</p>
          <p className="text-xs text-muted-foreground">Track public and internal milestones in one place.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="gap-2" disabled={!canManageCalendar}>
              <CalendarPlusIcon className="h-4 w-4" aria-hidden />
              Add event
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ROADMAP_CALENDAR_PRESETS.map((preset) => (
              <DropdownMenuItem key={preset.id} onSelect={() => handleOpenCreate(preset.title)}>
                {preset.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleOpenCreate()}>Custom event…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 rounded-xl border border-border/60 bg-background/20 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
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

          <Select value={timeZone} onValueChange={setTimeZone}>
            <SelectPrimitive.Trigger asChild>
              <Item asChild className="border-border/60 bg-background/20">
                <button type="button" className="w-full text-left">
                  <ItemMedia>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-muted/40 text-muted-foreground">
                      <GlobeIcon className="h-4 w-4" aria-hidden />
                    </span>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-xs uppercase tracking-wide text-muted-foreground">Time zone</ItemTitle>
                    <ItemDescription>{timeZone || "Local time"}</ItemDescription>
                  </ItemContent>
                  <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground">
                    <ChevronDownIcon className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </Item>
            </SelectPrimitive.Trigger>
            <SelectContent className="max-h-72">
              {timeZoneOptions.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {null}
        </div>

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

        <div className="flex min-h-0 flex-col rounded-lg border border-border/60 bg-background/30 p-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {selectedDate ? formatDate(selectedDate.toISOString(), { weekday: "long" }) : "Events"}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedDate ? formatDate(selectedDate.toISOString()) : ""}
            </p>
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
                        onClick={() => handleEditEvent(event)}
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
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>{editingEvent ? "Edit event" : "New event"}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="grid gap-2">
              <Label htmlFor="calendar-title">Title</Label>
              <Input
                id="calendar-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.currentTarget.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="calendar-description">Details</Label>
              <Textarea
                id="calendar-description"
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.currentTarget.value }))}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="calendar-start">Start</Label>
              <Input
                id="calendar-start"
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) => setDraft((prev) => ({ ...prev, startsAt: event.currentTarget.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="calendar-end">End</Label>
              <Input
                id="calendar-end"
                type="datetime-local"
                value={draft.endsAt}
                onChange={(event) => setDraft((prev) => ({ ...prev, endsAt: event.currentTarget.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="calendar-all-day"
                checked={draft.allDay}
                onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, allDay: Boolean(checked) }))}
              />
              <Label htmlFor="calendar-all-day">All day</Label>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, status: value as EventDraft["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign to</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      draft.assignedRoles.includes(role.id)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 bg-muted/40 text-muted-foreground"
                    )}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        assignedRoles: prev.assignedRoles.includes(role.id)
                          ? prev.assignedRoles.filter((item) => item !== role.id)
                          : [...prev.assignedRoles, role.id],
                      }))
                    }
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Repeat</p>
                  <p className="text-xs text-muted-foreground">
                    {draft.recurrence ? formatCalendarRecurrence(draft.recurrence) : "No recurrence"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDraft((prev) => ({ ...prev, recurrence: prev.recurrence ?? { frequency: "monthly" } }))}
                >
                  <RepeatIcon className="h-4 w-4" aria-hidden />
                  Set
                </Button>
              </div>
              {draft.recurrence ? (
                <div className="mt-3 grid gap-2">
                  <Label>Frequency</Label>
                  <Select
                    value={draft.recurrence.frequency}
                    onValueChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        recurrence: { ...(prev.recurrence ?? { frequency: "monthly" }), frequency: value as RoadmapCalendarRecurrence["frequency"] },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid gap-2">
                    <Label htmlFor="calendar-recurrence-end">Ends on (optional)</Label>
                    <Input
                      id="calendar-recurrence-end"
                      type="date"
                      value={draft.recurrence.endDate ?? ""}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          recurrence: prev.recurrence
                            ? { ...prev.recurrence, endDate: event.currentTarget.value || null }
                            : null,
                        }))
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs text-muted-foreground"
                    onClick={() => setDraft((prev) => ({ ...prev, recurrence: null }))}
                  >
                    Clear recurrence
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <DrawerFooter className="border-t border-border/60 bg-background/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {editingEvent ? (
                <Button type="button" variant="ghost" className="gap-2 text-destructive" onClick={handleDelete}>
                  <Trash2Icon className="h-4 w-4" aria-hidden />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={isPending}>
                  {editingEvent ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
