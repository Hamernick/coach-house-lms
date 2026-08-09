const METHOD_VERSION = "retained-community-reference-source-v1"

const SOURCE_IDS = new Set([
  "chicago-love-fridge-community-fridges",
  "chicago-osm-community-libraries",
  "chicago-osm-food-access",
  "chicago-osm-health-care",
  "chicago-osm-shelters",
  "chicago-wikidata-public-resources",
  "nyc-fridgefinder-community-fridges",
])

const PROVENANCE_HOSTS = new Set([
  "fridgefinder.app",
  "overpass-api.de",
  "wikidata.org",
])

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

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function normalizeUrl(value) {
  const candidate = readString(value)
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null
    }
    url.hash = ""
    return url.toString().replace(/\/$/u, "")
  } catch {
    return null
  }
}

function comparableUrl(value) {
  return (
    normalizeUrl(value)
      ?.replace(/^http:/u, "https:")
      .toLowerCase() ?? null
  )
}

function hostWithoutWww(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./u, "")
  } catch {
    return null
  }
}

function explicitProvenanceUrls(raw) {
  return unique([raw.sourceUrl, raw.source_url].map(normalizeUrl))
}

function providerUrl(raw) {
  const provenance = new Set(
    explicitProvenanceUrls(raw).map(comparableUrl).filter(Boolean)
  )
  const candidates = [
    raw.website,
    raw["contact:website"],
    raw.url,
    raw.websiteUrl,
    raw.website_url,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate)
    if (!normalized) continue
    if (provenance.has(comparableUrl(normalized))) continue
    if (PROVENANCE_HOSTS.has(hostWithoutWww(normalized))) continue
    return normalized
  }
  return null
}

function normalizePhone(raw) {
  return (
    readString(raw.phone, raw["contact:phone"])?.replace(/\s+/gu, " ") ?? null
  )
}

function normalizeEmail(raw) {
  const email = readString(raw.email, raw["contact:email"])?.toLowerCase()
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : null
}

function humanize(value) {
  return (
    readString(value)?.replace(/[_-]+/gu, " ").replace(/\s+/gu, " ") ?? null
  )
}

function retainedClassification(sourceId, raw) {
  if (sourceId === "chicago-wikidata-public-resources") {
    return readString(raw.description, raw.sourceCategoryText, raw.category)
  }
  if (sourceId.includes("fridge")) return "community fridge"
  return humanize(
    readString(
      raw.category,
      raw.sourceCategoryText,
      raw.healthcare,
      raw.social_facility,
      raw.amenity
    )
  )
}

function fallbackTitle(sourceId, classification) {
  if (sourceId === "chicago-osm-food-access") return "Unnamed food bank listing"
  if (sourceId === "chicago-osm-health-care") {
    return `Unnamed ${classification ?? "health care"} listing`
  }
  if (sourceId === "chicago-osm-community-libraries") {
    return "Unnamed community resource listing"
  }
  return "Unnamed community resource listing"
}

function titleFor(record, raw, fields, classification) {
  return (
    readString(
      raw.title,
      raw.name,
      fields.serviceTitle,
      fields.title,
      raw.organizationName,
      fields.organizationName
    ) ?? fallbackTitle(record.sourceId, classification)
  )
}

