#!/usr/bin/env node
import { createResourceMapAdminClient } from "./lib/env.mjs"
import { analyzeResourceEnrichmentReadiness } from "./lib/enrichment-quality.mjs"
import { buildCanonicalPayload } from "./lib/promotion-payloads.mjs"

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

function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value ?? "25"), 10)
  if (!Number.isFinite(parsed)) return 25
  return Math.min(Math.max(parsed, 1), 100)
}

function assertRecordsReadyForPublication(records) {
  const blocked = records
    .map((record) => analyzeResourceEnrichmentReadiness(record))
    .filter((result) => !result.publishable)

  if (blocked.length === 0) return

  const samples = blocked
    .slice(0, 5)
    .map(
      (result) =>
        `${result.recordId ?? result.title ?? "unknown"} (${result.blockingGaps
          .map((gap) => gap.code)
          .join(", ")})`
    )
    .join("; ")
  throw new Error(
    `${blocked.length} approved import records do not meet the source-verified promotion contract. Run resource-map:audit-enrichment and complete draft, verification, and admin review before promotion. ${samples}`
  )
}

async function fetchPromotionRecords(admin, limit) {
  const { data, error } = await admin
    .from("resource_map_import_records")
    .select("*")
    .eq("review_status", "approved")
    .in("promotion_status", ["ready", "not_promoted"])
    .order("updated_at", { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

async function fetchAcceptedDuplicateMatch(admin, importRecordId) {
  const { data, error } = await admin
    .from("resource_map_import_record_matches")
    .select(
      "id,import_record_id,organization_id,service_id,match_kind,match_status,match_score,match_reason"
    )
    .eq("import_record_id", importRecordId)
    .eq("match_status", "accepted")
    .order("match_score", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function promoteRecord(admin, record, publish) {
  const payload = buildCanonicalPayload(record, publish)
  const { data, error } = await admin.rpc(
    "promote_resource_map_import_record",
    {
      p_import_record_id: record.id,
      p_payload: payload,
      p_publish: publish,
    }
  )

  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.promotion_result) {
    throw new Error(
      `Atomic promotion returned no result for import record ${record.id}.`
    )
  }
  return result.promotion_result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const publish = Boolean(args.get("publish"))
  const apply = Boolean(args.get("apply"))
  const limit = normalizeLimit(args.get("limit"))
  const admin = createResourceMapAdminClient()
  const records = await fetchPromotionRecords(admin, limit)
  assertRecordsReadyForPublication(records)

  if (!apply) {
    records.forEach((record) => buildCanonicalPayload(record, publish))
    const acceptedDuplicateMatches = (
      await Promise.all(
        records.map((record) => fetchAcceptedDuplicateMatch(admin, record.id))
      )
    ).filter(Boolean)
    console.log(
      `Dry run: ${records.length} approved imports are eligible; ${acceptedDuplicateMatches.length} have accepted duplicate matches and will be blocked instead of creating duplicates. Re-run with --apply to promote as ${publish ? "published" : "draft"} canonical records. Add --publish only after admin approval to make promoted resources public. Contacts and links remain private until explicit visibility approval.`
    )
    return
  }

  let promoted = 0
  let blocked = 0
  let alreadyPromoted = 0
  for (const record of records) {
    const result = await promoteRecord(admin, record, publish)
    if (result === "promoted") promoted += 1
    if (result === "blocked") blocked += 1
    if (result === "already_promoted") alreadyPromoted += 1
  }

  console.log(
    `Promoted ${promoted} approved resource import records atomically; blocked ${blocked} accepted duplicate matches; ${alreadyPromoted} retries were already promoted.`
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
