import { createHash } from "node:crypto"

const SOURCE_ID = "brooklyn-nyc-nonprofit-directory-2026-07-30"
const SOURCE_NAME = "Brooklyn and NYC nonprofit directory - July 2026"
const METHOD_VERSION = "brooklyn-nyc-nonprofit-directory-v1"

const SOCIAL_FIELDS = [
  ["Instagram", "instagram", "Instagram"],
  ["Facebook", "facebook", "Facebook"],
  ["LinkedIn", "linkedin", "LinkedIn"],
  ["X / Twitter", "social", "X / Twitter"],
  ["YouTube / Vimeo", "video", "YouTube / Vimeo"],
  ["TikTok", "social", "TikTok"],
]

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.replace(/[ \t]+/gu, " ").trim()
    }
  }
  return null
}

function splitLines(value) {
  const text = readString(value)
  return text
    ? text
        .split(/\r?\n/gu)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []
}

function splitSemicolonList(value) {
  const text = readString(value)
  return text
    ? text
        .split(/\s*;\s*/gu)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []
}

function splitDataSources(value) {
  const text = readString(value)
  return text
    ? text
        .split(/\s+\+\s+|\r?\n|\s*;\s*/gu)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []
}

function normalizeUrl(value) {
  const raw = readString(value)
  if (!raw) return null
  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//iu.test(raw) ? raw : `https://${raw}`
    )
    if (!["http:", "https:"].includes(url.protocol)) return null
    if (url.username || url.password) return null
    url.hash = ""
    return url.toString().replace(/\/$/u, "")
  } catch {
    return null
  }
}

function parseNumberedValue(value) {
  const text = readString(value)
  if (!text) return { index: null, value: null }
  const match = text.match(/^(\d+)\.\s+(.+)$/su)
  return {
    index: match ? Number.parseInt(match[1], 10) : null,
    value: readString(match?.[2], text),
  }
}

function parseLocationLine(value) {
  const numbered = parseNumberedValue(value)
  const text = numbered.value
  if (!text) return null
  const labelMatch = text.match(/^([^:]{2,100}):\s*(\d[\s\S]+)$/u)
  const fullAddress = readString(labelMatch?.[2], text)
  const stateZip = fullAddress?.match(
    /(?:,|\s)\s*(NY|New York)\s*,?\s*(\d{5})(?:-\d{4})?\s*$/iu
  )
  const cityMatch = fullAddress?.match(
    /,\s*([^,]+),\s*(?:NY|New York)\s*,?\s*\d{5}(?:-\d{4})?\s*$/iu
  )

  return {
    city: readString(cityMatch?.[1]),
    fullAddress,
    index: numbered.index,
    label: readString(labelMatch?.[1]),
    postalCode: readString(stateZip?.[2]),
    state: stateZip ? "NY" : null,
  }
}

function parseCoordinates(value) {
  return splitLines(value)
    .map((entry) => {
      const numbered = parseNumberedValue(entry)
      const match = numbered.value?.match(
        /^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/u
      )
      if (!match) return null
      const latitude = Number.parseFloat(match[1])
      const longitude = Number.parseFloat(match[2])
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180 ||
        (latitude === 0 && longitude === 0)
      ) {
        return null
      }
      return { index: numbered.index, latitude, longitude }
    })
    .filter(Boolean)
}

function coordinateForLocation(locations, coordinates, location, index) {
  if (locations.length !== coordinates.length) return null
  const coordinate = coordinates[index]
  if (!coordinate) return null
  if (
    location.index !== null &&
    coordinate.index !== null &&
    location.index !== coordinate.index
  ) {
    return null
  }
  return coordinate
}

function buildRecordId(organizationName, location) {
  return createHash("sha256")
    .update(
      `${organizationName.toLocaleLowerCase("en-US")}\u0000${
        location?.fullAddress?.toLocaleLowerCase("en-US") ?? "service-area"
      }`
    )
    .digest("hex")
    .slice(0, 24)
}

function buildLinks(row) {
  const links = []
  const website = normalizeUrl(row.Website)
  if (website) {
    links.push({
      isPrimary: true,
      label: "Provider website",
      type: "website",
      url: website,
    })
  }
  for (const [field, type, label] of SOCIAL_FIELDS) {
    const url = normalizeUrl(row[field])
    if (url) links.push({ isPrimary: false, label, type, url })
  }
  return links
}

