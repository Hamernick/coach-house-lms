#!/usr/bin/env node
import { resolveResourceCategoryKey } from "./lib/promotion-normalizers.mjs"
import { readResourceMapRecords } from "./lib/read-records.mjs"

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

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null
}

function readFields(record) {
  return (
    readObject(record.extractedFields) ??
    readObject(record.extracted_fields) ??
    readObject(record.fields) ??
    record
  )
}

function readString(value) {
  return typeof value === "string" ? value.trim() : ""
}

function readFirstString(...values) {
  for (const value of values) {
    const stringValue = readString(value)
    if (stringValue) return stringValue
  }
  return null
}

function readArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function readNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function resolveCategories(record, fields) {
  const values = [
    ...readArray(fields.resourceCategories),
    ...readArray(fields.resource_categories),
    ...readArray(fields.categories),
    ...readArray(record.resourceCategories),
    ...readArray(record.resource_categories),
    ...readArray(record.categories),
    fields.primaryResourceCategory,
    fields.primary_resource_category,
    fields.category,
    fields.category_key,
    fields.subcategory,
    fields.subcategoryKey,
    fields.subcategory_key,
    record.primaryResourceCategory,
    record.primary_resource_category,
    record.category,
    record.category_key,
    record.subcategory,
    record.subcategoryKey,
    record.subcategory_key,
  ]

  return [
    ...new Set(
      values
        .map(resolveResourceCategoryKey)
        .filter((category) => category !== null)
    ),
  ]
}

function hasAnyContact(record, fields) {
  return Boolean(
    readFirstString(
      fields.phone,
      fields.phoneNumber,
      fields.telephone,
      fields.email,
      fields.contactEmail,
      record.phone,
      record.email
    ) ||
    readArray(fields.contacts).length > 0 ||
    readArray(record.contacts).length > 0
  )
}

function hasAnyLink(record, fields) {
  return Boolean(
    readFirstString(
      fields.websiteUrl,
      fields.website_url,
      fields.website,
      record.websiteUrl,
      record.website_url,
      record.sourceUrl,
      record.source_url
    ) ||
    readArray(fields.links).length > 0 ||
    readArray(record.links).length > 0
  )
}

function validateRecord(record, index, seen) {
  const row = index + 1
  const fields = readFields(record)
  const title = readFirstString(
    fields.title,
    fields.serviceTitle,
    fields.service_title,
    fields.name,
    fields.organizationName,
    fields.organization_name,
    record.title,
    record.name
  )
  const sourceRecordId = readFirstString(
    record.sourceRecordId,
    record.source_record_id,
    record.item_id,
    record.service_id,
    record.id
  )
  const sourceUrl = readFirstString(
    record.sourceUrl,
    record.source_url,
    fields.sourceUrl,
    fields.source_url
  )
  const latitude = readNumber(
    fields.latitude,
    fields.lat,
    record.latitude,
    record.lat
  )
  const longitude = readNumber(
    fields.longitude,
    fields.lng,
    fields.lon,
    record.longitude,
    record.lng,
    record.lon
  )
  const address = readFirstString(
    fields.address,
    fields.fullAddress,
    fields.address_line1,
    fields.streetAddress,
    record.address,
    record.address_line1
  )
  const city = readFirstString(fields.city, record.city)
  const state = readFirstString(fields.state, record.state)
  const categories = resolveCategories(record, fields)
  const errors = []
  const warnings = []

  if (!title)
    errors.push("Missing title/name; /find local preview will drop this row.")
  if (!sourceRecordId)
    warnings.push(
      "Missing sourceRecordId/id; import can still run, but dedupe is weaker."
    )
  if (!sourceUrl)
    warnings.push(
      "Missing sourceUrl; source review and evidence trail are weaker."
    )
  if (categories.length === 0)
    warnings.push(
      "Missing known resource category; preview falls back to Community."
    )
  if (latitude === null || longitude === null) {
    warnings.push("Missing latitude/longitude; map marker needs coordinates.")
  }
  if (!address && (!city || !state)) {
    warnings.push("Missing address or city/state; location review is weaker.")
  }
  if (!hasAnyContact(record, fields)) warnings.push("No contact fields found.")
  if (!hasAnyLink(record, fields))
    warnings.push("No link or source URL fields found.")

  if (sourceRecordId) {
    if (seen.sourceRecordIds.has(sourceRecordId)) {
      warnings.push(`Duplicate sourceRecordId/id: ${sourceRecordId}`)
    }
    seen.sourceRecordIds.add(sourceRecordId)
  }

  const duplicateKey = [
    title?.toLowerCase(),
    address?.toLowerCase(),
    city?.toLowerCase(),
    state?.toLowerCase(),
  ]
    .filter(Boolean)
    .join("|")
  if (duplicateKey) {
    if (seen.locationKeys.has(duplicateKey))
      warnings.push("Possible duplicate title/address row.")
    seen.locationKeys.add(duplicateKey)
  }

  return {
    address,
    categories,
    errors: errors.map((message) => ({ message, row })),
    hasContact: hasAnyContact(record, fields),
    hasCoordinates: latitude !== null && longitude !== null,
    hasLink: hasAnyLink(record, fields),
    sourceUrl,
    title,
    warnings: warnings.map((message) => ({ message, row })),
  }
}

