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

function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value ?? "100"), 10)
  if (!Number.isFinite(parsed)) return 100
  return Math.min(Math.max(parsed, 1), 500)
}

async function findOrganizationCandidate(admin, field, value) {
  if (!value) return null

  const { data, error } = await admin
    .from("resource_map_organizations")
    .select("id,name")
    .eq(field, value)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function findCandidate(admin, record) {
  const checks = [
    {
      kind: "domain",
      score: 95,
      reason: "Exact normalized domain match.",
      field: "domain",
      value: record.normalized_domain,
    },
    {
      kind: "phone",
      score: 90,
      reason: "Exact normalized phone match.",
      field: "normalized_phone",
      value: record.normalized_phone,
    },
    {
      kind: "email",
      score: 90,
      reason: "Exact normalized email match.",
      field: "normalized_email",
      value: record.normalized_email,
    },
  ]

  for (const check of checks) {
    const organization = await findOrganizationCandidate(
      admin,
      check.field,
      check.value
    )
    if (organization) {
      return { ...check, organizationId: organization.id }
    }
  }

  return null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apply = Boolean(args.get("apply"))
  const limit = normalizeLimit(args.get("limit"))
  const admin = createResourceMapAdminClient()

  const { data: records, error } = await admin
    .from("resource_map_import_records")
    .select(
      "id,normalized_domain,normalized_phone,normalized_email,duplicate_match_status"
    )
    .in("duplicate_match_status", ["unknown", "candidate"])
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) throw error

  const candidates = []
  for (const record of records ?? []) {
    const candidate = await findCandidate(admin, record)
    if (candidate) {
      candidates.push({
        import_record_id: record.id,
        organization_id: candidate.organizationId,
        match_kind: candidate.kind,
        match_status: "pending",
        match_score: candidate.score,
        match_reason: candidate.reason,
      })
    }
  }

  if (!apply) {
    console.log(
      `Dry run: found ${candidates.length} candidate matches. Re-run with --apply to write them.`
    )
    return
  }

  if (candidates.length > 0) {
    const { error: insertError } = await admin
      .from("resource_map_import_record_matches")
      .insert(candidates)
    if (insertError) throw insertError
  }

  const matchedIds = candidates.map((candidate) => candidate.import_record_id)
  if (matchedIds.length > 0) {
    const { error: updateError } = await admin
      .from("resource_map_import_records")
      .update({ duplicate_match_status: "candidate" })
      .in("id", matchedIds)
    if (updateError) throw updateError
  }

  console.log(`Wrote ${candidates.length} resource match candidates.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
