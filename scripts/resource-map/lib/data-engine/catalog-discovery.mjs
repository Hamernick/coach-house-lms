import { readFileSync } from "node:fs"

import {
  CONNECTOR_TYPES,
  nowIso,
  readArgList,
  readBoolean,
  readString,
  resolveLocalPath,
  sha256,
  slugify,
} from "./shared.mjs"

export const CATALOG_DISCOVERY_PROVIDERS = [
  "ckan",
  "data_gov",
  "socrata",
  "arcgis",
  "github",
  "common_crawl",
  "sitemap",
  "robots",
]

const PROVIDER_LABELS = {
  ckan: "CKAN catalog",
  data_gov: "Data.gov catalog",
  socrata: "Socrata catalog",
  arcgis: "ArcGIS open data catalog",
  github: "GitHub public dataset search",
  common_crawl: "Common Crawl index",
  sitemap: "Sitemap",
  robots: "Robots.txt",
}

function normalizeProvider(provider) {
  const normalized = String(provider ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/gu, "_")
  if (normalized === "datagov") return "data_gov"
  if (normalized === "arcgis_online") return "arcgis"
  if (normalized === "robotstxt") return "robots"
  if (normalized === "github_public_datasets") return "github"
  if (normalized === "commoncrawl") return "common_crawl"
  if (CATALOG_DISCOVERY_PROVIDERS.includes(normalized)) return normalized
  throw new Error(`Unsupported catalog provider: ${provider}`)
}