function summarize(input, records) {
  const seen = {
    locationKeys: new Set(),
    sourceRecordIds: new Set(),
  }
  const rows = records.map((record, index) =>
    validateRecord(readObject(record) ?? {}, index, seen)
  )
  const categoryCounts = {}
  for (const row of rows) {
    for (const category of row.categories) {
      categoryCounts[category] = (categoryCounts[category] ?? 0) + 1
    }
  }

  return {
    input,
    totalRecords: records.length,
    previewableRecords: rows.filter((row) => row.title).length,
    recordsWithCoordinates: rows.filter((row) => row.hasCoordinates).length,
    recordsWithAddress: rows.filter((row) => row.address).length,
    recordsWithSourceUrl: rows.filter((row) => row.sourceUrl).length,
    recordsWithContact: rows.filter((row) => row.hasContact).length,
    recordsWithLink: rows.filter((row) => row.hasLink).length,
    categoryCounts,
    errors: rows.flatMap((row) => row.errors),
    warnings: rows.flatMap((row) => row.warnings),
  }
}

function printTextReport(summary) {
  console.log("Resource map local file validation")
  console.log(`Input: ${summary.input}`)
  console.log(`Records: ${summary.totalRecords}`)
  console.log(`Previewable: ${summary.previewableRecords}`)
  console.log(`With coordinates: ${summary.recordsWithCoordinates}`)
  console.log(`With source URL: ${summary.recordsWithSourceUrl}`)
  console.log(`Errors: ${summary.errors.length}`)
  console.log(`Warnings: ${summary.warnings.length}`)
  if (Object.keys(summary.categoryCounts).length > 0) {
    console.log(`Categories: ${JSON.stringify(summary.categoryCounts)}`)
  }

  for (const error of summary.errors.slice(0, 20)) {
    console.log(`ERROR row ${error.row}: ${error.message}`)
  }
  for (const warning of summary.warnings.slice(0, 20)) {
    console.log(`WARN row ${warning.row}: ${warning.message}`)
  }

  console.log("")
  console.log(
    `Preview: RESOURCE_MAP_LOCAL_PREVIEW_FILE=${summary.input} pnpm dev`
  )
  console.log(
    `Dry-run import: pnpm resource-map:import -- --input ${summary.input} --source-slug <slug> --source-name "<Source name>" --dry-run`
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.get("input")
  if (!input || args.get("help")) {
    console.log(
      "Usage: pnpm resource-map:validate-local -- --input data/resource-map/batch.jsonl [--json] [--strict]"
    )
    process.exit(input ? 0 : 1)
  }

  const summary = summarize(
    String(input),
    readResourceMapRecords(String(input))
  )
  if (args.get("json")) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    printTextReport(summary)
  }

  if (
    summary.errors.length > 0 ||
    (args.get("strict") && summary.warnings.length > 0)
  ) {
    process.exit(1)
  }
}

main()
