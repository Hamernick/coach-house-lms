#!/usr/bin/env node
import { pathToFileURL } from "node:url"

import { analyzeResourceEnrichmentReadiness } from "./lib/enrichment-quality.mjs"
import { createResourceMapAdminClient } from "./lib/env.mjs"
import { buildCanonicalPayload } from "./lib/promotion-payloads.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

const DEFAULT_LIMIT = 5
const MAX_CANARY_SIZE = 5
const LOOKUP_CHUNK_SIZE = 100

function parseArgs(argv) {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith("--")) continue
    const key = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) args.set(key, true)
    else {
      args.set(key, next)
      index += 1
    }
  }
  return args
}

function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value ?? DEFAULT_LIMIT), 10)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  return Math.min(Math.max(parsed, 1), MAX_CANARY_SIZE)
}

function normalizeIds(value) {
  return [
    ...new Set(
      String(value ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ]
}

function chunks(values, size = LOOKUP_CHUNK_SIZE) {
  const result = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}

async function requireData(operation) {
  const response = await operation()
  if (response.error) throw response.error
  return response.data
}

function verificationResult(run) {
  return run?.structured_result?.verification ?? run?.structured_result ?? {}
}

export function hasApprovedVerificationLedger(runs) {
  return runs.some((run) => {
    const result = verificationResult(run)
    return (
      run.status === "completed" &&
      result.status === "approved" &&
      Array.isArray(run.issues) &&
      run.issues.length === 0 &&
      (result.unsupportedClaims ?? result.unsupported_claims ?? []).length ===
        0 &&
      (result.contradictions ?? []).length === 0
    )
  })
}

export function storedApprovalGaps(record, verificationRuns = []) {
  const gaps = []
  if (record.review_status !== "approved") gaps.push("not_admin_approved")
  if (!record.reviewed_by || !record.reviewed_at) {
    gaps.push("missing_identified_reviewer")
  }
  if (!record.last_verified_at) gaps.push("missing_verification_time")
  const readiness = analyzeResourceEnrichmentReadiness(record)
  gaps.push(...readiness.blockingGaps.map((gap) => gap.code))
  if (!hasApprovedVerificationLedger(verificationRuns)) {
    gaps.push("missing_approved_verification_ledger")
  }
  return [...new Set(gaps)]
}

async function loadVerificationRuns(admin, recordIds) {
  const runs = []
  for (const idChunk of chunks(recordIds)) {
    const data =
      (await requireData(() =>
        admin
          .from("resource_map_enrichment_runs")
          .select("import_record_id,status,structured_result,issues")
          .in("import_record_id", idChunk)
          .eq("pass_type", "verification")
      )) ?? []
    runs.push(...data)
  }
  return runs
}

async function loadAcceptedMatches(admin, recordIds) {
  const matches = []
  for (const idChunk of chunks(recordIds)) {
    const data =
      (await requireData(() =>
        admin
          .from("resource_map_import_record_matches")
          .select("import_record_id")
          .in("import_record_id", idChunk)
          .eq("match_status", "accepted")
      )) ?? []
    matches.push(...data)
  }
  return new Set(matches.map((match) => match.import_record_id))
}

function titleForRecord(record) {
  const fields = record.extracted_fields ?? {}
  return fields.serviceTitle ?? fields.title ?? record.source_record_id
}

function localSourceId(record) {
  return record.sourceId ?? record.source_id ?? null
}

function localRecordId(record) {
  return record.sourceRecordId ?? record.source_record_id ?? null
}

export function summarizeLocalDelta(localRecords, stagedRecords, sourceSlug) {
  const sourceRecords = localRecords.filter(
    (record) => localSourceId(record) === sourceSlug
  )
  const publishableRecords = sourceRecords.filter(
    (record) => analyzeResourceEnrichmentReadiness(record).publishable
  )
  const stagedIds = new Set(
    stagedRecords.map((record) => record.source_record_id)
  )
  const matched = publishableRecords.filter((record) =>
    stagedIds.has(localRecordId(record))
  )
  const missing = publishableRecords.filter(
    (record) => !stagedIds.has(localRecordId(record))
  )
  return {
    held: sourceRecords.length - publishableRecords.length,
    matched,
    missing,
    publishable: publishableRecords.length,
    total: sourceRecords.length,
  }
}

async function promoteRecord(admin, record) {
  const payload = buildCanonicalPayload(record, true)
  const data = await requireData(() =>
    admin.rpc("promote_resource_map_import_record", {
      p_import_record_id: record.id,
      p_payload: payload,
      p_publish: true,
    })
  )
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.promotion_result) {
    throw new Error(`Atomic promotion returned no result for ${record.id}.`)
  }
  return result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceSlug = String(args.get("source-slug") ?? "").trim()
  const input = String(args.get("input") ?? "").trim()
  const requestedIds = normalizeIds(args.get("id") ?? args.get("ids"))
  const limit = normalizeLimit(args.get("limit"))
  const apply = Boolean(args.get("apply"))
  const publish = Boolean(args.get("publish"))
  const confirmedSource = String(args.get("confirm-source") ?? "").trim()

  if (!sourceSlug) throw new Error("--source-slug is required.")
  if (apply) {
    if (!publish) throw new Error("--publish is required with --apply.")
    if (confirmedSource !== sourceSlug) {
      throw new Error("--confirm-source must exactly match --source-slug.")
    }
    if (requestedIds.length === 0) {
      throw new Error("Explicit --id values are required with --apply.")
    }
    if (requestedIds.length > MAX_CANARY_SIZE) {
      throw new Error(
        `A canary may contain at most ${MAX_CANARY_SIZE} records.`
      )
    }
    if (input) {
      throw new Error("--input is read-only and cannot be used with --apply.")
    }
  }

  const admin = createResourceMapAdminClient()
  const source = await requireData(() =>
    admin
      .from("resource_map_sources")
      .select("id,slug,trust_level")
      .eq("slug", sourceSlug)
      .maybeSingle()
  )
  if (!source) throw new Error(`Unknown resource source ${sourceSlug}.`)
  if (source.trust_level !== "official") {
    throw new Error(`${sourceSlug} is not marked as an official source.`)
  }

  let query = admin
    .from("resource_map_import_records")
    .select("*")
    .eq("source_id", source.id)
    .neq("promotion_status", "promoted")
    .order("created_at", { ascending: true })
    .limit(1000)
  if (requestedIds.length > 0) query = query.in("id", requestedIds)
  const records = (await requireData(() => query)) ?? []
  if (apply && records.length !== requestedIds.length) {
    throw new Error(
      `Expected ${requestedIds.length} requested unpromoted records; found ${records.length}.`
    )
  }

  if (input) {
    const local = summarizeLocalDelta(
      readResourceMapRecords(input),
      records,
      sourceSlug
    )
    console.log(
      `Local delta: ${local.publishable}/${local.total} ${sourceSlug} records pass the local publication contract; held ${local.held}; matched staged rows ${local.matched.length}; missing staged rows ${local.missing.length}.`
    )
    for (const record of local.matched.slice(0, limit)) {
      const staged = records.find(
        (item) => item.source_record_id === localRecordId(record)
      )
      console.log(
        `- refresh ${staged?.id} - ${record.extractedFields?.serviceTitle ?? record.extractedFields?.title ?? localRecordId(record)}`
      )
    }
  }

  const runs = await loadVerificationRuns(
    admin,
    records.map((record) => record.id)
  )
  const runsByRecord = new Map()
  for (const run of runs) {
    const values = runsByRecord.get(run.import_record_id) ?? []
    values.push(run)
    runsByRecord.set(run.import_record_id, values)
  }
  const evaluated = records.map((record) => ({
    gaps: storedApprovalGaps(record, runsByRecord.get(record.id) ?? []),
    record,
  }))
  const eligible = evaluated.filter((item) => item.gaps.length === 0)
  const selected = eligible.slice(
    0,
    requestedIds.length > 0 ? requestedIds.length : limit
  )
  const acceptedMatches = await loadAcceptedMatches(
    admin,
    selected.map((item) => item.record.id)
  )

  console.log(
    `Canary plan: ${eligible.length}/${records.length} unpromoted ${sourceSlug} records retain complete admin review and verification evidence; selected ${selected.length}; accepted duplicate matches ${acceptedMatches.size}.`
  )
  for (const item of selected) {
    const duplicate = acceptedMatches.has(item.record.id)
      ? " [accepted duplicate: promotion will block]"
      : ""
    console.log(
      `- ${item.record.id} - ${titleForRecord(item.record)}${duplicate}`
    )
  }
  const blockedCounts = {}
  for (const item of evaluated.filter((item) => item.gaps.length > 0)) {
    for (const gap of item.gaps)
      blockedCounts[gap] = (blockedCounts[gap] ?? 0) + 1
  }
  if (Object.keys(blockedCounts).length > 0) {
    console.log(
      `Held: ${Object.entries(blockedCounts)
        .map(([gap, count]) => `${gap}=${count}`)
        .join(", ")}.`
    )
  }

  if (!apply) {
    console.log(
      "Dry run only; no review, verification, visibility, or publication state changed."
    )
    return
  }
  if (selected.length !== records.length) {
    throw new Error(
      "Every explicitly requested record must pass the stored publication gates."
    )
  }

  const results = []
  for (const item of selected)
    results.push(await promoteRecord(admin, item.record))
  const counts = {}
  for (const result of results) {
    counts[result.promotion_result] = (counts[result.promotion_result] ?? 0) + 1
  }
  console.log(
    `Canary result: ${Object.entries(counts)
      .map(([status, count]) => `${status}=${count}`)
      .join(", ")}. Contacts and links retain their stored private visibility.`
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
