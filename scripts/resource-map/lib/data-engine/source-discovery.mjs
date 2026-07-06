import {
  CONNECTOR_TYPES,
  nowIso,
  readArgList,
  readString,
  slugify,
} from "./shared.mjs"

const SEARCH_SOURCE_TEMPLATES = [
  {
    key: "data_gov",
    name: "Data.gov",
    connectorType: "ckan",
    sourceType: "api",
    trustLevel: "official",
    homepageUrl: "https://catalog.data.gov",
    rawUrl: "https://catalog.data.gov/api/3/action/package_search",
    queryTemplate: "{category} {location} nonprofit public services",
  },
  {
    key: "ckan",
    name: "CKAN open data portal",
    connectorType: "ckan",
    sourceType: "api",
    trustLevel: "official",
    queryTemplate: "{category} resources {location}",
  },
  {
    key: "socrata",
    name: "Socrata open data portal",
    connectorType: "socrata",
    sourceType: "api",
    trustLevel: "official",
    queryTemplate: "{category} resources {location}",
  },
  {
    key: "arcgis",
    name: "ArcGIS open data portal",
    connectorType: "arcgis",
    sourceType: "api",
    trustLevel: "official",
    queryTemplate: "{category} resources {location}",
  },
  {
    key: "city_open_data_portal",
    name: "City open data portal",
    connectorType: "socrata",
    sourceType: "api",
    trustLevel: "official",
    queryTemplate: "{location} city open data {category} resources",
    portalScope: "city",
  },
  {
    key: "county_open_data_portal",
    name: "County open data portal",
    connectorType: "arcgis",
    sourceType: "api",
    trustLevel: "official",
    queryTemplate: "{location} county open data {category} resources",
    portalScope: "county",
  },
  {
    key: "state_open_data_portal",
    name: "State open data portal",
    connectorType: "ckan",
    sourceType: "api",
    trustLevel: "official",
    queryTemplate: "{location} state open data {category} resources",
    portalScope: "state",
  },
  {
    key: "irs_eo_bmf",
    name: "IRS Exempt Organizations Business Master File",
    connectorType: "irs_eo_bmf",
    sourceType: "api",
    trustLevel: "official",
    homepageUrl:
      "https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf",
    queryTemplate: "{location} nonprofit {category}",
  },
  {
    key: "grants_gov",
    name: "Grants.gov public programs",
    connectorType: "static_html",
    sourceType: "api",
    trustLevel: "official",
    homepageUrl: "https://www.grants.gov",
    queryTemplate: "{category} assistance {location}",
  },
  {
    key: "sam_gov",
    name: "SAM.gov assistance listings",
    connectorType: "static_html",
    sourceType: "api",
    trustLevel: "official",
    homepageUrl: "https://sam.gov",
    queryTemplate: "{category} public assistance {location}",
  },
  {
    key: "osm_overpass",
    name: "OpenStreetMap Overpass",
    connectorType: "osm_overpass",
    sourceType: "api",
    trustLevel: "community",
    homepageUrl: "https://www.openstreetmap.org",
    rawUrl: "https://overpass-api.de/api/interpreter",
    queryTemplate: "{category} resources near {location}",
  },
  {
    key: "wikidata_sparql",
    name: "Wikidata SPARQL",
    connectorType: "wikidata_sparql",
    sourceType: "api",
    trustLevel: "community",
    homepageUrl: "https://www.wikidata.org",
    rawUrl: "https://query.wikidata.org/sparql",
    queryTemplate: "{category} organizations in {location}",
  },
  {
    key: "github_public_datasets",
    name: "GitHub public datasets",
    connectorType: "json",
    sourceType: "manual",
    trustLevel: "community",
    homepageUrl: "https://github.com/search",
    queryTemplate: "{location} {category} resources dataset",
  },
  {
    key: "common_crawl",
    name: "Common Crawl indexes",
    connectorType: "static_html",
    sourceType: "scrape",
    trustLevel: "community",
    homepageUrl: "https://index.commoncrawl.org",
    queryTemplate: "{location} {category} resource directory",
  },
  {
    key: "sitemap",
    name: "Provider sitemap",
    connectorType: "sitemap",
    sourceType: "scrape",
    trustLevel: "community",
    queryTemplate: "{location} {category} sitemap.xml",
  },
  {
    key: "robots",
    name: "Provider robots.txt",
    connectorType: "static_html",
    sourceType: "scrape",
    trustLevel: "community",
    queryTemplate: "{location} {category} robots.txt sitemap",
  },
  {
    key: "211_directory",
    name: "211 resource directory",
    connectorType: "static_html",
    sourceType: "partner",
    trustLevel: "partner",
    queryTemplate: "{location} 211 {category} resources",
  },
  {
    key: "food_bank_directory",
    name: "Food bank directory",
    connectorType: "static_html",
    sourceType: "partner",
    trustLevel: "partner",
    queryTemplate: "{location} food bank pantry directory",
  },
  {
    key: "shelter_directory",
    name: "Shelter directory",
    connectorType: "static_html",
    sourceType: "partner",
    trustLevel: "partner",
    queryTemplate: "{location} shelter homeless services directory",
  },
  {
    key: "clinic_directory",
    name: "Clinic directory",
    connectorType: "static_html",
    sourceType: "partner",
    trustLevel: "partner",
    queryTemplate: "{location} free clinic community health directory",
  },
  {
    key: "library_directory",
    name: "Library directory",
    connectorType: "static_html",
    sourceType: "scrape",
    trustLevel: "official",
    queryTemplate: "{location} public library locations services",
  },
  {
    key: "school_directory",
    name: "School directory",
    connectorType: "static_html",
    sourceType: "scrape",
    trustLevel: "official",
    queryTemplate: "{location} school directory public services",
  },
  {
    key: "faith_community_directory",
    name: "Faith and community directory",
    connectorType: "static_html",
    sourceType: "directory",
    trustLevel: "community",
    queryTemplate: "{location} faith community resources",
  },
  {
    key: "nonprofit_directory",
    name: "Nonprofit directory",
    connectorType: "static_html",
    sourceType: "directory",
    trustLevel: "community",
    queryTemplate: "{location} nonprofit directory {category}",
  },
  {
    key: "mutual_aid_directory",
    name: "Mutual aid directory",
    connectorType: "static_html",
    sourceType: "directory",
    trustLevel: "community",
    queryTemplate: "{location} mutual aid {category}",
  },
  {
    key: "public_benefits_directory",
    name: "Public benefits directory",
    connectorType: "static_html",
    sourceType: "scrape",
    trustLevel: "official",
    queryTemplate: "{location} public benefits {category}",
  },
]

