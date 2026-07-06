import type { ExternalResourceMapItem } from "./resource-map-items"

const WIKIDATA_SOURCE_PATTERN = /\bwikidata\b/i
const LOW_VALUE_INSTITUTION_PATTERN =
  /\b(?:business school|law school|medical school|graduate school|school of|university|college|high school|middle school|elementary school|academy|campus)\b/i
const RESOURCE_SERVICE_SIGNAL_PATTERN =
  /\b(?:nonprofit|not-for-profit|community center|library|clinic|hospital|health center|food|pantry|shelter|cooling|warming|hydration|resource|aid|assistance|social service|mutual aid|senior|youth|family)\b/i

const SERVICE_CATEGORY_PREFIXES = [
  "community_libraries",
  "emergency",
  "family",
  "finance",
  "food",
  "health",
  "housing",
  "legal",
  "safety",
]

function isWikidataResourceItem(item: ExternalResourceMapItem) {
  return (
    WIKIDATA_SOURCE_PATTERN.test(item.sourceLabel ?? "") ||
    WIKIDATA_SOURCE_PATTERN.test(item.sourceUrl ?? "")
  )
}

function hasServiceCategorySignal(item: ExternalResourceMapItem) {
  return item.resourceCategories.some((category) =>
    SERVICE_CATEGORY_PREFIXES.some(
      (prefix) => category === prefix || category.startsWith(`${prefix}_`)
    )
  )
}

function hasResourceServiceSignal(item: ExternalResourceMapItem) {
  const text = [item.title, item.subtitle, item.description]
    .filter(Boolean)
    .join(" ")

  return (
    RESOURCE_SERVICE_SIGNAL_PATTERN.test(text) || hasServiceCategorySignal(item)
  )
}

function isLowValueWikidataInstitutionItem(item: ExternalResourceMapItem) {
  if (!isWikidataResourceItem(item)) return false

  const text = [item.title, item.subtitle, item.description]
    .filter(Boolean)
    .join(" ")

  return (
    LOW_VALUE_INSTITUTION_PATTERN.test(text) && !hasResourceServiceSignal(item)
  )
}

export function shouldShowPublicMapResourceItem(item: ExternalResourceMapItem) {
  return !isLowValueWikidataInstitutionItem(item)
}
