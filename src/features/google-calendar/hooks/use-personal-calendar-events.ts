"use client"
import { useEffect, useState } from "react"
import type { CalendarEvent, CalendarSummary } from "../types"
import { calendarClientRequest } from "./use-google-calendar-controller"
export function usePersonalCalendarEvents(month: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  useEffect(() => {
    let alive = true
    let generation = 0
    const load = async () => {
      const request = ++generation
      try {
        const status =
          await calendarClientRequest<CalendarSummary>("connection")
        if (!alive || generation !== request) return
        if (!status.enabled || !status.connected) {
          setEvents([])
          return
        }
        const from = new Date(
          month.getFullYear(),
          month.getMonth(),
          1
        ).toISOString()
        const to = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          1
        ).toISOString()
        const result = await calendarClientRequest<{ events: CalendarEvent[] }>(
          "events?" + new URLSearchParams({ from, to })
        )
        if (alive && generation === request) setEvents(result.events)
      } catch {
        if (alive && generation === request) setEvents([])
      }
    }
    setEvents([])
    void load()
    const listener = () => {
      if (document.visibilityState === "visible") void load()
    }
    window.addEventListener("coachhouse:google-calendar-changed", listener)
    window.addEventListener("focus", listener)
    const timer = window.setInterval(listener, 30000)
    return () => {
      alive = false
      generation++
      window.clearInterval(timer)
      window.removeEventListener("coachhouse:google-calendar-changed", listener)
      window.removeEventListener("focus", listener)
    }
  }, [month])
  return events
}
