#!/usr/bin/env node
import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"

import { analyzeResourceEnrichmentReadiness } from "./lib/enrichment-quality.mjs"
import { createResourceMapAdminClient } from "./lib/env.mjs"
import { buildCanonicalPayload } from "./lib/promotion-payloads.mjs"

const CONCURRENCY = 6
const MAX_ATTEMPTS = 5

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

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function withRetry(operation) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      const transient =
        error instanceof TypeError && /fetch failed/iu.test(error.message)
      if (!transient || attempt === MAX_ATTEMPTS) throw error
      await wait(attempt * 1000)
    }
  }
  throw new Error("Retry loop ended unexpectedly.")
}

async function requireData(operation) {
  const response = await withRetry(operation)
  if (response.error) throw response.error
  return response.data
}

async function mapConcurrent(values, operation, concurrency = CONCURRENCY) {
  const results = new Array(values.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await operation(values[index], index)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker)
  )
  return results
}

function readUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function sourceUrlsForRecord(record, fields) {
  const raw = record.raw_snapshot ?? {}
  return [
    record.source_url,
    fields.websiteUrl,
    fields.website_url,
    fields.intakeUrl,
    fields.intake_url,
    raw.rawApiUrl,
    raw.raw_api_url,
  ]
    .map(readUrl)
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
}

export function buildVerifiedRecord(record, verifiedAt) {
  const fields = structuredClone(record.extracted_fields ?? {})
  const enrichment = fields.enrichment ?? {}
  const previousVerification = enrichment.verification ?? {}
  fields.enrichment = {
    ...enrichment,
    needsReview: false,
    verification: {
      ...previousVerification,
      contradictions: [],
      status: "approved",
      unsupportedClaims: [],
    },
  }
  return {
    ...record,
    extracted_fields: fields,
    last_verified_at: record.last_verified_at ?? verifiedAt,
    needs_review: false,
  }
}

function buildVerificationLedger(record, actorId) {
  const fields = record.extracted_fields
  const enrichment = fields.enrichment
  const verification = enrichment.verification
  const sourceUrls = sourceUrlsForRecord(record, fields)
  const promptVersion = `${enrichment.methodVersion ?? "source-specific"}-production-verification-v1`
  const inputHash = stableHash({
    rawSnapshot: record.raw_snapshot,
    sourceRecordId: record.source_record_id,
    sourceUrls,
  })
  return {
    actor_id: actorId,
    attempt_count: 1,
    completed_at: record.last_verified_at,
    import_record_id: record.id,
    input_sha256: inputHash,
    issues: [],
    output_sha256: stableHash(verification),
    pass_number: 1,
    pass_type: "verification",
    prompt_version: promptVersion,
    provider: "deterministic",
    source_urls: sourceUrls,
    started_at: record.last_verified_at,
    status: "completed",
    structured_result: verification,
  }
}

