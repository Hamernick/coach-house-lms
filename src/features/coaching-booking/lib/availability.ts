import { addMinutes, COACHING_SESSION_MINUTES, toSlotId } from "."
import type { CoachingCoachId, CoachingSlot } from "../types"

type BusyWindow = {
  startsAt: string
  endsAt: string
}

const SLOT_START_HOURS = [9, 10, 11, 13, 14, 15]

function overlaps(leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date) {
  return leftStart < rightEnd && rightStart < leftEnd
}

function getTimezoneParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour === "24" ? "0" : byType.hour),
    minute: Number(byType.minute),
    second: Number(byType.second),
  }
}

function getTimezoneOffsetMs(date: Date, timezone: string) {
  const parts = getTimezoneParts(date, timezone)
  const utc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return utc - date.getTime()
}

export function localDateTimeToUtc({
  date,
  hour,
  timezone,
}: {
  date: Date
  hour: number
  timezone: string
}) {
  const localCandidate = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    0,
    0,
  )
  const candidate = new Date(localCandidate)
  const offset = getTimezoneOffsetMs(candidate, timezone)
  return new Date(localCandidate - offset)
}

export function buildCandidateSlots({
  coachId,
  from,
  to,
  timezone,
  busyWindows,
}: {
  coachId: CoachingCoachId
  from: Date
  to: Date
  timezone: string
  busyWindows: BusyWindow[]
}): CoachingSlot[] {
  const dateCursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const endDate = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))
  const busy = busyWindows.map((window) => ({
    startsAt: new Date(window.startsAt),
    endsAt: new Date(window.endsAt),
  }))
  const now = new Date()
  const slots: CoachingSlot[] = []

  while (dateCursor <= endDate) {
    const weekday = dateCursor.getUTCDay()
    if (weekday !== 0 && weekday !== 6) {
      for (const hour of SLOT_START_HOURS) {
        const startsAt = localDateTimeToUtc({ date: dateCursor, hour, timezone })
        const endsAt = addMinutes(startsAt, COACHING_SESSION_MINUTES)
        if (startsAt <= now || startsAt < from || startsAt > to) continue
        const blocked = busy.some((window) => overlaps(startsAt, endsAt, window.startsAt, window.endsAt))
        slots.push({
          id: toSlotId(coachId, startsAt.toISOString()),
          coachId,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          dateLabel: new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: timezone,
          }).format(startsAt),
          timeLabel: new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
            timeZone: timezone,
          }).format(startsAt),
          available: !blocked,
        })
      }
    }
    dateCursor.setUTCDate(dateCursor.getUTCDate() + 1)
  }

  return slots
}
