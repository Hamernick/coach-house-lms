import { isTechnicalResourceSourceUrl } from "./enrichment-quality.mjs"

const METHOD_VERSION = "official-cooling-heat-source-v1"
const CURRENT_SEASON_YEAR = 2026
const CURRENT_SEASON_SOURCE_IDS = new Set([
  "baltimore-arcgis-code-red-cooling-centers",
  "broward-arcgis-cooling-centers",
  "chicago-socrata-cooling-centers",
  "cook-county-socrata-cooling-centers",
  "maricopa-arcgis-heat-relief-network",
  "palm-springs-arcgis-cooling-centers",
  "pge-arcgis-california-cooling-centers-2026",
  "st-louis-arcgis-warming-cooling-centers",
])

const TIMEZONE_BY_SOURCE_ID = new Map([
  ["baltimore-arcgis-code-red-cooling-centers", "America/New_York"],
  ["broward-arcgis-cooling-centers", "America/New_York"],
  ["buena-park-arcgis-cooling-centers-2025", "America/Los_Angeles"],
  ["chicago-socrata-cooling-centers", "America/Chicago"],
  ["cook-county-socrata-cooling-centers", "America/Chicago"],
  ["dc-arcgis-cooling-centers", "America/New_York"],
  ["flint-arcgis-cooling-centers", "America/Detroit"],
  ["houston-arcgis-cool-centers", "America/Chicago"],
  ["la-county-chap-arcgis-cooling-centers", "America/Los_Angeles"],
  ["los-angeles-arcgis-cooling-heating-relief-centers", "America/Los_Angeles"],
  ["maricopa-arcgis-heat-relief-network", "America/Phoenix"],
  ["medical-lake-arcgis-cooling-resource", "America/Los_Angeles"],
  ["miami-city-arcgis-cooling-centers", "America/New_York"],
  ["miami-dade-arcgis-cooling-centers", "America/New_York"],
  ["palm-springs-arcgis-cooling-centers", "America/Los_Angeles"],
  ["pge-arcgis-california-cooling-centers-2026", "America/Los_Angeles"],
  ["philadelphia-arcgis-high-heat-cooling-resources", "America/New_York"],
  ["richmond-arcgis-cooling-centers", "America/New_York"],
  ["spokane-arcgis-cooling-resources", "America/Los_Angeles"],
  ["st-louis-arcgis-warming-cooling-centers", "America/Chicago"],
])

const CLOSED_STATUS_PATTERN =
  /\b(?:closed until further notice|closed for renovations?|permanently closed)\b/iu
const PHONE_PATTERN =
  /(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}|\b311\b/u
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu

function readObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {}
}

function readArray(value) {
  return Array.isArray(value) ? value : []
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.replace(/\s+/gu, " ").trim()
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }
  return null
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function sourceIdFor(record) {
  return readString(record.sourceId, record.source_id) ?? ""
}

function fieldsFor(record) {
  return readObject(
    record.extractedFields ?? record.extracted_fields ?? record.fields
  )
}

function rawFor(record) {
  return readObject(record.rawSnapshot ?? record.raw_snapshot)
}

export function isCoolingCenterRecord(record) {
  const sourceId = sourceIdFor(record)
  if (!sourceId || sourceId.startsWith("nyc-arcgis-")) return false
  if (sourceId === "chicago-socrata-public-libraries") return false
  if (!/(?:^|-)(?:arcgis|socrata)(?:-|$)/u.test(sourceId)) return false

  const fields = fieldsFor(record)
  const intent = [
    sourceId,
    record.sourceName,
    record.source_name,
    fields.sourceCategoryText,
    fields.source_category_text,
  ]
    .filter(Boolean)
    .join(" ")
  return /\b(?:cool(?:ing)?|heat|warming|hydration|relief)\b/iu.test(intent)
}

function cleanFacilityName(record, fields, raw) {
  return (
    readString(
      fields.canonicalName,
      fields.organizationName,
      fields.organization_name,
      fields.title,
      raw.FacilityName,
      raw.facility_name,
      raw.Site_Name,
      raw.site_name,
      raw.USER_Name,
      raw.USER_Agency,
      raw.AMENITY_NAME,
      raw.Location,
      raw.Name,
      raw.NAME,
      record.sourceRecordId,
      record.source_record_id
    )?.replace(/[.]+$/u, "") ?? null
  )
}

