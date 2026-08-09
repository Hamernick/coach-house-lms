import type { ExternalResourceMapItem } from "./resource-map-items"

const WIKIDATA_SOURCE_PATTERN = /\bwikidata\b/i
function isWikidataResourceItem(item: ExternalResourceMapItem) {
  return (
    WIKIDATA_SOURCE_PATTERN.test(item.sourceLabel ?? "") ||
    WIKIDATA_SOURCE_PATTERN.test(item.sourceUrl ?? "")
  )
}

export function shouldShowPublicMapResourceItem(item: ExternalResourceMapItem) {
  return !isWikidataResourceItem(item)
}