function buildAccessInstructions({
  address,
  organizationName,
  phone,
  website,
}) {
  const actions = []
  if (website) actions.push("review the provider website")
  if (phone) actions.push(`call ${phone}`)
  const contact = actions.length
    ? actions.join(" or ")
    : `contact ${organizationName}`
  return `${contact[0].toUpperCase()}${contact.slice(1)} to confirm current services, eligibility, and hours${address ? ` before visiting ${address}` : " before seeking services"}.`
}

function serviceName(row) {
  return (
    splitSemicolonList(row["Services / Offerings"])[0] ??
    readString(row["Record Type"], "Community resource")
  )
}

function publicResourceEligible(row, locations) {
  if (locations.length > 1) return false
  return [
    "Food access organization",
    "Community resource organization",
  ].includes(readString(row["Record Type"]))
}

function evidenceConfidence(row) {
  const confidence = readString(row["Match Confidence"])?.toLowerCase()
  if (confidence === "high") return 90
  if (confidence === "medium") return 78
  if (confidence === "low") return 60
  return 72
}

function buildEvidence(record, row, observedAt, sourceUrl, coordinate) {
  const confidenceScore = evidenceConfidence(row)
  const fields = [
    "organizationName",
    "title",
    "description",
    "serviceTitle",
    "sourceCategoryText",
    "websiteUrl",
    "phone",
    "email",
    "hours",
    "eligibility",
    "address",
    "serviceArea",
  ]
  if (coordinate) fields.push("latitude", "longitude")

  return fields
    .filter((field) => {
      const value = record.extractedFields[field]
      return value !== null && value !== undefined && value !== ""
    })
    .map((field) => ({
      confidenceScore:
        coordinate && ["latitude", "longitude"].includes(field)
          ? 100
          : confidenceScore,
      derivedFrom: [sourceUrl].filter(Boolean),
      evidenceMetadata: {
        dataSources: record.extractedFields.sourceDatasets,
        methodVersion: METHOD_VERSION,
        researchStatus: readString(row["Research Status"]),
        verificationStatus: "needs_review",
      },
      evidenceType: "source_snapshot",
      fieldPath: `extractedFields.${field}`,
      fieldValue: record.extractedFields[field],
      observedAt,
      sourceUrl,
      transformation: "source_specific_deterministic_extraction",
    }))
}

