function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value
  }
  return []
}

function readNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function readBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") return value
    if (typeof value === "string" && value.trim()) {
      if (["1", "true", "yes", "on"].includes(value.toLowerCase())) {
        return true
      }
      if (["0", "false", "no", "off"].includes(value.toLowerCase())) {
        return false
      }
    }
  }
  return null
}

function normalizeFlag(flag) {
  if (typeof flag === "string" && flag.trim()) {
    return {
      code: flag.trim(),
      severity: "review",
    }
  }
  return readObject(flag)
}

function normalizeQualityFlags(value) {
  return readArray(value)
    .map(normalizeFlag)
    .filter((flag) => Object.keys(flag).length > 0)
}

function normalizeReasonCodes(value) {
  return readArray(value)
    .map((code) => (typeof code === "string" ? code.trim() : ""))
    .filter(Boolean)
}

function inferNeedsReview(qualityFlags) {
  return qualityFlags.some((flag) => flag.severity === "review")
}

export function buildQualityImportFields(record, extractedFields = {}) {
  const dataQuality = readObject(
    extractedFields.dataQuality ?? extractedFields.data_quality
  )
  const qualityFlags = normalizeQualityFlags(
    record.qualityFlags ?? record.quality_flags ?? dataQuality.flags
  )
  const reasonCodes = normalizeReasonCodes(
    record.reasonCodes ?? record.reason_codes ?? dataQuality.reasonCodes
  )
  const explicitNeedsReview = readBoolean(
    record.needsReview,
    record.needs_review,
    dataQuality.needsReview,
    dataQuality.needs_review
  )

  return {
    trust_score: readNumber(
      record.trustScore,
      record.trust_score,
      dataQuality.trustScore,
      dataQuality.trust_score
    ),
    freshness_score: readNumber(
      record.freshnessScore,
      record.freshness_score,
      dataQuality.freshnessScore,
      dataQuality.freshness_score
    ),
    quality_flags: qualityFlags,
    reason_codes: reasonCodes,
    needs_review: explicitNeedsReview ?? inferNeedsReview(qualityFlags),
  }
}