function categoryFields(sourceId, raw, fields) {
  if (sourceId === "chicago-osm-food-access") {
    return {
      category: "food",
      primaryResourceCategory: "food_food_pantries",
      resourceCategories: ["food_food_pantries", "food"],
      subcategory: "food_food_pantries",
    }
  }
  if (sourceId === "chicago-osm-shelters") {
    const homeless = readString(raw["social_facility:for"])
      ?.toLowerCase()
      .includes("homeless")
    return {
      category: "housing",
      primaryResourceCategory: "housing_emergency_shelter",
      resourceCategories: unique([
        "housing_emergency_shelter",
        homeless ? "housing_homeless_services" : null,
        "housing",
      ]),
      subcategory: "housing_emergency_shelter",
    }
  }
  if (sourceId === "chicago-osm-health-care") {
    const type = readString(raw.healthcare, raw.amenity)?.toLowerCase()
    const primary =
      type === "dentist"
        ? "health_dental"
        : type === "doctor"
          ? "health_primary_care"
          : type === "dialysis"
            ? "health_chronic_illness"
            : "health"
    return {
      category: "health",
      primaryResourceCategory: primary,
      resourceCategories:
        primary === "health" ? ["health"] : [primary, "health"],
      subcategory: primary === "health" ? null : primary,
    }
  }
  if (sourceId === "chicago-osm-community-libraries") {
    const isLibrary = readString(raw.amenity)?.toLowerCase() === "library"
    const primary = isLibrary
      ? "community_libraries"
      : "community_community_centers"
    return {
      category: "community",
      primaryResourceCategory: primary,
      resourceCategories: unique([
        primary,
        /sports_centre/iu.test(readString(raw.category) ?? "")
          ? "community_sports"
          : null,
        "community",
      ]),
      subcategory: primary,
    }
  }
  if (sourceId.includes("fridge")) {
    return {
      category: "food",
      primaryResourceCategory: "food_community_fridges",
      resourceCategories: ["food_community_fridges", "food", "community"],
      subcategory: "food_community_fridges",
    }
  }
  if (sourceId === "chicago-wikidata-public-resources") {
    const category = readString(raw.category)?.toLowerCase()
    if (category === "library") {
      return {
        category: "community",
        primaryResourceCategory: "community_libraries",
        resourceCategories: ["community_libraries", "community"],
        subcategory: "community_libraries",
      }
    }
    if (category === "hospital") {
      return {
        category: "health",
        primaryResourceCategory: "health",
        resourceCategories: ["health"],
        subcategory: null,
      }
    }
    if (category === "school") {
      return {
        category: "education",
        primaryResourceCategory: "education",
        resourceCategories: ["education"],
        subcategory: null,
      }
    }
    if (category === "nonprofit organization") {
      return {
        category: "organizations",
        primaryResourceCategory: "organizations",
        resourceCategories: ["organizations"],
        subcategory: null,
      }
    }
  }

  return {
    category: fields.category ?? null,
    primaryResourceCategory: fields.primaryResourceCategory ?? null,
    resourceCategories: readArray(fields.resourceCategories),
    subcategory: fields.subcategory ?? null,
  }
}

function reportSummary(raw) {
  const condition = readString(raw.latestFridgeReport?.condition)
  const timestamp = readString(raw.latestFridgeReport?.timestamp)
  const date = /^\d{4}-\d{2}-\d{2}/u.test(timestamp ?? "")
    ? timestamp.slice(0, 10)
    : null
  if (!condition) return "The retained source has no current condition report."
  return `A retained report marked it \"${condition}\"${date ? ` on ${date}` : ""}.`
}

function descriptionFor({ classification, raw, sourceId, title }) {
  if (sourceId === "nyc-fridgefinder-community-fridges") {
    return `${title} is listed in retained Fridge Finder data as a community fridge offering free food. ${reportSummary(raw)} Current location, condition, stock, and access require confirmation.`
  }
  if (sourceId === "chicago-love-fridge-community-fridges") {
    return `${title} is listed by The Love Fridge Chicago as a community fridge offering free food. Current location, condition, stock, and access require confirmation.`
  }
  if (sourceId === "chicago-wikidata-public-resources") {
    return `Retained Wikidata data describes ${title} as ${classification ?? "a public resource"}. Provider status, services, eligibility, and access details require confirmation.`
  }
  return `${title} appears in retained OpenStreetMap data as ${classification ?? "a community resource"}. Current services, eligibility, hours, and availability are not confirmed.`
}

