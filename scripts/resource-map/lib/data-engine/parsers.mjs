import { createHash } from "node:crypto"
import { inflateRawSync } from "node:zlib"
import {
  CONNECTOR_VERSION,
  PARSER_VERSION,
  inferContentType,
  nowIso,
  readArray,
  readString,
  sha256,
} from "./shared.mjs"

const FIELD_ALIASES = {
  organizationName: [
    "organizationName",
    "organization_name",
    "providerName",
    "provider",
    "agency",
    "organization",
    "branch_",
    "branch",
    "facilityname",
    "facility_name",
    "facility",
    "facilities",
    "location",
    "user_name",
    "user_agency",
    "site_name",
    "site",
    "org",
    "name",
  ],
  title: [
    "title",
    "serviceTitle",
    "service",
    "program",
    "resource_name",
    "branch_",
    "branch",
    "facilityname",
    "facility_name",
    "facility",
    "facilities",
    "location",
    "user_name",
    "user_agency",
    "site_name",
    "site",
    "place_name",
    "name",
  ],
  description: [
    "description",
    "desc",
    "about",
    "summary",
    "content",
    "serviceDescription",
    "activity",
  ],
  sourceCategoryText: [
    "category",
    "subcategory",
    "service_category",
    "type",
    "amenity",
    "social_facility",
    "healthcare",
    "office",
    "shop",
    "leisure",
    "tourism",
    "ntee_cd",
    "ntee",
    "subsection",
    "classification",
    "clinic_type",
    "facility_type",
    "site_type",
    "folderpath",
    "heatrelief_type",
    "hydrationactivities",
    "type_of_center",
    "fac_type",
    "user_type",
    "strucdet",
    "strucType",
    "program",
  ],
  address: [
    "address",
    "fullAddress",
    "street_address",
    "streetAddress",
    "streetaddress",
    "site_address",
    "facility_address",
    "physical_address",
    "place_addr",
    "user_address",
    "street_loc",
    "address_1",
    "fulladdr",
    "street",
    "addr:full",
    "location",
  ],
  city: ["city", "city_1", "municipality", "borough_name", "addr:city"],
  state: ["state", "state_1", "region", "addr:state"],
  postalCode: [
    "postalCode",
    "postal_code",
    "zip",
    "zip_code",
    "zipcode",
    "addr:postcode",
  ],
  latitude: ["latitude", "lat", "y"],
  longitude: ["longitude", "lng", "lon", "x"],
  phone: [
    "phone",
    "telephone",
    "phoneNumber",
    "phone_1",
    "phone_2",
    "phone_3",
    "phone_4",
    "phone_5",
    "phone_number",
    "phonenumbe",
    "contactphone",
    "altfacphone",
    "primaryphone",
    "cntct_phn",
    "call",
    "pocphone",
    "user_phone",
    "contact:phone",
  ],
  email: ["email", "contactEmail", "contact:email", "branch_email"],
  websiteUrl: [
    "websiteUrl",
    "website",
    "contact:website",
    "website:official",
    "url",
    "link",
    "href",
    "facilitywebsite",
    "weblink",
    "website_link",
    "user_url",
  ],
  hours: [
    "hours",
    "open_hours",
    "opening_hours",
    "openingHours",
    "schedule",
    "service_hours",
    "hours_of_operation",
    "hours_of_operations",
    "days_hours_of_operation",
    "operationalhours",
    "operation_hrs",
    "operhours",
    "operating_hours",
    "open_hrs",
    "user_hours",
  ],
  timezone: ["timezone", "time_zone", "tz"],
  appointmentRequired: [
    "appointmentRequired",
    "appointment_required",
    "requiresAppointment",
    "requires_appointment",
  ],
  availabilityStatus: [
    "availabilityStatus",
    "availability_status",
    "status",
    "finder_status",
    "user_status",
    "seasonstatus",
    "dailystatus",
    "active",
  ],
  availabilityNotes: [
    "availabilityNotes",
    "availability_notes",
    "notes",
    "note",
    "comments",
    "additionalinfo",
    "additional_info",
    "additional_notes",
  ],
  temporaryClosedUntil: ["temporaryClosedUntil", "temporary_closed_until"],
  eligibility: ["eligibility", "who_it_helps"],
  cost: ["cost", "fee", "fees"],
  documentsNeeded: ["documentsNeeded", "documents", "required_documents"],
  languages: ["languages", "language"],
  deliveryModes: ["deliveryModes", "modality", "online_in_person"],
  serviceArea: ["serviceArea", "coverageArea", "area_served"],
  locationType: ["locationType", "location_type"],
  onlineOnly: ["onlineOnly", "online_only"],
  pageHeadings: ["pageHeadings", "page_headings", "headings"],
  keywords: ["keywords", "tags"],
  links: ["links", "pageLinks", "page_links"],
  lastUpdatedAt: [
    "lastUpdatedAt",
    "last_updated",
    "updated_at",
    "modified",
    "updated",
    "published",
    "pubDate",
  ],
  lastVerifiedAt: ["lastVerifiedAt", "last_verified", "verified_at"],
  lastSeenAt: ["lastSeenAt", "last_seen", "seen_at"],
}

