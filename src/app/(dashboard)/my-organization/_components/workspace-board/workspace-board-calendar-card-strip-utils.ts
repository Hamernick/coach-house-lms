import { parseMonthParam } from "../../_lib/helpers"

export function parseAnchorMonthFromNextHref(nextMonthHref: string) {
  try {
    const url = new URL(nextMonthHref, "https://workspace.local")
    const nextMonthParam = url.searchParams.get("month")
    const nextMonthDate = nextMonthParam ? parseMonthParam(nextMonthParam) : null
    if (!nextMonthDate) return null
    return new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() - 1, 1)
  } catch {
    return null
  }
}

export function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function buildCalendarDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

export function buildDateStripDays(selectedDate: Date, count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(selectedDate)
    date.setDate(selectedDate.getDate() + index)
    return date
  })
}

export function startOfLocalDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}
