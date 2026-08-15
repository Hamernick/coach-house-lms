#!/usr/bin/env node
import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"

import { createResourceMapAdminClient } from "./lib/env.mjs"

const MAX_RECORDS = 5
const MAX_METADATA_BYTES = 250_000
const MAX_QUERY_BYTES = 1_000_000
const REQUEST_TIMEOUT_MS = 15_000
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

const SOURCE_PROFILES = new Map([
  [
    "maricopa-arcgis-heat-relief-network",
    {
      compareRecord: compareMaricopaRecord,
      layerUrl:
        "https://services1.arcgis.com/MdyCMZnX1raZ7TS3/arcgis/rest/services/HRN_Public_view/FeatureServer/0",
      methodVersion: "maricopa-live-arcgis-v1",
    },
  ],
])

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
  const ids = [
    ...new Set(
      String(value ?? "")
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean)
    ),
  ]
  const invalid = ids.find((id) => !UUID_PATTERN.test(id))
  if (invalid) throw new Error(`Invalid UUID: ${invalid}`)
  return ids
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

function normalizeArcGisId(value) {
  return String(value ?? "")
    .trim()
    .replace(/^\{(.+)\}$/u, "$1")
    .toLowerCase()
}

function readText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }
  return null
}

function displayTitle(name, kind) {
  if (!name || !kind) return null
  if (new RegExp(`\\b${kind.replaceAll(" ", "\\s+")}\\b`, "iu").test(name)) {
    return name
  }
  return `${name} — ${kind}`
}

function maricopaKind(attributes) {
  const heatReliefType = readText(attributes.HeatRelief_Type)
  if (heatReliefType) return heatReliefType
  if (/^yes$/iu.test(readText(attributes.Collection) ?? "")) {
    const collectionType = readText(attributes.Collection_Type)
    return collectionType
      ? `${collectionType} Site`
      : "Heat-Relief Supply Collection Site"
  }
  return null
}

function compareTextClaim(issues, issue, staged, liveValues, normalize) {
  const stagedValue = normalize(staged)
  if (
    !stagedValue ||
    !liveValues.some((value) => stagedValue === normalize(value))
  ) {
    issues.push(issue)
  }
}

function compareCoordinate(issues, issue, staged, live) {
  const stagedNumber = Number(staged)
  const liveNumber = Number(live)
  if (
    !Number.isFinite(stagedNumber) ||
    !Number.isFinite(liveNumber) ||
    Math.abs(stagedNumber - liveNumber) > 0.000001
  ) {
    issues.push(issue)
  }
}

function isMaricopaActive(attributes, checkedAt) {
  if (!/^yes$/iu.test(readText(attributes.Active) ?? "")) return false
  if (Number(attributes.Status) !== 1) return false

  const checkedDate = checkedAt.slice(0, 10)
  const startDate = readText(attributes.Start_Date)
  const endDate = readText(attributes.End_Date)
  if (startDate && checkedDate < startDate) return false
  if (endDate && checkedDate > endDate) return false
  return true
}

function compareMaricopaRecord(record, liveFeature, checkedAt) {
  if (!liveFeature) return ["removed_from_current_official_source"]

  const fields = record.extracted_fields ?? {}
  const attributes = liveFeature.attributes ?? {}
  const geometry = liveFeature.geometry ?? {}
  const facility = readText(attributes.Location)
  const organization = readText(attributes.Organization)
  const kind = maricopaKind(attributes)
  const issues = []

  compareTextClaim(
    issues,
    "title_changed",
    readText(fields.serviceTitle, fields.title),
    [
      facility,
      organization,
      displayTitle(facility, kind),
      displayTitle(organization, kind),
    ],
    normalizeText
  )
  if (readText(fields.organizationName)) {
    compareTextClaim(
      issues,
      "organization_changed",
      fields.organizationName,
      [organization],
      normalizeText
    )
  }
  compareTextClaim(
    issues,
    "address_changed",
    fields.address,
    [attributes.Address],
    normalizeText
  )
  compareTextClaim(
    issues,
    "hours_changed",
    fields.hours?.label,
    [attributes.Hours],
    normalizeText
  )
  compareTextClaim(
    issues,
    "phone_changed",
    fields.phone,
    [attributes.PrimaryPhone],
    normalizePhone
  )
  compareCoordinate(
    issues,
    "latitude_changed",
    fields.latitude,
    geometry.y ?? attributes.latitude
  )
  compareCoordinate(
    issues,
    "longitude_changed",
    fields.longitude,
    geometry.x ?? attributes.longitude
  )
  if (!isMaricopaActive(attributes, checkedAt)) {
    issues.push("inactive_in_current_official_source")
  }
  return issues
}

