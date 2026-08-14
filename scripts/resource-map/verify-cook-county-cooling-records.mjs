#!/usr/bin/env node
import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"

import { createResourceMapAdminClient } from "./lib/env.mjs"

const SOURCE_SLUG = "cook-county-socrata-cooling-centers"
const SOURCE_URL =
  "https://datacatalog.cookcountyil.gov/resource/wci7-jntz.json?$limit=100"
const METHOD_VERSION = "cook-county-live-socrata-v1"
const MAX_RECORDS = 5
const MAX_SOURCE_BYTES = 1_000_000

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

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replaceAll(/[^a-z0-9]+/gu, " ")
    .trim()
}

function normalizePhone(value) {
  return String(value ?? "")
    .replaceAll(/[^0-9]/gu, "")
    .slice(-10)
}

function sourceName(record) {
  return String(record.extracted_fields?.serviceTitle ?? "").replace(
    /\s+—\s+Cooling Center$/u,
    ""
  )
}

function compareRecord(record, liveRow) {
  if (!liveRow) return ["removed_from_current_official_source"]
  const fields = record.extracted_fields ?? {}
  const comparisons = [
    ["name", sourceName(record), liveRow.name, normalizeText],
    ["address", fields.address, liveRow.streetaddress, normalizeText],
    ["hours", fields.hours?.label, liveRow.hours_of_operation, normalizeText],
    ["phone", fields.phone, liveRow.contactphone, normalizePhone],
  ]
  const issues = comparisons.flatMap(([field, staged, live, normalize]) =>
    normalize(staged) === normalize(live) ? [] : [`${field}_changed`]
  )
  const latitude = Number(fields.latitude)
  const longitude = Number(fields.longitude)
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude - Number(liveRow.latitude)) > 0.000001
  ) {
    issues.push("latitude_changed")
  }
  if (
    !Number.isFinite(longitude) ||
    Math.abs(longitude - Number(liveRow.longitude)) > 0.000001
  ) {
    issues.push("longitude_changed")
  }
  return issues
}

export function buildVerificationPlan(records, liveRows, checkedAt) {
  return records.map((record) => {
    const name = sourceName(record)
    const address = record.extracted_fields?.address
    const namedRows = liveRows.filter((row) => row.name === name)
    const liveRow =
      namedRows.find(
        (row) => normalizeText(row.streetaddress) === normalizeText(address)
      ) ?? (namedRows.length === 1 ? namedRows[0] : null)
    const issues = compareRecord(record, liveRow)
    const verification = {
      checkedAt,
      contradictions: issues,
      method: "deterministic_live_source_verification",
      methodVersion: METHOD_VERSION,
      sourceRecordName: name,
      status: issues.length === 0 ? "approved" : "needs_review",
      unsupportedClaims: [],
    }
    return { issues, liveRow, record, verification }
  })
}

function buildLedgerRow(item, checkedAt) {
  const input = {
    liveRow: item.liveRow,
    sourceRecordId: item.record.source_record_id,
    stagedFields: item.record.extracted_fields,
  }
  return {
    attempt_count: 1,
    completed_at: checkedAt,
    import_record_id: item.record.id,
    input_sha256: stableHash(input),
    issues: item.issues,
    output_sha256: stableHash(item.verification),
    pass_number: 1,
    pass_type: "verification",
    prompt_version: METHOD_VERSION,
    provider: "deterministic",
    source_urls: [SOURCE_URL],
    started_at: checkedAt,
    status: item.issues.length === 0 ? "completed" : "needs_review",
    structured_result: item.verification,
  }
}

async function requireSource(admin) {
  const { data, error } = await admin
    .from("resource_map_sources")
    .select("id,slug,trust_level")
    .eq("slug", SOURCE_SLUG)
    .maybeSingle()
  if (error) throw error
  if (!data || data.trust_level !== "official") {
    throw new Error(`${SOURCE_SLUG} is not an existing official source.`)
  }
  return data
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const ids = normalizeIds(args.get("id") ?? args.get("ids"))
  const apply = Boolean(args.get("apply"))
  const confirmedSource = String(args.get("confirm-source") ?? "").trim()
  if (ids.length === 0) throw new Error("Explicit --id values are required.")
  if (ids.length > MAX_RECORDS) {
    throw new Error(`Verification may contain at most ${MAX_RECORDS} records.`)
  }
  if (apply && confirmedSource !== SOURCE_SLUG) {
    throw new Error(
      "--confirm-source must exactly match the Cook County source."
    )
  }

  const admin = createResourceMapAdminClient()
  const source = await requireSource(admin)
  const { data: records, error } = await admin
    .from("resource_map_import_records")
    .select(
      "id,source_record_id,source_url,extracted_fields,review_status,promotion_status"
    )
    .eq("source_id", source.id)
    .eq("review_status", "needs_review")
    .eq("promotion_status", "not_promoted")
    .in("id", ids)
  if (error) throw error
  if ((records ?? []).length !== ids.length) {
    throw new Error(
      `Expected ${ids.length} unapproved, unpromoted Cook County records; found ${(records ?? []).length}.`
    )
  }

  const response = await fetch(SOURCE_URL, {
    headers: { accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok)
    throw new Error(`Official source returned HTTP ${response.status}.`)
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_SOURCE_BYTES) {
    throw new Error("Official source response exceeded the size limit.")
  }
  const sourceText = await response.text()
  if (Buffer.byteLength(sourceText, "utf8") > MAX_SOURCE_BYTES) {
    throw new Error("Official source response exceeded the size limit.")
  }
  const liveRows = JSON.parse(sourceText)
  if (!Array.isArray(liveRows))
    throw new Error("Official source returned invalid JSON.")
  const checkedAt = new Date().toISOString()
  const plan = buildVerificationPlan(records, liveRows, checkedAt)
  const approved = plan.filter((item) => item.issues.length === 0)
  const held = plan.length - approved.length
  console.log(
    `Live verification plan: ${approved.length}/${plan.length} records match the current ${liveRows.length}-row Cook County source; held ${held}.`
  )
  for (const item of plan) {
    console.log(
      `- ${item.record.id} - ${sourceName(item.record)} - ${item.issues.length === 0 ? "approved" : item.issues.join(",")}`
    )
  }
  if (!apply) {
    console.log("Dry run only; no verification ledger or review state changed.")
    return
  }

  const { error: ledgerError } = await admin
    .from("resource_map_enrichment_runs")
    .upsert(
      plan.map((item) => buildLedgerRow(item, checkedAt)),
      {
        ignoreDuplicates: true,
        onConflict:
          "import_record_id,pass_type,pass_number,input_sha256,prompt_version",
      }
    )
  if (ledgerError) throw ledgerError
  console.log(
    `Stored ${plan.length} deterministic verification results: approved ${approved.length}, held ${held}. Review and publication state remain unchanged.`
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
