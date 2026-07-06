#!/usr/bin/env node
import { createResourceMapAdminClient } from "./lib/env.mjs"
import {
  buildCanonicalPayload,
  buildPromotedFieldEvidenceRows,
  insertPromotionChildren,
} from "./lib/promotion-payloads.mjs"

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

async function insertCanonicalResource(admin, payload) {
  const { data: organization, error: orgError } = await admin
    .from("resource_map_organizations")
    .insert(payload.organization)
    .select("id")
    .maybeSingle()
  if (orgError) throw orgError
  if (!organization) throw new Error("Organization promotion insert failed.")

  const { data: service, error: serviceError } = await admin
    .from("resource_map_services")
    .insert({ ...payload.service, organization_id: organization.id })
    .select("id")
    .maybeSingle()
  if (serviceError) throw serviceError
  if (!service) throw new Error("Service promotion insert failed.")

  const children = await insertPromotionChildren(
    admin,
    payload,
    organization,
    service
  )
  return { organization, service, children }
}

async function fetchStagedFieldEvidence(admin, importRecordId) {
  const { data, error } = await admin
    .from("resource_map_field_evidence")
    .select(
      "id,import_record_id,source_id,field_path,field_value,confidence_score,source_url,evidence_type,derived_from,transformation,evidence_metadata,observed_at"
    )
    .eq("import_record_id", importRecordId)
    .is("organization_id", null)
    .is("service_id", null)
    .is("location_id", null)
    .is("contact_id", null)
    .is("link_id", null)

  if (error) throw error
  return data ?? []
}

async function insertPromotedFieldEvidence(admin, record, canonical) {
  const stagedEvidence = await fetchStagedFieldEvidence(admin, record.id)
  const evidencePayload = buildPromotedFieldEvidenceRows(
    stagedEvidence,
    canonical,
    canonical.children
  )

  if (evidencePayload.length === 0) {
    return { inserted: 0, available: stagedEvidence.length }
  }

  const { error } = await admin
    .from("resource_map_field_evidence")
    .insert(evidencePayload)
  if (error) throw error

  return { inserted: evidencePayload.length, available: stagedEvidence.length }
}

async function markPromoted(admin, record, canonical) {
  const { error } = await admin
    .from("resource_map_import_records")
    .update({
      promotion_status: "promoted",
      promoted_organization_id: canonical.organization.id,
      promoted_service_id: canonical.service.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", record.id)
  if (error) throw error
}

async function blockDuplicatePromotion(admin, record, acceptedMatch) {
  const { error: updateError } = await admin
    .from("resource_map_import_records")
    .update({ promotion_status: "blocked" })
    .eq("id", record.id)
  if (updateError) throw updateError

  const { error: eventError } = await admin
    .from("resource_map_curation_events")
    .insert({
      action: "merge_duplicate",
      organization_id: acceptedMatch.organization_id,
      service_id: acceptedMatch.service_id,
      import_record_id: record.id,
      reason:
        "Blocked promotion because an accepted duplicate match exists. Merge manually before creating a new canonical resource.",
      before_state: record,
      after_state: { blocked: true, acceptedMatch },
    })
  if (eventError) throw eventError
}

async function insertPromotionEvent(
  admin,
  record,
  canonical,
  payload,
  publish,
  evidenceSummary
) {
  const { error } = await admin.from("resource_map_curation_events").insert({
    action: "promote",
    organization_id: canonical.organization.id,
    service_id: canonical.service.id,
    import_record_id: record.id,
    reason: publish
      ? "Promoted approved import as published canonical resource."
      : "Promoted approved import as draft canonical resource.",
    before_state: record,
    after_state: {
      organization: canonical.organization,
      service: canonical.service,
      location: payload.location
        ? { created: true, isPrimary: payload.location.is_primary }
        : null,
      categoryKeys: payload.categoryKeys,
      privateContactCount: payload.contacts.length,
      privateLinkCount: payload.links.length,
      fieldEvidencePromotedCount: evidenceSummary.inserted,
      stagedFieldEvidenceCount: evidenceSummary.available,
      visibility: payload.service.visibility,
    },
  })
  if (error) throw error
}

async function promoteRecord(admin, record, publish) {
  const acceptedMatch = await fetchAcceptedDuplicateMatch(admin, record.id)
  if (acceptedMatch) {
    await blockDuplicatePromotion(admin, record, acceptedMatch)
    return "blocked"
  }

  const payload = buildCanonicalPayload(record, publish)
  const canonical = await insertCanonicalResource(admin, payload)
  const evidenceSummary = await insertPromotedFieldEvidence(
    admin,
    record,
    canonical
  )
  await markPromoted(admin, record, canonical)
  await insertPromotionEvent(
    admin,
    record,
    canonical,
    payload,
    publish,
    evidenceSummary
  )
  return "promoted"
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const publish = Boolean(args.get("publish"))
  const apply = Boolean(args.get("apply"))
  const limit = normalizeLimit(args.get("limit"))
  const admin = createResourceMapAdminClient()
  const records = await fetchPromotionRecords(admin, limit)

  if (!apply) {
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
  for (const record of records) {
    const result = await promoteRecord(admin, record, publish)
    if (result === "promoted") promoted += 1
    if (result === "blocked") blocked += 1
  }

  console.log(
    `Promoted ${promoted} approved resource import records; blocked ${blocked} accepted duplicate matches.`
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