function readField(row, names) {
  for (const name of names) {
    if (row[name] !== null && row[name] !== undefined && row[name] !== "") {
      return row[name]
    }
    const foundKey = Object.keys(row).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    )
    if (foundKey && row[foundKey] !== "") return row[foundKey]
  }
  return null
}

function readTextField(row, names) {
  for (const name of names) {
    const direct = readString(row[name])
    if (direct) return direct
    const foundKey = Object.keys(row).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    )
    if (foundKey) {
      const value = readString(row[foundKey])
      if (value) return value
    }
  }
  return null
}

function readIdentifier(value) {
  const text = readString(value)
  if (text) return text
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (typeof value === "bigint") return String(value)
  return null
}

function readScalarString(value) {
  return readString(value) ?? readIdentifier(value)
}

function parseNumber(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    const parsed = Number.parseFloat(String(value ?? ""))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function parseList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    return value
      .split(/[;,|]/u)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function composeAddress(row, explicitAddress) {
  const address = readString(explicitAddress, row["addr:full"])
  if (address) return address

  const houseNumber = readString(row["addr:housenumber"], row.houseNumber)
  const street = readString(row["addr:street"], row.street)
  const place = readString(row["addr:place"])
  if (houseNumber && street) return `${houseNumber} ${street}`
  return readString(street, place)
}

function readSourceMetadata(source) {
  return source?.metadata && typeof source.metadata === "object"
    ? source.metadata
    : {}
}

function readFieldAliasMap(source) {
  const metadata = readSourceMetadata(source)
  const aliases = source?.fieldAliases ?? source?.field_aliases
  const metadataAliases = metadata.fieldAliases ?? metadata.field_aliases
  if (metadataAliases && typeof metadataAliases === "object") {
    return metadataAliases
  }
  return aliases && typeof aliases === "object" ? aliases : {}
}

function readFieldAliases(source, fieldKey) {
  return readArray(readFieldAliasMap(source)[fieldKey])
}

function mergeAliases(source, fieldKey, fallbackAliases = []) {
  return [
    ...new Set([
      ...readFieldAliases(source, fieldKey),
      ...(FIELD_ALIASES[fieldKey] ?? fallbackAliases),
    ]),
  ]
}

function readSourceCategoryText(source) {
  const metadata = readSourceMetadata(source)
  return readString(
    source?.sourceCategoryText,
    source?.source_category_text,
    source?.categoryLabel,
    source?.category_label,
    metadata.sourceCategoryText,
    metadata.source_category_text,
    metadata.categoryLabel,
    metadata.category_label
  )
}

function joinSourceCategoryText(...values) {
  const entries = values.map((value) => readString(value)).filter(Boolean)
  return [...new Set(entries)].join("; ") || null
}

function readSocrataLocation(row) {
  return row.location && typeof row.location === "object" ? row.location : {}
}

function isFridgeFinderRow(row) {
  return (
    row &&
    typeof row === "object" &&
    row.location &&
    typeof row.location === "object" &&
    ("geoLat" in row.location || "geoLng" in row.location) &&
    ("latestFridgeReport" in row || "verified" in row)
  )
}

function normalizeFridgeFinderCondition(value) {
  const normalized = readString(value)?.toLowerCase()
  if (!normalized) return null
  if (normalized === "good") return "available"
  if (normalized === "dirty") return "limited"
  if (normalized === "out of order") return "temporarily_closed"
  if (normalized === "not at location" || normalized === "ghost") {
    return "closed"
  }
  return null
}

function normalizeFridgeFinderRow(row) {
  const location = readSocrataLocation(row)
  const report =
    row.latestFridgeReport && typeof row.latestFridgeReport === "object"
      ? row.latestFridgeReport
      : {}
  const fridgeId = readString(row.id)
  const sourceUrl = fridgeId
    ? `https://www.fridgefinder.app/fridge/${fridgeId}`
    : "https://www.fridgefinder.app/browse"
  const maintainer =
    row.maintainer && typeof row.maintainer === "object" ? row.maintainer : {}
  const websiteUrl = readString(maintainer.website, maintainer.instagram)
  const reportNotes = readString(report.notes)
  const condition = readString(report.condition)

  return {
    ...row,
    sourceRecordId: fridgeId,
    sourceUrl,
    organizationName: readString(location.name, row.name),
    title: readString(row.name, location.name),
    description:
      "Community fridge offering free food. Verify current status before visiting.",
    category: "Community Fridges",
    sourceCategoryText: "Community Fridges",
    address: readString(location.street),
    city: readString(location.city),
    state: readString(location.state),
    postalCode: readScalarString(location.zip),
    latitude: parseNumber(location.geoLat),
    longitude: parseNumber(location.geoLng),
    websiteUrl,
    availabilityStatus: normalizeFridgeFinderCondition(condition),
    availabilityNotes: [condition, reportNotes].filter(Boolean).join("; "),
    lastVerifiedAt: readString(report.timestamp),
    lastUpdatedAt: row.last_edited
      ? new Date(Number(row.last_edited) * 1000).toISOString()
      : null,
  }
}

function readSocrataUrl(value) {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return null
  return readString(value.url, value.href)
}

function normalizeRow(row, rawRecord, context) {
  const location = readSocrataLocation(row)
  const rowWebsite = readString(readSocrataUrl(row.website), row.url, row.link)
  const aliases = (fieldKey, fallbackAliases = []) =>
    mergeAliases(context.source, fieldKey, fallbackAliases)
  const sourceUrl = readString(
    readField(row, ["sourceUrl", "source_url"]),
    rowWebsite,
    context.rawUrl,
    context.source?.homepageUrl
  )
  const organizationName = readString(
    readTextField(row, aliases("organizationName"))
  )
  const title = readString(
    readTextField(row, aliases("title")),
    organizationName
  )
  const rowSourceCategoryText = readString(
    readField(row, aliases("sourceCategoryText"))
  )
  const sourceCategoryText = joinSourceCategoryText(
    readSourceCategoryText(context.source),
    rowSourceCategoryText
  )
  const address = readString(readField(row, aliases("address")))
  const city = readString(readField(row, aliases("city")))
  const state = readString(readField(row, aliases("state")))
  const extractedFields = {
    organizationName,
    title,
    description: readString(readField(row, aliases("description"))),
    sourceCategoryText,
    address: composeAddress(row, address),
    city: readString(city, location.city),
    state: readString(state, location.state),
    postalCode: readScalarString(
      readField(row, aliases("postalCode")) ?? location.zip
    ),
    latitude: parseNumber(
      readField(row, aliases("latitude")),
      location.latitude,
      location.geoLat,
      location.coordinates?.[1]
    ),
    longitude: parseNumber(
      readField(row, aliases("longitude")),
      location.longitude,
      location.geoLng,
      location.coordinates?.[0]
    ),
    phone: readString(readField(row, aliases("phone"))),
    email: readString(readField(row, aliases("email"))),
    websiteUrl: readString(readField(row, aliases("websiteUrl")), rowWebsite),
    hours: readField(row, aliases("hours")),
    timezone: readString(readField(row, aliases("timezone"))),
    appointmentRequired: readField(row, aliases("appointmentRequired")),
    availabilityStatus: readString(
      readField(row, aliases("availabilityStatus"))
    ),
    availabilityNotes: readString(readField(row, aliases("availabilityNotes"))),
    temporaryClosedUntil: readString(
      readField(row, aliases("temporaryClosedUntil"))
    ),
    eligibility: readString(readField(row, aliases("eligibility"))),
    cost: readString(readField(row, aliases("cost"))),
    documentsNeeded: parseList(readField(row, aliases("documentsNeeded"))),
    languages: parseList(readField(row, aliases("languages"))),
    deliveryModes: parseList(readField(row, aliases("deliveryModes"))),
    serviceArea: parseList(readField(row, aliases("serviceArea"))),
    locationType: readString(readField(row, aliases("locationType"))),
    onlineOnly: readField(row, aliases("onlineOnly")) === true,
    pageHeadings: parseList(readField(row, aliases("pageHeadings"))),
    keywords: parseList(readField(row, aliases("keywords"))),
    links: parseList(readField(row, aliases("links"))),
    sourceUrl,
  }
  const nativeId = readIdentifier(
    readField(
      row,
      aliases("sourceRecordId", [
        "sourceRecordId",
        "source_record_id",
        "service_id",
        "serviceId",
        "id",
        "guid",
        "globalid",
        "global_id",
        "nycem_id",
        "fid",
        "objectid",
        "ein",
        "branch_",
        "branch",
      ])
    )
  )
  const rowIdentity = [
    organizationName,
    title,
    extractedFields.address,
    city,
    state,
    extractedFields.postalCode,
    extractedFields.latitude,
    extractedFields.longitude,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join("|")
  const idBasis = readString(
    nativeId,
    rowIdentity ? [sourceUrl, rowIdentity].filter(Boolean).join("|") : null,
    sourceUrl
  )

  return {
    sourceRecordId:
      nativeId ??
      (idBasis
        ? sha256(idBasis).slice(0, 32)
        : sha256(JSON.stringify(row)).slice(0, 32)),
    sourceId: context.source?.sourceId ?? context.source?.slug ?? null,
    sourceName: context.source?.name,
    sourceUrl,
    sourceType: context.source?.sourceType,
    rawSnapshot: rawRecord,
    extractedFields,
    fieldEvidence: Object.entries(extractedFields)
      .filter(
        ([, value]) => value !== null && value !== undefined && value !== ""
      )
      .map(([fieldPath, fieldValue]) => ({
        fieldPath: `extractedFields.${fieldPath}`,
        fieldValue,
        confidenceScore: 75,
        sourceUrl,
        observedAt: context.fetchedAt,
        evidenceType: "source",
        derivedFrom: [],
        transformation: null,
      })),
    lastSeenAt:
      readString(readField(row, aliases("lastSeenAt"))) ?? context.fetchedAt,
    lastScrapedAt: context.fetchedAt,
    lastUpdatedAt: readString(readField(row, aliases("lastUpdatedAt"))),
    lastVerifiedAt: readString(readField(row, aliases("lastVerifiedAt"))),
    licenseNotes:
      context.source?.licenseNotes ?? context.source?.licenseLabel ?? null,
    attribution: context.source?.attribution ?? null,
    termsNotes: context.source?.termsNotes ?? null,
  }
}

function parseCsvRows(text) {
  const lines = text.trim().split(/\r?\n/u).filter(Boolean)
  if (lines.length === 0) return []
  const delimiter =
    lines[0].includes("|") && !lines[0].includes(",")
      ? "|"
      : lines[0].includes("\t") && !lines[0].includes(",")
        ? "\t"
        : ","
  const headers = splitDelimitedLine(lines[0], delimiter)
  return lines.slice(1).map((line) => {
    const values = splitDelimitedLine(line, delimiter)
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    )
  })
}

function splitDelimitedLine(line, delimiter) {
  const values = []
  let current = ""
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      quoted = !quoted
      continue
    }
    if (char === delimiter && !quoted) {
      values.push(current.trim())
      current = ""
      continue
    }
    current += char
  }
  values.push(current.trim())
  return values
}

