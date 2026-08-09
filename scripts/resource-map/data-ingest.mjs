#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import {
  STORE_PATHS,
  appendJsonl,
  createRunRecord,
  finishRunRecord,
  normalizeSourceId,
  parseArgs,
  readBoolean,
  readJsonl,
  readString,
  sha256,
  upsertJsonl,
  writeJsonl,
} from "./lib/data-engine/shared.mjs"
import {
  parseFetchedRaw,
  runConnectorFetch,
} from "./lib/data-engine/connectors.mjs"
import { normalizeCandidateRecord } from "./lib/data-engine/normalizer.mjs"
import { geocodeRecord } from "./lib/data-engine/geocoder.mjs"
import { dedupeRecords } from "./lib/data-engine/dedupe.mjs"
import { attachQuality } from "./lib/data-engine/quality.mjs"
import {
  normalizeStaleDays,
  selectRetryFailedSourceIds,
  selectStaleSourceIds,
} from "./lib/data-engine/source-freshness.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

function usage() {
  return [
    "Usage:",
    "  pnpm data:ingest -- --source <sourceId> [--write]",
    "  pnpm data:ingest -- --all [--type csv] [--write]",
    "  pnpm data:ingest -- --retry-failed [--write]",
    "  pnpm data:ingest -- --stale --stale-days 90 [--write]",
    "  pnpm data:ingest -- --source <sourceId> --retries 2 --timeout-ms 15000",
    "  pnpm data:ingest -- --source <sourceId> --replace-source-candidates --write",
    "  pnpm data:ingest -- --input records.jsonl --stage --dry-run",
    "",
    "Fetches open/local sources into raw payloads and canonical resource JSONL.",
  ].join("\n")
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function normalizeSourceRuntime(source) {
  const metadata = readObject(source.metadata)
  const sourceId = normalizeSourceId({
    ...source,
    sourceId: readString(source.sourceId, source.source_id, metadata.sourceId),
    source_id: readString(source.source_id, metadata.source_id),
  })

  return {
    ...source,
    sourceId,
    connectorType: readString(
      source.connectorType,
      source.connector_type,
      metadata.connectorType,
      metadata.connector_type
    ),
    rawUrl: readString(
      source.rawUrl,
      source.raw_url,
      metadata.rawUrl,
      metadata.raw_url
    ),
    apiEndpoint: readString(
      source.apiEndpoint,
      source.api_endpoint,
      metadata.apiEndpoint,
      metadata.api_endpoint
    ),
    discoveryQueries:
      source.discoveryQueries ??
      source.discovery_queries ??
      metadata.discoveryQueries ??
      metadata.discovery_queries,
    seedQueries:
      source.seedQueries ??
      source.seed_queries ??
      metadata.seedQueries ??
      metadata.seed_queries,
  }
}

function buildCandidateRecordKey(record) {
  const sourceKey = readString(
    record.sourceId,
    record.source_id,
    record.sourceName,
    record.source_name,
    record.sourceUrl,
    record.source_url
  )
  const recordKey = readString(
    record.sourceRecordId,
    record.source_record_id,
    record.id,
    record.normalizedFingerprint,
    record.normalized_fingerprint
  )

  if (sourceKey && recordKey) return `${sourceKey}:${recordKey}`
  return sha256(JSON.stringify(record))
}

function readCandidateSourceIdentifiers(record) {
  return [
    record.sourceName,
    record.source_name,
    record.sourceId,
    record.source_id,
    record.sourceUrl,
    record.source_url,
  ]
    .map((value) => readString(value))
    .filter(Boolean)
}

function buildSelectedSourceIdentifiers(sources) {
  return new Set(
    sources.flatMap((source) =>
      [
        source.name,
        source.sourceName,
        source.sourceId,
        source.source_id,
        source.slug,
        source.rawUrl,
        source.raw_url,
      ]
        .map((value) => readString(value))
        .filter(Boolean)
    )
  )
}

function buildDuplicateRawReceipt(raw) {
  return {
    runId: raw.run_id ?? null,
    rawUrl: raw.raw_url ?? null,
    fetchedAt: raw.fetched_at ?? null,
    fetchStatus: "duplicate",
    connectorVersion: raw.connector_version ?? null,
    parserVersion: raw.parser_version ?? null,
    fetchAttempts: Array.isArray(raw.raw_payload?.fetchAttempts)
      ? raw.raw_payload.fetchAttempts
      : [],
  }
}

function mergeDuplicateRawObservation(storedRaw, duplicateRaw) {
  const storedPayload = readObject(storedRaw.raw_payload)
  const receipts = Array.isArray(storedPayload.duplicateFetchReceipts)
    ? storedPayload.duplicateFetchReceipts
    : []

  return {
    ...storedRaw,
    run_id: duplicateRaw.run_id,
    fetched_at: duplicateRaw.fetched_at,
    raw_payload: {
      ...storedPayload,
      firstFetchedAt:
        storedPayload.firstFetchedAt ??
        storedRaw.fetched_at ??
        duplicateRaw.fetched_at,
      latestFetchedAt: duplicateRaw.fetched_at,
      duplicateFetchCount: (Number(storedPayload.duplicateFetchCount) || 0) + 1,
      duplicateFetchReceipts: [
        ...receipts,
        buildDuplicateRawReceipt(duplicateRaw),
      ].slice(-25),
    },
    fetch_status: "fetched",
    error_message: null,
  }
}

function replaceSelectedSourceCandidates(output, sources) {
  const sourceIdentifiers = buildSelectedSourceIdentifiers(sources)
  if (sourceIdentifiers.size === 0) return

  const retained = readJsonl(output).filter((record) =>
    readCandidateSourceIdentifiers(record).every(
      (identifier) => !sourceIdentifiers.has(identifier)
    )
  )
  writeJsonl(output, retained)
}

function loadSources(args) {
  const registryPath = args.get("registry") || STORE_PATHS.sourceRegistry
  const sources = readJsonl(registryPath).map(normalizeSourceRuntime)
  const sourceId = readString(args.get("source"), args.get("sourceId"))
  const connectorType = readString(args.get("type"), args.get("connector"))
  const rawRows = readJsonl(STORE_PATHS.rawPayloads)
  const retryFailedIds = args.has("retry-failed")
    ? new Set(selectRetryFailedSourceIds(rawRows))
    : null
  const staleIds = args.has("stale")
    ? new Set(
        selectStaleSourceIds({
          sources,
          rawRows,
          staleDays: normalizeStaleDays(args.get("stale-days"), 90),
        })
      )
    : null

  const applySetFilters = (items) =>
    items.filter(
      (source) =>
        (!retryFailedIds || retryFailedIds.has(source.sourceId)) &&
        (!staleIds || staleIds.has(source.sourceId))
    )

  if (sourceId) {
    return applySetFilters(
      sources.filter(
        (source) => source.sourceId === sourceId || source.slug === sourceId
      )
    )
  }
  if (connectorType) {
    return applySetFilters(
      sources.filter(
        (source) =>
          source.connectorType === connectorType ||
          source.connector_type === connectorType
      )
    )
  }
  if (args.has("all") || retryFailedIds || staleIds)
    return applySetFilters(sources)
  throw new Error(
    "--source, --all, --type, --retry-failed, --stale, or --input is required."
  )
}

async function ingestSources(args) {
  const sources = loadSources(args)
  if (sources.length === 0) {
    if (args.has("retry-failed") || args.has("stale")) {
      console.log("No matching sources found for the requested local job.")
      return
    }
    throw new Error("No matching sources found.")
  }

  const network = readBoolean(args, "network", false)
  const write = readBoolean(args, "write", false)
  const replaceSourceCandidates = readBoolean(
    args,
    "replace-source-candidates",
    false
  )
  const connectorOptions = {
    retries: args.get("retries"),
    timeoutMs: args.get("timeout-ms") ?? args.get("timeoutMs"),
    retryDelayMs: args.get("retry-delay-ms") ?? args.get("retryDelayMs"),
  }
  const output = args.get("output") || STORE_PATHS.candidates
  const knownRaw = new Map(
    readJsonl(STORE_PATHS.rawPayloads).map((raw) => [
      `${raw.source_id}:${raw.checksum}`,
      raw,
    ])
  )
  const run = createRunRecord({
    kind: args.has("retry-failed")
      ? "failed_retry"
      : args.has("stale")
        ? "freshness_refresh"
        : "source_ingestion",
    connectorType: readString(args.get("type"), args.get("connector")),
  })
  let rawRecords = []
  const rawRowsToStore = []
  let parsedRecords = []
  const parseErrors = []

  for (const source of sources) {
    const raw = await runConnectorFetch(source, run.run_id, connectorOptions)
    const rawKey = `${raw.source_id}:${raw.checksum}`
    const storedRaw = knownRaw.get(rawKey)
    let rawForParsing = raw
    if (storedRaw && raw.fetch_status === "fetched") {
      rawRecords.push({ ...raw, fetch_status: "duplicate" })
      const updatedRaw = mergeDuplicateRawObservation(storedRaw, raw)
      rawRowsToStore.push(updatedRaw)
      knownRaw.set(rawKey, updatedRaw)
      rawForParsing = storedRaw
    } else {
      rawRecords.push(raw)
      rawRowsToStore.push(raw)
      knownRaw.set(rawKey, raw)
    }

    const parsed = parseFetchedRaw(rawForParsing, source)
    parseErrors.push(
      ...parsed.warnings.map((warning) => ({
        rawUrl: raw.raw_url,
        sourceId: source.sourceId,
        message: warning,
      }))
    )
    parsedRecords.push(...parsed.records.map((record) => ({ record, source })))
  }

  const normalized = []
  for (const item of parsedRecords) {
    const normalizedRecord = normalizeCandidateRecord(item.record)
    const geocoded = await geocodeRecord(normalizedRecord, { network })
    normalized.push({ record: geocoded, source: item.source })
  }
  const dedupe = dedupeRecords(normalized.map((item) => item.record))
  const duplicateByRecord = new Map(
    dedupe.duplicates.map((duplicate) => [duplicate.sourceRecordId, duplicate])
  )
  const finalRecords = dedupe.preservedRecords.map((record) => {
    const source =
      normalized.find(
        (item) => item.record.sourceRecordId === record.sourceRecordId
      )?.source ?? {}
    return attachQuality(
      record,
      source,
      duplicateByRecord.get(record.sourceRecordId)
    )
  })
  const finished = finishRunRecord(run, {
    source_id: sources.length === 1 ? sources[0].sourceId : null,
    fetched_count: rawRecords.filter((raw) => raw.fetch_status === "fetched")
      .length,
    parsed_count: parsedRecords.length,
    normalized_count: normalized.length,
    classified_count: normalized.length,
    deduped_count: dedupe.duplicates.length,
    flagged_count: finalRecords.filter((record) => record.qualityFlags?.length)
      .length,
    errors: [
      ...rawRecords
        .filter((raw) => raw.fetch_status === "failed")
        .map((raw) => ({ rawUrl: raw.raw_url, message: raw.error_message })),
      ...parseErrors,
    ],
  })

  if (!write) {
    console.log(
      `Dry run: selected ${sources.length} sources, fetched ${finished.fetched_count}, parsed ${finished.parsed_count}, output ${finalRecords.length}, duplicate candidates ${dedupe.duplicates.length}.`
    )
    return
  }

  upsertJsonl(
    STORE_PATHS.rawPayloads,
    rawRowsToStore,
    (raw) => `${raw.source_id}:${raw.checksum}`
  )
  appendJsonl(STORE_PATHS.runs, [finished])
  if (replaceSourceCandidates) replaceSelectedSourceCandidates(output, sources)
  upsertJsonl(output, finalRecords, buildCandidateRecordKey)
  const storedCandidateCount = readJsonl(output).length
  console.log(
    `Wrote ${finalRecords.length} candidate records to ${output} (${storedCandidateCount} total); raw payloads and run ${finished.run_id} saved.`
  )
}

function stageInput(args) {
  const input = args.get("input")
  if (!input) throw new Error("--input is required for --stage.")
  const apply = readBoolean(args, "apply", false)
  const dryRun = !apply && readBoolean(args, "dry-run", true)
  const command = [
    "resource-map:import",
    "--",
    "--input",
    input,
    "--source-slug",
    args.get("source-slug") || "local-data-engine",
    "--source-name",
    args.get("source-name") || "Local data engine",
  ]
  if (dryRun) command.push("--dry-run")

  const output = execFileSync("pnpm", command, {
    cwd: process.cwd(),
    encoding: "utf8",
  })
  process.stdout.write(output)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.has("help")) {
    console.log(usage())
    return
  }
  if (args.has("stage")) {
    stageInput(args)
    return
  }
  if (args.has("input")) {
    const rows = readResourceMapRecords(args.get("input"))
    console.log(`Dry run: parsed ${rows.length} local candidate records.`)
    return
  }
  await ingestSources(args)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
