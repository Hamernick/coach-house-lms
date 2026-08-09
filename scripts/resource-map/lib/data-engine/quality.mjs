import { readString } from "./shared.mjs"

function readFields(record) {
  return record.extractedFields ?? record.extracted_fields ?? {}
}

function readEvidence(record) {
  const value = record.fieldEvidence ?? record.field_evidence
  return Array.isArray(value) ? value : []
}

function readArrayField(value) {
  return Array.isArray(value) ? value : []
}

function isFailedLinkCheck(check) {
  if (!check || typeof check !== "object") return false
  if (check.ok === false) return true
  if (check.status === "failed" || check.status === "malformed") return true

  const statusCode = Number(check.status)
  return Number.isFinite(statusCode) && statusCode >= 400
}

function readLinkCheckFailures(record, fields) {
  return [
    ...readArrayField(record.linkChecks),
    ...readArrayField(record.link_checks),
    ...readArrayField(fields.linkChecks),
    ...readArrayField(fields.link_check_results),
    ...readArrayField(fields.dataQuality?.linkChecks),
    ...readArrayField(fields.data_quality?.link_checks),
  ].filter(isFailedLinkCheck)
}

function buildQualityEvidence(record, result) {
  const fields = readFields(record)
  const sourceUrl = readString(
    record.sourceUrl,
    record.source_url,
    fields.sourceUrl
  )
  const observedAt =
    record.lastScrapedAt ??
    record.last_scraped_at ??
    record.lastSeenAt ??
    record.last_seen_at ??
    new Date().toISOString()
  const derivedFrom = [
    "normalizedName",
    "normalizedDomain",
    "normalizedPhone",
    "normalizedEmail",
    "extractedFields.normalization",
    "extractedFields.taxonomyClassification",
    "lastSeenAt",
    "lastUpdatedAt",
    "lastVerifiedAt",
  ]

  return [
    {
      fieldPath: "trustScore",
      fieldValue: result.scoring.trustScore,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom,
      transformation: "score_record_trust",
    },
    {
      fieldPath: "freshnessScore",
      fieldValue: result.scoring.freshnessScore,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["lastSeenAt", "lastUpdatedAt", "lastVerifiedAt"],
      transformation: "score_record_freshness",
    },
    {
      fieldPath: "confidenceScore",
      fieldValue: result.scoring.confidenceScore,
      confidenceScore: result.scoring.confidenceScore,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["trustScore", "freshnessScore", "confidenceScore"],
      transformation: "combine_record_confidence",
    },
    {
      fieldPath: "reasonCodes",
      fieldValue: result.scoring.reasonCodes,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom,
      transformation: "score_reason_codes",
    },
    {
      fieldPath: "qualityFlags",
      fieldValue: result.flags,
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["trustScore", "freshnessScore", "extractedFields"],
      transformation: "build_data_quality_flags",
    },
    {
      fieldPath: "extractedFields.dataQuality",
      fieldValue: {
        schemaVersion: 1,
        flags: result.flags,
        trustScore: result.scoring.trustScore,
        freshnessScore: result.scoring.freshnessScore,
        confidenceScore: result.scoring.confidenceScore,
        reasonCodes: result.scoring.reasonCodes,
        needsReview: result.needsReview,
      },
      confidenceScore: 80,
      sourceUrl,
      observedAt,
      evidenceType: "derived",
      derivedFrom: ["qualityFlags", "trustScore", "freshnessScore"],
      transformation: "attach_quality_metadata",
    },
  ]
}

function ageDays(value, now = new Date()) {
  const timestamp = new Date(value ?? "").getTime()
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86_400_000))
}

function hasOfficialDomain(...values) {
  return values.some((value) => {
    const raw = readString(value)
    if (!raw) return false
    try {
      const host = new URL(raw).hostname.toLowerCase()
      return host.endsWith(".gov") || host.endsWith(".edu")
    } catch {
      return /\.gov(\/|$)|\.edu(\/|$)/u.test(raw)
    }
  })
}