function recordName(record) {
  const fields = record.extracted_fields ?? {}
  return readText(fields.serviceTitle, fields.title, fields.organizationName)
}

export function validateArcGisLayerUrl(value) {
  const url = new URL(value)
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !/(?:^|\.)arcgis\.com$/iu.test(url.hostname)
  ) {
    throw new Error("The source URL is not an allowed HTTPS ArcGIS URL.")
  }
  const match = url.pathname.match(
    /^(.*\/arcgis\/rest\/services\/.+\/FeatureServer\/[0-9]+)(?:\/query)?\/?$/iu
  )
  if (!match) throw new Error("The source URL is not an ArcGIS feature layer.")
  url.pathname = match[1]
  url.search = ""
  url.hash = ""
  return url.toString().replace(/\/$/u, "")
}

export function buildVerificationPlan(
  records,
  liveFeatures,
  checkedAt,
  sourceSlug = "maricopa-arcgis-heat-relief-network",
  globalIdField = "globalid"
) {
  const profile = SOURCE_PROFILES.get(sourceSlug)
  if (!profile) throw new Error(`Unsupported ArcGIS source: ${sourceSlug}`)
  const liveById = new Map(
    liveFeatures.map((feature) => [
      normalizeArcGisId(feature.attributes?.[globalIdField]),
      feature,
    ])
  )

  return records.map((record) => {
    const liveFeature = liveById.get(normalizeArcGisId(record.source_record_id))
    const issues = profile.compareRecord(record, liveFeature, checkedAt)
    const verification = {
      checkedAt,
      contradictions: issues,
      method: "deterministic_live_source_verification",
      methodVersion: profile.methodVersion,
      sourceRecordId: record.source_record_id,
      sourceRecordName: recordName(record),
      status: issues.length === 0 ? "approved" : "needs_review",
      unsupportedClaims: [],
    }
    return { issues, liveFeature, record, verification }
  })
}

function buildLedgerRow(item, checkedAt, sourceUrl, methodVersion) {
  const input = {
    checkedAt,
    liveFeature: item.liveFeature,
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
    prompt_version: methodVersion,
    provider: "deterministic",
    source_urls: [sourceUrl],
    started_at: checkedAt,
    status: item.issues.length === 0 ? "completed" : "needs_review",
    structured_result: item.verification,
  }
}

async function fetchBoundedJson(url, maxBytes, label) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok)
    throw new Error(`${label} returned HTTP ${response.status}.`)
  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > maxBytes) {
    throw new Error(`${label} response exceeded the size limit.`)
  }
  const text = await response.text()
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new Error(`${label} response exceeded the size limit.`)
  }
  const parsed = JSON.parse(text)
  if (parsed?.error) {
    throw new Error(`${label} returned an ArcGIS error.`)
  }
  return parsed
}

