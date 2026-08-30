import type {
  FindMapWeatherCell,
  FindMapWeatherFreshness,
  FindMapWeatherResponse,
  FindMapWeatherSignal,
} from "../types"

const HEAT_THRESHOLD_CELSIUS = ((100 - 32) * 5) / 9
const OBSERVATION_MAX_AGE_MS = 90 * 60 * 1000
const OBSERVATION_FUTURE_TOLERANCE_MS = 5 * 60 * 1000
const CELSIUS_UNIT_CODE = "wmoUnit:degC"
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

function readTimestamp(value: unknown) {
  const timestamp = readString(value)
  return timestamp && Number.isFinite(Date.parse(timestamp)) ? timestamp : null
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
  const unitCode = readString(record?.["uom"])
  if (unitCode && unitCode !== CELSIUS_UNIT_CODE) return []
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

function readObservationTemperature(observation: unknown, now: number) {
  const properties = readRecord(readRecord(observation)?.["properties"])
  const temperature = readRecord(properties?.["temperature"])
  const unitCode = readString(temperature?.["unitCode"])
  const value = readNumber(temperature?.["value"])
  const updatedAt = readTimestamp(properties?.["timestamp"])
  if (unitCode !== CELSIUS_UNIT_CODE || value === null || !updatedAt)
    return null
  const age = now - Date.parse(updatedAt)
  if (age < -OBSERVATION_FUTURE_TOLERANCE_MS || age > OBSERVATION_MAX_AGE_MS) {
    return null
  }
  return { updatedAt, value }
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

function hasActiveHeatAlert(alerts: unknown, now: number) {
  const features = readRecord(alerts)?.["features"]
  if (!Array.isArray(features)) return false
  return features.some((feature) => {
    const properties = readRecord(readRecord(feature)?.["properties"])
    if (!normalizeNwsHeatEvent(properties?.["event"])) return false
    if (readString(properties?.["status"]).toLowerCase() !== "actual")
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
      Number.isFinite(starts) &&
      Number.isFinite(ends) &&
      starts <= now &&
      now < ends
    )
  })
}

export function buildFindMapWeatherResponse({
  alerts,
  alertsAvailable,
  freshness,
  grid,
  now = Date.now(),
  observation,
  point,
}: {
  alerts: unknown
  alertsAvailable: boolean
  freshness: FindMapWeatherFreshness
  grid: unknown
  now?: number
  observation?: unknown
  point: unknown
}): FindMapWeatherResponse {
  const pointProperties = readRecord(readRecord(point)?.["properties"])
  const gridProperties = readRecord(readRecord(grid)?.["properties"])
  const relativeLocation = readRecord(pointProperties?.["relativeLocation"])
  const place = readRecord(relativeLocation?.["properties"])
  const timezone = readString(pointProperties?.["timeZone"])
  const forecastTemperature = gridProperties
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
  const observationTemperature = readObservationTemperature(observation, now)
  const temperature = observationTemperature?.value ?? forecastTemperature
  const temperatureSource = observationTemperature
    ? ("observation" as const)
    : ("forecast" as const)
  const updatedAt =
    observationTemperature?.updatedAt ??
    readTimestamp(gridProperties?.["updateTime"])
  const snapshotFreshness = observationTemperature ? "fresh" : freshness

  return {
    signal,
    snapshot:
      temperature !== undefined && updatedAt
        ? {
            ...(city ? { city } : null),
            ...(state ? { state } : null),
            temperatureFahrenheit: celsiusToRoundedFahrenheit(temperature),
            ...(high === null
              ? null
              : { highFahrenheit: celsiusToRoundedFahrenheit(high) }),
            ...(low === null
              ? null
              : { lowFahrenheit: celsiusToRoundedFahrenheit(low) }),
            temperatureSource,
            signal,
            freshness: snapshotFreshness,
            updatedAt,
          }
        : null,
  }
}
