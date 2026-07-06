import { createHash, randomUUID } from "node:crypto"

const FALLBACK_VERSION = "2026-06-28-staging-import"
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const CHECKSUM_PATTERN = /^[a-f0-9]{64}$/u
const FETCH_STATUSES = new Set([
  "pending",
  "fetched",
  "duplicate",
  "not_modified",
  "failed",
  "skipped",
])

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function stableJson(value) {
  if (value === null || value === undefined) return "null"
  if (typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
    .join(",")}}`
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

function asJsonObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value
  return { value: value ?? null }
}

function normalizeFetchStatus(value) {
  const status = readString(value)
  return status && FETCH_STATUSES.has(status) ? status : "fetched"
}

function normalizeChecksum(value, fallbackBasis) {
  const checksum = readString(value)?.toLowerCase()
  return checksum && CHECKSUM_PATTERN.test(checksum)
    ? checksum
    : sha256(fallbackBasis)
}

function pickRawCandidate(record) {
  const explicit = record.rawIngestion ?? record.raw_ingestion
  if (explicit && typeof explicit === "object" && !Array.isArray(explicit)) {
    return explicit
  }

  const snapshot = record.rawSnapshot ?? record.raw_snapshot
  if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
    return snapshot
  }

  return {
    rawPayload: snapshot ?? record,
    rawText: typeof snapshot === "string" ? snapshot : null,
    rawUrl: record.sourceUrl ?? record.source_url ?? null,
  }
}

export function readRawRunId(record) {
  const raw = pickRawCandidate(record)
  return readString(record.runId, record.run_id, raw.run_id, raw.runId)
}

export function resolveImportRunId(rows, explicitRunId) {
  const requested = readString(explicitRunId)
  if (requested) {
    if (!UUID_PATTERN.test(requested)) {
      throw new Error("--run-id must be a UUID when provided.")
    }
    return requested
  }

  const rawRunId = rows
    .map(readRawRunId)
    .find((value) => UUID_PATTERN.test(value))
  return rawRunId ?? randomUUID()
}

export function buildRawIngestionRecord(
  record,
  { sourceId, runDbId = null, batchId = null, input = null, now = null }
) {
  const observedAt = now ?? new Date().toISOString()
  const raw = pickRawCandidate(record)
  const rawUrl = readString(
    raw.raw_url,
    raw.rawUrl,
    raw.url,
    record.sourceUrl,
    record.source_url,
    input
  )

  if (!rawUrl) {
    throw new Error("Raw ingestion records require rawUrl or sourceUrl.")
  }

  const rawText =
    typeof raw.raw_text === "string"
      ? raw.raw_text
      : typeof raw.rawText === "string"
        ? raw.rawText
        : typeof raw.text === "string"
          ? raw.text
          : null
  const rawPayload = asJsonObject(
    raw.raw_payload ??
      raw.rawPayload ??
      raw.payload ??
      raw.rawPayloadJson ??
      raw
  )
  const checksumBasis = rawText ?? stableJson(rawPayload)
  const checksum = normalizeChecksum(raw.checksum, checksumBasis)

  return {
    source_id: sourceId,
    run_id: runDbId,
    import_batch_id: batchId,
    raw_url: rawUrl,
    raw_payload: rawPayload,
    raw_text: rawText,
    content_type: readString(raw.content_type, raw.contentType),
    checksum,
    fetched_at: readString(raw.fetched_at, raw.fetchedAt) ?? observedAt,
    parser_version:
      readString(raw.parser_version, raw.parserVersion) ?? FALLBACK_VERSION,
    connector_version:
      readString(raw.connector_version, raw.connectorVersion) ??
      FALLBACK_VERSION,
    fetch_status: normalizeFetchStatus(raw.fetch_status ?? raw.fetchStatus),
    error_message: readString(raw.error_message, raw.errorMessage),
  }
}

export function buildRawIngestionPlan(rows, options) {
  const rawRowsByKey = new Map()
  const keyByIndex = []

  rows.forEach((record) => {
    const rawRow = buildRawIngestionRecord(record, options)
    const key = `${rawRow.source_id}:${rawRow.checksum}`
    keyByIndex.push(key)
    if (!rawRowsByKey.has(key)) rawRowsByKey.set(key, rawRow)
  })

  return {
    rawRows: [...rawRowsByKey.values()],
    keyByIndex,
  }
}