async function requireSource(admin, sourceSlug) {
  const { data, error } = await admin
    .from("resource_map_sources")
    .select("id,slug,trust_level")
    .eq("slug", sourceSlug)
    .maybeSingle()
  if (error) throw error
  if (!data || data.trust_level !== "official") {
    throw new Error(`${sourceSlug} is not an existing official source.`)
  }
  return data
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceSlug = String(args.get("source-slug") ?? "").trim()
  const profile = SOURCE_PROFILES.get(sourceSlug)
  const ids = normalizeIds(args.get("id") ?? args.get("ids"))
  const apply = Boolean(args.get("apply"))
  const confirmedSource = String(args.get("confirm-source") ?? "").trim()

  if (!profile) throw new Error(`Unsupported ArcGIS source: ${sourceSlug}`)
  if (ids.length === 0) throw new Error("Explicit --id values are required.")
  if (ids.length > MAX_RECORDS) {
    throw new Error(`Verification may contain at most ${MAX_RECORDS} records.`)
  }
  if (apply && confirmedSource !== sourceSlug) {
    throw new Error("--confirm-source must exactly match --source-slug.")
  }

  const admin = createResourceMapAdminClient()
  const source = await requireSource(admin, sourceSlug)
  const { data: unorderedRecords, error } = await admin
    .from("resource_map_import_records")
    .select(
      "id,source_record_id,source_url,extracted_fields,review_status,promotion_status"
    )
    .eq("source_id", source.id)
    .eq("review_status", "needs_review")
    .eq("promotion_status", "not_promoted")
    .in("id", ids)
  if (error) throw error
  if ((unorderedRecords ?? []).length !== ids.length) {
    throw new Error(
      `Expected ${ids.length} unapproved, unpromoted records; found ${(unorderedRecords ?? []).length}.`
    )
  }
  const recordsById = new Map(
    unorderedRecords.map((record) => [record.id.toLowerCase(), record])
  )
  const records = ids.map((id) => recordsById.get(id))
  if (records.some((record) => !record)) {
    throw new Error("One or more exact import IDs were not returned.")
  }
  for (const record of records) {
    if (!UUID_PATTERN.test(record.source_record_id)) {
      throw new Error(`Invalid ArcGIS global ID: ${record.source_record_id}`)
    }
    const layerUrl = validateArcGisLayerUrl(record.source_url)
    if (layerUrl !== profile.layerUrl) {
      throw new Error("A staged source URL does not match the supported layer.")
    }
  }

  const metadataUrl = `${profile.layerUrl}?f=json`
  const metadata = await fetchBoundedJson(
    metadataUrl,
    MAX_METADATA_BYTES,
    "ArcGIS layer metadata"
  )
  const globalIdField = readText(metadata.globalIdField)
  const globalField = metadata.fields?.find(
    (field) => field.name === globalIdField
  )
  if (
    metadata.type !== "Feature Layer" ||
    !String(metadata.capabilities ?? "")
      .split(",")
      .map((capability) => capability.trim())
      .includes("Query") ||
    !globalIdField ||
    globalField?.type !== "esriFieldTypeGlobalID"
  ) {
    throw new Error("ArcGIS layer metadata lacks the required query contract.")
  }

  const sourceRecordIds = records.map((record) => record.source_record_id)
  const query = new URLSearchParams({
    f: "json",
    outFields: "*",
    outSR: "4326",
    returnGeometry: "true",
    where: `${globalIdField} IN (${sourceRecordIds
      .map((id) => `'${id}'`)
      .join(",")})`,
  })
  const queryUrl = `${profile.layerUrl}/query?${query}`
  const queryResult = await fetchBoundedJson(
    queryUrl,
    MAX_QUERY_BYTES,
    "ArcGIS feature query"
  )
  if (!Array.isArray(queryResult.features)) {
    throw new Error("ArcGIS feature query returned invalid JSON.")
  }
  if (queryResult.features.length > records.length) {
    throw new Error("ArcGIS feature query returned unexpected records.")
  }
  const requestedSourceIds = new Set(sourceRecordIds.map(normalizeArcGisId))
  const returnedSourceIds = queryResult.features.map((feature) =>
    normalizeArcGisId(feature.attributes?.[globalIdField])
  )
  if (
    new Set(returnedSourceIds).size !== returnedSourceIds.length ||
    returnedSourceIds.some((id) => !requestedSourceIds.has(id))
  ) {
    throw new Error("ArcGIS feature query returned unexpected global IDs.")
  }

  const checkedAt = new Date().toISOString()
  const plan = buildVerificationPlan(
    records,
    queryResult.features,
    checkedAt,
    sourceSlug,
    globalIdField
  )
  const approved = plan.filter((item) => item.issues.length === 0)
  const held = plan.length - approved.length
  console.log(
    `Live verification plan: ${approved.length}/${plan.length} records match ${sourceSlug}; held ${held}.`
  )
  for (const item of plan) {
    console.log(
      `- ${item.record.id} - ${recordName(item.record)} - ${item.issues.length === 0 ? "approved" : item.issues.join(",")}`
    )
  }
  if (!apply) {
    console.log("Dry run only; no verification ledger or review state changed.")
    return
  }

  const { error: ledgerError } = await admin
    .from("resource_map_enrichment_runs")
    .upsert(
      plan.map((item) =>
        buildLedgerRow(item, checkedAt, queryUrl, profile.methodVersion)
      ),
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
