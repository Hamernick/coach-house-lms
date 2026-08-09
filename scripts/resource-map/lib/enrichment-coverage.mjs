import {
  analyzeResourceEnrichmentReadiness,
  isTechnicalResourceSourceUrl,
  resolveEnrichmentFields,
} from "./enrichment-quality.mjs"

const METRIC_KEYS = [
  "title",
  "service",
  "summary",
  "categories",
  "location",
  "contactOrLink",
  "eligibility",
  "access",
  "source",
  "twoComparisons",
  "verified",
]

function readArray(value) {
  return Array.isArray(value) ? value : []
}

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function readNumber(...values) {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

function hasActionableLink(fields) {
  return [
    fields.websiteUrl,
    fields.website_url,
    fields.website,
    fields.intakeUrl,
    fields.intake_url,
    ...readArray(fields.links).map((link) => link?.url ?? link?.href),
  ]
    .map((value) => readString(value))
    .filter(Boolean)
    .some((url) => !isTechnicalResourceSourceUrl(url))
}

function hasLocation(record, fields) {
  const latitude = readNumber(fields.latitude, fields.lat, record.latitude)
  const longitude = readNumber(
    fields.longitude,
    fields.lng,
    fields.lon,
    record.longitude
  )
  return Boolean(
    (latitude !== null && longitude !== null) ||
    readString(
      fields.address,
      fields.addressLine1,
      fields.address_line1,
      fields.city
    ) ||
    readArray(fields.serviceArea ?? fields.service_area).length > 0
  )
}

function hasSource(record, fields) {
  return Boolean(
    readString(
      record.sourceUrl,
      record.source_url,
      fields.sourceUrl,
      fields.source_url
    ) ||
    readArray(record.fieldEvidence ?? record.field_evidence).some((item) =>
      readString(item?.sourceUrl, item?.source_url)
    )
  )
}

export function analyzeRecordCoverage(record) {
  const fields = resolveEnrichmentFields(record)
  const enrichment = readObject(fields.enrichment ?? record.enrichment)
  const verification = readObject(enrichment.verification)
  const title = readString(
    fields.serviceTitle,
    fields.service_title,
    fields.title,
    fields.organizationName,
    fields.organization_name
  )
  const service = readString(
    fields.serviceTitle,
    fields.service_title,
    readArray(fields.services)[0]?.name
  )
  const summary = readString(
    fields.serviceDescription,
    fields.service_description,
    fields.description
  )
  const contact = readString(
    fields.phone,
    fields.email,
    fields.contactPhone,
    fields.contactEmail
  )
  const sourceComparisonCount = readNumber(
    enrichment.sourceComparisonCount,
    enrichment.source_comparison_count
  )
  const metrics = {
    access: Boolean(
      readString(
        fields.accessInstructions,
        fields.access_instructions,
        fields.howToAccess,
        fields.how_to_access,
        fields.appointmentInfo,
        fields.appointment_info
      )
    ),
    categories:
      readArray(fields.resourceCategories ?? fields.resource_categories)
        .length > 0 || Boolean(readString(fields.category, fields.subcategory)),
    contactOrLink: Boolean(contact) || hasActionableLink(fields),
    eligibility: Boolean(readString(fields.eligibility)),
    location: hasLocation(record, fields),
    service: Boolean(service),
    source: hasSource(record, fields),
    summary: Boolean(summary && summary.length >= 80),
    title: Boolean(title),
    twoComparisons:
      sourceComparisonCount !== null && sourceComparisonCount >= 2,
    verified: verification.status === "approved",
  }
  const readiness = analyzeResourceEnrichmentReadiness(record)

  return {
    complete: METRIC_KEYS.every((key) => metrics[key]),
    metrics,
    publishable: readiness.publishable,
    recordId: String(
      record.sourceRecordId ?? record.source_record_id ?? record.id ?? ""
    ),
    sourceId: String(record.sourceId ?? record.source_id ?? "unknown"),
  }
}

function emptyCounts() {
  return Object.fromEntries(METRIC_KEYS.map((key) => [key, 0]))
}

function addResult(target, result) {
  target.total += 1
  if (result.complete) target.complete += 1
  if (result.publishable) target.publishable += 1
  for (const key of METRIC_KEYS) {
    if (result.metrics[key]) target.metrics[key] += 1
  }
}

export function summarizeEnrichmentCoverage(records) {
  const accumulator = createEnrichmentCoverageAccumulator()
  for (const record of records) accumulator.add(record)
  return accumulator.summary()
}

export function createEnrichmentCoverageAccumulator() {
  const total = {
    complete: 0,
    metrics: emptyCounts(),
    publishable: 0,
    total: 0,
  }
  const sources = new Map()

  return {
    add(record) {
      const result = analyzeRecordCoverage(record)
      const source = sources.get(result.sourceId) ?? {
        complete: 0,
        metrics: emptyCounts(),
        publishable: 0,
        sourceId: result.sourceId,
        total: 0,
      }
      addResult(total, result)
      addResult(source, result)
      sources.set(result.sourceId, source)
      return result
    },
    summary() {
      return {
        metricKeys: METRIC_KEYS,
        sources: [...sources.values()].sort(
          (left, right) =>
            right.total - left.total ||
            left.sourceId.localeCompare(right.sourceId)
        ),
        total: {
          complete: total.complete,
          metrics: { ...total.metrics },
          publishable: total.publishable,
          total: total.total,
        },
      }
    },
  }
}

export const ENRICHMENT_COVERAGE_METRIC_KEYS = METRIC_KEYS