function inferIrsNteeCategory(value) {
  const prefix = readString(value)?.[0]?.toUpperCase()
  const map = {
    A: "Arts and culture nonprofit",
    B: "Education nonprofit",
    C: "Environment nonprofit",
    D: "Animal welfare nonprofit",
    E: "Health nonprofit",
    F: "Mental health nonprofit",
    G: "Chronic illness nonprofit",
    H: "Health research nonprofit",
    I: "Safety nonprofit",
    J: "Employment nonprofit",
    K: "Food nonprofit",
    L: "Housing nonprofit",
    M: "Emergency nonprofit",
    N: "Community recreation nonprofit",
    O: "Youth services nonprofit",
    P: "Family and human services nonprofit",
    Q: "International nonprofit",
    R: "Civil rights and legal nonprofit",
    S: "Community improvement nonprofit",
    T: "Philanthropy and grant support nonprofit",
    U: "Science and technology education nonprofit",
    V: "Social science research nonprofit",
    W: "Community benefit nonprofit",
    X: "Faith organization",
    Y: "Mutual aid nonprofit",
    Z: "Organizations nonprofit",
  }
  return prefix ? map[prefix] : null
}

function inferOsmCategory(tags = {}) {
  const values = [
    tags.social_facility,
    tags.healthcare,
    tags.office,
    tags.shop,
    tags.leisure,
    tags.tourism,
    tags.amenity,
  ].filter(Boolean)
  return values.length > 0 ? values.join("; ") : null
}