function readJson(text, provider) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid ${provider} catalog JSON: ${error.message}`)
  }
}

function readOrigin(rawUrl) {
  try {
    return new URL(rawUrl).origin
  } catch {
    return null
  }
}

function readUrl(value, rawUrl) {
  const raw = readString(value)
  if (!raw) return null
  try {
    return new URL(raw, rawUrl).toString()
  } catch {
    return raw
  }
}

function readUrlPathTitle(rawUrl, fallback) {
  try {
    return new URL(rawUrl).pathname.replace(/^\/|\/$/gu, "") || fallback
  } catch {
    return fallback
  }
}

function readIsoDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function inferConnectorType(url, format, provider) {
  const value = `${format ?? ""} ${url ?? ""}`.toLowerCase()
  if (provider === "socrata") return "socrata"
  if (provider === "arcgis") return "arcgis"
  if (provider === "sitemap" && !value.includes("sitemap")) return "static_html"
  if (value.includes("sitemap") || value.endsWith(".xml.gz")) return "sitemap"
  if (value.includes("geojson") || value.endsWith(".geojson")) return "json"
  if (value.includes("json") || value.endsWith(".json")) return "json"
  if (value.includes("csv") || value.endsWith(".csv")) return "csv"
  if (
    value.includes("excel") ||
    value.includes("xlsx") ||
    value.endsWith(".xls")
  )
    return "excel"
  if (value.includes("rss") || value.includes("atom")) return "rss_atom"
  if (value.includes("xml") || value.endsWith(".xml")) return "xml"
  if (
    value.includes("html") ||
    value.endsWith(".html") ||
    value.endsWith(".htm")
  )
    return "static_html"
  return "json"
}

function buildCandidate({
  provider,
  location,
  category,
  title,
  rawUrl,
  homepageUrl = null,
  connectorType,
  sourceType = "api",
  trustLevel = "official",
  description = null,
  licenseLabel = null,
  licenseUrl = null,
  attribution = null,
  catalogRecordId = null,
  catalogUrl = null,
  format = null,
  metadata = {},
}) {
  const sourceUrl = readUrl(rawUrl, catalogUrl)
  if (!sourceUrl) return null

  const safeConnectorType = CONNECTOR_TYPES.includes(connectorType)
    ? connectorType
    : inferConnectorType(sourceUrl, format, provider)
  const slug = slugify(
    `${location}-${category}-${provider}-${title}-${sha256(sourceUrl).slice(0, 8)}`
  )

  return {
    sourceId: slug,
    slug,
    name: `${title} - ${location} - ${category}`,
    description,
    homepageUrl: readUrl(homepageUrl, catalogUrl),
    rawUrl: sourceUrl,
    connectorType: safeConnectorType,
    sourceType,
    trustLevel,
    categories: [category],
    coverageAreas: [location],
    discoveredAt: nowIso(),
    discoveryStatus: "candidate",
    discoveryQueries: [`${provider}:${catalogUrl ?? sourceUrl}`],
    publicDisplayAllowed: false,
    manualConfirmationRequired: true,
    licenseLabel,
    licenseUrl,
    attribution,
    termsNotes:
      "Catalog-discovered source; confirm terms, license, attribution, and field quality before non-dry-run ingestion.",
    metadata: {
      ...metadata,
      catalogProvider: provider,
      catalogProviderLabel: PROVIDER_LABELS[provider],
      catalogUrl: catalogUrl ?? null,
      catalogRecordId,
      originalFormat: format,
      sourceRegistryTable: "resource_map_sources",
      rawStoreTable: "resource_map_raw_ingestion_records",
      parsedFromCatalog: true,
      connectorSupported: CONNECTOR_TYPES.includes(safeConnectorType),
    },
  }
}

function buildCandidatesForContexts(context, entries) {
  const candidates = []
  for (const location of context.locations) {
    for (const category of context.categories) {
      for (const entry of entries) {
        const candidate = buildCandidate({
          ...entry,
          location,
          category,
          catalogUrl: context.rawUrl,
        })
        if (candidate) candidates.push(candidate)
      }
    }
  }
  return candidates
}

function parseCkanCatalog(text, context, provider) {
  const parsed = readJson(text, provider)
  const datasets = Array.isArray(parsed.result?.results)
    ? parsed.result.results
    : Array.isArray(parsed.results)
      ? parsed.results
      : []
  const entries = []

  for (const dataset of datasets) {
    const resources = Array.isArray(dataset.resources) ? dataset.resources : []
    for (const resource of resources) {
      const resourceUrl = readUrl(resource.url, context.rawUrl)
      if (!resourceUrl) continue
      const format = readString(resource.format, resource.mimetype)
      const datasetTitle = readString(dataset.title, dataset.name, "Dataset")
      const resourceTitle = readString(resource.name, resource.description)
      entries.push({
        provider,
        title: resourceTitle
          ? `${datasetTitle} / ${resourceTitle}`
          : datasetTitle,
        description: readString(resource.description, dataset.notes),
        homepageUrl: readString(dataset.url, dataset.metadata_url),
        rawUrl: resourceUrl,
        connectorType: inferConnectorType(resourceUrl, format, provider),
        format,
        licenseLabel: readString(dataset.license_title, dataset.license_id),
        licenseUrl: readString(dataset.license_url),
        attribution: readString(dataset.organization?.title, dataset.author),
        catalogRecordId: readString(resource.id, dataset.id, dataset.name),
        metadata: {
          datasetId: readString(dataset.id, dataset.name),
          resourceId: readString(resource.id),
          datasetModifiedAt: readString(dataset.metadata_modified),
        },
      })
    }
  }

  return buildCandidatesForContexts(context, entries)
}

function parseSocrataCatalog(text, context, provider) {
  const parsed = readJson(text, provider)
  const results = Array.isArray(parsed.results)
    ? parsed.results
    : Array.isArray(parsed)
      ? parsed
      : []
  const entries = []

  for (const item of results) {
    const resource = item.resource ?? item
    const id = readString(resource.id, item.identifier)
    const domain = readString(resource.domain, item.metadata?.domain)
    const origin = domain ? `https://${domain}` : readOrigin(context.rawUrl)
    const endpoint = id && origin ? `${origin}/resource/${id}.json` : null
    const rawUrl =
      readUrl(endpoint, context.rawUrl) ?? readUrl(item.link, context.rawUrl)
    if (!rawUrl) continue
    entries.push({
      provider,
      title: readString(
        resource.name,
        item.name,
        item.title,
        id,
        "Socrata dataset"
      ),
      description: readString(resource.description, item.description),
      homepageUrl: readString(item.permalink, item.link),
      rawUrl,
      connectorType: "socrata",
      format: readString(resource.type, "socrata"),
      catalogRecordId: id,
      metadata: {
        domain,
        categories: item.classification?.categories ?? [],
        tags: item.classification?.tags ?? [],
        updatedAt: readString(resource.updatedAt, resource.updated_at),
      },
    })
  }

  return buildCandidatesForContexts(context, entries)
}

