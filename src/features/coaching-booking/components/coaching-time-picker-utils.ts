import type { CoachingSlot } from "../types"

export type TimeFormat = "12h" | "24h"

export type SlotGroup = {
  dateLabel: string
  displayDateLabel: string
  slots: CoachingSlot[]
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function zonedDateKey(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(new Date(value))
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function listMonthDates(month: Date) {
  const dates: Date[] = []
  const cursor = startOfMonth(month)
  const nextMonth = addMonths(cursor, 1)
  while (cursor < nextMonth) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function formatSlotDateLabel(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(value))
}

export function formatSlotTimeLabel(value: string, timezone: string, timeFormat: TimeFormat) {
  const formatted = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: timeFormat === "12h",
    timeZone: timezone,
  }).format(new Date(value))

  if (timeFormat === "24h") return formatted
  return formatted.replace(/\s?(AM|PM)$/i, (suffix) => suffix.trim().toLowerCase())
}

export function groupSlotsByDate(slots: CoachingSlot[], timezone: string): SlotGroup[] {
  return slots.reduce<SlotGroup[]>((groups, slot) => {
    const current = groups.at(-1)
    if (current?.dateLabel === slot.dateLabel) {
      current.slots.push(slot)
      return groups
    }

    groups.push({
      dateLabel: slot.dateLabel,
      displayDateLabel: formatSlotDateLabel(slot.startsAt, timezone),
      slots: [slot],
    })
    return groups
  }, [])
}
