import { buildFindMapWeatherResponse } from "../lib/weather"
import type {
  FindMapWeatherCell,
  FindMapWeatherFreshness,
  FindMapWeatherResponse,
} from "../types"

const NWS_HEADERS = {
  Accept: "application/geo+json",
  "User-Agent": "CoachHouseFind/1.0 (https://coachhouse.app)",
}
const REQUEST_TIMEOUT_MS = 5000
const NWS_GRID_MAX_AGE_MS = 12 * 60 * 60 * 1000

function isRetryable(status: number) {
  return status === 429 || status >= 500
}

async function fetchNwsJson(url: string, revalidate: number) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: NWS_HEADERS,
        next: { revalidate },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (response.ok) return (await response.json()) as unknown
      if (!isRetryable(response.status) || attempt === 1) return null
    } catch {
      if (attempt === 1) return null
    }
  }
  return null
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function resolveGridUrl(point: unknown) {
  const properties = readRecord(readRecord(point)?.["properties"])
  const value = properties?.["forecastGridData"]
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "api.weather.gov"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function resolveNwsGridFreshness(
  grid: unknown,
  now = Date.now()
): FindMapWeatherFreshness {
  const properties = readRecord(readRecord(grid)?.["properties"])
  const updatedAt = properties?.["updateTime"]
  const updateTime =
    typeof updatedAt === "string" ? Date.parse(updatedAt) : Number.NaN
  const age = now - updateTime
  return Number.isFinite(updateTime) && age >= 0 && age <= NWS_GRID_MAX_AGE_MS
    ? "fresh"
    : "stale"
}

export async function fetchFindMapWeather(
  cell: FindMapWeatherCell
): Promise<FindMapWeatherResponse> {
  const coordinate = `${cell.latitude.toFixed(2)},${cell.longitude.toFixed(2)}`
  const [point, alerts] = await Promise.all([
    fetchNwsJson(`https://api.weather.gov/points/${coordinate}`, 86400),
    fetchNwsJson(
      `https://api.weather.gov/alerts/active?point=${coordinate}`,
      120
    ),
  ])
  const gridUrl = resolveGridUrl(point)
  const grid = gridUrl ? await fetchNwsJson(gridUrl, 1800) : null

  return buildFindMapWeatherResponse({
    alerts,
    alertsAvailable: alerts !== null,
    freshness: resolveNwsGridFreshness(grid),
    grid,
    point,
  })
}