function providerNameFor(record, raw, facilityName) {
  const attribution = readString(record.attribution)
  const sourceName = readString(record.sourceName, record.source_name)
  const sourcePublisher = sourceName?.split(/\s[-–—]\s/u)[0]?.trim()
  const candidates = [
    raw.Organization,
    raw.USER_Agency,
    raw.Agency,
    raw.Provider,
    attribution,
    sourcePublisher,
  ]
  for (const candidate of candidates) {
    const provider = readString(candidate)
    if (!provider) continue
    if (
      /^(?:public )?arcgis|open feature service$/iu.test(provider) ||
      /\b(?:GIS|geographic information systems?)\b/iu.test(provider) ||
      /\bregion(?:al)?$/iu.test(provider)
    ) {
      continue
    }
    return provider
  }
  return facilityName
}

function resourceKindFor(record, fields, raw) {
  const sourceId = sourceIdFor(record)
  if (sourceId === "st-louis-arcgis-warming-cooling-centers") {
    return "Warming and Cooling Center"
  }
  if (sourceId === "los-angeles-arcgis-cooling-heating-relief-centers") {
    return "Climate Relief Center"
  }

  const heatReliefType = readString(raw.HeatRelief_Type)
  if (heatReliefType) return heatReliefType
  if (/^yes$/iu.test(readString(raw.Collection) ?? "")) {
    const collectionType = readString(raw.Collection_Type)
    return collectionType
      ? `${collectionType} Site`
      : "Heat-Relief Supply Collection Site"
  }

  const stationType = readString(raw.STATION_TYPE)
  if (/fountain/iu.test(stationType ?? "")) return "Water Fountain"
  if (/hydration/iu.test(stationType ?? "")) return "Hydration Station"

  const rawType = readString(
    raw.Type,
    raw.Type_of_Center,
    raw.USER_Type,
    fields.sourceCategoryText
  )
  if (/hydration|cold water/iu.test(rawType ?? "")) return "Hydration Station"
  if (/respite/iu.test(rawType ?? "")) return "Respite Center"
  if (/warming/iu.test(rawType ?? "") && /cool/iu.test(rawType ?? "")) {
    return "Warming and Cooling Center"
  }
  return "Cooling Center"
}

function displayTitleFor(facilityName, resourceKind) {
  if (
    new RegExp(`\\b${resourceKind.replaceAll(" ", "\\s+")}\\b`, "iu").test(
      facilityName
    )
  ) {
    return facilityName
  }
  return `${facilityName} — ${resourceKind}`
}

