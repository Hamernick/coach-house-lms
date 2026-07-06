import { nowIso, readArray, readString, sha256 } from "./shared.mjs"
import { classifyResourceTaxonomy } from "./taxonomy-classifier.mjs"

const DAY_ALIASES = new Map([
  ["mon", "monday"],
  ["monday", "monday"],
  ["tue", "tuesday"],
  ["tues", "tuesday"],
  ["tuesday", "tuesday"],
  ["wed", "wednesday"],
  ["wednesday", "wednesday"],
  ["thu", "thursday"],
  ["thur", "thursday"],
  ["thurs", "thursday"],
  ["thursday", "thursday"],
  ["fri", "friday"],
  ["friday", "friday"],
  ["sat", "saturday"],
  ["saturday", "saturday"],
  ["sun", "sunday"],
  ["sunday", "sunday"],
])

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const AVAILABILITY_STATUSES = new Set([
  "unknown",
  "available",
  "limited",
  "appointment_only",
  "waitlist",
  "temporarily_closed",
  "seasonal",
  "closed",
])

export function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(inc|incorporated|llc|ltd|corp|corporation|nonprofit)\b/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizePhone(value) {
  const raw = readString(value)
  if (!raw) return null
  const extension = raw.match(/(?:ext\.?|x)\s*(\d+)$/i)?.[1]
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 10)
    return extension ? `+1${digits}x${extension}` : `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) {
    const base = `+${digits}`
    return extension ? `${base}x${extension}` : base
  }
  return digits || null
}

export function normalizeEmail(value) {
  const raw = readString(value)?.toLowerCase()
  if (!raw) return null
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(raw) ? raw : null
}

export function normalizeUrl(value) {
  const raw = readString(value)
  if (!raw) return null
  if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) {
    return null
  }

  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`https://${raw}`)
    url.hash = ""
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) url.searchParams.delete(key)
    }
    const normalized = url.toString().replace(/\/$/u, "")
    return normalized
  } catch {
    return null
  }
}

export function normalizeDomain(value) {
  const normalizedUrl = normalizeUrl(value)
  if (!normalizedUrl) return null
  try {
    return new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return normalizedUrl
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
  }
}

export function normalizeAddress(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#.-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeState(value) {
  const raw = readString(value)
  if (!raw) return null
  return raw.length === 2 ? raw.toUpperCase() : raw
}

function normalizeLocationType(value) {
  const raw = readString(value)
  if (!raw) return null
  const normalized = raw
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (["online", "online only", "virtual"].includes(normalized)) return "online"
  if (
    ["service area", "service area only", "area served"].includes(normalized)
  ) {
    return "service_area"
  }
  return raw
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return false
  return ["1", "true", "yes", "y", "on", "required"].includes(
    value.trim().toLowerCase()
  )
}

function normalizeAvailabilityStatus(value) {
  const normalized = readString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  if (normalized === "open") return "available"
  return normalized && AVAILABILITY_STATUSES.has(normalized) ? normalized : null
}

function normalizeTime(value, role = "open", pairedValue = null) {
  const raw = readString(value)
  if (!raw) return null
  const compact = raw.toLowerCase().replace(/\./g, "").replace(/\s+/g, "")
  if (compact === "noon") return "12:00"
  if (compact === "midnight") return "00:00"
  const meridiem = compact.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/u)
  if (meridiem) {
    let hour = Number.parseInt(meridiem[1], 10)
    const minute = meridiem[2] ?? "00"
    if (meridiem[3] === "pm" && hour < 12) hour += 12
    if (meridiem[3] === "am" && hour === 12) hour = 0
    if (hour > 23 || Number.parseInt(minute, 10) > 59) return null
    return `${String(hour).padStart(2, "0")}:${minute}`
  }
  const twentyFour = compact.match(/^(\d{1,2}):(\d{2})$/u)
  if (twentyFour) {
    const hour = Number.parseInt(twentyFour[1], 10)
    const minute = Number.parseInt(twentyFour[2], 10)
    if (hour === 24 && minute === 0) return "24:00"
    if (hour > 23 || minute > 59) return null
    return `${twentyFour[1].padStart(2, "0")}:${twentyFour[2]}`
  }
  const plainHour = compact.match(/^(\d{1,2})$/u)
  if (plainHour) {
    let hour = Number.parseInt(plainHour[1], 10)
    const paired = readString(pairedValue)?.toLowerCase() ?? ""
    if (role === "close" && hour <= 7) hour += 12
    if (role === "close" && paired.includes("pm") && hour < 12) hour += 12
    if (hour > 23) return null
    return `${String(hour).padStart(2, "0")}:00`
  }
  return null
}

