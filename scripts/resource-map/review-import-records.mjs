#!/usr/bin/env node
import { createResourceMapAdminClient } from "./lib/env.mjs"

const REVIEW_STATUSES = new Set([
  "needs_review",
  "approved",
  "rejected",
  "stale",
])

const USAGE = [
  "Usage:",
  "  pnpm resource-map:review-imports -- --limit 25",
  '  pnpm resource-map:review-imports -- --id <uuid>[,<uuid>] --status approved --reason "Reviewed source evidence" --apply',
].join("\n")

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

function normalizeIds(args) {
  const raw = String(args.get("id") ?? args.get("ids") ?? "")
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

function normalizeStatus(value) {
  const status = String(value ?? "").trim()
  if (!REVIEW_STATUSES.has(status)) {
    throw new Error(
      "Choose a review status: needs_review, approved, rejected, or stale."
    )
  }
  return status
}

function normalizeReason(value) {
  const reason = String(value ?? "").trim()
  return reason ? reason.slice(0, 1000) : null
}

function promotionStatusForReview(status) {
  if (status === "approved") return "ready"
  if (status === "rejected" || status === "stale") return "blocked"
  return "not_promoted"
}

function reviewActionForStatus(status) {
  if (status === "approved") return "approve"
  if (status === "rejected") return "reject"
  if (status === "stale") return "mark_stale"
  return "edit"
}

function titleForRecord(record) {
  const fields = record.extracted_fields ?? {}
  return (
    fields.title ??
    fields.serviceTitle ??
    fields.name ??
    record.normalized_name ??
    record.source_record_id ??
    record.id
  )
}

function printRecords(records) {
  for (const record of records) {
    console.log(
      [
        record.review_status.padEnd(12),
        record.promotion_status.padEnd(12),
        record.id,
        "-",
        titleForRecord(record),
      ].join(" ")
    )
  }
}

async function findSourceId(admin, slug) {
  if (!slug) return null

  const { data, error } = await admin
    .from("resource_map_sources")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`No resource_map_sources row found for ${slug}.`)
  return data.id
}

async function fetchReviewRecords(admin, { ids, sourceId, status, limit }) {
  let query = admin
    .from("resource_map_import_records")
    .select(
      "id,source_id,source_record_id,source_url,extracted_fields,normalized_name,review_status,promotion_status,duplicate_match_status,confidence_score,trust_score,freshness_score,quality_flags,reason_codes,needs_review,rejection_reason,stale_reason,reviewed_by,reviewed_at,updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (ids.length > 0) query = query.in("id", ids)
  if (sourceId) query = query.eq("source_id", sourceId)
  if (status) query = query.eq("review_status", status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

async function applyReview({ admin, ids, status, reason, actorId }) {
  const beforeRecords = await fetchReviewRecords(admin, {
    ids,
    sourceId: null,
    status: null,
    limit: ids.length,
  })
  if (beforeRecords.length !== ids.length) {
    throw new Error(
      `Expected ${ids.length} import records, found ${beforeRecords.length}.`
    )
  }

  const now = new Date().toISOString()
  const { data: afterRecords, error } = await admin
    .from("resource_map_import_records")
    .update({
      review_status: status,
      promotion_status: promotionStatusForReview(status),
      rejection_reason: status === "rejected" ? reason : null,
      stale_reason: status === "stale" ? reason : null,
      reviewed_by: actorId,
      reviewed_at: now,
    })
    .in("id", ids)
    .select("*")

  if (error) throw error

  const beforeById = new Map(beforeRecords.map((record) => [record.id, record]))
  const events = (afterRecords ?? []).map((after) => ({
    action: reviewActionForStatus(status),
    import_record_id: after.id,
    actor_id: actorId,
    reason,
    before_state: beforeById.get(after.id) ?? {},
    after_state: after,
  }))

  if (events.length > 0) {
    const { error: eventError } = await admin
      .from("resource_map_curation_events")
      .insert(events)
    if (eventError) throw eventError
  }

  return afterRecords ?? []
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.get("help")) {
    console.log(USAGE)
    return
  }

  const apply = Boolean(args.get("apply"))
  const ids = normalizeIds(args)
  const reason = normalizeReason(args.get("reason"))
  const actorId = String(args.get("actor-id") ?? "").trim() || null
  const limit = normalizeLimit(args.get("limit"))
  const status = args.get("status")
    ? normalizeStatus(args.get("status"))
    : String(args.get("review-status") ?? "").trim() || null

  if (apply) {
    if (ids.length === 0) throw new Error("--id is required with --apply.")
    if (!status) throw new Error("--status is required with --apply.")
    if (!reason) throw new Error("--reason is required with --apply.")
  }

  const admin = createResourceMapAdminClient()
  const sourceId = await findSourceId(admin, args.get("source-slug"))

  if (!apply) {
    const records = await fetchReviewRecords(admin, {
      ids,
      sourceId,
      status: status && REVIEW_STATUSES.has(status) ? status : null,
      limit,
    })
    console.log(
      `Dry run: ${records.length} staged import records matched. Re-run with --id <uuid> --status <status> --reason <reason> --apply to write review decisions.`
    )
    printRecords(records)
    return
  }

  const updated = await applyReview({ admin, ids, status, reason, actorId })
  console.log(`Reviewed ${updated.length} staged import records as ${status}.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
