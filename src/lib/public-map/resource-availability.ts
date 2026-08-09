export type PublicMapResourceAvailabilityStatus =
  | "open"
  | "closed"
  | "appointment_required"
  | "temporarily_closed"
  | "unknown"

export type PublicMapResourceAvailability = {
  status: PublicMapResourceAvailabilityStatus
  statusLabel: string
  openNow: boolean | null
  nextOpenAt: string | null
  nextCloseAt: string | null
  timezone: string | null
  label: string | null
  notes: string | null
  appointmentRequired: boolean
  sourceStatus: string | null
  temporaryClosedUntil: string | null
}

type AvailabilityInput = {
  hours: unknown
  timezone?: string | null
  appointmentRequired?: boolean | null
  availabilityStatus?: string | null
  availabilityNotes?: string | null
  temporaryClosedUntil?: string | null
  now?: Date
}

type LocalSnapshot = {
  dateKey: string
  dayIndex: number
  minutes: number
}

type TimeInterval = {
  opens: number
  closes: number
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

const DAY_ALIASES = new Map<string, number>(
  DAY_KEYS.flatMap((day, index) => [
    [day, index],
    [day.slice(0, 3), index],
  ])
)

const KNOWN_AVAILABILITY_STATUSES = new Set([
  "unknown",
  "available",
  "limited",
  "appointment_only",
  "waitlist",
  "temporarily_closed",
  "seasonal",
  "closed",
])

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readStringOrNull(...values: unknown[]) {
  for (const value of values) {
    const trimmed = readString(value)
    if (trimmed) return trimmed
  }
  return null
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return false
  return ["true", "yes", "1"].includes(value.trim().toLowerCase())
}

function normalizeStatus(value: unknown) {
  const normalized = readString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return KNOWN_AVAILABILITY_STATUSES.has(normalized) ? normalized : null
}

function normalizeTimezone(value: unknown) {
  const timezone = readString(value)
  if (!timezone) return null
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone })
    return timezone
  } catch {
    return null
  }
}

function readHoursLabel(hours: unknown) {
  if (typeof hours === "string") return readStringOrNull(hours)
  if (Array.isArray(hours)) {
    const entries = hours.map(readString).filter(Boolean)
    return entries.length > 0 ? entries.join(", ") : null
  }
  const record = readRecord(hours)
  if (!record) return null
  return readStringOrNull(record.label, record.summary, record.display)
}

function parseTime(value: unknown) {
  const raw = readString(value).toLowerCase()
  if (!raw) return null
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/)
  if (!match) return null
  let hour = Number.parseInt(match[1] ?? "", 10)
  const minute = Number.parseInt(match[2] ?? "0", 10)
  const meridian = match[3]
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (minute < 0 || minute > 59) return null
  if (meridian === "pm" && hour < 12) hour += 12
  if (meridian === "am" && hour === 12) hour = 0
  if (hour === 24 && minute === 0) return 1440
  if (hour < 0 || hour > 23) return null
  return hour * 60 + minute
}

function readIntervals(value: unknown): TimeInterval[] {
  const entries = Array.isArray(value) ? value : [value]
  return entries.flatMap((entry) => {
    const record = readRecord(entry)
    if (!record) return []
    const opens = parseTime(record.opensAt ?? record.opens_at ?? record.open)
    const closes = parseTime(
      record.closesAt ?? record.closes_at ?? record.close
    )
    if (opens === null || closes === null || opens === closes) return []
    return [{ opens, closes }]
  })
}

function normalizeDayIndex(value: unknown) {
  if (typeof value === "number" && value >= 0 && value <= 6) return value
  const normalized = readString(value).toLowerCase()
  return DAY_ALIASES.get(normalized) ?? null
}

function getParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(date)
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value)
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
  }
}

function buildDateKey(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-")
}

function readDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return { year: year ?? 0, month: month ?? 0, day: day ?? 0 }
}

function addDays(dateKey: string, days: number) {
  const date = readDateKey(dateKey)
  return new Date(Date.UTC(date.year, date.month - 1, date.day + days))
    .toISOString()
    .slice(0, 10)
}

function getDayIndex(dateKey: string) {
  const date = readDateKey(dateKey)
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
}

function getLocalSnapshot(now: Date, timezone: string): LocalSnapshot {
  const parts = getParts(now, timezone)
  const dateKey = buildDateKey(parts.year, parts.month, parts.day)
  return {
    dateKey,
    dayIndex: getDayIndex(dateKey),
    minutes: parts.hour * 60 + parts.minute,
  }
}

function zonedLocalToUtc(dateKey: string, minutes: number, timezone: string) {
  const date = readDateKey(dateKey)
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  const guess = Date.UTC(date.year, date.month - 1, date.day, hour, minute)
  const actual = getParts(new Date(guess), timezone)
  const actualAsUtc = Date.UTC(
    actual.year,
    actual.month - 1,
    actual.day,
    actual.hour,
    actual.minute
  )
  const desiredAsUtc = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    hour,
    minute
  )
  return new Date(guess + desiredAsUtc - actualAsUtc)
}

function getExceptionIntervals(
  hours: Record<string, unknown>,
  dateKey: string
) {
  const exceptions = Array.isArray(hours.exceptions) ? hours.exceptions : []
  const exception = exceptions.find((entry) => {
    const record = readRecord(entry)
    return record && readString(record.date ?? record.localDate) === dateKey
  })
  const record = readRecord(exception)
  if (!record) return null
  if (
    readBoolean(record.closed) ||
    normalizeStatus(record.status) === "closed"
  ) {
    return []
  }
  return readIntervals(record.intervals ?? record.hours)
}