function isConnectorReady(candidate) {
  const connectorType = readString(candidate.connectorType)
  if (!CONNECTOR_TYPES.includes(connectorType)) return false

  const rawUrl = readString(candidate.rawUrl, candidate.raw_url)
  const apiEndpoint = readString(candidate.apiEndpoint, candidate.api_endpoint)
  const metadata = candidate.metadata ?? {}
  const hasFetchTarget = Boolean(rawUrl || apiEndpoint)
  if (!hasFetchTarget) return false

  if (connectorType === "osm_overpass") {
    return Boolean(
      readString(
        candidate.overpassQuery,
        candidate.overpass_query,
        metadata.overpassQuery,
        metadata.overpass_query
      )
    )
  }

  if (connectorType === "wikidata_sparql") {
    return Boolean(
      readString(
        candidate.sparqlQuery,
        candidate.sparql_query,
        metadata.sparqlQuery,
        metadata.sparql_query
      )
    )
  }

  return true
}

export function buildSourceDiscoveryCandidates({
  locations,
  categories,
  limit = null,
}) {
  const discoveredAt = nowIso()
  const candidates = []

  for (const location of locations) {
    for (const category of categories) {
      for (const template of SEARCH_SOURCE_TEMPLATES) {
        const query = template.queryTemplate
          .replaceAll("{location}", location)
          .replaceAll("{category}", category)
        const slug = slugify(`${location}-${category}-${template.key}`)
        const candidate = {
          sourceId: slug,
          slug,
          name: `${template.name} - ${location} - ${category}`,
          homepageUrl: template.homepageUrl ?? null,
          rawUrl: template.rawUrl ?? null,
          connectorType: template.connectorType,
          sourceType: template.sourceType,
          trustLevel: template.trustLevel,
          categories: [category],
          coverageAreas: [location],
          discoveredAt,
          discoveryStatus: "candidate",
          discoveryQueries: [query],
          publicDisplayAllowed: false,
          manualConfirmationRequired: true,
          licenseLabel: null,
          licenseUrl: null,
          attribution: null,
          termsNotes:
            "Manual terms/license verification required before non-dry-run ingestion.",
          metadata: {
            sourceTemplate: template.key,
            sourceFamily: template.portalScope
              ? "civic_open_data_portal"
              : template.key,
            portalScope: template.portalScope ?? null,
            sourceRegistryTable: "resource_map_sources",
            rawStoreTable: "resource_map_raw_ingestion_records",
            connectorSupported: CONNECTOR_TYPES.includes(
              template.connectorType
            ),
          },
        }
        const connectorReady = isConnectorReady(candidate)
        candidates.push({
          ...candidate,
          ingestionReadiness: connectorReady ? "ready" : "lead",
          metadata: {
            ...candidate.metadata,
            connectorReady,
            ingestionReadiness: connectorReady ? "ready" : "lead",
          },
        })
      }
    }
  }

  return Number.isFinite(limit) ? candidates.slice(0, limit) : candidates
}

export function buildDiscoveryCandidatesFromArgs(args) {
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
  const limitValue = readString(args.get("limit"))
  const limit = limitValue ? Number.parseInt(limitValue, 10) : null

  if (locations.length === 0) {
    throw new Error("At least one --location or --locations value is required.")
  }
  if (categories.length === 0) {
    throw new Error(
      "At least one --category or --categories value is required."
    )
  }

  return buildSourceDiscoveryCandidates({
    locations,
    categories,
    limit: Number.isFinite(limit) ? limit : null,
  })
}
