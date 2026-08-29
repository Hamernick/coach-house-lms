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
const RETRY_DELAY_MS = 150
const NWS_GRID_MAX_AGE_MS = 6 * 60 * 60 * 1000
const MAX_PROVIDER_CACHE_ENTRIES = 128

type NwsRequestKind = "alerts" | "grid" | "observation" | "point" | "stations"

type NwsCacheEntry = {
  freshUntil: number
  staleUntil: number
  value: unknown
}

const providerCache = new Map<string, NwsCacheEntry>()
const pendingProviderRequests = new Map<string, Promise<unknown | null>>()

function isRetryable(status: number) {
  return status === 429 || status >= 500
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function writeProviderCache(
  url: string,
  value: unknown,
  freshSeconds: number,
  staleSeconds: number
) {
  const now = Date.now()
  providerCache.delete(url)
  providerCache.set(url, {
    freshUntil: now + freshSeconds * 1000,
    staleUntil: now + staleSeconds * 1000,
    value,
  })
  if (providerCache.size > MAX_PROVIDER_CACHE_ENTRIES) {
    const oldestKey = providerCache.keys().next().value
    if (oldestKey) providerCache.delete(oldestKey)
  }
}

function warnProviderFailure({
  errorName,
  kind,
  staleFallback,
  status,
}: {
  errorName?: string
  kind: NwsRequestKind
  staleFallback: boolean
  status?: number
}) {
  console.warn("[find-weather] NWS request unavailable.", {
    errorName,
    kind,
    staleFallback,
    status,
  })
}

async function fetchNwsJson({
  freshSeconds,
  kind,
  staleSeconds,
  url,
}: {
  freshSeconds: number
  kind: NwsRequestKind
  staleSeconds: number
  url: string
}) {
  const cached = providerCache.get(url)
  if (cached && cached.freshUntil > Date.now()) return cached.value
  const pending = pendingProviderRequests.get(url)
  if (pending) return pending

  const request = (async () => {
    let errorName: string | undefined
    let status: number | undefined
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: NWS_HEADERS,
          next: { revalidate: freshSeconds },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        status = response.status
        if (response.ok) {
          const value = (await response.json()) as unknown
          writeProviderCache(url, value, freshSeconds, staleSeconds)
          return value
        }
        if (!isRetryable(response.status) || attempt === 1) break
      } catch (error) {
        errorName = error instanceof Error ? error.name : "UnknownError"
        if (attempt === 1) break
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }

    const stale = providerCache.get(url)
    const staleFallback = Boolean(stale && stale.staleUntil > Date.now())
    warnProviderFailure({ errorName, kind, staleFallback, status })
    return staleFallback ? (stale?.value ?? null) : null
  })().finally(() => pendingProviderRequests.delete(url))

  pendingProviderRequests.set(url, request)
  return request
}

function resolveNwsLinkedUrl(value: unknown) {
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

function resolvePointLink(point: unknown, property: string) {
  const properties = readRecord(readRecord(point)?.["properties"])
  return resolveNwsLinkedUrl(properties?.[property])
}

function resolveStationIdentifier(stations: unknown) {
  const features = readRecord(stations)?.["features"]
  if (!Array.isArray(features)) return null
  for (const feature of features) {
    const properties = readRecord(readRecord(feature)?.["properties"])
    const identifier = readString(properties?.["stationIdentifier"])
    if (/^[A-Z0-9]{3,8}$/.test(identifier)) return identifier
  }
  return null
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
    fetchNwsJson({
      freshSeconds: 86400,
      kind: "point",
      staleSeconds: 7 * 86400,
      url: `https://api.weather.gov/points/${coordinate}`,
    }),
    fetchNwsJson({
      freshSeconds: 120,
      kind: "alerts",
      staleSeconds: 900,
      url: `https://api.weather.gov/alerts/active?point=${coordinate}`,
    }),
  ])
  const gridUrl = resolvePointLink(point, "forecastGridData")
  const stationsUrl = resolvePointLink(point, "observationStations")
  const [grid, stations] = await Promise.all([
    gridUrl
      ? fetchNwsJson({
          freshSeconds: 1800,
          kind: "grid",
          staleSeconds: 21600,
          url: gridUrl,
        })
      : null,
    stationsUrl
      ? fetchNwsJson({
          freshSeconds: 86400,
          kind: "stations",
          staleSeconds: 7 * 86400,
          url: stationsUrl,
        })
      : null,
  ])
  const stationIdentifier = resolveStationIdentifier(stations)
  const observation = stationIdentifier
    ? await fetchNwsJson({
        freshSeconds: 300,
        kind: "observation",
        staleSeconds: 5400,
        url: `https://api.weather.gov/stations/${encodeURIComponent(stationIdentifier)}/observations/latest?require_qc=true`,
      })
    : null

  return buildFindMapWeatherResponse({
    alerts,
    alertsAvailable: alerts !== null,
    freshness: resolveNwsGridFreshness(grid),
    grid,
    observation,
    point,
  })
}