function getWeeklyIntervals(
  hours: Record<string, unknown>,
  dateKey: string,
  dayIndex: number
) {
  const exceptionIntervals = getExceptionIntervals(hours, dateKey)
  if (exceptionIntervals) return exceptionIntervals
  if (readBoolean(hours.alwaysOpen) || readBoolean(hours.always_open)) {
    return [{ opens: 0, closes: 1440 }]
  }

  const weekly = readRecord(hours.weekly)
  if (weekly) {
    const day = DAY_KEYS[dayIndex] ?? "sunday"
    return readIntervals(weekly[day] ?? weekly[day.slice(0, 3)])
  }

  if (!Array.isArray(hours.weekly)) return []
  return hours.weekly.flatMap((entry) => {
    const record = readRecord(entry)
    if (!record) return []
    const days = Array.isArray(record.days) ? record.days : [record.day]
    if (!days.some((day) => normalizeDayIndex(day) === dayIndex)) return []
    return readIntervals(record.intervals ?? record)
  })
}

function intervalEndDateKey(dateKey: string, interval: TimeInterval) {
  return interval.closes <= interval.opens ? addDays(dateKey, 1) : dateKey
}

function findOpenInterval(
  hours: Record<string, unknown>,
  snapshot: LocalSnapshot,
  timezone: string,
  now: Date
) {
  const dates = [snapshot.dateKey, addDays(snapshot.dateKey, -1)]
  for (const dateKey of dates) {
    const intervals = getWeeklyIntervals(hours, dateKey, getDayIndex(dateKey))
    for (const interval of intervals) {
      const start = zonedLocalToUtc(dateKey, interval.opens, timezone)
      const end = zonedLocalToUtc(
        intervalEndDateKey(dateKey, interval),
        interval.closes,
        timezone
      )
      if (now >= start && now < end) return { start, end }
    }
  }
  return null
}

function findNextOpen(
  hours: Record<string, unknown>,
  snapshot: LocalSnapshot,
  timezone: string,
  now: Date
) {
  for (let offset = 0; offset <= 14; offset += 1) {
    const dateKey = addDays(snapshot.dateKey, offset)
    const intervals = getWeeklyIntervals(hours, dateKey, getDayIndex(dateKey))
    const starts = intervals
      .map((interval) => zonedLocalToUtc(dateKey, interval.opens, timezone))
      .filter((start) => start > now)
      .sort((a, b) => a.getTime() - b.getTime())
    if (starts[0]) return starts[0]
  }
  return null
}

export function resolveResourceAvailability({
  hours,
  timezone: explicitTimezone,
  appointmentRequired,
  availabilityStatus,
  availabilityNotes,
  temporaryClosedUntil,
  now = new Date(),
}: AvailabilityInput): PublicMapResourceAvailability {
  const record = readRecord(hours) ?? {}
  const timezone = normalizeTimezone(explicitTimezone ?? record.timezone)
  const sourceStatus = normalizeStatus(
    availabilityStatus ?? record.availabilityStatus ?? record.status
  )
  const appointment =
    Boolean(appointmentRequired) ||
    readBoolean(record.appointmentRequired ?? record.appointment_required) ||
    sourceStatus === "appointment_only"
  const notes = readStringOrNull(
    availabilityNotes,
    record.availabilityNotes,
    record.availability_notes,
    record.notes
  )
  const label = readHoursLabel(hours)
  const closedUntil = readStringOrNull(
    temporaryClosedUntil,
    record.temporaryClosedUntil,
    record.temporary_closed_until
  )
  const temporaryClosed =
    sourceStatus === "temporarily_closed" ||
    readBoolean(record.temporaryClosed ?? record.temporary_closed) ||
    Boolean(closedUntil && new Date(closedUntil) > now)

  if (temporaryClosed) {
    return {
      status: "temporarily_closed",
      statusLabel: "Temporarily closed",
      openNow: false,
      nextOpenAt: null,
      nextCloseAt: null,
      timezone,
      label,
      notes,
      appointmentRequired: appointment,
      sourceStatus,
      temporaryClosedUntil: closedUntil,
    }
  }

  if (!timezone) {
    return {
      status: appointment ? "appointment_required" : "unknown",
      statusLabel: appointment ? "Appointment required" : "Hours unavailable",
      openNow: null,
      nextOpenAt: null,
      nextCloseAt: null,
      timezone: null,
      label,
      notes,
      appointmentRequired: appointment,
      sourceStatus,
      temporaryClosedUntil: closedUntil,
    }
  }

  const snapshot = getLocalSnapshot(now, timezone)
  const openInterval = findOpenInterval(record, snapshot, timezone, now)
  const nextOpen = openInterval
    ? null
    : findNextOpen(record, snapshot, timezone, now)

  if (openInterval) {
    return {
      status: appointment ? "appointment_required" : "open",
      statusLabel: appointment ? "Open now, appointment required" : "Open now",
      openNow: true,
      nextOpenAt: null,
      nextCloseAt: openInterval.end.toISOString(),
      timezone,
      label,
      notes,
      appointmentRequired: appointment,
      sourceStatus,
      temporaryClosedUntil: closedUntil,
    }
  }

  return {
    status: appointment ? "appointment_required" : "closed",
    statusLabel: appointment ? "Appointment required" : "Closed",
    openNow: false,
    nextOpenAt: nextOpen?.toISOString() ?? null,
    nextCloseAt: null,
    timezone,
    label,
    notes,
    appointmentRequired: appointment,
    sourceStatus,
    temporaryClosedUntil: closedUntil,
  }
}