function normalizeDays(value) {
  return readArray(value)
    .map((day) => DAY_ALIASES.get(String(day).toLowerCase()))
    .filter(Boolean)
}

function normalizeDayToken(value) {
  return DAY_ALIASES.get(
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z]/g, "")
  )
}

function expandDayRange(start, end) {
  const startIndex = DAY_ORDER.indexOf(start)
  const endIndex = DAY_ORDER.indexOf(end)
  if (startIndex === -1 || endIndex === -1) return []
  if (startIndex <= endIndex) return DAY_ORDER.slice(startIndex, endIndex + 1)
  return [...DAY_ORDER.slice(startIndex), ...DAY_ORDER.slice(0, endIndex + 1)]
}

function parseDayPhrase(value) {
  const raw = readString(value)
  if (!raw) return []
  const normalized = raw
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\bthrough\b/g, "-")
    .replace(/\bto\b/g, "-")
  if (/\b(24\/7|daily|every day|all days|all week)\b/u.test(normalized)) {
    return DAY_ORDER
  }

  const days = []
  for (const part of normalized
    .split(/\s*(?:,|\/|&|\band\b)\s*/u)
    .map((entry) => entry.trim())
    .filter(Boolean)) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(normalizeDayToken)
      days.push(...expandDayRange(start, end))
      continue
    }
    const day = normalizeDayToken(part)
    if (day) days.push(day)
  }
  return [...new Set(days)]
}

function parseHoursTextSegment(segment) {
  const normalized = readString(segment)?.replace(/[–—]/g, "-")
  if (!normalized) return null
  if (/\b(24\/7|24 hours|open 24)\b/iu.test(normalized)) {
    return {
      days: DAY_ORDER,
      opensAt: "00:00",
      closesAt: "24:00",
    }
  }

  const timePattern =
    "(midnight|noon|\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)?)"
  const match = normalized.match(
    new RegExp(
      `^([\\s\\S]*?)\\b${timePattern}\\s*(?:-|to|until)\\s*${timePattern}\\b`,
      "iu"
    )
  )
  if (!match) return null
  const days = parseDayPhrase(match[1])
  if (days.length === 0) return null

  const opensAt = normalizeTime(match[2], "open", match[3])
  const closesAt = normalizeTime(match[3], "close", match[2])
  if (!opensAt || !closesAt || opensAt === closesAt) return null

  return { days, opensAt, closesAt }
}

function inferAvailabilityFromHoursLabel(value) {
  const label = readString(value)
  if (!label) return {}
  const normalized = label.toLowerCase()
  if (
    /\bappointment(?:s)?\s+(?:only|required)|by appointment\b/u.test(normalized)
  ) {
    return { appointmentRequired: true, availabilityStatus: "appointment_only" }
  }
  if (/\btemporarily closed|closed until\b/u.test(normalized)) {
    return { availabilityStatus: "temporarily_closed" }
  }
  if (/\bwaitlist\b/u.test(normalized))
    return { availabilityStatus: "waitlist" }
  if (/\bclosed\b/u.test(normalized) && !/\bclosed at\b/u.test(normalized)) {
    return { availabilityStatus: "closed" }
  }
  return {}
}

function parseHoursLabel(value) {
  const label = readString(value)
  if (!label) return []
  return label
    .split(/\s*(?:;|\n)\s*/u)
    .map(parseHoursTextSegment)
    .filter(Boolean)
}

function normalizeHours(hours, warnings) {
  if (!hours) return {}
  if (typeof hours === "string") {
    const weekly = parseHoursLabel(hours)
    if (weekly.length === 0) {
      const availability = inferAvailabilityFromHoursLabel(hours)
      if (
        !availability.appointmentRequired &&
        !availability.availabilityStatus
      ) {
        warnings.push("hours_unparseable")
      }
    }
    return {
      schemaVersion: 1,
      label: hours,
      weekly,
      exceptions: [],
    }
  }
  if (typeof hours !== "object" || Array.isArray(hours)) return {}

  const weekly = readArray(hours.weekly)
    .map((entry) => ({
      days: normalizeDays(entry.days),
      opensAt: normalizeTime(entry.opensAt ?? entry.opens_at),
      closesAt: normalizeTime(entry.closesAt ?? entry.closes_at, "close"),
    }))
    .filter((entry) => entry.days.length && entry.opensAt && entry.closesAt)

  if (readArray(hours.weekly).length && weekly.length === 0) {
    warnings.push("hours_unparseable")
  }

  return {
    schemaVersion: Number(hours.schemaVersion ?? hours.schema_version ?? 1),
    label: readString(hours.label) ?? undefined,
    weekly,
    exceptions: readArray(hours.exceptions),
  }
}

