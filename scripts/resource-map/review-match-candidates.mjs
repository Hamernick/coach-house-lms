#!/usr/bin/env node
import { createResourceMapAdminClient } from "./lib/env.mjs"

const MATCH_STATUSES = new Set(["accepted", "rejected", "superseded"])

const USAGE = [
  "Usage:",
  "  pnpm resource-map:review-matches -- --limit 25",
  '  pnpm resource-map:review-matches -- --id <uuid>[,<uuid>] --status accepted --reason "Same provider" --apply',
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
  if (!MATCH_STATUSES.has(status)) {
    throw new Error("Choose a match status: accepted, rejected, or superseded.")
  }
  return status
}

function normalizeReason(value) {
  const reason = String(value ?? "").trim()
  return reason ? reason.slice(0, 1000) : null
}

function curationActionForStatus(status) {
  if (status === "accepted") return "merge_duplicate"
  if (status === "rejected") return "reject"
  return "edit"
}

function printMatches(matches) {
  for (const match of matches) {
    const target = match.organization_id ?? match.service_id ?? "missing-target"
    console.log(
      [
        match.match_status.padEnd(10),
        String(match.match_score ?? "-").padStart(5),
        match.id,
        "import:",
        match.import_record_id,
        "target:",
        target,
        "-",
        match.match_kind,
      ].join(" ")
    )
  }
}

async function fetchMatches(admin, { ids, status, limit }) {
  let query = admin
    .from("resource_map_import_record_matches")
    .select(
      "id,import_record_id,organization_id,service_id,match_kind,match_status,match_score,match_reason,reviewed_by,reviewed_at,updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (ids.length > 0) query = query.in("id", ids)
  if (status) query = query.eq("match_status", status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

async function applyReview({ admin, ids, status, reason, actorId }) {
  const beforeMatches = await fetchMatches(admin, {
    ids,
    status: null,
    limit: ids.length,
  })
  if (beforeMatches.length !== ids.length) {
    throw new Error(
      `Expected ${ids.length} match records, found ${beforeMatches.length}.`
    )
  }

  const now = new Date().toISOString()
  const { data: afterMatches, error } = await admin
    .from("resource_map_import_record_matches")
    .update({
      match_status: status,
      match_reason: reason,
      reviewed_by: actorId,
      reviewed_at: now,
    })
    .in("id", ids)
    .select("*")

  if (error) throw error

  const beforeById = new Map(beforeMatches.map((match) => [match.id, match]))
  const events = (afterMatches ?? []).map((after) => ({
    action: curationActionForStatus(status),
    organization_id: after.organization_id,
    service_id: after.service_id,
    import_record_id: after.import_record_id,
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

  return afterMatches ?? []
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
    : String(args.get("match-status") ?? "pending").trim() || null

  if (apply) {
    if (ids.length === 0) throw new Error("--id is required with --apply.")
    if (!status || !MATCH_STATUSES.has(status)) {
      throw new Error("--status is required with --apply.")
    }
    if (!reason) throw new Error("--reason is required with --apply.")
  }

  const admin = createResourceMapAdminClient()

  if (!apply) {
    const matches = await fetchMatches(admin, { ids, status, limit })
    console.log(
      `Dry run: ${matches.length} match candidates matched. Re-run with --id <uuid> --status <status> --reason <reason> --apply to write review decisions.`
    )
    printMatches(matches)
    return
  }

  const updated = await applyReview({ admin, ids, status, reason, actorId })
  console.log(`Reviewed ${updated.length} match candidates as ${status}.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