function classifySourceAuthority(source) {
  const trust = readString(source?.trustLevel, source?.trust_level)
  const sourceType = readString(source?.sourceType, source?.source_type)
  const connectorType = readString(
    source?.connectorType,
    source?.connector_type
  )
  const metadata = source?.metadata ?? {}
  const verified =
    source?.publicDisplayAllowed === true ||
    source?.public_display_allowed === true ||
    metadata.publicDisplayAllowed === true ||
    metadata.termsVerified === true

  const officialDomain = hasOfficialDomain(
    source?.homepageUrl,
    source?.homepage_url,
    source?.rawUrl,
    source?.raw_url,
    source?.apiEndpoint,
    source?.api_endpoint,
    source?.url
  )

  if (trust === "official" && verified && officialDomain) {
    return { score: 35, reasonCodes: ["official_government_source"] }
  }
  if (trust === "official" && verified) {
    return { score: 30, reasonCodes: ["official_source_verified"] }
  }
  if (trust === "official") {
    return { score: 18, reasonCodes: ["official_source_unverified"] }
  }
  if (trust === "partner" && verified) {
    return { score: 26, reasonCodes: ["partner_source_verified"] }
  }
  if (trust === "partner") {
    return { score: 18, reasonCodes: ["partner_source_unverified"] }
  }
  if (sourceType === "directory") {
    return { score: verified ? 18 : 12, reasonCodes: ["known_directory"] }
  }
  if (trust === "community") {
    return { score: 10, reasonCodes: ["community_source"] }
  }
  if (sourceType === "scrape" || connectorType === "playwright_scrape") {
    return { score: 2, reasonCodes: ["scraped_third_party_source"] }
  }
  if (sourceType === "api" || sourceType === "csv" || sourceType === "excel") {
    return { score: 8, reasonCodes: ["structured_source_unverified"] }
  }

  return { score: 0, reasonCodes: ["source_authority_unknown"] }
}

export function scoreRecord(record, source = {}) {
  const fields = readFields(record)
  const reasons = []
  const authority = classifySourceAuthority(source)
  let trustScore = 40 + authority.score
  reasons.push(...authority.reasonCodes)
  const metadata = source?.metadata ?? {}
  const displayVerified =
    source?.publicDisplayAllowed === true ||
    source?.public_display_allowed === true ||
    metadata.publicDisplayAllowed === true ||
    metadata.termsVerified === true
  if (record.normalizedDomain) {
    trustScore += 8
    reasons.push("has_website_domain")
  }
  if (record.normalizedPhone || record.normalizedEmail) {
    trustScore += 6
    reasons.push("has_contact")
  }
  if (source?.trustLevel === "official" || source?.trust_level === "official") {
    reasons.push(
      displayVerified
        ? "official_source_verified"
        : "official_source_unverified"
    )
    if (!displayVerified) trustScore -= 8
  }
  if (source?.sourceType === "scrape" || source?.source_type === "scrape") {
    trustScore -= 8
    reasons.push("scraped_source")
  }
  if (fields.dedupe?.reviewNeeded) {
    trustScore -= 6
    reasons.push("uncertain_duplicate_match")
  }
  if (fields.dedupe?.conflicts?.length) {
    trustScore -= Math.min(fields.dedupe.conflicts.length * 6, 18)
    reasons.push("field_conflicts")
  }
  const linkCheckFailures = readLinkCheckFailures(record, fields)
  if (linkCheckFailures.length) {
    trustScore -= Math.min(linkCheckFailures.length * 6, 18)
    reasons.push("broken_links")
  }
  if (fields.normalization?.warnings?.length) {
    trustScore -= fields.normalization.warnings.length * 4
    reasons.push("normalization_warnings")
  }

  const observedAt =
    record.lastVerifiedAt ??
    record.last_verified_at ??
    record.lastUpdatedAt ??
    record.last_updated_at ??
    record.lastSeenAt ??
    record.last_seen_at
  const daysOld = ageDays(observedAt)
  let freshnessScore = 50
  if (daysOld === null) {
    reasons.push("freshness_unknown")
  } else if (daysOld <= 30) {
    freshnessScore = 95
    reasons.push("recent_fetch")
  } else if (daysOld <= 90) {
    freshnessScore = 80
  } else if (daysOld <= 365) {
    freshnessScore = 60
  } else {
    freshnessScore = 25
    reasons.push("stale_source")
  }
  const cadence = readString(source?.refreshCadence, source?.refresh_cadence)
  if (cadence && daysOld !== null) {
    const expectedDays =
      cadence === "daily"
        ? 2
        : cadence === "weekly"
          ? 14
          : cadence === "monthly"
            ? 45
            : cadence === "quarterly"
              ? 120
              : null
    if (expectedDays && daysOld > expectedDays) {
      freshnessScore = Math.min(freshnessScore, 55)
      reasons.push("overdue_refresh_cadence")
    }
  }

  const confidenceScore = Math.round(
    (Math.max(0, Math.min(100, trustScore)) +
      Math.max(0, Math.min(100, freshnessScore)) +
      Number(record.confidenceScore ?? record.confidence_score ?? 70)) /
      3
  )

  return {
    trustScore: Math.max(0, Math.min(100, Math.round(trustScore))),
    freshnessScore,
    confidenceScore,
    reasonCodes: [...new Set(reasons)],
    needsReview: confidenceScore < 75 || trustScore < 65,
  }
}