function accessInstructions({
  address,
  email,
  phone,
  providerWebsite,
  sourceId,
}) {
  const location = address ? ` at ${address}` : ""
  const contactTypes = unique([
    phone ? "phone" : null,
    email ? "email" : null,
    providerWebsite ? "website" : null,
  ])
  const urgentPrefix = sourceId.includes("fridge")
    ? "Do not rely on retained directory status for current food availability. "
    : ""
  if (contactTypes.length > 0) {
    return `${urgentPrefix}Confirm current availability and access details with the provider by ${contactTypes.join(" or ")} before visiting${location}.`
  }
  return `${urgentPrefix}Confirm current availability and access details with the provider or an administrator before visiting${location}; the retained source does not include a provider contact method.`
}

function evidenceSnippet({ address, classification, raw, sourceId, title }) {
  return [
    title,
    classification,
    address,
    sourceId === "nyc-fridgefinder-community-fridges"
      ? readString(raw.latestFridgeReport?.condition)
      : null,
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 240)
}

function buildComparisons({ category, fields, raw, sourceUrl }) {
  const pairs = [
    ["title", readString(raw.title, raw.name), fields.title],
    [
      "description",
      readString(raw.description, raw.category),
      fields.description,
    ],
    ["address", readString(raw.address, fields.address), fields.address],
    ["phone", readString(raw.phone, raw["contact:phone"]), fields.phone],
    ["email", readString(raw.email, raw["contact:email"]), fields.email],
    [
      "websiteUrl",
      readString(raw.website, raw["contact:website"], raw.url, raw.websiteUrl),
      fields.websiteUrl,
    ],
    [
      "primaryResourceCategory",
      readString(raw.category, raw.sourceCategoryText),
      category.primaryResourceCategory,
    ],
  ]

  return pairs
    .filter(([, sourceValue, value]) => sourceValue || value)
    .map(([fieldPath, sourceValue, value]) => ({
      fieldPath,
      sourceUrl,
      sourceValue: sourceValue ?? null,
      status:
        readString(sourceValue)?.toLowerCase() ===
        readString(value)?.toLowerCase()
          ? "matched"
          : "normalized",
      value: value ?? null,
    }))
}

function buildFieldEvidence({ comparisons, now, sourceUrl }) {
  return comparisons
    .filter((comparison) => comparison.value !== null)
    .map((comparison) => ({
      confidenceScore: 70,
      derivedFrom: sourceUrl ? [sourceUrl] : [],
      evidenceMetadata: {
        manualReviewRequired: true,
        methodVersion: METHOD_VERSION,
        verificationStatus: "needs_review",
      },
      evidenceType: "derived",
      fieldPath: `extractedFields.${comparison.fieldPath}`,
      fieldValue: comparison.value,
      observedAt: now ?? null,
      sourceUrl,
      transformation: "retained_evidence_community_enrichment",
    }))
}

function requiredCorrections({ fields, record, titleWasFallback }) {
  const corrections = [
    "An administrator must verify current operating status, availability, and access with the provider.",
  ]
  if (!fields.phone && !fields.email && !fields.websiteUrl) {
    corrections.push("Add a provider-controlled phone, email, or website.")
  }
  if (titleWasFallback) corrections.push("Confirm the official resource name.")
  if (readArray(record.reasonCodes).includes("stale_source")) {
    corrections.push("Refresh the stale source evidence before publication.")
  }
  return corrections
}

function providerOrganization(raw, fields) {
  return readString(
    raw.organizationName,
    raw.operator,
    fields.organizationName,
    fields.providerName
  )
}

function retainedEvidenceUrl(record, raw, fields) {
  return readString(
    record.sourceUrl,
    record.source_url,
    raw.sourceUrl,
    fields.sourceUrl
  )
}

export function isCommunityResourceRecord(record) {
  return SOURCE_IDS.has(readString(record?.sourceId, record?.source_id))
}

