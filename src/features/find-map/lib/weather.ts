import type {
  FindMapWeatherCell,
  FindMapWeatherFreshness,
  FindMapWeatherResponse,
  FindMapWeatherSignal,
} from "../types"

const CELL_SIZE = 0.05
const HEAT_THRESHOLD_CELSIUS = 37.78
const HEAT_EVENTS = new Map([
  ["heat advisory", "Heat Advisory"],
  ["extreme heat watch", "Extreme Heat Watch"],
  ["extreme heat warning", "Extreme Heat Warning"],
  ["excessive heat watch", "Extreme Heat Watch"],
  ["excessive heat warning", "Extreme Heat Warning"],
])

type NwsValue = { validTime?: unknown; value?: unknown }
type NwsInterval = { start: number; end: number; value: number }

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseDuration(value: string) {
  const match = value.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/
  )
  if (!match) return null
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match
  return (
    (Number(days) * 86400 +
      Number(hours) * 3600 +
      Number(minutes) * 60 +
      Number(seconds)) *
    1000
  )
}

function parseInterval(entry: NwsValue): NwsInterval | null {
  const validTime = readString(entry.validTime)
  const [startValue, durationValue] = validTime.split("/")
  const start = Date.parse(startValue ?? "")
  const duration = parseDuration(durationValue ?? "")
  const value = readNumber(entry.value)
  if (!Number.isFinite(start) || duration === null || value === null)
    return null
  return { start, end: start + duration, value }
}

function readIntervals(value: unknown) {
  const record = readRecord(value)
  const entries = record?.["values"]
  return Array.isArray(entries)
    ? entries
        .map((entry) => parseInterval(readRecord(entry) ?? {}))
        .filter((entry): entry is NwsInterval => entry !== null)
    : []
}

function celsiusToRoundedFahrenheit(value: number) {
  return Math.round((value * 9) / 5 + 32)
}

function valueAt(intervals: NwsInterval[], time: number) {
  return intervals.find(
    (interval) => interval.start <= time && time < interval.end
  )?.value
}

function formatDateKey(time: number, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone: timezone,
      year: "numeric",
    }).format(new Date(time))
  } catch {
    return null
  }
}

function dailyValue(intervals: NwsInterval[], now: number, timezone: string) {
  const today = formatDateKey(now, timezone)
  const matching = intervals.find(
    (interval) =>
      formatDateKey(interval.start, timezone) === today ||
      formatDateKey(Math.max(interval.start, interval.end - 1), timezone) ===
        today
  )
  return matching?.value ?? null
}

function hasForecastHeatThreshold(
  properties: Record<string, unknown>,
  now: number
) {
  const metrics = ["heatIndex", "apparentTemperature", "temperature"]
  const end = now + 24 * 60 * 60 * 1000
  for (const metric of metrics) {
    const intervals = readIntervals(properties[metric])
    let consecutive = 0
    for (let time = now; time < end; time += 60 * 60 * 1000) {
      const value = valueAt(intervals, time)
      consecutive =
        value !== undefined && value >= HEAT_THRESHOLD_CELSIUS
          ? consecutive + 1
          : 0
      if (consecutive >= 2) return true
    }
  }
  return false
}

export function normalizeNwsHeatEvent(value: unknown) {
  return HEAT_EVENTS.get(readString(value).toLowerCase()) ?? null
}

export function buildFindMapWeatherCell({
  latitude,
  longitude,
}: FindMapWeatherCell): FindMapWeatherCell | null {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }
  return {
    latitude: Number((Math.round(latitude / CELL_SIZE) * CELL_SIZE).toFixed(2)),
    longitude: Number(
      (Math.round(longitude / CELL_SIZE) * CELL_SIZE).toFixed(2)
    ),
  }
}

export function parseFindMapWeatherCell(value: unknown) {
  const record = readRecord(value)
  const cell = buildFindMapWeatherCell({
    latitude: readNumber(record?.["latitude"]) ?? Number.NaN,
    longitude: readNumber(record?.["longitude"]) ?? Number.NaN,
  })
  if (!cell) return null
  const latitude = readNumber(record?.["latitude"])
  const longitude = readNumber(record?.["longitude"])
  return latitude !== null &&
    longitude !== null &&
    Math.abs(latitude - cell.latitude) < 0.000001 &&
    Math.abs(longitude - cell.longitude) < 0.000001
    ? cell
    : null
}

function hasActiveHeatAlert(alerts: unknown, now: number) {
  const features = readRecord(alerts)?.["features"]
  if (!Array.isArray(features)) return false
  return features.some((feature) => {
    const properties = readRecord(readRecord(feature)?.["properties"])
    if (!normalizeNwsHeatEvent(properties?.["event"])) return false
    if (readString(properties?.["status"]).toLowerCase() === "test")
      return false
    if (readString(properties?.["messageType"]).toLowerCase() === "cancel")
      return false
    const starts = Date.parse(
      readString(properties?.["onset"] ?? properties?.["effective"])
    )
    const ends = Date.parse(
      readString(properties?.["ends"] ?? properties?.["expires"])
    )
    return (
      (!Number.isFinite(starts) || starts <= now) &&
      (!Number.isFinite(ends) || now < ends)
    )
  })
}

export function buildFindMapWeatherResponse({
  alerts,
  alertsAvailable,
  freshness,
  grid,
  now = Date.now(),
  point,
}: {
  alerts: unknown
  alertsAvailable: boolean
  freshness: FindMapWeatherFreshness
  grid: unknown
  now?: number
  point: unknown
}): FindMapWeatherResponse {
  const pointProperties = readRecord(readRecord(point)?.["properties"])
  const gridProperties = readRecord(readRecord(grid)?.["properties"])
  const relativeLocation = readRecord(pointProperties?.["relativeLocation"])
  const place = readRecord(relativeLocation?.["properties"])
  const timezone = readString(pointProperties?.["timeZone"])
  const temperature = gridProperties
    ? valueAt(readIntervals(gridProperties["temperature"]), now)
    : undefined
  const high = gridProperties
    ? dailyValue(readIntervals(gridProperties["maxTemperature"]), now, timezone)
    : null
  const low = gridProperties
    ? dailyValue(readIntervals(gridProperties["minTemperature"]), now, timezone)
    : null
  const activeAlert = hasActiveHeatAlert(alerts, now)
  const forecastThreshold =
    gridProperties && freshness === "fresh"
      ? hasForecastHeatThreshold(gridProperties, now)
      : false
  const signal: FindMapWeatherSignal = activeAlert
    ? "official_alert"
    : forecastThreshold
      ? "forecast_threshold"
      : alertsAvailable && gridProperties && freshness === "fresh"
        ? "none"
        : "unknown"
  const city = readString(place?.["city"])
  const state = readString(place?.["state"])
  const updatedAt = readString(gridProperties?.["updateTime"])

  return {
    signal,
    snapshot:
      city &&
      state &&
      timezone &&
      temperature !== undefined &&
      high !== null &&
      low !== null &&
      updatedAt
        ? {
            city,
            state,
            temperatureFahrenheit: celsiusToRoundedFahrenheit(temperature),
            highFahrenheit: celsiusToRoundedFahrenheit(high),
            lowFahrenheit: celsiusToRoundedFahrenheit(low),
            signal,
            freshness,
            updatedAt,
          }
        : null,
  }
}
