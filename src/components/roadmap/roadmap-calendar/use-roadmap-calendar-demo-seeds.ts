"use client"

import { useEffect } from "react"

import { createRoadmapCalendarEvent } from "@/actions/roadmap-calendar"
import {
  ROADMAP_CALENDAR_PRESETS,
  type RoadmapCalendarAssignedRole,
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarRecurrence,
  type RoadmapCalendarType,
} from "@/lib/roadmap/calendar"
import { DEMO_SEED_KEY } from "@/components/roadmap/roadmap-calendar/constants"

export function useRoadmapCalendarDemoSeeds(input: {
  calendarType: RoadmapCalendarType
  canManageCalendar: boolean
  eventsLength: number
  isLoading: boolean
  startTransition: (scope: () => void) => void
  setEvents: (
    updater: (events: RoadmapCalendarEvent[]) => RoadmapCalendarEvent[]
  ) => void
}) {
  const {
    calendarType,
    canManageCalendar,
    eventsLength,
    isLoading,
    setEvents,
    startTransition,
  } = input

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    if (!canManageCalendar || isLoading || eventsLength > 0) return
    if (typeof window === "undefined") return
    if (window.localStorage.getItem(DEMO_SEED_KEY)) return

    const now = new Date()
    const seeds: RoadmapCalendarEventInput[] = Array.from({ length: 60 }).map(
      (_, index) => buildDemoSeed(now, index)
    )

    window.localStorage.setItem(DEMO_SEED_KEY, "true")
    startTransition(async () => {
      const created: RoadmapCalendarEvent[] = []
      for (const seed of seeds) {
        const result = await createRoadmapCalendarEvent({
          calendarType,
          event: seed,
        })
        if ("error" in result) continue
        created.push(result.event)
      }
      if (created.length > 0) {
        setEvents((prev) => [...prev, ...created])
      }
    })
  }, [
    calendarType,
    canManageCalendar,
    eventsLength,
    isLoading,
    setEvents,
    startTransition,
  ])
}

function buildDemoSeed(now: Date, index: number): RoadmapCalendarEventInput {
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
    recurrence:
      index % 11 === 0
        ? ({ frequency: "monthly" } as RoadmapCalendarRecurrence)
        : null,
  }
}