function parseArcgisCatalog(text, context, provider) {
  const parsed = readJson(text, provider)
  const results = Array.isArray(parsed.results)
    ? parsed.results
    : Array.isArray(parsed.items)
      ? parsed.items
      : []
  const entries = []

  for (const item of results) {
    const rawUrl = readUrl(item.url, context.rawUrl)
    if (!rawUrl) continue
    entries.push({
      provider,
      title: readString(item.title, item.name, item.id, "ArcGIS dataset"),
      description: readString(item.description, item.snippet),
      homepageUrl: readString(item.homepage, item.itemUrl),
      rawUrl,
      connectorType: "arcgis",
      format: readString(item.type, "Feature Service"),
      catalogRecordId: readString(item.id),
      metadata: {
        owner: readString(item.owner),
        modifiedAt: readIsoDate(item.modified),
        tags: item.tags ?? [],
      },
    })
  }

  return buildCandidatesForContexts(context, entries)
}

function parseSitemapCatalog(text, context, provider) {
  const entries = [...text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map(
    (match) => {
      const rawUrl = readUrl(match[1], context.rawUrl)
      return {
        provider,
        title: rawUrl ? readUrlPathTitle(rawUrl, "home") : "sitemap URL",
        rawUrl,
        connectorType: inferConnectorType(rawUrl, null, provider),
        sourceType: "scrape",
        trustLevel: "community",
        format: rawUrl?.endsWith(".xml") ? "sitemap" : "html",
        catalogRecordId: rawUrl ? sha256(rawUrl).slice(0, 16) : null,
      }
    }
  )

  return buildCandidatesForContexts(context, entries)
}

function parseRobotsCatalog(text, context, provider) {
  const entries = text
    .split(/\r?\n/u)
    .map((line) => line.match(/^\s*Sitemap\s*:\s*(.+?)\s*$/iu)?.[1])
    .filter(Boolean)
    .map((raw) => {
      const rawUrl = readUrl(raw, context.rawUrl)
      return {
        provider,
        title: rawUrl
          ? `sitemap ${new URL(rawUrl).hostname}`
          : "robots sitemap",
        rawUrl,
        connectorType: "sitemap",
        sourceType: "scrape",
        trustLevel: "community",
        format: "sitemap",
        catalogRecordId: rawUrl ? sha256(rawUrl).slice(0, 16) : null,
      }
    })

  return buildCandidatesForContexts(context, entries)
}

function parseGithubCatalog(text, context, provider) {
  const parsed = readJson(text, provider)
  const results = Array.isArray(parsed.items)
    ? parsed.items
    : Array.isArray(parsed)
      ? parsed
      : []
  const entries = []

  for (const item of results) {
    const rawUrl = readUrl(
      item.raw_url ??
        item.download_url ??
        item.html_url ??
        item.repository?.html_url,
      context.rawUrl
    )
    if (!rawUrl) continue
    const repository = item.repository ?? item
    entries.push({
      provider,
      title: readString(
        item.name,
        item.path,
        repository.full_name,
        "GitHub dataset"
      ),
      description: readString(
        item.description,
        repository.description,
        item.text_matches?.[0]?.fragment
      ),
      homepageUrl: readString(repository.html_url, item.html_url),
      rawUrl,
      connectorType: inferConnectorType(rawUrl, item.name, provider),
      sourceType: "manual",
      trustLevel: "community",
      format: readString(item.name, item.path),
      licenseLabel: readString(repository.license?.spdx_id),
      attribution: readString(repository.full_name, repository.owner?.login),
      catalogRecordId: readString(item.sha, item.id, repository.id),
      metadata: {
        repositoryFullName: readString(repository.full_name),
        repositoryUrl: readString(repository.html_url),
        path: readString(item.path),
        stars: repository.stargazers_count ?? null,
      },
    })
  }

  return buildCandidatesForContexts(context, entries)
}

function parseCommonCrawlCatalog(text, context, provider) {
  const entries = []
  for (const line of text.split(/\r?\n/u)) {
    const rawLine = line.trim()
    if (!rawLine) continue

    let row = null
    try {
      row = JSON.parse(rawLine)
    } catch {
      const parts = rawLine.split(/\s+/u)
      row = {
        url: parts[0],
        timestamp: parts[1],
        mime: parts[2],
        status: parts[3],
        digest: parts[4],
      }
    }

    const status = String(row.status ?? row.statusCode ?? "200")
    if (status && status !== "200") continue
    const rawUrl = readUrl(row.url, context.rawUrl)
    if (!rawUrl) continue
    const mime = readString(row.mime, row.mimeType)
    entries.push({
      provider,
      title: readUrlPathTitle(rawUrl, "Common Crawl URL"),
      description: readString(row.title),
      homepageUrl: rawUrl,
      rawUrl,
      connectorType: inferConnectorType(rawUrl, mime, provider),
      sourceType: "scrape",
      trustLevel: "community",
      format: mime,
      catalogRecordId: readString(row.digest, row.urlkey, row.timestamp),
      metadata: {
        crawlTimestamp: readString(row.timestamp),
        digest: readString(row.digest),
        warcFilename: readString(row.filename),
        warcOffset: readString(row.offset),
        warcLength: readString(row.length),
      },
    })
  }

  return buildCandidatesForContexts(context, entries)
}

export function buildCatalogDiscoveryCandidates({
  provider,
  rawText,
  rawUrl,
  locations,
  categories,
  limit = null,
}) {
  const normalizedProvider = normalizeProvider(provider)
  const context = {
    rawUrl,
    locations,
    categories,
  }
  let candidates = []

  if (normalizedProvider === "ckan" || normalizedProvider === "data_gov") {
    candidates = parseCkanCatalog(rawText, context, normalizedProvider)
  } else if (normalizedProvider === "socrata") {
    candidates = parseSocrataCatalog(rawText, context, normalizedProvider)
  } else if (normalizedProvider === "arcgis") {
    candidates = parseArcgisCatalog(rawText, context, normalizedProvider)
  } else if (normalizedProvider === "github") {
    candidates = parseGithubCatalog(rawText, context, normalizedProvider)
  } else if (normalizedProvider === "common_crawl") {
    candidates = parseCommonCrawlCatalog(rawText, context, normalizedProvider)
  } else if (normalizedProvider === "sitemap") {
    candidates = parseSitemapCatalog(rawText, context, normalizedProvider)
  } else if (normalizedProvider === "robots") {
    candidates = parseRobotsCatalog(rawText, context, normalizedProvider)
  }

  return Number.isFinite(limit) ? candidates.slice(0, limit) : candidates
}

export async function readCatalogInput(input, { network = false } = {}) {
  const source = readString(input)
  if (!source) throw new Error("--catalog-input is required.")

  const localPath = resolveLocalPath(source)
  if (localPath) {
    return {
      rawText: readFileSync(localPath, "utf8"),
      rawUrl: source,
    }
  }

  if (!network) {
    throw new Error(
      "Remote catalog discovery requires --network true; use a local --catalog-input fixture for offline parsing."
    )
  }

  const response = await fetch(source, {
    headers: {
      Accept: "*/*",
      "User-Agent": "coach-house-resource-map-local-prototype/1.0",
    },
  })
  const rawText = await response.text()
  if (!response.ok) throw new Error(`Catalog fetch failed ${response.status}.`)
  return {
    rawText,
    rawUrl: response.url || source,
  }
}

export async function buildCatalogDiscoveryCandidatesFromArgs(args) {
  if (!args.has("catalog-input")) return []

  const provider = readString(
    args.get("catalog-provider"),
    args.get("provider")
  )
  if (!provider) throw new Error("--catalog-provider is required.")

  const locations = readArgList(
    args,
    "locations",
    readString(args.get("location")) ? [readString(args.get("location"))] : []
  )
  const categories = readArgList(
    args,
    "categories",
    readArgList(args, "category")
  )
  if (locations.length === 0) {
    throw new Error("At least one --location or --locations value is required.")
  }
  if (categories.length === 0) {
    throw new Error(
      "At least one --category or --categories value is required."
    )
  }

  const limitValue = readString(args.get("limit"))
  const limit = limitValue ? Number.parseInt(limitValue, 10) : null
  const input = await readCatalogInput(args.get("catalog-input"), {
    network: readBoolean(args, "network", false),
  })

  return buildCatalogDiscoveryCandidates({
    provider,
    rawText: input.rawText,
    rawUrl: input.rawUrl,
    locations,
    categories,
    limit: Number.isFinite(limit) ? limit : null,
  })
}