function parseIrsEoBmfRows(text) {
  return parseCsvRows(text).map((row) => {
    const ntee = readString(row.NTEE_CD, row.NTEE, row.ntee_cd, row.ntee)
    const inferredCategory = inferIrsNteeCategory(ntee)
    const sourceCategoryText = [inferredCategory, ntee]
      .filter(Boolean)
      .join("; ")
    return {
      ...row,
      sourceRecordId: readString(row.EIN, row.ein),
      organizationName: readString(row.NAME, row.name),
      address: readString(row.STREET, row.street),
      city: readString(row.CITY, row.city),
      state: readString(row.STATE, row.state),
      postalCode: readString(row.ZIP, row.zip),
      description: readString(row.ACTIVITY, row.activity, row.SORT_NAME),
      category: sourceCategoryText,
      sourceCategoryText,
    }
  })
}

function readBindingValue(binding, ...names) {
  for (const name of names) {
    const value = readString(binding[name]?.value)
    if (value) return value
  }
  return null
}

function parseJsonRows(text) {
  const parsed = JSON.parse(text)
  if (Array.isArray(parsed)) {
    return parsed.map((row) =>
      isFridgeFinderRow(row) ? normalizeFridgeFinderRow(row) : row
    )
  }
  if (Array.isArray(parsed.elements)) {
    return parsed.elements.map((element) => ({
      id: `osm:${element.type}:${element.id}`,
      ...(element.tags ?? {}),
      category: inferOsmCategory(element.tags ?? {}),
      latitude: element.lat ?? element.center?.lat,
      longitude: element.lon ?? element.center?.lon,
    }))
  }
  if (Array.isArray(parsed.results?.bindings)) {
    return parsed.results.bindings.map((binding) => {
      const itemUrl = readBindingValue(binding, "item")
      const category = readBindingValue(
        binding,
        "categoryLabel",
        "typeLabel",
        "instanceOfLabel"
      )
      const coordinate = readBindingValue(binding, "coordinate", "location")
      const point = coordinate?.match(/Point\(([-0-9.]+)\s+([-0-9.]+)\)/u)
      return {
        id: itemUrl?.split("/").pop(),
        sourceUrl: itemUrl,
        name: readBindingValue(binding, "itemLabel", "name"),
        description: readBindingValue(binding, "description"),
        category,
        sourceCategoryText: category,
        website: readBindingValue(
          binding,
          "website",
          "officialWebsite",
          "homepage"
        ),
        address: readBindingValue(binding, "address", "streetAddress"),
        city: readBindingValue(binding, "cityLabel", "city"),
        state: readBindingValue(binding, "stateLabel", "state"),
        postalCode: readBindingValue(binding, "postalCode", "zip"),
        phone: readBindingValue(binding, "phone", "telephone"),
        email: readBindingValue(binding, "email"),
        latitude: point ? Number.parseFloat(point[2]) : null,
        longitude: point ? Number.parseFloat(point[1]) : null,
      }
    })
  }
  if (Array.isArray(parsed.records)) return parsed.records
  if (Array.isArray(parsed.resources)) return parsed.resources
  if (Array.isArray(parsed.items)) return parsed.items
  if (Array.isArray(parsed.result?.results)) {
    return parsed.result.results.flatMap((dataset) => {
      const resources = Array.isArray(dataset.resources)
        ? dataset.resources
        : []
      return resources.length
        ? resources.map((resource) => ({
            id: resource.id,
            organizationName: dataset.organization?.title ?? dataset.author,
            title: resource.name ?? dataset.title,
            description: resource.description ?? dataset.notes,
            category: dataset.groups?.[0]?.display_name ?? dataset.type,
            url: resource.url,
            last_updated: resource.last_modified ?? dataset.metadata_modified,
          }))
        : [dataset]
    })
  }
  if (Array.isArray(parsed.features)) {
    return parsed.features.map((feature) => ({
      ...(feature.attributes ?? feature.properties ?? {}),
      latitude: feature.geometry?.y ?? feature.geometry?.coordinates?.[1],
      longitude: feature.geometry?.x ?? feature.geometry?.coordinates?.[0],
    }))
  }
  if (Array.isArray(parsed.result?.records)) return parsed.result.records
  if (Array.isArray(parsed.result?.resources)) return parsed.result.resources
  if (Array.isArray(parsed.value)) return parsed.value
  return [parsed]
}

