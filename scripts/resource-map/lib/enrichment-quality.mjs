const TECHNICAL_SOURCE_HOSTS = new Set([
  "api-prod.communityfridgefinder.com",
  "overpass-api.de",
  "query.wikidata.org",
])

const MACHINE_DESCRIPTION_PATTERN =
  /^(?:[a-z0-9]+(?:_[a-z0-9]+)+|clinic|community cent(?:er|re)|hospital|library|shelter|social facility)$/iu
const CLEAR_TITLE_PATTERN =
  /\b(?:branch|center|centre|clinic|hospital|library|office|pantry|program|school|service|shelter|station)\b/iu

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readArray(value) {
  return Array.isArray(value) ? value : []
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

export function resolveEnrichmentFields(record) {
  return readObject(
    record.extractedFields ?? record.extracted_fields ?? record.fields ?? record
  )
}

export function isTechnicalResourceSourceUrl(value) {
  const url = readString(value)
  if (!url) return false

  try {
    const parsed = new URL(url)
    if (TECHNICAL_SOURCE_HOSTS.has(parsed.hostname.toLowerCase())) return true
    return (
      /\/arcgis\/rest\/services\//iu.test(parsed.pathname) ||
      /\/resource\/[a-z0-9-]+\.json$/iu.test(parsed.pathname) ||
      parsed.pathname.endsWith("/sparql") ||
      parsed.pathname.endsWith("/interpreter")
    )
  } catch {
    return true
  }
}

function readEvidenceUrls(record, fields) {
  const urls = new Set()
  const add = (value) => {
    const url = readString(value)
    if (!url) return
    try {
      const parsed = new URL(url)
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        urls.add(parsed.toString())
      }
    } catch {
      // Invalid URLs remain quality gaps and are not evidence.
    }
  }

  add(record.sourceUrl ?? record.source_url)
  add(fields.sourceUrl ?? fields.source_url)
  add(fields.websiteUrl ?? fields.website_url ?? fields.website)
  add(fields.intakeUrl ?? fields.intake_url)
  for (const evidence of readArray(
    record.fieldEvidence ?? record.field_evidence
  )) {
    add(evidence?.sourceUrl ?? evidence?.source_url)
  }
  for (const link of readArray(fields.links)) add(link?.url ?? link?.href)

  return [...urls]
}

function hasContact(record, fields) {
  return Boolean(
    readString(
      fields.phone,
      fields.phoneNumber,
      fields.email,
      fields.contactEmail,
      record.phone,
      record.email
    ) || readArray(fields.contacts).length > 0
  )
}

function hasActionableLink(record, fields) {
  const urls = [
    fields.websiteUrl,
    fields.website_url,
    fields.website,
    fields.intakeUrl,
    fields.intake_url,
    ...readArray(fields.links).map((link) => link?.url ?? link?.href),
  ]
    .map((value) => readString(value))
    .filter(Boolean)

  return urls.some((url) => !isTechnicalResourceSourceUrl(url))
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
      fields.city,
      fields.serviceArea,
      fields.service_area
    ) ||
    readArray(fields.serviceArea ?? fields.service_area).length > 0
  )
}

function hasUsefulHours(fields) {
  if (typeof fields.hours === "string" && fields.hours.trim()) return true
  const hours = readObject(fields.hours)
  return Boolean(
    readString(hours.label) ||
    readArray(hours.weekly).length > 0 ||
    fields.appointmentRequired === true ||
    fields.appointment_required === true
  )
}

function readEnrichment(record, fields) {
  return readObject(fields.enrichment ?? record.enrichment)
}

function readVerification(enrichment) {
  return readObject(enrichment.verification)
}

function pushGap(gaps, code, message, blocking = true) {
  gaps.push({ blocking, code, message })
}

