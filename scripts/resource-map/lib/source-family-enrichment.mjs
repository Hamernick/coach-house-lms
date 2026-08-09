import {
  enrichCommunityResourceRecord,
  isCommunityResourceRecord,
} from "./community-resource-enrichment.mjs"
import {
  enrichCoolingCenterRecord,
  isCoolingCenterRecord,
} from "./cooling-center-enrichment.mjs"
const LIBRARY_SOURCE_ID = "chicago-socrata-public-libraries"
const NYC_HEAT_SOURCE_IDS = new Set([
  "nyc-arcgis-cool-options",
  "nyc-arcgis-cooling-centers",
])

function recordKey(record) {
  const sourceId = String(record.sourceId ?? record.source_id ?? "")
  const recordId = String(
    record.sourceRecordId ?? record.source_record_id ?? record.id ?? ""
  )
  return `${sourceId}\u0000${recordId}`
}

export function buildReplacementRecordMap(records) {
  return new Map(records.map((record) => [recordKey(record), record]))
}

export function isNycHeatRecord(record) {
  const sourceId = String(record.sourceId ?? record.source_id ?? "")
  return NYC_HEAT_SOURCE_IDS.has(sourceId)
}

export function enrichSourceFamilyRecord({
  libraryRecordsByKey = new Map(),
  now,
  record,
}) {
  const sourceId = String(record.sourceId ?? record.source_id ?? "")
  if (sourceId === LIBRARY_SOURCE_ID) {
    const replacement = libraryRecordsByKey.get(recordKey(record))
    return {
      family: replacement ? "library" : "unmatched",
      record: replacement ?? record,
    }
  }
  if (isNycHeatRecord(record)) {
    return {
      family: "nyc_heat_held",
      record,
    }
  }
  if (isCoolingCenterRecord(record)) {
    return {
      family: "official_heat",
      record: enrichCoolingCenterRecord({ now, record }),
    }
  }
  if (isCommunityResourceRecord(record)) {
    return {
      family: "community_reference",
      record: enrichCommunityResourceRecord({ now, record }),
    }
  }
  return { family: "unmatched", record }
}

export function summarizeFamilyCounts(counts) {
  return Object.fromEntries(
    [...counts.entries()].sort((left, right) => left[0].localeCompare(right[0]))
  )
}