function normalizeUrl(value) {
  const raw = readString(value)?.replace(/[*]+$/u, "")
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (isTechnicalResourceSourceUrl(url.toString())) return null
    if (/\.(?:gif|jpe?g|png|webp)(?:$|\?)/iu.test(url.pathname)) return null
    if (
      /^(?:farm\d+\.staticflickr\.com|live\.staticflickr\.com)$/iu.test(
        url.hostname
      ) ||
      /(?:^|\.)googleusercontent\.com$/iu.test(url.hostname)
    ) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

function rawUrlCandidates(raw) {
  return [
    raw.Website_Link,
    raw.USER_Url,
    raw.URL,
    raw.WebLink,
    raw.FacilityWebsite,
    raw.website,
    raw.link,
    raw.link2,
    raw.map_link,
    readObject(raw.directions).url,
  ]
}

function buildLinks(fields, raw) {
  const candidates = [
    ...readArray(fields.links).map((link) => readObject(link).url),
    fields.websiteUrl,
    fields.website_url,
    ...rawUrlCandidates(raw),
  ]
  const urls = unique(candidates.map(normalizeUrl))
  return urls.map((url, index) => {
    const isDirections = /(?:google\.[^/]+\/maps|maps\.google\.)/iu.test(url)
    return {
      label: isDirections
        ? "Directions"
        : index === 0
          ? "Official page"
          : "Resource page",
      type: isDirections ? "resource" : "website",
      url,
    }
  })
}

function extractPhone(record, fields, raw) {
  const candidates = [
    fields.phone,
    fields.phoneNumber,
    raw.PrimaryPhone,
    raw.Phone,
    raw.phone,
    raw.USER_Phone,
    raw.CNTCT_PHN,
    raw.Phone_Number,
    raw.PhoneNumbe,
    raw.contactphone,
    raw.Call,
    raw.AltFacPhone,
    raw.Notes,
    raw.COMMENTS,
    raw.Hours,
  ]
  for (const candidate of candidates) {
    const match = readString(candidate)?.match(PHONE_PATTERN)?.[0]
    if (match) return match
  }
  if (
    sourceIdFor(record) === "chicago-socrata-cooling-centers" &&
    /\bcall 311\b/iu.test(readString(record.termsNotes) ?? "")
  ) {
    return "311"
  }
  return null
}

function extractEmail(fields, raw) {
  const candidates = [fields.email, fields.contactEmail, ...Object.values(raw)]
  for (const candidate of candidates) {
    const match = readString(candidate)?.match(EMAIL_PATTERN)?.[0]
    if (match) return match
  }
  return null
}

function usableAddress(fields, raw) {
  const address = readString(
    fields.address,
    fields.addressLine1,
    fields.address_line1,
    raw.Address,
    raw.ADDRESS,
    raw.USER_Address,
    raw.Place_addr,
    raw.Match_addr,
    raw.Street_Loc,
    raw.Street_Address,
    raw.Street,
    raw.streetaddress
  )
  return /^(?:indoor|outdoor|unknown|n\/?a)$/iu.test(address ?? "")
    ? null
    : address
}

function hoursFor(fields, raw) {
  const hours = readObject(fields.hours)
  const label = readString(
    hours.label,
    raw.Hours_of_Operation,
    raw.hours_of_operation,
    raw.OperationalHours,
    raw.Operation_Hrs,
    raw.Open_Hrs,
    raw.USER_Hours,
    raw.Days_Hours_of_Operation,
    raw.Hours,
    raw.hours
  )
  const phoneOnly = label && label.match(PHONE_PATTERN)?.[0] === label
  return {
    hours:
      phoneOnly || (!label && Object.keys(hours).length === 0)
        ? { exceptions: [], schemaVersion: 1, weekly: [] }
        : { ...hours, ...(label ? { label } : {}) },
    label: phoneOnly ? null : label,
  }
}

function eligibilityFor(raw) {
  const openTo = readString(raw.USER_Open_To)
  if (/^all$/iu.test(openTo ?? "")) {
    return "The source lists this location as open to all and does not state additional eligibility requirements."
  }
  if (/^(?:men|women)$/iu.test(openTo ?? "")) {
    return `The source lists this location for ${openTo.toLowerCase()} and does not state additional eligibility requirements.`
  }

  const notes = readString(
    raw.Notes,
    raw.Additional_Notes,
    raw.Note,
    raw.COMMENTS
  )
  const age = notes?.match(/(?:must be\s*)?([0-9]{2})\s*(?:\+|or older)/iu)?.[1]
  if (age)
    return `The source limits this location to people age ${age} or older.`
  if (/seniors? only/iu.test(notes ?? "")) {
    return "The source identifies this location as seniors-only but does not state an age threshold."
  }
  return "The source does not state eligibility requirements for this location."
}

function accessibilityFor(raw) {
  const value = readString(
    raw.ADA_accessible,
    raw.ada_accessible,
    raw.Wheelchair_access,
    raw.accessible,
    raw.accessibledetails
  )
  if (/^yes$/iu.test(value ?? "")) {
    return "The source identifies this location as wheelchair or ADA accessible."
  }
  if (/^no$/iu.test(value ?? "")) {
    return "The source says this location is not wheelchair or ADA accessible."
  }
  return "The source does not state accessibility details for this location."
}

function explicitStatus(raw) {
  return readString(raw.USER_Status, raw.status_text, raw.Status)
}

function parseDate(value) {
  const raw = readString(value)
  if (!raw) return null
  const date = new Date(`${raw}T23:59:59.999Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function duplicateConflicts(record) {
  const duplicate = readObject(
    record.duplicateCandidate ?? record.duplicate_candidate
  )
  const normalizedDuplicate = readObject(fieldsFor(record).dedupe)
  const direct = readArray(duplicate.conflicts).map(String)
  const normalized = readArray(normalizedDuplicate.conflicts).map(String)
  const flags = readArray(record.qualityFlags ?? record.quality_flags)
    .filter((flag) => readObject(flag).code === "field_conflict")
    .map((flag) => readString(readObject(flag).message) ?? "field conflict")
  return unique([...direct, ...normalized, ...flags])
}

function duplicateReviewNeeded(record) {
  const duplicate = readObject(
    record.duplicateCandidate ?? record.duplicate_candidate
  )
  const normalizedDuplicate = readObject(fieldsFor(record).dedupe)
  return (
    duplicate.reviewNeeded === true || normalizedDuplicate.reviewNeeded === true
  )
}

function buildBlockers({ email, links, nowDate, phone, raw, record }) {
  const blockers = []
  const sourceId = sourceIdFor(record)
  const add = (code, message) => blockers.push({ code, message })

  if (
    nowDate.getUTCFullYear() !== CURRENT_SEASON_YEAR ||
    !CURRENT_SEASON_SOURCE_IDS.has(sourceId)
  ) {
    add(
      "seasonal_source_not_currently_verified",
      "The retained source is not verified for the current 2026 heat season."
    )
  }
  if (/verify source authority/iu.test(readString(record.termsNotes) ?? "")) {
    add(
      "source_authority_unverified",
      "The retained source metadata requires authority review."
    )
  }
  if (sourceId === "pge-arcgis-california-cooling-centers-2026") {
    add(
      "secondary_source_requires_provider_confirmation",
      "The utility listing requires confirmation against the local provider."
    )
  }

  const status = explicitStatus(raw)
  if (CLOSED_STATUS_PATTERN.test(status ?? "")) {
    add("source_marks_closed", `The source status says: ${status}`)
  }
  if (/^no$/iu.test(readString(raw.Active) ?? "")) {
    add("source_marks_inactive", "The source marks this record inactive.")
  }

  const recordYear = Number(raw.Year)
  if (Number.isFinite(recordYear) && recordYear !== nowDate.getUTCFullYear()) {
    add(
      "record_outside_current_season",
      `The source record is for ${recordYear}, not ${nowDate.getUTCFullYear()}.`
    )
  }
  const startsAt = parseDate(raw.Start_Date)
  const endsAt = parseDate(raw.End_Date)
  if (startsAt && startsAt > nowDate) {
    add("season_not_started", "The source-listed season has not started.")
  }
  if (endsAt && endsAt < nowDate) {
    add("season_ended", "The source-listed season has ended.")
  }

  const conflicts = duplicateConflicts(record)
  if (duplicateReviewNeeded(record)) {
    add(
      "unresolved_duplicate_match",
      "The staged record has an unresolved potential duplicate."
    )
  }
  if (conflicts.length > 0) {
    add(
      "unresolved_field_conflict",
      `The staged record has unresolved conflicts: ${conflicts.join(", ")}.`
    )
  }
  const providerLink = links.find((link) => link.type === "website")
  if (!phone && !email && !providerLink) {
    add(
      "missing_actionable_contact",
      "The source provides no public contact or non-technical provider link."
    )
  }
  if (!readString(record.sourceUrl, record.source_url)) {
    add("missing_source_url", "The retained record has no source URL.")
  }

  return blockers.filter(
    (blocker, index, items) =>
      items.findIndex((item) => item.code === blocker.code) === index
  )
}

function resourceCategories(resourceKind) {
  if (/warming and cooling/iu.test(resourceKind)) {
    return [
      "emergency_cooling_centers",
      "emergency_warming_centers",
      "environment",
    ]
  }
  if (/hydration|fountain|collection/iu.test(resourceKind)) {
    return ["environment", "community"]
  }
  return ["emergency_cooling_centers", "environment"]
}

function availabilitySummary({ hoursLabel, raw, sourceName }) {
  const status = explicitStatus(raw)
  if (CLOSED_STATUS_PATTERN.test(status ?? "")) {
    return `The ${sourceName} listing marks this location closed. Confirm any later reopening before traveling.`
  }
  const season =
    readString(raw.Start_Date) && readString(raw.End_Date)
      ? ` The source lists a season from ${readString(raw.Start_Date)} through ${readString(raw.End_Date)}.`
      : ""
  const schedule = hoursLabel
    ? ` Source-listed schedule: ${hoursLabel}.`
    : " The source does not provide operating hours."
  return `Dataset membership does not confirm that this seasonal or event-based location is activated or open now.${season}${schedule}`
}

function buildAccessInstructions({
  address,
  email,
  links,
  phone,
  sourceName,
  isClosed,
}) {
  const place = address ? ` The source lists the location at ${address}.` : ""
  if (isClosed) {
    return `The retained source marks this location closed. Confirm a later reopening with ${sourceName} before traveling.${place}`
  }
  if (phone) {
    return `Call ${phone} to confirm current activation, hours, and access before traveling.${place}`
  }
  if (email) {
    return `Email ${email} to confirm current activation, hours, and access before traveling.${place}`
  }
  const providerLink = links.find((link) => link.type === "website")
  if (providerLink) {
    return `Check the source-listed ${providerLink.label.toLowerCase()} to confirm current activation, hours, and access before traveling.${place}`
  }
  return `The source provides no public contact. Confirm current activation and hours with ${sourceName} before traveling.${place}`
}

function buildCitation({ draft, evidenceSnippet, sourceUrl }) {
  return {
    claimPaths: [
      "displayTitle",
      "providerName",
      "publicSummary",
      "services",
      "eligibility",
      "accessInstructions",
      "availability",
      "hoursNote",
      "cost",
      "accessibility",
      ...(draft.address ? ["address"] : []),
      ...(draft.phone ? ["phone"] : []),
      ...(draft.email ? ["email"] : []),
      ...(draft.links.length > 0 ? ["links"] : []),
    ],
    evidenceSnippet: evidenceSnippet.slice(0, 240),
    sourceUrl,
  }
}

function buildClaimChecks(draft, sourceUrl) {
  return draft.citations[0].claimPaths.map((claimPath) => ({
    claimPath,
    note: "Checked against retained dataset fields and omission-safe wording.",
    sourceUrls: [sourceUrl],
    status: "supported",
  }))
}

function buildEvidenceSnippet({
  address,
  facilityName,
  hoursLabel,
  raw,
  resourceKind,
}) {
  return unique([
    facilityName,
    resourceKind,
    address,
    hoursLabel,
    explicitStatus(raw),
    readString(raw.Start_Date),
    readString(raw.End_Date),
  ]).join(" | ")
}

function buildDerivedEvidence({ draft, now, sourceUrl, verificationStatus }) {
  const fields = new Map([
    ["extractedFields.organizationName", draft.providerName],
    ["extractedFields.serviceTitle", draft.displayTitle],
    ["extractedFields.description", draft.publicSummary],
    ["extractedFields.serviceDescription", draft.publicSummary],
    ["extractedFields.eligibility", draft.eligibility],
    ["extractedFields.accessInstructions", draft.accessInstructions],
    ["extractedFields.cost", draft.cost],
    ["extractedFields.accessibilityNotes", draft.accessibility],
    ["extractedFields.availabilityNotes", draft.availability],
    ["extractedFields.phone", draft.phone],
    ["extractedFields.email", draft.email],
    ["extractedFields.timezone", draft.timezone],
  ])
  return [...fields]
    .filter(([, value]) => value !== null && value !== "")
    .map(([fieldPath, fieldValue]) => ({
      confidenceScore: verificationStatus === "approved" ? 92 : 70,
      derivedFrom: [sourceUrl],
      evidenceMetadata: {
        methodVersion: METHOD_VERSION,
        retainedRawFields: true,
        verificationStatus,
      },
      evidenceType: "derived",
      fieldPath,
      fieldValue,
      observedAt: now,
      sourceUrl,
      transformation: "source_specific_deterministic_enrichment",
    }))
}

function buildBlockerQualityFlags(existingFlags, blockers) {
  const flags = [...existingFlags]
  for (const blocker of blockers) {
    if (flags.some((flag) => readObject(flag).code === blocker.code)) continue
    flags.push({
      code: blocker.code,
      message: blocker.message,
      severity: "review",
    })
  }
  return flags
}

export function enrichCoolingCenterRecord({ record, now }) {
  if (!isCoolingCenterRecord(record)) {
    throw new Error(
      "Record is outside the non-NYC ArcGIS/Socrata cooling and heat cohort."
    )
  }

  const verifiedAt = now ?? record.lastSeenAt ?? new Date().toISOString()
  const nowDate = new Date(verifiedAt)
  if (Number.isNaN(nowDate.getTime()))
    throw new Error("A valid enrichment time is required.")

  const fields = fieldsFor(record)
  const raw = rawFor(record)
  const sourceId = sourceIdFor(record)
  const sourceName =
    readString(record.sourceName, record.source_name) ?? "the source agency"
  const sourceUrl = readString(record.sourceUrl, record.source_url)
  const facilityName = cleanFacilityName(record, fields, raw)
  if (!facilityName)
    throw new Error("A source-listed facility name is required.")
  if (!sourceUrl) throw new Error("A retained source URL is required.")

  const resourceKind = resourceKindFor(record, fields, raw)
  const displayTitle = displayTitleFor(facilityName, resourceKind)
  const providerName = providerNameFor(record, raw, facilityName)
  const address = usableAddress(fields, raw)
  const phone = extractPhone(record, fields, raw)
  const email = extractEmail(fields, raw)
  const links = buildLinks(fields, raw)
  const { hours, label: hoursLabel } = hoursFor(fields, raw)
  const timezone =
    readString(fields.timezone, fields.timeZone) ??
    TIMEZONE_BY_SOURCE_ID.get(sourceId) ??
    null
  const status = explicitStatus(raw)
  const isClosed = CLOSED_STATUS_PATTERN.test(status ?? "")
  const availability = availabilitySummary({ hoursLabel, raw, sourceName })
  const accessInstructions = buildAccessInstructions({
    address,
    email,
    isClosed,
    links,
    phone,
    sourceName,
  })
  const locationDescription = address
    ? ` at ${address}`
    : " at the mapped source location"
  const providerLink = links.find((link) => link.type === "website")
  const contactDescription = phone
    ? ` The listing provides ${phone} for confirmation.`
    : email
      ? ` The listing provides ${email} for confirmation.`
      : providerLink
        ? " The listing includes a non-technical public resource link."
        : " The listing does not provide a public contact."
  const publicSummary = `The retained ${sourceName} dataset lists ${facilityName} as a ${resourceKind.toLowerCase()}${locationDescription}. Dataset membership does not confirm current activation or open status.${contactDescription}`
  const categoryKeys = resourceCategories(resourceKind)
  const blockers = buildBlockers({ email, links, nowDate, phone, raw, record })
  const contradictions = duplicateConflicts(record).map(
    (conflict) =>
      `The staged record has an unresolved field conflict: ${conflict}.`
  )
  if (isClosed) contradictions.push(`The source status says: ${status}`)
  const verificationStatus = blockers.length === 0 ? "approved" : "needs_review"
  const draft = {
    accessInstructions,
    accessibility: accessibilityFor(raw),
    address,
    availability,
    citations: [],
    cost: "The source does not state a cost for using this location.",
    displayTitle,
    email,
    eligibility: eligibilityFor(raw),
    hoursNote: hoursLabel
      ? `Use the source-listed schedule and confirm current activation and exceptions before traveling: ${hoursLabel}.`
      : "The source does not provide operating hours; confirm them before traveling.",
    links,
    phone,
    providerName,
    publicSummary,
    resourceKind,
    schemaVersion: 1,
    services: [
      {
        description: `The source classifies this mapped location as a ${resourceKind.toLowerCase()}.`,
        howToAccess: accessInstructions,
        name: resourceKind,
      },
    ],
    timezone,
  }
  draft.citations = [
    buildCitation({
      draft,
      evidenceSnippet: buildEvidenceSnippet({
        address,
        facilityName,
        hoursLabel,
        raw,
        resourceKind,
      }),
      sourceUrl,
    }),
  ]

  const enrichedFields = {
    ...fields,
    accessInstructions: draft.accessInstructions,
    accessibilityNotes: draft.accessibility,
    address: draft.address,
    appointmentInfo: draft.accessInstructions,
    appointmentRequired: null,
    availabilityNotes: draft.availability,
    availabilityStatus: isClosed ? "closed" : "seasonal",
    category: categoryKeys[0].startsWith("emergency_")
      ? "emergency"
      : "environment",
    cost: draft.cost,
    deliveryModes: unique([...readArray(fields.deliveryModes), "in_person"]),
    description: draft.publicSummary,
    email: draft.email ?? null,
    eligibility: draft.eligibility,
    enrichment: {
      draft: {
        citations: draft.citations,
        method: "deterministic_source_extraction",
        methodVersion: METHOD_VERSION,
      },
      evidenceUrls: [sourceUrl],
      passes: [
        {
          comparedFields: [
            "title",
            "resourceKind",
            "address",
            "hours",
            "phone",
            "email",
            "status",
          ],
          name: "retained_raw_field_comparison",
          status: contradictions.length === 0 ? "completed" : "needs_review",
        },
        {
          claimCount: draft.citations[0].claimPaths.length,
          name: "claim_and_citation_verification",
          status:
            verificationStatus === "approved" ? "completed" : "needs_review",
        },
      ],
      publicationBlockers: blockers,
      schemaVersion: 1,
      sourceComparisonCount: 2,
      verification: {
        claimChecks: buildClaimChecks(draft, sourceUrl),
        contradictions,
        method: "deterministic_source_verification",
        methodVersion: METHOD_VERSION,
        requiredCorrections: blockers.map((blocker) => blocker.message),
        schemaVersion: 1,
        status: verificationStatus,
        summary:
          verificationStatus === "approved"
            ? "Source-backed claims, omissions, citations, and current-season gates passed."
            : `${blockers.length} publication blocker${blockers.length === 1 ? "" : "s"} require review.`,
        unsupportedClaims: [],
      },
    },
    hours,
    hoursNote: draft.hoursNote,
    intakeUrl: null,
    links: draft.links,
    locationType: fields.locationType ?? "physical",
    organizationName: draft.providerName,
    phone: draft.phone ?? null,
    primaryResourceCategory: categoryKeys[0],
    providerName: draft.providerName,
    resourceCategories: categoryKeys,
    serviceDescription: draft.publicSummary,
    serviceOfferings: [draft.resourceKind],
    services: draft.services,
    serviceTitle: draft.displayTitle,
    subcategory: categoryKeys[0],
    timezone: draft.timezone,
    title: draft.displayTitle,
    websiteUrl:
      draft.links.find((link) => link.type === "website")?.url ?? null,
  }

  return {
    ...record,
    extractedFields: enrichedFields,
    fieldEvidence: [
      ...readArray(record.fieldEvidence ?? record.field_evidence),
      ...buildDerivedEvidence({
        draft,
        now: verifiedAt,
        sourceUrl,
        verificationStatus,
      }),
    ],
    lastEnrichedAt: verifiedAt,
    lastVerifiedAt: verificationStatus === "approved" ? verifiedAt : null,
    needsReview: true,
    qualityFlags: buildBlockerQualityFlags(
      readArray(record.qualityFlags ?? record.quality_flags),
      blockers
    ),
    reasonCodes: unique([
      ...readArray(record.reasonCodes ?? record.reason_codes),
      "deterministic_source_enrichment",
      ...blockers.map((blocker) => blocker.code),
    ]),
  }
}

export const COOLING_CENTER_ENRICHMENT_METHOD_VERSION = METHOD_VERSION