function isoDate(value, fallback) {
  const raw = readString(value)
  if (!raw) return fallback
  const parsed = new Date(`${raw}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback
}

export function buildBrooklynNonprofitDirectoryRecords(
  rows,
  { observedAt = "2026-07-30T00:00:00.000Z" } = {}
) {
  return rows.flatMap((row) => {
    const organizationName = readString(row.Organization)
    if (!organizationName) return []
    const parsedLocations = splitLines(row["Addresses / Locations"])
      .map(parseLocationLine)
      .filter(Boolean)
    const locations = parsedLocations.length ? parsedLocations : [null]
    const coordinates = parseCoordinates(row.Coordinates)
    const sourceUrls = splitLines(row["Source URLs"])
      .map(normalizeUrl)
      .filter(Boolean)
    const website = normalizeUrl(row.Website)
    const sourceUrl = sourceUrls[0] ?? website
    const dataSources = splitDataSources(row["Data Sources"])
    const services = splitSemicolonList(row["Services / Offerings"])
    const serviceArea = splitSemicolonList(row["Locations Served"])
    const phones = splitSemicolonList(row["Contact Phone(s)"])
    const emails = splitSemicolonList(row["Contact Email(s)"])
    const links = buildLinks(row)
    const multiLocation = parsedLocations.length > 1

    return locations.map((location, index) => {
      const coordinate = location
        ? coordinateForLocation(parsedLocations, coordinates, location, index)
        : null
      const locationName = readString(
        location?.label,
        multiLocation ? location?.city : null
      )
      const title = locationName
        ? `${organizationName} - ${locationName}`
        : organizationName
      const canonicalName =
        multiLocation && location?.fullAddress
          ? `${organizationName} at ${location.fullAddress}`
          : organizationName
      const phone = phones[0] ?? null
      const email = emails[0] ?? null
      const address = location?.fullAddress ?? null
      const accessInstructions = buildAccessInstructions({
        address,
        organizationName,
        phone,
        website,
      })
      const warnings = [
        ...(multiLocation ? ["services_aggregated_across_locations"] : []),
        ...(coordinates.length > 0 && !coordinate
          ? ["source_coordinates_not_safely_assignable"]
          : []),
        ...(!address && serviceArea.length === 0
          ? ["missing_specific_location"]
          : []),
        ...(readString(row["Food Bank Data As Of"]) === "2025-04-28"
          ? ["food_bank_snapshot_requires_freshness_check"]
          : []),
      ]
      const extractedFields = {
        accessInstructions,
        address,
        addressType: readString(row["Address Type"]),
        canonicalName,
        city: location?.city ?? null,
        contacts: [
          ...phones.slice(1).map((value) => ({ type: "phone", value })),
          ...emails.slice(1).map((value) => ({ type: "email", value })),
        ],
        coverageArea: serviceArea,
        deliveryModes: address ? ["in_person"] : [],
        description: readString(row.Description),
        email,
        eligibility: readString(row["Eligibility / Notes"]),
        enrichment: {
          methodVersion: METHOD_VERSION,
          needsReview: true,
          publicResourceEligible: publicResourceEligible(row, parsedLocations),
          qualityNotes: warnings,
          sourceComparisonCount: 1,
          verification: {
            contradictions: [],
            status: "needs_review",
            unsupportedClaims: [],
          },
        },
        foodBankDataAsOf: readString(row["Food Bank Data As Of"]),
        foodBankSiteCount: readString(row["Food Bank Sites"]),
        fullAddress: address,
        hours: readString(row["Service Hours / Frequency"]),
        latitude: coordinate?.latitude ?? null,
        links,
        locationName,
        locationType: address
          ? "physical"
          : serviceArea.length
            ? "service_area"
            : null,
        longitude: coordinate?.longitude ?? null,
        organizationName,
        phone,
        postalCode: location?.postalCode ?? null,
        primarySourceDataset: dataSources[0] ?? null,
        providerName: organizationName,
        recordType: readString(row["Record Type"]),
        resourceGuideListingCount: readString(row["Resource Guide Listings"]),
        researchStatus: readString(row["Research Status"]),
        serviceArea: address ? [] : serviceArea,
        serviceDescription: readString(row.Description),
        services: services.map((name) => ({
          description: readString(row.Description),
          howToAccess: accessInstructions,
          name,
        })),
        serviceTitle: serviceName(row),
        sourceCategoryText: [
          readString(row["Record Type"]),
          readString(row["Issue Areas"]),
          readString(row["Services / Offerings"]),
        ]
          .filter(Boolean)
          .join("; "),
        sourceDatasets: dataSources,
        sourceEvidenceUrls: sourceUrls,
        state: location?.state ?? null,
        title,
        websiteUrl: website,
      }
      const record = {
        extractedFields,
        lastScrapedAt: isoDate(row.Retrieved, observedAt),
        lastSeenAt: isoDate(row.Retrieved, observedAt),
        lastUpdatedAt: isoDate(row["Food Bank Data As Of"], null),
        rawSnapshot: {
          locationCount: parsedLocations.length,
          locationIndex: location ? index + 1 : null,
          spreadsheetRow: row,
        },
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceRecordId: buildRecordId(organizationName, location),
        sourceType: "directory",
        sourceUrl,
      }
      return {
        ...record,
        fieldEvidence: buildEvidence(
          record,
          row,
          isoDate(row.Retrieved, observedAt),
          sourceUrl,
          coordinate
        ),
      }
    })
  })
}

export const BROOKLYN_NONPROFIT_DIRECTORY_SOURCE = {
  attribution:
    "Brooklyn Org, Food Bank For NYC, and Carroll Gardens Association source listings",
  connectorType: "excel",
  homepageUrl: "https://brooklyn.org",
  licenseLabel: "Scraped directory data; provider review required",
  metadata: {
    headerRow: 5,
    sourceFamily: "brooklyn_nyc_nonprofit_directory",
  },
  name: SOURCE_NAME,
  publicDisplayAllowed: false,
  sourceId: SOURCE_ID,
  sourceType: "directory",
  termsNotes:
    "Workbook notes say Food Bank data is dated April 28, 2025 and contacts, hours, and eligibility may change. Call ahead and verify source text before publication.",
  trustLevel: "community",
}

export const BROOKLYN_NONPROFIT_DIRECTORY_DEFAULTS = {
  expectedWorkbookRows: 762,
  sourceId: SOURCE_ID,
  sourceName: SOURCE_NAME,
}