export function enrichCommunityResourceRecord({ now, record }) {
  if (!isCommunityResourceRecord(record)) return record

  const raw = readObject(record.rawSnapshot ?? record.raw_snapshot)
  const originalFields = readObject(
    record.extractedFields ?? record.extracted_fields
  )
  const classification = retainedClassification(record.sourceId, raw)
  const title = titleFor(record, raw, originalFields, classification)
  const rawTitle = readString(raw.title, raw.name, raw.organizationName)
  const providerWebsite = providerUrl(raw)
  const phone = normalizePhone(raw)
  const email = normalizeEmail(raw)
  const category = categoryFields(record.sourceId, raw, originalFields)
  const description = descriptionFor({
    classification,
    raw,
    sourceId: record.sourceId,
    title,
  })
  const address = readString(raw.address, originalFields.address)
  const sourceUrl = retainedEvidenceUrl(record, raw, originalFields)
  const fields = {
    ...originalFields,
    accessInstructions: accessInstructions({
      address,
      email,
      phone,
      providerWebsite,
      sourceId: record.sourceId,
    }),
    address,
    category: category.category,
    description,
    email,
    intakeUrl: null,
    organizationName: providerOrganization(raw, originalFields),
    phone,
    primaryResourceCategory: category.primaryResourceCategory,
    providerName: providerOrganization(raw, originalFields),
    resourceCategories: category.resourceCategories,
    serviceDescription: description,
    serviceTitle: title,
    subcategory: category.subcategory,
    title,
    websiteUrl: providerWebsite,
  }
  const comparisons = buildComparisons({ category, fields, raw, sourceUrl })
  const corrections = requiredCorrections({
    fields,
    record,
    titleWasFallback: !rawTitle,
  })
  fields.enrichment = {
    draft: {
      citations: [
        {
          claimPaths: comparisons.map((comparison) => comparison.fieldPath),
          evidenceSnippet: evidenceSnippet({
            address,
            classification,
            raw,
            sourceId: record.sourceId,
            title,
          }),
          sourceUrl,
        },
      ],
      method: "deterministic_retained_evidence_normalization",
      methodVersion: METHOD_VERSION,
    },
    evidenceUrls: sourceUrl ? [sourceUrl] : [],
    fieldComparisonCount: comparisons.length,
    passes: [
      { name: "retained_source_field_comparison", status: "completed" },
      { name: "provider_status_verification", status: "needs_review" },
    ],
    schemaVersion: 1,
    sourceComparisonCount: sourceUrl ? 1 : 0,
    sourceComparisons: comparisons,
    verification: {
      claimChecks: comparisons.map((comparison) => ({
        claimPath: comparison.fieldPath,
        note: "Normalized only from retained source evidence; provider confirmation is still required.",
        sourceUrls: sourceUrl ? [sourceUrl] : [],
        status: "supported",
      })),
      contradictions: [],
      method: "manual_provider_verification_required",
      methodVersion: METHOD_VERSION,
      requiredCorrections: corrections,
      schemaVersion: 1,
      status: "needs_review",
      summary:
        "Retained source evidence was normalized deterministically, but source authority, current status, and provider contact still require administrator review.",
      unsupportedClaims: [],
    },
  }

  const existingEvidence = readArray(
    record.fieldEvidence ?? record.field_evidence
  ).filter(
    (item) =>
      item?.evidenceMetadata?.methodVersion !== METHOD_VERSION &&
      item?.transformation !== "retained_evidence_community_enrichment"
  )
  const enriched = {
    ...record,
    extractedFields: fields,
    fieldEvidence: [
      ...existingEvidence,
      ...buildFieldEvidence({ comparisons, now, sourceUrl }),
    ],
    needsReview: true,
  }
  if (now) enriched.lastEnrichedAt = now
  return enriched
}

export const COMMUNITY_RESOURCE_ENRICHMENT_METHOD_VERSION = METHOD_VERSION