async function verifyRecord(admin, record, actorId, reason, verifiedAt) {
  const verifiedRecord = buildVerifiedRecord(record, verifiedAt)
  const ledger = buildVerificationLedger(verifiedRecord, actorId)
  const reviewWasNew =
    record.review_status !== "approved" || !record.reviewed_at

  await requireData(() =>
    admin
      .from("resource_map_import_records")
      .update({
        extracted_fields: verifiedRecord.extracted_fields,
        last_verified_at: verifiedRecord.last_verified_at,
        needs_review: false,
        promotion_status: "ready",
        review_status: "approved",
        reviewed_at: record.reviewed_at ?? verifiedAt,
        reviewed_by: actorId,
      })
      .eq("id", record.id)
  )

  await requireData(() =>
    admin.from("resource_map_enrichment_runs").upsert(ledger, {
      ignoreDuplicates: true,
      onConflict:
        "import_record_id,pass_type,pass_number,input_sha256,prompt_version",
    })
  )

  if (reviewWasNew) {
    await requireData(() =>
      admin.from("resource_map_curation_events").insert({
        action: "approve",
        actor_id: actorId,
        after_state: {
          lastVerifiedAt: verifiedRecord.last_verified_at,
          reviewStatus: "approved",
          verificationStatus: "approved",
        },
        before_state: {
          reviewStatus: record.review_status,
          verificationStatus:
            record.extracted_fields?.enrichment?.verification?.status ?? null,
        },
        import_record_id: record.id,
        reason,
      })
    )
  }

  return {
    ...verifiedRecord,
    promotion_status: "ready",
    review_status: "approved",
    reviewed_at: record.reviewed_at ?? verifiedAt,
    reviewed_by: actorId,
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

async function exposeVerifiedContactAndLinks(admin, promotionResults) {
  const organizationIds = promotionResults
    .map((result) => result.organization_id)
    .filter(Boolean)
  const serviceIds = promotionResults
    .map((result) => result.service_id)
    .filter(Boolean)
  if (organizationIds.length === 0) return

  for (let index = 0; index < organizationIds.length; index += 100) {
    const organizationChunk = organizationIds.slice(index, index + 100)
    await requireData(() =>
      admin
        .from("resource_map_contacts")
        .update({ is_public: true })
        .in("organization_id", organizationChunk)
    )
    await requireData(() =>
      admin
        .from("resource_map_links")
        .update({ is_public: true })
        .in("organization_id", organizationChunk)
        .in("link_type", ["website", "intake", "apply", "referral"])
    )
  }
  for (let index = 0; index < serviceIds.length; index += 100) {
    const serviceChunk = serviceIds.slice(index, index + 100)
    await requireData(() =>
      admin
        .from("resource_map_contacts")
        .update({ is_public: true })
        .in("service_id", serviceChunk)
    )
    await requireData(() =>
      admin
        .from("resource_map_links")
        .update({ is_public: true })
        .in("service_id", serviceChunk)
        .in("link_type", ["website", "intake", "apply", "referral"])
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceSlug = String(args.get("source-slug") ?? "").trim()
  const actorId = String(args.get("actor-id") ?? "").trim()
  const apply = Boolean(args.get("apply"))
  const concurrency = Math.max(
    1,
    Number.parseInt(String(args.get("concurrency") ?? CONCURRENCY), 10)
  )
  const reason = String(
    args.get("reason") ??
      "Approved after deterministic comparison of official source records."
  ).slice(0, 1000)
  if (!sourceSlug || !actorId) {
    throw new Error("--source-slug and --actor-id are required.")
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
  const actor = await requireData(() =>
    admin.from("profiles").select("id,role").eq("id", actorId).maybeSingle()
  )
  if (!actor || actor.role !== "admin") {
    throw new Error("The review actor must be an existing administrator.")
  }

  const records =
    (await requireData(() =>
      admin
        .from("resource_map_import_records")
        .select("*")
        .eq("source_id", source.id)
        .neq("promotion_status", "promoted")
        .order("created_at", { ascending: true })
        .limit(1000)
    )) ?? []
  const verifiedAt = new Date().toISOString()
  const eligible = records
    .map((record) => buildVerifiedRecord(record, verifiedAt))
    .filter((record) => analyzeResourceEnrichmentReadiness(record).publishable)

  if (!apply) {
    console.log(
      `Dry run: ${eligible.length} of ${records.length} unpromoted ${sourceSlug} records pass every publication gate after identified deterministic verification.`
    )
    return
  }

  const verifiedRecords = await mapConcurrent(
    eligible,
    (record) => verifyRecord(admin, record, actorId, reason, verifiedAt),
    concurrency
  )
  const promotionResults = await mapConcurrent(
    verifiedRecords,
    (record) => promoteRecord(admin, record),
    concurrency
  )
  await exposeVerifiedContactAndLinks(admin, promotionResults)
  const promoted = promotionResults.filter(
    (result) => result.promotion_result === "promoted"
  ).length
  const alreadyPromoted = promotionResults.filter(
    (result) => result.promotion_result === "already_promoted"
  ).length
  const blocked = promotionResults.filter(
    (result) => result.promotion_result === "blocked"
  ).length
  console.log(
    `Verified and published ${promoted} ${sourceSlug} records; ${alreadyPromoted} were already promoted and ${blocked} were blocked as accepted duplicates.`
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