function parseXmlRows(text) {
  const itemMatches = [
    ...text.matchAll(/<(item|entry|record)\b[^>]*>([\s\S]*?)<\/\1>/giu),
  ]
  const matches = itemMatches.length
    ? itemMatches
    : [...text.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/giu)].map((match) => [
        match[0],
        "url",
        match[1],
      ])

  return matches.map((match) => {
    const nodeType = match[1]
    const body = match[2]
    const row = {}
    for (const [, tag, value] of body.matchAll(
      /<([a-z0-9:_-]+)\b[^>]*>([\s\S]*?)<\/\1>/giu
    )) {
      const key = tag.split(":").pop()
      mergeXmlField(row, key, stripTags(value))
    }
    if (nodeType !== "url") {
      const linkHref = readAtomLinkHref(body)
      const categoryTerm = readXmlAttributeValue(body, "category", [
        "term",
        "label",
      ])
      if (linkHref && !row.link) row.link = linkHref
      if (categoryTerm && !row.category) row.category = categoryTerm
    }
    if (row.loc && !row.url) row.url = row.loc
    return row
  })
}

function mergeXmlField(row, key, value) {
  if (!readString(value)) return
  if (row[key] === undefined) {
    row[key] = value
    return
  }

  const existing = Array.isArray(row[key]) ? row[key] : [row[key]]
  row[key] = [...existing, value].filter((entry) => readString(entry))
}

