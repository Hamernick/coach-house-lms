#!/usr/bin/env node
import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import { createResourceMapAdminClient } from "./lib/env.mjs"
import { LIBRARY_ENRICHMENT_METHOD_VERSION } from "./lib/library-enrichment.mjs"
import { buildCanonicalPayload } from "./lib/promotion-payloads.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

const SOURCE_SLUG = "chicago-socrata-public-libraries"

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
  const parsed = Number.parseInt(String(value ?? "5"), 10)
  if (!Number.isFinite(parsed)) return 5
  return Math.min(Math.max(parsed, 1), 100)
}

function recordId(record) {
  return String(
    record.sourceRecordId ?? record.source_record_id ?? record.id ?? ""
  )
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function domainForUrl(value) {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return null
  }
}

function backupPath() {
  const timestamp = new Date().toISOString().replaceAll(/[:.]/gu, "-")
  return `data/resource-map/.engine/backups/library-public-sync-${timestamp}.json`
}

async function requireSource(admin) {
  const { data, error } = await admin
    .from("resource_map_sources")
    .select("id,slug,name")
    .eq("slug", SOURCE_SLUG)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Missing resource-map source ${SOURCE_SLUG}.`)
  return data
}

async function loadPromotedImports(admin, sourceId, ids) {
  const { data, error } = await admin
    .from("resource_map_import_records")
    .select("*")
    .eq("source_id", sourceId)
    .eq("promotion_status", "promoted")
    .in("source_record_id", ids)
  if (error) throw error
  return data ?? []
}

async function loadBackup(admin, plans) {
  const importIds = plans.map(({ importRecord }) => importRecord.id)
  const organizationIds = plans.map(
    ({ importRecord }) => importRecord.promoted_organization_id
  )
  const serviceIds = plans.map(
    ({ importRecord }) => importRecord.promoted_service_id
  )
  const queries = await Promise.all([
    admin.from("resource_map_import_records").select("*").in("id", importIds),
    admin
      .from("resource_map_organizations")
      .select("*")
      .in("id", organizationIds),
    admin.from("resource_map_services").select("*").in("id", serviceIds),
    admin
      .from("resource_map_locations")
      .select("*")
      .in("service_id", serviceIds),
    admin
      .from("resource_map_contacts")
      .select("*")
      .in("organization_id", organizationIds),
    admin
      .from("resource_map_links")
      .select("*")
      .in("organization_id", organizationIds),
    admin
      .from("resource_map_enrichment_runs")
      .select("*")
      .in("import_record_id", importIds),
  ])
  for (const query of queries) if (query.error) throw query.error
  return {
    contacts: queries[4].data ?? [],
    enrichmentRuns: queries[6].data ?? [],
    imports: queries[0].data ?? [],
    links: queries[5].data ?? [],
    locations: queries[3].data ?? [],
    organizations: queries[1].data ?? [],
    services: queries[2].data ?? [],
  }
}

function buildLedgerRows(importRecord, enrichedRecord) {
  const fields = enrichedRecord.extractedFields
  const enrichment = fields.enrichment
  const verifiedAt = enrichedRecord.lastVerifiedAt
  const inputHash = stableHash({
    contentHashes: enrichedRecord.fieldEvidence
      .map((item) => item.evidenceMetadata?.contentSha256)
      .filter(Boolean),
    sourceRecordId: importRecord.source_record_id,
    sourceUrls: enrichment.evidenceUrls,
  })
  return [
    {
      attempt_count: 1,
      completed_at: verifiedAt,
      import_record_id: importRecord.id,
      input_sha256: inputHash,
      issues: [],
      output_sha256: stableHash(enrichment.draft),
      pass_number: 1,
      pass_type: "draft",
      prompt_version: LIBRARY_ENRICHMENT_METHOD_VERSION,
      provider: "deterministic",
      source_urls: enrichment.evidenceUrls,
      started_at: verifiedAt,
      status: "completed",
      structured_result: enrichment.draft,
    },
    {
      attempt_count: 1,
      completed_at: verifiedAt,
      import_record_id: importRecord.id,
      input_sha256: inputHash,
      issues: [],
      output_sha256: stableHash(enrichment.verification),
      pass_number: 1,
      pass_type: "verification",
      prompt_version: LIBRARY_ENRICHMENT_METHOD_VERSION,
      provider: "deterministic",
      source_urls: enrichment.evidenceUrls,
      started_at: verifiedAt,
      status: "completed",
      structured_result: enrichment.verification,
    },
  ]
}

function buildEvidenceRows(importRecord, enrichedRecord) {
  return enrichedRecord.fieldEvidence
    .filter(
      (item) =>
        item.transformation === "source_specific_deterministic_enrichment"
    )
    .map((item) => ({
      confidence_score: item.confidenceScore,
      derived_from: item.derivedFrom,
      evidence_metadata: item.evidenceMetadata,
      evidence_type: item.evidenceType,
      field_path: item.fieldPath,
      field_value: item.fieldValue,
      import_record_id: importRecord.id,
      observed_at: item.observedAt,
      source_id: importRecord.source_id,
      source_url: item.sourceUrl,
      transformation: item.transformation,
    }))
}

async function updateContactVisibility(admin, organizationId, contacts) {
  for (const contact of contacts) {
    const { error } = await admin
      .from("resource_map_contacts")
      .update({
        is_public: true,
        label: contact.label,
        url: contact.url,
        value: contact.value,
      })
      .eq("organization_id", organizationId)
      .eq("contact_type", contact.contact_type)
    if (error) throw error
  }
}

async function updateLinkVisibility(admin, organizationId, links, verifiedAt) {
  for (const link of links) {
    const isWebsite = link.link_type === "website"
    const { error } = await admin
      .from("resource_map_links")
      .update({
        domain: domainForUrl(link.url),
        is_public: isWebsite,
        label: isWebsite ? "Official branch website" : link.label,
        last_checked_at: verifiedAt,
        url: link.url,
      })
      .eq("organization_id", organizationId)
      .eq("link_type", link.link_type)
    if (error) throw error
  }
}

async function syncPlan(admin, plan) {
  const { importRecord, enrichedRecord } = plan
  const verifiedAt = enrichedRecord.lastVerifiedAt
  if (!verifiedAt)
    throw new Error(`${recordId(enrichedRecord)} is not verified.`)
  const canonical = buildCanonicalPayload(
    {
      ...importRecord,
      extracted_fields: enrichedRecord.extractedFields,
      last_verified_at: verifiedAt,
    },
    true
  )
  const organizationId = importRecord.promoted_organization_id
  const serviceId = importRecord.promoted_service_id
  if (!organizationId || !serviceId) {
    throw new Error(
      `${recordId(enrichedRecord)} has no promoted canonical IDs.`
    )
  }

  const { error: importError } = await admin
    .from("resource_map_import_records")
    .update({
      extracted_fields: enrichedRecord.extractedFields,
      last_verified_at: verifiedAt,
      needs_review: false,
    })
    .eq("id", importRecord.id)
  if (importError) throw importError

  const { error: ledgerError } = await admin
    .from("resource_map_enrichment_runs")
    .upsert(buildLedgerRows(importRecord, enrichedRecord), {
      ignoreDuplicates: true,
      onConflict:
        "import_record_id,pass_type,pass_number,input_sha256,prompt_version",
    })
  if (ledgerError) throw ledgerError

  const { error: oldEvidenceError } = await admin
    .from("resource_map_field_evidence")
    .delete()
    .eq("import_record_id", importRecord.id)
    .eq("transformation", "source_specific_deterministic_enrichment")
  if (oldEvidenceError) throw oldEvidenceError

  const { error: evidenceError } = await admin
    .from("resource_map_field_evidence")
    .insert(buildEvidenceRows(importRecord, enrichedRecord))
  if (evidenceError) throw evidenceError

  const actorId = importRecord.reviewed_by
  const { error: organizationError } = await admin
    .from("resource_map_organizations")
    .update({
      description: canonical.organization.description,
      email: canonical.organization.email,
      last_verified_at: verifiedAt,
      name: canonical.organization.name,
      normalized_email: canonical.organization.normalized_email,
      normalized_phone: canonical.organization.normalized_phone,
      phone: canonical.organization.phone,
      source_url: canonical.organization.source_url,
      updated_by: actorId,
      website_url: canonical.organization.website_url,
    })
    .eq("id", organizationId)
  if (organizationError) throw organizationError

  const { error: serviceError } = await admin
    .from("resource_map_services")
    .update({
      accessibility_notes: canonical.service.accessibility_notes,
      appointment_info: canonical.service.appointment_info,
      appointment_required: canonical.service.appointment_required,
      availability_notes: canonical.service.availability_notes,
      availability_status: canonical.service.availability_status,
      cost: canonical.service.cost,
      delivery_modes: canonical.service.delivery_modes,
      description: canonical.service.description,
      documents_needed: canonical.service.documents_needed,
      eligibility: canonical.service.eligibility,
      hours: canonical.service.hours,
      intake_url: canonical.service.intake_url,
      languages: canonical.service.languages,
      last_verified_at: verifiedAt,
      source_url: canonical.service.source_url,
      timezone: canonical.service.timezone,
      title: canonical.service.title,
      updated_by: actorId,
      who_it_helps: canonical.service.who_it_helps,
    })
    .eq("id", serviceId)
  if (serviceError) throw serviceError

  if (canonical.location) {
    const { error: locationError } = await admin
      .from("resource_map_locations")
      .update({
        accessibility_notes: canonical.location.accessibility_notes,
        appointment_required: canonical.location.appointment_required,
        availability_notes: canonical.location.availability_notes,
        availability_status: canonical.location.availability_status,
        hours: canonical.location.hours,
        location_url: canonical.location.location_url,
        timezone: canonical.location.timezone,
      })
      .eq("service_id", serviceId)
      .eq("is_primary", true)
    if (locationError) throw locationError
  }

  await updateContactVisibility(admin, organizationId, canonical.contacts)
  await updateLinkVisibility(admin, organizationId, canonical.links, verifiedAt)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  if (!input || args.has("help")) {
    console.log(
      "Usage: pnpm resource-map:sync-library -- --input <enriched.jsonl> [--limit 5] [--apply]"
    )
    process.exit(input ? 0 : 1)
  }

  const limit = normalizeLimit(args.get("limit"))
  const records = readResourceMapRecords(String(input)).slice(0, limit)
  const admin = createResourceMapAdminClient()
  const source = await requireSource(admin)
  const imports = await loadPromotedImports(
    admin,
    source.id,
    records.map(recordId)
  )
  const importByRecordId = new Map(
    imports.map((record) => [record.source_record_id, record])
  )
  const plans = records
    .map((enrichedRecord) => ({
      enrichedRecord,
      importRecord: importByRecordId.get(recordId(enrichedRecord)),
    }))
    .filter((plan) => plan.importRecord)
  const missing = records.filter(
    (record) => !importByRecordId.has(recordId(record))
  )

  console.log(
    `${plans.length} existing published library records matched; ${missing.length} selected records are not yet published.`
  )
  for (const plan of plans) {
    console.log(`- ${plan.enrichedRecord.extractedFields.serviceTitle}`)
  }
  if (!args.has("apply")) {
    console.log("Dry run only. Add --apply to update these published records.")
    return
  }
  if (plans.length === 0) throw new Error("No published records matched.")

  const backup = await loadBackup(admin, plans)
  const output = backupPath()
  mkdirSync(path.dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(backup, null, 2)}\n`, "utf8")
  console.log(`Saved pre-update backup to ${output}.`)

  let completed = 0
  for (const plan of plans) {
    await syncPlan(admin, plan)
    completed += 1
    console.log(`Updated ${plan.enrichedRecord.extractedFields.serviceTitle}.`)
  }
  console.log(`Updated ${completed} published library records.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