function normalizeCost(value) {
  const raw = readString(value)
  if (!raw) return { cost: null, free: null, costType: "unknown" }
  const lowered = raw.toLowerCase()
  if (/\b(free|no cost|without charge)\b/u.test(lowered)) {
    return { cost: raw, free: true, costType: "free" }
  }
  if (/sliding|income|scale/u.test(lowered)) {
    return { cost: raw, free: null, costType: "sliding_scale" }
  }
  if (/(\$|\bfee\b|\bcost\b|\bpaid\b)/u.test(lowered)) {
    return { cost: raw, free: false, costType: "paid" }
  }
  return { cost: raw, free: null, costType: "unknown" }
}

function readFields(record) {
  const fields =
    record.extractedFields ?? record.extracted_fields ?? record.fields ?? record
  return fields && typeof fields === "object" && !Array.isArray(fields)
    ? fields
    : {}
}

function hasEvidenceValue(value) {
  if (value === null || value === undefined || value === "") return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

function makeEvidence({
  fieldPath,
  fieldValue,
  sourceUrl,
  observedAt,
  confidenceScore = 80,
  evidenceType = "source",
  derivedFrom = [],
  transformation = null,
}) {
  if (!fieldPath || !hasEvidenceValue(fieldValue)) return null

  return {
    fieldPath,
    fieldValue,
    confidenceScore,
    sourceUrl,
    observedAt,
    evidenceType,
    derivedFrom,
    transformation,
  }
}

function buildEvidence(record, fields, observedAt, derivedEvidence = []) {
  const sourceUrl = readString(
    record.sourceUrl,
    record.source_url,
    fields.sourceUrl
  )
  const existing = readArray(record.fieldEvidence ?? record.field_evidence)
  const entries = []
  const keys = new Set()
  const existingSourcePaths = new Set()

  const addEvidence = (evidence) => {
    if (!evidence) return
    const fieldPath = readString(
      evidence.fieldPath,
      evidence.field_path,
      evidence.path
    )
    if (!fieldPath) return
    const key = [
      fieldPath,
      readString(evidence.evidenceType, evidence.evidence_type) ?? "source",
      readString(evidence.transformation) ?? "",
      JSON.stringify(evidence.fieldValue ?? evidence.field_value ?? null),
    ].join("|")
    if (keys.has(key)) return
    keys.add(key)
    entries.push(evidence)
  }

  for (const evidence of existing) {
    const fieldPath = readString(
      evidence.fieldPath,
      evidence.field_path,
      evidence.path
    )
    const evidenceType = readString(
      evidence.evidenceType,
      evidence.evidence_type
    )
    const transformation = readString(evidence.transformation)
    if (
      fieldPath &&
      evidenceType === "source" &&
      transformation !== "source_field_passthrough"
    ) {
      existingSourcePaths.add(fieldPath)
    }
    addEvidence(evidence)
  }

  for (const [fieldPath, fieldValue] of Object.entries(fields)) {
    const normalizedFieldPath = `extractedFields.${fieldPath}`
    if (existingSourcePaths.has(normalizedFieldPath)) continue
    const evidence = makeEvidence({
      fieldPath: normalizedFieldPath,
      fieldValue,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      transformation: "source_field_passthrough",
    })
    addEvidence(evidence)
  }

  for (const evidence of derivedEvidence) {
    addEvidence(evidence)
  }

  return entries
}

function buildDerivedNormalizationEvidence({
  fields,
  enrichedFields,
  normalizedName,
  normalizedDomain,
  normalizedPhone,
  normalizedEmail,
  normalizedAddress,
  normalizedFingerprint,
  confidenceScore,
  sourceUrl,
  observedAt,
}) {
  return [
    makeEvidence({
      fieldPath: "normalizedName",
      fieldValue: normalizedName,
      confidenceScore: 88,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "extractedFields.canonicalName",
        "extractedFields.organizationName",
        "extractedFields.title",
      ],
      transformation: "normalize_name",
    }),
    makeEvidence({
      fieldPath: "normalizedDomain",
      fieldValue: normalizedDomain,
      confidenceScore: 88,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.websiteUrl"],
      transformation: "normalize_domain",
    }),
    makeEvidence({
      fieldPath: "extractedFields.websiteUrl",
      fieldValue: enrichedFields.websiteUrl,
      confidenceScore: 85,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.websiteUrl"],
      transformation: "normalize_url",
    }),
    makeEvidence({
      fieldPath: "extractedFields.domain",
      fieldValue: enrichedFields.domain,
      confidenceScore: 88,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.websiteUrl"],
      transformation: "normalize_domain",
    }),
    makeEvidence({
      fieldPath: "normalizedPhone",
      fieldValue: normalizedPhone,
      confidenceScore: 85,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.phone"],
      transformation: "normalize_phone",
    }),
    makeEvidence({
      fieldPath: "extractedFields.normalizedPhone",
      fieldValue: enrichedFields.normalizedPhone,
      confidenceScore: 85,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.phone"],
      transformation: "normalize_phone",
    }),
    makeEvidence({
      fieldPath: "normalizedEmail",
      fieldValue: normalizedEmail,
      confidenceScore: 85,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.email"],
      transformation: "normalize_email",
    }),
    makeEvidence({
      fieldPath: "extractedFields.email",
      fieldValue: enrichedFields.email,
      confidenceScore: 85,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.email"],
      transformation: "normalize_email",
    }),
    makeEvidence({
      fieldPath: "normalizedAddress",
      fieldValue: normalizedAddress,
      confidenceScore: 82,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "extractedFields.address",
        "extractedFields.city",
        "extractedFields.state",
        "extractedFields.postalCode",
      ],
      transformation: "normalize_address",
    }),
    makeEvidence({
      fieldPath: "normalizedFingerprint",
      fieldValue: normalizedFingerprint,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "normalizedName",
        "normalizedDomain",
        "normalizedPhone",
        "normalizedEmail",
        "normalizedAddress",
      ],
      transformation: "build_dedupe_fingerprint",
    }),
    makeEvidence({
      fieldPath: "confidenceScore",
      fieldValue: confidenceScore,
      confidenceScore,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "extractedFields.normalization.missingFlags",
        "extractedFields.normalization.warnings",
        "extractedFields.taxonomyClassification",
      ],
      transformation: "score_parse_confidence",
    }),
    makeEvidence({
      fieldPath: "extractedFields.normalization",
      fieldValue: enrichedFields.normalization,
      confidenceScore,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: Object.keys(fields).map((key) => `extractedFields.${key}`),
      transformation: "normalize_resource_fields",
    }),
    makeEvidence({
      fieldPath: "extractedFields.hours.weekly",
      fieldValue: enrichedFields.hours?.weekly,
      confidenceScore: enrichedFields.hours?.weekly?.length ? 82 : 0,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.hours"],
      transformation: "normalize_hours_label",
    }),
    makeEvidence({
      fieldPath: "extractedFields.appointmentRequired",
      fieldValue: enrichedFields.appointmentRequired,
      confidenceScore: 78,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "extractedFields.appointmentRequired",
        "extractedFields.hours",
      ],
      transformation: "normalize_availability",
    }),
    makeEvidence({
      fieldPath: "extractedFields.availabilityStatus",
      fieldValue: enrichedFields.availabilityStatus,
      confidenceScore: 78,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "extractedFields.availabilityStatus",
        "extractedFields.hours",
      ],
      transformation: "normalize_availability",
    }),
    makeEvidence({
      fieldPath: "extractedFields.taxonomyClassification",
      fieldValue: enrichedFields.taxonomyClassification,
      confidenceScore: enrichedFields.taxonomyClassification?.confidence,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: [
        "extractedFields.sourceCategoryText",
        "extractedFields.title",
        "extractedFields.organizationName",
        "extractedFields.description",
        "extractedFields.eligibility",
        "extractedFields.websiteUrl",
      ],
      transformation: "deterministic_taxonomy_classifier",
    }),
    makeEvidence({
      fieldPath: "extractedFields.category",
      fieldValue: enrichedFields.category,
      confidenceScore: enrichedFields.taxonomyClassification?.confidence,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.taxonomyClassification"],
      transformation: "deterministic_taxonomy_classifier",
    }),
    makeEvidence({
      fieldPath: "extractedFields.subcategory",
      fieldValue: enrichedFields.subcategory,
      confidenceScore: enrichedFields.taxonomyClassification?.confidence,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.taxonomyClassification"],
      transformation: "deterministic_taxonomy_classifier",
    }),
    makeEvidence({
      fieldPath: "extractedFields.resourceCategories",
      fieldValue: enrichedFields.resourceCategories,
      confidenceScore: enrichedFields.taxonomyClassification?.confidence,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.taxonomyClassification"],
      transformation: "deterministic_taxonomy_classifier",
    }),
    makeEvidence({
      fieldPath: "extractedFields.primaryResourceCategory",
      fieldValue: enrichedFields.primaryResourceCategory,
      confidenceScore: enrichedFields.taxonomyClassification?.confidence,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.taxonomyClassification"],
      transformation: "deterministic_taxonomy_classifier",
    }),
    makeEvidence({
      fieldPath: "extractedFields.free",
      fieldValue: enrichedFields.free,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["extractedFields.cost"],
      transformation: "normalize_cost",
    }),
  ]
}

