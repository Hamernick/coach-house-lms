import { normalizeSourceId, readString } from "./shared.mjs"

export function normalizeStaleDays(value, fallback = 90) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, 1), 3650)
}

function parseDate(value) {
  const timestamp = new Date(value ?? "").getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export function ageDays(value, now = new Date()) {
  const timestamp = parseDate(value)
  if (timestamp === null) return null
  return Math.floor((now.getTime() - timestamp) / 86_400_000)
}

export function latestRawBySource(rawRows) {
  const latest = new Map()

  for (const raw of rawRows) {
    const sourceId = readString(raw.source_id, raw.sourceId)
    if (!sourceId) continue

    const fetchedAt = readString(raw.fetched_at, raw.fetchedAt)
    const timestamp = parseDate(fetchedAt) ?? 0
    const existing = latest.get(sourceId)
    if (!existing || timestamp >= existing.timestamp) {
      latest.set(sourceId, { raw, fetchedAt, timestamp })
    }
  }

  return latest
}

export function countFailedFetchesBySource(rawRows) {
  const counts = new Map()
  for (const raw of rawRows) {
    const sourceId = readString(raw.source_id, raw.sourceId)
    const status = readString(raw.fetch_status, raw.fetchStatus)
    if (!sourceId || status !== "failed") continue
    counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1)
  }
  return counts
}

export function buildLocalSourceFreshnessReport({
  sources,
  rawRows,
  staleDays = 90,
  now = new Date(),
}) {
  const latestBySource = latestRawBySource(rawRows)
  const failedCounts = countFailedFetchesBySource(rawRows)

  return sources.map((source) => {
    const sourceId = normalizeSourceId(source)
    const latest = latestBySource.get(sourceId)
    const latestStatus = readString(
      latest?.raw.fetch_status,
      latest?.raw.fetchStatus
    )
    const latestFetchedAt = latest?.fetchedAt ?? null
    const daysOld = ageDays(latestFetchedAt, now)
    const failedFetchCount = failedCounts.get(sourceId) ?? 0
    const status =
      latestStatus === "failed"
        ? "failed"
        : daysOld === null
          ? "never_fetched"
          : daysOld > staleDays
            ? "stale"
            : "current"

    return {
      sourceId,
      slug: source.slug ?? sourceId,
      name: source.name ?? sourceId,
      connectorType: source.connectorType ?? source.connector_type ?? null,
      sourceType: source.sourceType ?? source.source_type ?? null,
      trustLevel: source.trustLevel ?? source.trust_level ?? null,
      rawUrl: readString(source.rawUrl, source.raw_url, source.url),
      latestFetchedAt,
      latestFetchStatus: latestStatus ?? null,
      daysOld,
      failedFetchCount,
      staleDays,
      status,
    }
  })
}

export function selectRetryFailedSourceIds(rawRows) {
  return [
    ...new Set(
      rawRows
        .filter(
          (raw) => readString(raw.fetch_status, raw.fetchStatus) === "failed"
        )
        .map((raw) => readString(raw.source_id, raw.sourceId))
        .filter(Boolean)
    ),
  ]
}

export function selectStaleSourceIds({ sources, rawRows, staleDays, now }) {
  return buildLocalSourceFreshnessReport({
    sources,
    rawRows,
    staleDays,
    now,
  })
    .filter(
      (item) => item.status === "stale" || item.status === "never_fetched"
    )
    .map((item) => item.sourceId)
}