export function analyzeResourceEnrichmentReadiness(record) {
  const fields = resolveEnrichmentFields(record)
  const title = readString(
    fields.serviceTitle,
    fields.service_title,
    fields.title,
    fields.organizationName,
    fields.organization_name,
    fields.name,
    record.title,
    record.name
  )
  const description = readString(
    fields.serviceDescription,
    fields.service_description,
    fields.description
  )
  const eligibility = readString(fields.eligibility)
  const accessInstructions = readString(
    fields.accessInstructions,
    fields.access_instructions,
    fields.howToAccess,
    fields.how_to_access,
    fields.intakeInstructions,
    fields.intake_instructions,
    fields.appointmentInfo,
    fields.appointment_info
  )
  const serviceTitle = readString(
    fields.serviceTitle,
    fields.service_title,
    fields.title
  )
  const evidenceUrls = readEvidenceUrls(record, fields)
  const providerEvidenceUrls = evidenceUrls.filter(
    (url) => !isTechnicalResourceSourceUrl(url)
  )
  const enrichment = readEnrichment(record, fields)
  const verification = readVerification(enrichment)
  const sourceComparisonCount = readNumber(
    enrichment.sourceComparisonCount,
    enrichment.source_comparison_count
  )
  const unsupportedClaims = readArray(
    verification.unsupportedClaims ?? verification.unsupported_claims
  )
  const contradictions = readArray(verification.contradictions)
  const gaps = []

  if (enrichment.publicResourceEligible === false) {
    pushGap(
      gaps,
      "missing_specific_public_service",
      "The source must identify a specific public service before publication."
    )
  }

  if (!title)
    pushGap(gaps, "missing_title", "A specific public title is required.")
  if (
    title &&
    !CLEAR_TITLE_PATTERN.test(title) &&
    /librar(?:y|ies)/iu.test(
      [
        fields.category,
        fields.sourceCategoryText,
        record.sourceName,
        record.source_name,
      ]
        .filter(Boolean)
        .join(" ")
    )
  ) {
    pushGap(
      gaps,
      "ambiguous_library_title",
      "Library records must identify the title as a branch or library."
    )
  }
  if (!description || description.length < 80) {
    pushGap(
      gaps,
      "missing_public_summary",
      "A source-grounded public summary of at least 80 characters is required."
    )
  } else if (MACHINE_DESCRIPTION_PATTERN.test(description)) {
    pushGap(
      gaps,
      "machine_description",
      "Machine taxonomy labels cannot be used as public summaries."
    )
  }
  if (!serviceTitle) {
    pushGap(gaps, "missing_service", "At least one named service is required.")
  }
  if (!eligibility) {
    pushGap(
      gaps,
      "missing_eligibility",
      "State eligibility or explicitly state that the source does not specify it."
    )
  }
  if (!accessInstructions) {
    pushGap(
      gaps,
      "missing_access_instructions",
      "Explain how to access the service."
    )
  }
  if (!hasContact(record, fields) && !hasActionableLink(record, fields)) {
    pushGap(
      gaps,
      "missing_actionable_contact",
      "A provider contact or actionable provider/intake link is required."
    )
  }
  if (!hasLocation(record, fields)) {
    pushGap(
      gaps,
      "missing_location",
      "A physical location or service area is required."
    )
  }
  if (evidenceUrls.length === 0) {
    pushGap(gaps, "missing_source", "At least one source URL is required.")
  }
  if (providerEvidenceUrls.length === 0) {
    pushGap(
      gaps,
      "missing_provider_source",
      "A provider-facing or public information page is required.",
      false
    )
  }
  if (!hasUsefulHours(fields)) {
    pushGap(
      gaps,
      "missing_hours",
      "Hours or appointment availability are not stated.",
      false
    )
  }
  if (sourceComparisonCount === null || sourceComparisonCount < 2) {
    pushGap(
      gaps,
      "insufficient_source_comparisons",
      "Two completed source-comparison passes are required."
    )
  }
  if (verification.status !== "approved") {
    pushGap(
      gaps,
      "enrichment_not_verified",
      "The independent enrichment verification pass must approve the record."
    )
  }
  if (unsupportedClaims.length > 0) {
    pushGap(
      gaps,
      "unsupported_claims",
      "Unsupported claims must be removed or sourced."
    )
  }
  if (contradictions.length > 0) {
    pushGap(
      gaps,
      "source_contradictions",
      "Source contradictions must be resolved before publication."
    )
  }

  const blockingGaps = gaps.filter((gap) => gap.blocking)
  const score = Math.max(
    0,
    Math.round(
      100 - blockingGaps.length * 9 - (gaps.length - blockingGaps.length) * 2
    )
  )

  return {
    blockingGaps,
    evidenceUrls,
    gaps,
    providerEvidenceUrls,
    publishable: blockingGaps.length === 0,
    recordId: readString(
      record.id,
      record.sourceRecordId,
      record.source_record_id
    ),
    score,
    sourceName: readString(record.sourceName, record.source_name),
    title,
  }
}

export function summarizeResourceEnrichmentReadiness(results) {
  const gapCounts = {}
  const sourceCounts = {}
  let publishableRecords = 0

  for (const result of results) {
    if (result.publishable) publishableRecords += 1
    const source = result.sourceName ?? "Unknown source"
    sourceCounts[source] = (sourceCounts[source] ?? 0) + 1
    for (const gap of result.gaps) {
      gapCounts[gap.code] = (gapCounts[gap.code] ?? 0) + 1
    }
  }

  return {
    gapCounts,
    publishableRecords,
    sourceCounts,
    totalRecords: results.length,
  }
}

export function assertResourceRecordPublishable(record) {
  const result = analyzeResourceEnrichmentReadiness(record)
  if (result.publishable) return result

  const id = result.recordId ?? result.title ?? "unknown record"
  const codes = result.blockingGaps.map((gap) => gap.code).join(", ")
  throw new Error(`Resource ${id} is not publishable: ${codes}.`)
}
