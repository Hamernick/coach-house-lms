import type {
  FindMapWeatherCell,
  FindMapWeatherFreshness,
  FindMapWeatherResponse,
  FindMapWeatherSignal,
} from "@/features/find-map"

const CELL_SIZE = 0.05
const WEATHER_SIGNALS = new Set<FindMapWeatherSignal>([
  "official_alert",
  "forecast_threshold",
  "none",
  "unknown",
])
const WEATHER_FRESHNESS = new Set<FindMapWeatherFreshness>(["fresh", "stale"])

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

function isPlausibleTemperature(value: number | null) {
  return value === null || (value >= -200 && value <= 200)
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

export function parseFindMapWeatherResponse(
  value: unknown
): FindMapWeatherResponse | null {
  const record = readRecord(value)
  const signal = readString(record?.["signal"]) as FindMapWeatherSignal
  if (!WEATHER_SIGNALS.has(signal)) return null
  if (record?.["snapshot"] === null) return { signal, snapshot: null }

  const snapshot = readRecord(record?.["snapshot"])
  const temperatureFahrenheit = readNumber(snapshot?.["temperatureFahrenheit"])
  const temperatureSource = readString(snapshot?.["temperatureSource"])
  const snapshotSignal = readString(
    snapshot?.["signal"]
  ) as FindMapWeatherSignal
  const freshness = readString(
    snapshot?.["freshness"]
  ) as FindMapWeatherFreshness
  const updatedAt = readTimestamp(snapshot?.["updatedAt"])
  if (
    temperatureFahrenheit === null ||
    !isPlausibleTemperature(temperatureFahrenheit) ||
    (temperatureSource !== "observation" && temperatureSource !== "forecast") ||
    !WEATHER_SIGNALS.has(snapshotSignal) ||
    snapshotSignal !== signal ||
    !WEATHER_FRESHNESS.has(freshness) ||
    !updatedAt
  ) {
    return null
  }

  const city = readString(snapshot?.["city"])
  const state = readString(snapshot?.["state"])
  const highFahrenheit = readNumber(snapshot?.["highFahrenheit"])
  const lowFahrenheit = readNumber(snapshot?.["lowFahrenheit"])
  if (
    !isPlausibleTemperature(highFahrenheit) ||
    !isPlausibleTemperature(lowFahrenheit)
  ) {
    return null
  }
  return {
    signal,
    snapshot: {
      ...(city ? { city } : null),
      ...(state ? { state } : null),
      ...(highFahrenheit === null ? null : { highFahrenheit }),
      ...(lowFahrenheit === null ? null : { lowFahrenheit }),
      freshness,
      signal: snapshotSignal,
      temperatureFahrenheit,
      temperatureSource,
      updatedAt,
    },
  }
}
