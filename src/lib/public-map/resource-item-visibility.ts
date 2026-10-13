import type { ExternalResourceMapItem } from "./resource-map-items"

const WIKIDATA_SOURCE_PATTERN = /\bwikidata\b/i
function isWikidataResourceItem(item: ExternalResourceMapItem) {
  return (
    WIKIDATA_SOURCE_PATTERN.test(item.sourceLabel ?? "") ||
    WIKIDATA_SOURCE_PATTERN.test(item.sourceUrl ?? "")
  )
}

// Historical resource-map RLS runs left published fixtures behind. Match their
// complete identity, not a broad name/domain rule that could hide real services.
function isResourceMapRlsFixture(item: ExternalResourceMapItem) {
  const normalize = (value: string | null) => value?.trim().replace(/\s+/g, " ").toLowerCase()
  if (normalize(item.title) !== "rls resource service" || normalize(item.subtitle) !== "rls resource org") return false
  try {
    const source = new URL(item.sourceUrl ?? "")
    return source.hostname === "example.org" && source.pathname.replace(/\/$/, "") === "/service"
  } catch {
    return false
  }
}

export function shouldShowPublicMapResourceItem(item: ExternalResourceMapItem) {
  return !isWikidataResourceItem(item) && !isResourceMapRlsFixture(item)
}
