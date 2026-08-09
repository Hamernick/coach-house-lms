import { readString } from "./shared.mjs"

function readFields(record) {
  return record.extractedFields ?? record.extracted_fields ?? {}
}

function coordinateDistanceMiles(a, b) {
  const aFields = readFields(a)
  const bFields = readFields(b)
  const lat1 = Number(aFields.latitude)
  const lon1 = Number(aFields.longitude)
  const lat2 = Number(bFields.latitude)
  const lon2 = Number(bFields.longitude)
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null

  const toRad = (value) => (value * Math.PI) / 180
  const radius = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(h))
}

function textSimilarity(left, right) {
  const leftTokens = new Set(
    String(left ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter(Boolean)
  )
  const rightTokens = new Set(
    String(right ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter(Boolean)
  )
  const union = new Set([...leftTokens, ...rightTokens])
  if (union.size === 0) return 0
  return (
    [...leftTokens].filter((token) => rightTokens.has(token)).length /
    union.size
  )
}

function readArrayField(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[;,|]/u)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

const SERVICE_NEUTRAL_CATEGORY_KEYS = new Set([
  "community",
  "community_libraries",
  "community_community_centers",
  "organizations",
])

function normalizeCategoryKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function readCategoryKeys(record) {
  const fields = readFields(record)
  return [
    fields.primaryResourceCategory,
    fields.primary_resource_category,
    fields.category,
    fields.subcategory,
    ...readArrayField(fields.resourceCategories),
    ...readArrayField(fields.resource_categories),
  ]
    .map(normalizeCategoryKey)
    .filter(Boolean)
}

function readServiceCategoryKeys(record) {
  return readCategoryKeys(record).filter(
    (key) => key.includes("_") && !SERVICE_NEUTRAL_CATEGORY_KEYS.has(key)
  )
}

function setsOverlap(left, right) {
  return left.some((entry) => right.includes(entry))
}

function compareServiceIntent(candidate, existing) {
  const candidateFields = readFields(candidate)
  const existingFields = readFields(existing)
  const candidateTitle = readString(
    candidateFields.title,
    candidateFields.serviceName,
    candidateFields.service_name
  )
  const existingTitle = readString(
    existingFields.title,
    existingFields.serviceName,
    existingFields.service_name
  )
  const titleSimilarity = textSimilarity(candidateTitle, existingTitle)
  const serviceCategoryOverlap = setsOverlap(
    readServiceCategoryKeys(candidate),
    readServiceCategoryKeys(existing)
  )
  const broadCategoryOverlap = setsOverlap(
    readCategoryKeys(candidate),
    readCategoryKeys(existing)
  )
  const titleMissing = !candidateTitle || !existingTitle
  const compatible =
    titleSimilarity >= 0.7 ||
    serviceCategoryOverlap ||
    (titleMissing && broadCategoryOverlap)
  const different =
    !titleMissing && titleSimilarity < 0.45 && !serviceCategoryOverlap

  return {
    broadCategoryOverlap,
    compatible,
    different,
    serviceCategoryOverlap,
    titleSimilarity,
  }
}

function compareRecords(candidate, existing) {
  const reasons = []
  let score = 0

  if (
    candidate.normalizedDomain &&
    candidate.normalizedDomain === existing.normalizedDomain
  ) {
    score += 35
    reasons.push("website_domain")
  }
  if (
    candidate.normalizedPhone &&
    candidate.normalizedPhone === existing.normalizedPhone
  ) {
    score += 25
    reasons.push("phone")
  }
  if (
    candidate.normalizedEmail &&
    candidate.normalizedEmail === existing.normalizedEmail
  ) {
    score += 25
    reasons.push("email")
  }
  if (
    candidate.normalizedAddress &&
    candidate.normalizedAddress === existing.normalizedAddress
  ) {
    score += 20
    reasons.push("address")
  }

  const nameSimilarity = textSimilarity(
    candidate.normalizedName,
    existing.normalizedName
  )
  if (nameSimilarity >= 0.8) {
    score += Math.round(nameSimilarity * 20)
    reasons.push("normalized_name")
  }

  const serviceSimilarity = textSimilarity(
    readFields(candidate).title,
    readFields(existing).title
  )
  if (serviceSimilarity >= 0.7) {
    score += Math.round(serviceSimilarity * 10)
    reasons.push("service_similarity")
  }

  const distance = coordinateDistanceMiles(candidate, existing)
  if (distance !== null && distance <= 0.1) {
    score += 15
    reasons.push("coordinate_proximity")
  }

  const serviceIntent = compareServiceIntent(candidate, existing)
  if (serviceIntent.serviceCategoryOverlap) reasons.push("service_category")
  if (serviceIntent.different) reasons.push("different_service")

  return {
    score: Math.min(100, score),
    reasons,
    distanceMiles: distance,
    serviceIntent,
  }
}

export function dedupeRecords(records) {
  const canonical = []
  const duplicates = []
  const preservedRecords = []
  const bySourceRecord = new Map()

  for (const record of records) {
    let currentRecord = record
    const sourceKey = [
      readString(
        currentRecord.sourceName,
        currentRecord.source_name,
        currentRecord.sourceId,
        currentRecord.source_id
      ),
      readString(currentRecord.sourceRecordId, currentRecord.source_record_id),
    ]
      .filter(Boolean)
      .join(":")
    if (sourceKey && bySourceRecord.has(sourceKey)) {
      const existing = bySourceRecord.get(sourceKey)
      const duplicate = {
        sourceRecordId: currentRecord.sourceRecordId,
        duplicateOf: existing.sourceRecordId,
        confidence: 100,
        reasons: ["source_cross_reference"],
        conflicts: buildConflicts(currentRecord, existing),
        reviewNeeded: false,
      }
      duplicates.push(duplicate)
      preservedRecords.push(
        attachDuplicate(currentRecord, duplicate, "duplicate")
      )
      continue
    }

    let best = null
    for (const existing of canonical) {
      const comparison = compareRecords(currentRecord, existing)
      const confidence =
        comparison.score >= 88 && comparison.serviceIntent.different
          ? Math.min(82, comparison.score)
          : comparison.score
      if (!best || confidence > best.confidence) {
        best = {
          sourceRecordId: currentRecord.sourceRecordId,
          duplicateOf: existing.sourceRecordId,
          confidence,
          reasons: comparison.reasons,
          conflicts: buildConflicts(currentRecord, existing),
          reviewNeeded:
            (comparison.score >= 60 && comparison.score < 88) ||
            (comparison.score >= 88 && comparison.serviceIntent.different),
        }
      }
    }

    if (best && best.confidence >= 88) {
      const duplicate = { ...best, reviewNeeded: false }
      duplicates.push(duplicate)
      preservedRecords.push(
        attachDuplicate(currentRecord, duplicate, "duplicate")
      )
      continue
    }
    if (best && best.reviewNeeded) {
      currentRecord = attachDuplicate(currentRecord, best, "candidate")
      duplicates.push(best)
    }
    canonical.push(currentRecord)
    preservedRecords.push(currentRecord)
    if (sourceKey) bySourceRecord.set(sourceKey, currentRecord)
  }

  return { canonicalRecords: canonical, preservedRecords, duplicates }
}

function attachDuplicate(record, duplicate, status) {
  return {
    ...record,
    duplicateMatchStatus: status,
    duplicateCandidate: duplicate,
    extractedFields: {
      ...readFields(record),
      dedupe: {
        schemaVersion: 1,
        status,
        duplicateOf: duplicate.duplicateOf,
        duplicateConfidence: duplicate.confidence,
        reasons: duplicate.reasons,
        conflicts: duplicate.conflicts ?? [],
        reviewNeeded: duplicate.reviewNeeded,
      },
    },
  }
}

function buildConflicts(left, right) {
  const conflicts = []
  for (const field of [
    "phone",
    "email",
    "websiteUrl",
    "hours",
    "title",
    "description",
  ]) {
    const leftValue = readFields(left)[field]
    const rightValue = readFields(right)[field]
    if (
      leftValue &&
      rightValue &&
      JSON.stringify(leftValue) !== JSON.stringify(rightValue)
    ) {
      conflicts.push(field)
    }
  }
  const leftCategories = readServiceCategoryKeys(left)
  const rightCategories = readServiceCategoryKeys(right)
  if (
    leftCategories.length &&
    rightCategories.length &&
    !setsOverlap(leftCategories, rightCategories)
  ) {
    conflicts.push("category")
  }
  return conflicts
}
