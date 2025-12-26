"use client"

import { useMemo, useState } from "react"
import { parseISO } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type DashboardEvent = {
  date: string
  label: string
  href?: string
  type?: "roadmap" | "org" | "people" | "marketplace" | "note"
}

export function DashboardCalendarCard({ events, className }: { events: DashboardEvent[]; className?: string }) {
  const parsed = useMemo(
    () =>
      events.map((evt) => ({
        ...evt,
        dateObj: parseISO(evt.date),
      })),
    [events],
  )
  const defaultSelected = parsed[0]?.dateObj ?? new Date()
  const [selected, setSelected] = useState<Date | undefined>(defaultSelected)

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={setSelected}
      showOutsideDays={false}
      buttonVariant="ghost"
      className={cn("rounded-2xl border border-border/70 bg-card/70 p-4 text-xs [--cell-size:--spacing(7)]", className)}
      classNames={{
        months: "flex flex-col gap-2 relative",
        month: "flex flex-col w-full gap-2",
        week: "flex w-full mt-1",
      }}
    />
  )
}