function readXmlAttributeValue(body, tagName, attributeNames) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)\\/?>`, "giu")
  for (const match of body.matchAll(pattern)) {
    for (const attributeName of attributeNames) {
      const value = readString(
        match[1].match(
          new RegExp(`${attributeName}=["']([^"']+)["']`, "iu")
        )?.[1]
      )
      if (value) return stripTags(value)
    }
  }
  return null
}

function readAtomLinkHref(body) {
  for (const match of body.matchAll(/<link\b([^>]*)\/?>/giu)) {
    const rel = readString(match[1].match(/\brel=["']([^"']+)["']/iu)?.[1])
    const href = readString(match[1].match(/\bhref=["']([^"']+)["']/iu)?.[1])
    if (href && (!rel || rel === "alternate")) return stripTags(href)
  }
  return null
}

function readZipEntries(buffer) {
  const entries = new Map()
  let eocdOffset = -1
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index
      break
    }
  }
  if (eocdOffset === -1) throw new Error("xlsx_zip_eocd_missing")

  const entryCount = buffer.readUInt16LE(eocdOffset + 10)
  let offset = buffer.readUInt32LE(eocdOffset + 16)

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("xlsx_zip_central_directory_invalid")
    }
    const compressionMethod = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const fileNameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8")

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error("xlsx_zip_local_header_invalid")
    }
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
    const dataStart =
      localHeaderOffset + 30 + localNameLength + localExtraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)
    const data =
      compressionMethod === 0
        ? compressed
        : compressionMethod === 8
          ? inflateRawSync(compressed)
          : null
    if (data) entries.set(fileName, data.toString("utf8"))
    offset += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

function readExcelBuffer(rawText, rawRecord) {
  const encoding =
    rawRecord.raw_payload?.rawTextEncoding ??
    rawRecord.rawPayload?.rawTextEncoding ??
    null
  if (encoding === "base64") return Buffer.from(rawText, "base64")
  if (rawText.startsWith("UEs")) return Buffer.from(rawText, "base64")
  return Buffer.from(rawText, "utf8")
}

function readXlsxSharedStrings(entries) {
  const text = entries.get("xl/sharedStrings.xml")
  if (!text) return []
  return [...text.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/giu)].map((match) =>
    stripTags(match[1])
  )
}

function readExcelCellValue(cellXml, sharedStrings) {
  const type = cellXml.match(/\bt=["']([^"']+)["']/iu)?.[1]
  if (type === "inlineStr") {
    return stripTags(cellXml.match(/<is\b[^>]*>([\s\S]*?)<\/is>/iu)?.[1] ?? "")
  }

  const rawValue = stripTags(
    cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/iu)?.[1] ?? ""
  )
  if (type === "s") return sharedStrings[Number.parseInt(rawValue, 10)] ?? ""
  return rawValue
}

function readCellIndex(cellRef, fallbackIndex) {
  const letters = readString(cellRef)?.match(/^[A-Z]+/iu)?.[0]
  if (!letters) return fallbackIndex
  return (
    [...letters.toUpperCase()].reduce(
      (total, letter) => total * 26 + letter.charCodeAt(0) - 64,
      0
    ) - 1
  )
}

function parseExcelRows(rawText, rawRecord) {
  const buffer = readExcelBuffer(rawText, rawRecord)
  if (buffer.subarray(0, 2).toString("utf8") !== "PK") {
    return parseCsvRows(rawText)
  }

  const entries = readZipEntries(buffer)
  const sheet =
    entries.get("xl/worksheets/sheet1.xml") ??
    [...entries.entries()].find(([name]) =>
      /^xl\/worksheets\/sheet\d+\.xml$/u.test(name)
    )?.[1]
  if (!sheet) throw new Error("xlsx_sheet_missing")

  const sharedStrings = readXlsxSharedStrings(entries)
  const rawRows = [...sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/giu)]
    .map((rowMatch) => {
      const values = []
      let fallbackIndex = 0
      for (const cellMatch of rowMatch[1].matchAll(
        /<c\b([^>]*)>([\s\S]*?)<\/c>/giu
      )) {
        const cellRef = cellMatch[1].match(/\br=["']([^"']+)["']/iu)?.[1]
        const index = readCellIndex(cellRef, fallbackIndex)
        values[index] = readExcelCellValue(cellMatch[0], sharedStrings)
        fallbackIndex = index + 1
      }
      return values
    })
    .filter((row) => row.some((value) => readString(value)))

  if (rawRows.length === 0) return []
  const headers = rawRows[0].map((header, index) =>
    readString(header, `column_${index + 1}`)
  )
  return rawRows
    .slice(1)
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] ?? ""])
      )
    )
}

function parseHtmlRows(text, rawUrl) {
  const jsonLdRows = [
    ...text.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu
    ),
  ].flatMap((match) => {
    try {
      const parsed = JSON.parse(match[1])
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  })

  const normalizedJsonLdRows = jsonLdRows
    .flatMap(normalizeJsonLdRow)
    .filter(isUsableJsonLdResourceRow)
  if (normalizedJsonLdRows.length > 0) return normalizedJsonLdRows

  const title = stripTags(
    text.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1] ?? ""
  )
  const description =
    readMetaContent(text, "description") ??
    stripTags(text.match(/<p[^>]*>([\s\S]*?)<\/p>/iu)?.[1] ?? "")
  const headings = extractHeadings(text)
  const links = extractLinks(text, rawUrl)
  const contact = extractContact(text, links)
  const visibleText = stripTags(text)
  const readHtmlLabel = (...labels) => {
    for (const label of labels) {
      const value =
        readLabeledTextFromHtml(text, label) ??
        readLabeledText(visibleText, label)
      if (value) return value
    }
    return null
  }

  return [
    {
      title: headings[0] ?? title,
      service: headings[1] ?? title,
      description,
      category: readHtmlLabel("Category", "Service Category"),
      address: stripTags(
        text.match(/<address\b[^>]*>([\s\S]*?)<\/address>/iu)?.[1] ?? ""
      ),
      phone: contact.phone,
      email: contact.email,
      websiteUrl: contact.websiteUrl ?? rawUrl,
      hours: readHtmlLabel("Hours", "Opening Hours"),
      eligibility: readHtmlLabel("Eligibility", "Who It Helps"),
      cost: readHtmlLabel("Cost", "Fees", "Fee"),
      documentsNeeded: parseList(
        readHtmlLabel("Required Documents", "Documents", "Documents Needed")
      ),
      languages: parseList(readHtmlLabel("Languages", "Language")),
      deliveryModes: parseList(
        readHtmlLabel(
          "Online/In-person",
          "Online / In-person",
          "Delivery Modes",
          "Modality"
        )
      ),
      serviceArea: parseList(readHtmlLabel("Service Area", "Area Served")),
      locationType: readHtmlLabel("Location Type"),
      links,
      pageHeadings: headings,
      keywords: parseList(readMetaContent(text, "keywords")),
      url: rawUrl,
    },
  ]
}

function readJsonLdTypes(row) {
  return parseList(row?.["@type"] ?? row?.type).map((type) =>
    String(type).toLowerCase()
  )
}

function isUsableJsonLdResourceRow(row) {
  if (!row || typeof row !== "object") return false
  const types = readJsonLdTypes(row)
  const ignoredTypes = new Set([
    "breadcrumblist",
    "webpage",
    "website",
    "searchaction",
    "imageobject",
    "listitem",
  ])
  if (types.length > 0 && types.every((type) => ignoredTypes.has(type))) {
    return false
  }

  return Boolean(
    readString(
      row.organizationName,
      row.title,
      row.name,
      row.serviceType,
      row.description,
      row.address,
      row.phone,
      row.email,
      row.websiteUrl
    )
  )
}

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function readMetaContent(text, name) {
  return readString(
    text.match(
      new RegExp(
        `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
        "iu"
      )
    )?.[1],
    text.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
        "iu"
      )
    )?.[1]
  )
}