export function normalizeCandidateRecord(record) {
  const fields = { ...readFields(record) }
  const observedAt =
    readString(
      record.lastScrapedAt,
      record.last_scraped_at,
      record.fetchedAt
    ) ?? nowIso()
  const warnings = []
  const missingFlags = []
  const websiteUrl = normalizeUrl(
    fields.websiteUrl ?? fields.website_url ?? fields.website
  )
  const phone = readString(fields.phone, fields.phoneNumber, fields.telephone)
  const email = readString(fields.email, fields.contactEmail)
  const title = readString(
    fields.title,
    fields.serviceTitle,
    fields.serviceName,
    fields.name
  )
  const organizationName = readString(
    fields.organizationName,
    fields.organization_name,
    fields.providerName,
    fields.provider_name,
    fields.name
  )
  const canonicalName = readString(
    fields.canonicalName,
    organizationName,
    title
  )
  const address = readString(
    fields.address,
    fields.fullAddress,
    fields.addressLine1,
    fields.streetAddress
  )
  const state = normalizeState(fields.state)
  const cost = normalizeCost(fields.cost)
  const hours = normalizeHours(fields.hours, warnings)
  const locationType = normalizeLocationType(
    fields.locationType ?? fields.location_type
  )
  const onlineOnly = fields.onlineOnly === true || fields.online_only === true
  const serviceArea = readArray(fields.serviceArea ?? fields.service_area)
  const pointLocationNotApplicable =
    locationType === "online" ||
    onlineOnly ||
    locationType === "service_area" ||
    serviceArea.length > 0
  const hoursAvailability = inferAvailabilityFromHoursLabel(
    typeof fields.hours === "string" ? fields.hours : fields.hours?.label
  )
  const appointmentRequired =
    normalizeBoolean(
      fields.appointmentRequired ?? fields.appointment_required
    ) || hoursAvailability.appointmentRequired === true
  const availabilityStatus =
    normalizeAvailabilityStatus(
      fields.availabilityStatus ?? fields.availability_status
    ) ??
    hoursAvailability.availabilityStatus ??
    (appointmentRequired
      ? "appointment_only"
      : hours.weekly?.length
        ? "available"
        : "unknown")

  if (!title) missingFlags.push("missing_service_name")
  if (!organizationName) missingFlags.push("missing_organization_name")
  if (
    !fields.category &&
    !fields.subcategory &&
    !fields.resourceCategories &&
    !fields.sourceCategoryText
  ) {
    missingFlags.push("missing_category")
  }
  if (
    !address &&
    !(fields.latitude && fields.longitude) &&
    !pointLocationNotApplicable
  ) {
    missingFlags.push("missing_address")
  }
  if (!phone && !email && !websiteUrl)
    missingFlags.push("missing_contact_method")

  const enrichedFields = {
    ...fields,
    organizationName,
    title,
    canonicalName,
    phone,
    normalizedPhone: normalizePhone(phone),
    email: normalizeEmail(email),
    websiteUrl,
    domain: normalizeDomain(websiteUrl),
    address,
    city: readString(fields.city),
    state,
    postalCode: readString(fields.postalCode, fields.postal_code),
    hours,
    timezone: readString(fields.timezone, fields.timeZone),
    appointmentRequired,
    availabilityStatus,
    availabilityNotes: readString(
      fields.availabilityNotes,
      fields.availability_notes
    ),
    temporaryClosedUntil: readString(
      fields.temporaryClosedUntil,
      fields.temporary_closed_until
    ),
    locationType,
    onlineOnly,
    eligibility: readString(fields.eligibility),
    serviceArea,
    coverageArea: readArray(fields.coverageArea ?? fields.coverage_area),
    cost: cost.cost,
    free: cost.free,
    languages: [...new Set(readArray(fields.languages).map(String))],
  }
  const taxonomy = classifyResourceTaxonomy({
    ...record,
    extractedFields: enrichedFields,
  })
  enrichedFields.category =
    taxonomy.resourceCategories.find((key) => !key.includes("_")) ??
    fields.category
  enrichedFields.subcategory =
    taxonomy.resourceCategories.find((key) => key.includes("_")) ??
    fields.subcategory
  enrichedFields.resourceCategories = taxonomy.resourceCategories
  enrichedFields.primaryResourceCategory = taxonomy.primaryResourceCategory
  enrichedFields.taxonomyClassification = taxonomy

  if (taxonomy.needsReview) warnings.push("taxonomy_needs_review")
  const searchableText = [
    enrichedFields.organizationName,
    enrichedFields.title,
    enrichedFields.description,
    enrichedFields.category,
    enrichedFields.subcategory,
    enrichedFields.address,
    enrichedFields.city,
    enrichedFields.state,
    enrichedFields.domain,
    ...readArray(enrichedFields.serviceArea),
    ...readArray(enrichedFields.languages),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  enrichedFields.normalization = {
    schemaVersion: 1,
    canonicalName,
    searchableText,
    costType: cost.costType,
    missingFlags,
    warnings,
  }

  const normalizedName = normalizeName(canonicalName)
  const normalizedDomain = normalizeDomain(websiteUrl)
  const normalizedPhone = normalizePhone(phone)
  const normalizedEmail = normalizeEmail(email)
  const normalizedAddress = normalizeAddress(
    [address, enrichedFields.city, state, enrichedFields.postalCode]
      .filter(Boolean)
      .join(" ")
  )
  const confidenceScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        missingFlags.length * 8 -
        warnings.length * 4 -
        (taxonomy.needsReview ? 10 : 0)
    )
  )
  const fieldConfidence = {
    ...(record.fieldConfidence ?? record.field_confidence ?? {}),
    organizationName: organizationName ? 90 : 0,
    title: title ? 90 : 0,
    category: taxonomy.confidence,
    resourceCategories: taxonomy.confidence,
    address: address ? 80 : 0,
    phone: normalizedPhone ? 85 : 0,
    email: normalizedEmail ? 85 : 0,
    websiteUrl: websiteUrl ? 85 : 0,
    hours: Object.keys(hours).length ? 70 : 0,
  }

  const normalizedFingerprint = [
    normalizedName,
    normalizedDomain,
    normalizedPhone,
    normalizedEmail,
    normalizedAddress,
  ]
    .filter(Boolean)
    .join("|")
  const sourceUrl = readString(
    record.sourceUrl,
    record.source_url,
    fields.sourceUrl
  )
  const derivedEvidence = buildDerivedNormalizationEvidence({
    fields,
    enrichedFields,
    normalizedName,
    normalizedDomain,
    normalizedPhone,
    normalizedEmail,
    normalizedAddress,
    normalizedFingerprint,
    confidenceScore,
    sourceUrl,
    observedAt,
  })

  return {
    ...record,
    sourceRecordId:
      readString(record.sourceRecordId, record.source_record_id, record.id) ??
      sha256(JSON.stringify(enrichedFields)).slice(0, 24),
    sourceUrl,
    rawSnapshot: record.rawSnapshot ?? record.raw_snapshot ?? record,
    normalizedName,
    normalizedDomain,
    normalizedPhone,
    normalizedEmail,
    normalizedAddress,
    normalizedFingerprint,
    confidenceScore,
    fieldConfidence,
    fieldEvidence: buildEvidence(
      record,
      enrichedFields,
      observedAt,
      derivedEvidence
    ),
    lastSeenAt:
      readString(record.lastSeenAt, record.last_seen_at) ?? observedAt,
    lastScrapedAt: observedAt,
    lastUpdatedAt: readString(record.lastUpdatedAt, record.last_updated_at),
    lastVerifiedAt: readString(record.lastVerifiedAt, record.last_verified_at),
    extractedFields: enrichedFields,
  }
}
