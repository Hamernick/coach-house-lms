#!/usr/bin/env node
import { createResourceMapAdminClient } from "./lib/env.mjs"

function parseArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith("--")) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) {
      args.set(key, true)
    } else {
      args.set(key, next)
      i += 1
    }
  }
  return args
}

function normalizeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function newestDate(...values) {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
  if (timestamps.length === 0) return null
  return new Date(Math.max(...timestamps)).toISOString()
}

function ageDays(value, now = new Date()) {
  if (!value) return null
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.floor((now.getTime() - timestamp) / 86_400_000)
}

function latestBySource(rows, fields) {
  const latest = new Map()

  for (const row of rows ?? []) {
    const observedAt = newestDate(...fields.map((field) => row[field]))
    if (!observedAt) continue

    const existing = latest.get(row.source_id)
    if (!existing || observedAt > existing.observedAt) {
      latest.set(row.source_id, { row, observedAt })
    }
  }

  return latest
}

function buildFreshnessReport({
  sources,
  latestBatchBySource,
  latestRecordBySource,
  staleDays,
}) {
  const now = new Date()

  return sources.map((source) => {
    const latestBatch = latestBatchBySource.get(source.id)
    const latestRecord = latestRecordBySource.get(source.id)
    const latestObservedAt = newestDate(
      latestBatch?.observedAt,
      latestRecord?.observedAt
    )
    const daysOld = ageDays(latestObservedAt, now)
    const status =
      daysOld === null
        ? "no_imports"
        : daysOld > staleDays
          ? "stale"
          : "current"

    return {
      id: source.id,
      slug: source.slug,
      name: source.name,
      sourceType: source.source_type,
      trustLevel: source.trust_level,
      refreshCadence: source.refresh_cadence,
      homepageUrl: source.homepage_url,
      latestBatchAt: latestBatch?.observedAt ?? null,
      latestRecordAt: latestRecord?.observedAt ?? null,
      latestObservedAt,
      daysOld,
      status,
    }
  })
}

function printReport(report) {
  for (const item of report) {
    const age = item.daysOld === null ? "never" : `${item.daysOld}d`
    console.log(
      `${item.status.padEnd(10)} ${age.padStart(7)} ${item.slug} - ${item.name}`
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const staleDays = normalizeInteger(args.get("stale-days"), 90, 1, 3650)
  const limit = normalizeInteger(args.get("limit"), 200, 1, 1000)
  const onlyStale = Boolean(args.get("only-stale"))
  const json = Boolean(args.get("json"))
  const admin = createResourceMapAdminClient()

  const { data: sources, error: sourceError } = await admin
    .from("resource_map_sources")
    .select(
      "id,slug,name,source_type,trust_level,refresh_cadence,homepage_url,updated_at,created_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (sourceError) throw sourceError

  const sourceIds = (sources ?? []).map((source) => source.id)
  if (sourceIds.length === 0) {
    console.log(json ? "[]" : "No resource map sources found.")
    return
  }

  const [batches, records] = await Promise.all([
    admin
      .from("resource_map_import_batches")
      .select("source_id,status,completed_at,started_at,created_at")
      .in("source_id", sourceIds)
      .order("created_at", { ascending: false })
      .limit(limit * 5),
    admin
      .from("resource_map_import_records")
      .select(
        "source_id,last_seen_at,last_scraped_at,last_verified_at,updated_at"
      )
      .in("source_id", sourceIds)
      .order("updated_at", { ascending: false })
      .limit(limit * 10),
  ])

  if (batches.error) throw batches.error
  if (records.error) throw records.error

  const report = buildFreshnessReport({
    sources: sources ?? [],
    latestBatchBySource: latestBySource(batches.data, [
      "completed_at",
      "started_at",
      "created_at",
    ]),
    latestRecordBySource: latestBySource(records.data, [
      "last_verified_at",
      "last_seen_at",
      "last_scraped_at",
      "updated_at",
    ]),
    staleDays,
  }).filter((item) => !onlyStale || item.status !== "current")

  if (json) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  printReport(report)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