function extractHeadings(text) {
  return [...text.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/giu)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean)
}

function resolveHref(href, rawUrl) {
  const raw = readString(href)
  if (!raw) return null
  if (/^(mailto|tel):/iu.test(raw)) return raw
  try {
    return new URL(raw, rawUrl).toString()
  } catch {
    return raw
  }
}

function extractLinks(text, rawUrl) {
  return [
    ...text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu),
  ]
    .map((match) => ({
      url: resolveHref(match[1], rawUrl),
      label: stripTags(match[2]),
    }))
    .filter((link) => link.url)
}

function extractContact(text, links) {
  const telLink = links.find((link) => /^tel:/iu.test(link.url))
  const mailLink = links.find((link) => /^mailto:/iu.test(link.url))
  const webLink = links.find((link) => /^https?:\/\//iu.test(link.url))
  const visible = stripTags(text)
  return {
    phone:
      telLink?.url.replace(/^tel:/iu, "") ??
      visible.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/u)?.[0],
    email:
      mailLink?.url.replace(/^mailto:/iu, "").split("?")[0] ??
      visible.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu)?.[0],
    websiteUrl: webLink?.url,
  }
}

function readLabeledText(text, label) {
  const match = text.match(
    new RegExp(`${label}\\s*:\\s*([^:]+?)(?=\\s+[A-Z][A-Za-z ]+\\s*:|$)`, "u")
  )
  return readString(match?.[1])
}

function readLabeledTextFromHtml(text, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const match = text.match(
    new RegExp(
      `<(?:p|li|div|span|td|th|dd|dt)\\b[^>]*>\\s*${escapedLabel}\\s*:\\s*([\\s\\S]*?)<\\/(?:p|li|div|span|td|th|dd|dt)>`,
      "iu"
    )
  )
  return readString(stripTags(match?.[1]))
}