export function buildQualityFlags(record, source = {}, duplicate = null) {
  const fields = readFields(record)
  const taxonomy = fields.taxonomyClassification
  const linkCheckFailures = readLinkCheckFailures(record, fields)
  const locationType = readString(fields.locationType, fields.location_type)
  const flags = []

  if (duplicate?.reviewNeeded) {
    flags.push({
      code: "uncertain_duplicate_match",
      severity: "review",
      message: "Potential duplicate requires review.",
    })
  }
  if (duplicate?.conflicts?.length) {
    flags.push({
      code: "field_conflict",
      severity: "review",
      message: `Duplicate candidate has conflicting fields: ${duplicate.conflicts.join(", ")}.`,
    })
  }
  if (!fields.category && !fields.resourceCategories?.length) {
    flags.push({
      code: "missing_category",
      severity: "review",
      message: "No canonical resource category was assigned.",
    })
  }
  if (
    !fields.address &&
    locationType !== "online" &&
    locationType !== "service_area"
  ) {
    flags.push({
      code: "missing_address",
      severity: "warning",
      message: "No physical address is present.",
    })
  }
  if (
    !record.normalizedPhone &&
    !record.normalizedEmail &&
    !fields.websiteUrl
  ) {
    flags.push({
      code: "missing_contact_method",
      severity: "review",
      message: "No phone, email, or website is available.",
    })
  }
  if (fields.geocodingAccuracy === "not_attempted") {
    flags.push({
      code: "geocode_unattempted",
      severity: "info",
      message: "Geocoding was not attempted for this record.",
    })
  } else if (fields.geocodingAccuracy === "service_area_only") {
    flags.push({
      code: "service_area_only",
      severity: "info",
      message: "Resource serves an area but does not have a point location.",
    })
  } else if (
    fields.geocodingConfidence === 0 ||
    ["failed", "invalid_source_coordinates"].includes(fields.geocodingAccuracy)
  ) {
    flags.push({
      code: "bad_geocode",
      severity: "warning",
      message: "Geocoding could not resolve this resource.",
    })
  }
  if (fields.normalization?.warnings?.includes("hours_unparseable")) {
    flags.push({
      code: "conflicting_hours",
      severity: "review",
      message: "Hours were present but could not be normalized.",
    })
  }
  if (linkCheckFailures.length) {
    flags.push({
      code: "broken_url",
      severity: "review",
      message: `${linkCheckFailures.length} URL${
        linkCheckFailures.length === 1 ? "" : "s"
      } failed link validation.`,
    })
  }
  if (!fields.eligibility) {
    flags.push({
      code: "unclear_eligibility",
      severity: "info",
      message: "Eligibility requirements are not stated.",
    })
  }
  const scoring = scoreRecord(record, source)
  if (scoring.reasonCodes.includes("freshness_unknown")) {
    flags.push({
      code: "freshness_unknown",
      severity: "review",
      message: "Source update or verification age is unknown.",
    })
  }
  if (scoring.freshnessScore < 50) {
    flags.push({
      code: "stale_source",
      severity: "review",
      message: "Source evidence is stale or missing.",
    })
  }
  if (scoring.trustScore < 65) {
    flags.push({
      code: "low_trust",
      severity: "review",
      message: "Source authority or record confidence is low.",
    })
  }
  if (source?.sourceType === "scrape" || source?.source_type === "scrape") {
    flags.push({
      code: "scraped_only_evidence",
      severity: "info",
      message: "Record evidence comes from scraping only.",
    })
  }
  if (taxonomy?.needsReview) {
    flags.push({
      code: "low_confidence_category",
      severity: "review",
      message: "Taxonomy classifier marked the category as low confidence.",
    })
  }

  return {
    scoring,
    flags,
    flagCodes: flags.map((flag) => flag.code),
    needsReview:
      scoring.needsReview || flags.some((flag) => flag.severity === "review"),
  }
}

export function attachQuality(record, source, duplicate) {
  const result = buildQualityFlags(record, source, duplicate)
  const qualityEvidence = buildQualityEvidence(record, result)
  return {
    ...record,
    confidenceScore: result.scoring.confidenceScore,
    trustScore: result.scoring.trustScore,
    freshnessScore: result.scoring.freshnessScore,
    reasonCodes: result.scoring.reasonCodes,
    needsReview: result.needsReview,
    qualityFlags: result.flags,
    fieldEvidence: [...readEvidence(record), ...qualityEvidence],
    extractedFields: {
      ...readFields(record),
      dataQuality: {
        schemaVersion: 1,
        flags: result.flags,
        trustScore: result.scoring.trustScore,
        freshnessScore: result.scoring.freshnessScore,
        confidenceScore: result.scoring.confidenceScore,
        reasonCodes: result.scoring.reasonCodes,
        needsReview: result.needsReview,
      },
    },
  }
}
