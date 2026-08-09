import type { PublicMapResourceLink } from "./resource-map-items"

function parsePublicMapResourceUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function hasPublicMapResourceSearchParam(
  search: URLSearchParams,
  values: string[]
) {
  const keys = new Set([...search.keys()].map((key) => key.toLowerCase()))
  return values.some((value) => keys.has(value.toLowerCase()))
}

function isPublicMapSocrataApiUrl(host: string, pathname: string) {
  return (
    host.startsWith("data.") &&
    /\/resource\/[^/]+\.(?:csv|geojson|json)$/i.test(pathname)
  )
}

export function isPublicMapTechnicalSourceUrl(
  value: string | null | undefined
) {
  const url = parsePublicMapResourceUrl(value)
  if (!url) return false

  const host = url.hostname.toLowerCase()
  const pathname = url.pathname.toLowerCase()
  const search = url.searchParams

  if (
    host === "overpass-api.de" ||
    (pathname === "/api/interpreter" &&
      hasPublicMapResourceSearchParam(search, ["data"]))
  ) {
    return true
  }

  if (
    (host === "wikidata.org" || host === "www.wikidata.org") &&
    (pathname.startsWith("/entity/") || pathname.includes("/sparql"))
  ) {
    return true
  }

  if (host.startsWith("api.") || host.includes(".api.")) return true
  if (isPublicMapSocrataApiUrl(host, pathname)) return true

  if (
    pathname.includes("/arcgis/rest/services/") ||
    pathname.includes("/featureserver/") ||
    pathname.includes("/mapserver/")
  ) {
    return true
  }

  if (
    host.includes("arcgis.com") &&
    (pathname.endsWith("/query") ||
      search.get("f")?.toLowerCase() === "json" ||
      hasPublicMapResourceSearchParam(search, [
        "where",
        "outFields",
        "returnGeometry",
      ]))
  ) {
    return true
  }

  return false
}

export function shouldShowPublicMapResourceLink(
  link: Pick<PublicMapResourceLink, "url"> &
    Partial<Pick<PublicMapResourceLink, "type">>
) {
  if (link.type === "source") return false
  return !isPublicMapTechnicalSourceUrl(link.url)
}