function readJsonLdText(value) {
  if (typeof value === "string") return readString(value)
  if (Array.isArray(value)) {
    return value.map(readJsonLdText).filter(Boolean).join("; ") || null
  }
  if (!value || typeof value !== "object") return null
  return readString(
    value.name,
    value.text,
    value.description,
    value.value,
    value.price,
    value.url
  )
}

function normalizeJsonLdRow(row) {
  if (!row || typeof row !== "object") return []
  if (Array.isArray(row)) return row.flatMap(normalizeJsonLdRow)
  if (Array.isArray(row["@graph"]))
    return row["@graph"].flatMap(normalizeJsonLdRow)
  const address =
    row.address && typeof row.address === "object" ? row.address : {}
  const offer = Array.isArray(row.offers) ? row.offers[0] : row.offers
  const provider =
    row.provider && typeof row.provider === "object" ? row.provider : {}

  return [
    {
      ...row,
      organizationName: readString(provider.name, row.name, row.legalName),
      title: readString(row.serviceType, row.name),
      description: readString(row.description),
      category: readString(row.serviceType, row["@type"]),
      address: readString(row.streetAddress, address.streetAddress),
      city: readString(row.addressLocality, address.addressLocality),
      state: readString(row.addressRegion, address.addressRegion),
      postalCode: readString(row.postalCode, address.postalCode),
      phone: readString(row.telephone),
      email: readString(row.email),
      websiteUrl: readString(row.url),
      hours: row.openingHours ?? row.openingHoursSpecification,
      eligibility: readJsonLdText(
        row.eligibility ?? row.audience ?? row.serviceAudience
      ),
      cost: readJsonLdText(row.cost ?? row.fees ?? row.priceRange ?? offer),
      documentsNeeded: parseList(
        readJsonLdText(
          row.requiredDocumentation ??
            row.requiredDocuments ??
            row.documentation
        )
      ),
      languages: parseList(row.availableLanguage),
      deliveryModes: parseList(
        readJsonLdText(
          row.serviceOutput ?? row.availableChannel ?? row.deliveryMethod
        )
      ),
      serviceArea: parseList(row.areaServed),
      locationType: readString(
        row.serviceLocation?.["@type"],
        row.locationType
      ),
    },
  ]
}

export function parseRawPayload(rawRecord, source) {
  const rawText = rawRecord.raw_text ?? rawRecord.rawText ?? ""
  const contentType =
    rawRecord.content_type ??
    rawRecord.contentType ??
    inferContentType(rawRecord.raw_url)
  const connectorType = source.connectorType ?? source.connector_type ?? "json"
  const context = {
    source,
    rawUrl: rawRecord.raw_url ?? rawRecord.rawUrl,
    fetchedAt: rawRecord.fetched_at ?? rawRecord.fetchedAt ?? nowIso(),
  }
  let rows = []

  try {
    if (connectorType === "irs_eo_bmf") {
      rows = parseIrsEoBmfRows(rawText)
    } else if (
      connectorType === "excel" ||
      contentType.includes("spreadsheetml") ||
      contentType.includes("application/vnd.ms-excel")
    ) {
      rows = parseExcelRows(rawText, rawRecord)
    } else if (connectorType === "csv" || contentType.includes("csv")) {
      rows = parseCsvRows(rawText)
    } else if (
      connectorType === "xml" ||
      connectorType === "sitemap" ||
      connectorType === "rss_atom" ||
      contentType.includes("xml") ||
      contentType.includes("rss")
    ) {
      rows = parseXmlRows(rawText)
    } else if (
      connectorType === "static_html" ||
      connectorType === "playwright_scrape" ||
      contentType.includes("html")
    ) {
      rows = parseHtmlRows(rawText, context.rawUrl)
    } else {
      rows = parseJsonRows(rawText)
    }
  } catch (error) {
    return {
      records: [],
      warnings: [`parse_failed:${error.message}`],
    }
  }

  return {
    records: rows.map((row) => normalizeRow(row, row, context)),
    warnings: [],
  }
}

export function buildRawRecord({
  source,
  runId,
  rawUrl,
  rawText,
  contentType,
  status = "fetched",
  errorMessage = null,
  metadata = {},
}) {
  const checksum = createHash("sha256")
    .update(rawText ?? "")
    .digest("hex")
  return {
    id: `${source.sourceId ?? source.slug}:${checksum}`,
    source_id: source.sourceId ?? source.slug,
    run_id: runId,
    raw_url: rawUrl,
    raw_payload: {
      connectorType: source.connectorType,
      byteLength:
        metadata.rawByteLength ?? Buffer.byteLength(rawText ?? "", "utf8"),
      ...metadata,
    },
    raw_text: rawText,
    content_type: contentType,
    checksum,
    fetched_at: nowIso(),
    parser_version: PARSER_VERSION,
    connector_version: CONNECTOR_VERSION,
    fetch_status: status,
    error_message: errorMessage,
  }
}
