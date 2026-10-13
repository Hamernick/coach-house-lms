import {
  buildNormalizedImportFields,
  getFirstString,
  normalizeDomain,
  resolveExtractedFields,
} from "./normalization.mjs"
import {
  AVAILABILITY_STATUSES,
  CONTACT_TYPES,
  GEOCODING_ACCURACY,
  LINK_TYPES,
  LOCATION_TYPES,
  dedupePayloads,
  fieldArray,
  normalizeEnum,
  resolveResourceCategoryKey,
  normalizeUrl,
  objectArray,
  readBoolean,
  readCoordinate,
  readHours,
  readPositiveNumber,
} from "./promotion-normalizers.mjs"

function buildCategoryKeys(fields, record) {
  const values = [
    ...fieldArray(fields.resourceCategories ?? fields.resource_categories),
    ...fieldArray(fields.categories),
    ...fieldArray(record.resourceCategories ?? record.resource_categories),
    ...fieldArray(record.categories),
    fields.primaryResourceCategory,
    fields.primary_resource_category,
    fields.categoryKey,
    fields.category_key,
    fields.category,
    fields.subcategory,
    fields.subcategoryKey,
    fields.subcategory_key,
    record.primaryResourceCategory,
    record.primary_resource_category,
    record.categoryKey,
    record.category_key,
    record.category,
    record.subcategory,
    record.subcategoryKey,
    record.subcategory_key,
  ]

  const categories = values
    .map(resolveResourceCategoryKey)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)

  return categories.length > 0 ? categories : ["community"]
}

function buildCategoryConfidenceByKey(fields, fallbackConfidence) {
  const taxonomy =
    fields.taxonomyClassification ?? fields.taxonomy_classification ?? {}
  const entries = Array.isArray(taxonomy.categories) ? taxonomy.categories : []
  const confidenceByKey = {}
  const fallback = Number(fallbackConfidence)
  const hasFallback = Number.isFinite(fallback)

  for (const entry of entries) {
    const key = resolveResourceCategoryKey(
      entry.key ?? entry.category ?? entry.category_key
    )
    const confidence = Number(entry.confidence)
    if (key && Number.isFinite(confidence)) {
      confidenceByKey[key] = Math.max(0, Math.min(100, confidence))
    }
  }

  for (const key of buildCategoryKeys(fields, {})) {
    if (confidenceByKey[key] === undefined && hasFallback) {
      confidenceByKey[key] = Math.max(0, Math.min(100, fallback))
    }
  }

  return confidenceByKey
}

function buildLocationPayload(fields, record) {
  const latitude = readCoordinate(
    fields.latitude ?? fields.lat ?? record.latitude ?? record.lat,
    -90,
    90
  )
  const longitude = readCoordinate(
    fields.longitude ??
      fields.lng ??
      fields.lon ??
      record.longitude ??
      record.lng ??
      record.lon,
    -180,
    180
  )
  const hasCoordinatePair = latitude !== null && longitude !== null
  const addressLine1 = getFirstString(
    fields.addressLine1,
    fields.address_line1,
    fields.streetAddress,
    fields.address,
    fields.fullAddress,
    record.address
  )
  const serviceArea = fieldArray(
    fields.serviceArea ?? fields.service_area ?? record.serviceArea
  )
  const city = getFirstString(fields.city, record.city)
  const state = getFirstString(fields.state, record.state)
  const locationUrl = normalizeUrl(
    fields.locationUrl ?? fields.location_url ?? record.locationUrl
  )
  const hours = readHours(fields.hours ?? record.hours)
  const timezone = getFirstString(
    fields.timezone,
    fields.timeZone,
    record.timezone,
    record.timeZone
  )

  if (
    !addressLine1 &&
    !city &&
    !state &&
    !hasCoordinatePair &&
    serviceArea.length === 0 &&
    !locationUrl &&
    Object.keys(hours).length === 0
  ) {
    return null
  }

  const requestedType = normalizeEnum(
    fields.locationType ?? fields.location_type ?? record.locationType,
    LOCATION_TYPES,
    null
  )
  const locationType =
    requestedType ??
    (hasCoordinatePair || addressLine1
      ? "physical"
      : serviceArea.length > 0
        ? "service_area"
        : "online")

  return {
    label: getFirstString(fields.locationLabel, fields.location_label),
    location_type: locationType,
    address_line1: addressLine1,
    address_line2: getFirstString(fields.addressLine2, fields.address_line2),
    city,
    state,
    county: getFirstString(fields.county),
    postal_code: getFirstString(fields.postalCode, fields.postal_code),
    country: getFirstString(fields.country) ?? "United States",
    latitude: hasCoordinatePair ? latitude : null,
    longitude: hasCoordinatePair ? longitude : null,
    geocoding_accuracy: normalizeEnum(
      fields.geocodingAccuracy ?? fields.geocoding_accuracy,
      GEOCODING_ACCURACY,
      "unknown"
    ),
    service_radius_miles: readPositiveNumber(
      fields.serviceRadiusMiles,
      fields.service_radius_miles
    ),
    location_url: locationUrl,
    service_area: serviceArea,
    accessibility_notes: getFirstString(
      fields.accessibilityNotes,
      fields.accessibility_notes
    ),
    hours,
    timezone,
    appointment_required: readBoolean(
      fields.locationAppointmentRequired ??
        fields.location_appointment_required ??
        fields.appointmentRequired ??
        fields.appointment_required
    ),
    availability_status: normalizeEnum(
      fields.locationAvailabilityStatus ??
        fields.location_availability_status ??
        fields.availabilityStatus ??
        fields.availability_status,
      AVAILABILITY_STATUSES,
      "unknown"
    ),
    availability_notes: getFirstString(
      fields.locationAvailabilityNotes,
      fields.location_availability_notes,
      fields.availabilityNotes,
      fields.availability_notes
    ),
    temporary_closed_until: getFirstString(
      fields.locationTemporaryClosedUntil,
      fields.location_temporary_closed_until,
      fields.temporaryClosedUntil,
      fields.temporary_closed_until
    ),
    is_primary: true,
  }
}

function inferContactType(value, fallback) {
  if (fallback) return fallback
  if (String(value).includes("@")) return "email"
  return "phone"
}

function normalizeContactEntry(entry, index) {
  const value = getFirstString(entry.value, entry.phone, entry.email)
  if (!value) return null

  const explicitType = normalizeEnum(
    entry.type ?? entry.contact_type,
    CONTACT_TYPES,
    null
  )
  const contactType = inferContactType(value, explicitType)
  const url =
    normalizeUrl(entry.url) ??
    (contactType === "email"
      ? `mailto:${value}`
      : contactType === "phone" || contactType === "sms"
        ? `tel:${value}`
        : null)

  return {
    contact_type: contactType,
    label: getFirstString(entry.label, entry.name),
    value,
    url,
    is_primary: entry.isPrimary === true || entry.is_primary === true,
    is_public: false,
    metadata: { promotedFromImport: true, sourceIndex: index },
  }
}

function buildContactPayloads(fields, record) {
  const explicitContacts = [
    ...objectArray(fields.contacts),
    ...objectArray(fields.public_contacts),
    ...objectArray(record.contacts),
    ...objectArray(record.public_contacts),
  ].flatMap((entry, index) => {
    const normalized = normalizeContactEntry(entry, index)
    return normalized ? [normalized] : []
  })

  const phone = getFirstString(fields.phone, fields.phoneNumber, record.phone)
  const email = getFirstString(fields.email, fields.contactEmail, record.email)
  const defaults = [
    phone
      ? {
          contact_type: "phone",
          label: "Phone",
          value: phone,
          url: `tel:${phone}`,
          is_primary: explicitContacts.length === 0,
          is_public: false,
          metadata: { promotedFromImport: true, sourceField: "phone" },
        }
      : null,
    email
      ? {
          contact_type: "email",
          label: "Email",
          value: email,
          url: `mailto:${email}`,
          is_primary: false,
          is_public: false,
          metadata: { promotedFromImport: true, sourceField: "email" },
        }
      : null,
  ].filter(Boolean)

  return dedupePayloads([...defaults, ...explicitContacts], (contact) =>
    `${contact.contact_type}:${contact.value}`.toLowerCase()
  )
}

function normalizeLinkEntry(entry, index) {
  const url = normalizeUrl(entry.url ?? entry.href)
  if (!url) return null
  const linkType = normalizeEnum(
    entry.type ?? entry.link_type,
    LINK_TYPES,
    "other"
  )

  return {
    link_type: linkType,
    label: getFirstString(entry.label, entry.title),
    url,
    domain: getFirstString(entry.domain) ?? normalizeDomain(url),
    is_primary: entry.isPrimary === true || entry.is_primary === true,
    is_public: false,
    metadata: { promotedFromImport: true, sourceIndex: index },
  }
}

function buildLinkPayloads(fields, record, sourceUrl) {
  const explicitLinks = [
    ...objectArray(fields.links),
    ...objectArray(fields.public_links),
    ...objectArray(record.links),
    ...objectArray(record.public_links),
  ].flatMap((entry, index) => {
    const normalized = normalizeLinkEntry(entry, index)
    return normalized ? [normalized] : []
  })

  const defaults = [
    [
      "website",
      "Website",
      fields.websiteUrl ?? fields.website_url ?? fields.website,
    ],
    ["donate", "Donate", fields.donateUrl ?? fields.donate_url],
    ["intake", "Intake", fields.intakeUrl ?? fields.intake_url],
    ["logo", "Logo", fields.logoUrl ?? fields.logo_url],
    ["source", "Source", sourceUrl],
  ].flatMap(([linkType, label, rawUrl]) => {
    const url = normalizeUrl(rawUrl)
    if (!url) return []
    return [
      {
        link_type: linkType,
        label,
        url,
        domain: normalizeDomain(url),
        is_primary: linkType === "website" && explicitLinks.length === 0,
        is_public: false,
        metadata: { promotedFromImport: true, sourceField: linkType },
      },
    ]
  })

  return dedupePayloads([...defaults, ...explicitLinks], (link) =>
    `${link.link_type}:${link.url}`.toLowerCase()
  )
}

const LOCATION_EVIDENCE_FIELDS = new Set([
  "address",
  "addressLine1",
  "address_line1",
  "addressLine2",
  "address_line2",
  "streetAddress",
  "fullAddress",
  "city",
  "state",
  "county",
  "postalCode",
  "postal_code",
  "country",
  "latitude",
  "lat",
  "longitude",
  "lng",
  "lon",
  "locationUrl",
  "location_url",
  "locationType",
  "location_type",
  "locationLabel",
  "location_label",
  "serviceArea",
  "service_area",
  "serviceRadiusMiles",
  "service_radius_miles",
  "geocodingAccuracy",
  "geocoding_accuracy",
  "hours",
  "timezone",
  "timeZone",
  "appointmentRequired",
  "appointment_required",
  "availabilityStatus",
  "availability_status",
  "availabilityNotes",
  "availability_notes",
  "temporaryClosedUntil",
  "temporary_closed_until",
])

const CONTACT_EVIDENCE_FIELDS = new Set([
  "contacts",
  "public_contacts",
  "phone",
  "phoneNumber",
  "email",
  "contactEmail",
])

const LINK_EVIDENCE_FIELDS = new Set([
  "links",
  "public_links",
  "website",
  "websiteUrl",
  "website_url",
  "donateUrl",
  "donate_url",
  "intakeUrl",
  "intake_url",
  "logoUrl",
  "logo_url",
  "sourceUrl",
  "source_url",
])

const CONTACT_TYPE_BY_FIELD = new Map([
  ["phone", "phone"],
  ["phoneNumber", "phone"],
  ["email", "email"],
  ["contactEmail", "email"],
])

const LINK_TYPE_BY_FIELD = new Map([
  ["website", "website"],
  ["websiteUrl", "website"],
  ["website_url", "website"],
  ["donateUrl", "donate"],
  ["donate_url", "donate"],
  ["intakeUrl", "intake"],
  ["intake_url", "intake"],
  ["logoUrl", "logo"],
  ["logo_url", "logo"],
  ["sourceUrl", "source"],
  ["source_url", "source"],
])

function lastFieldPathSegment(fieldPath) {
  const normalized = String(fieldPath ?? "")
    .trim()
    .replace(/\[\d+\]/g, "")
  if (!normalized) return ""
  return normalized.split(".").filter(Boolean).at(-1) ?? ""
}

function isFieldPathUnder(fieldPath, segment) {
  const normalized = String(fieldPath ?? "").trim()
  return normalized === segment || normalized.startsWith(`${segment}.`)
}

function readEvidenceMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value
}

function readTextArray(value) {
  if (!Array.isArray(value)) return []
  return value.filter((entry) => typeof entry === "string" && entry.trim())
}

function findContactForField(fieldName, children) {
  const contactType = CONTACT_TYPE_BY_FIELD.get(fieldName)
  if (contactType) {
    const match = children.contacts.find(
      (contact) => contact.contact_type === contactType
    )
    if (match) return match
  }
  return children.contacts[0] ?? null
}

function findLinkForField(fieldName, children) {
  const linkType = LINK_TYPE_BY_FIELD.get(fieldName)
  if (linkType) {
    const match = children.links.find((link) => link.link_type === linkType)
    if (match) return match
  }
  return children.links[0] ?? null
}

export function buildPromotedFieldEvidenceRows(
  evidenceRows,
  canonical,
  children = {}
) {
  const organizationId = canonical.organization?.id ?? null
  const serviceId = canonical.service?.id ?? null
  const insertedChildren = {
    location: children.location ?? null,
    contacts: Array.isArray(children.contacts) ? children.contacts : [],
    links: Array.isArray(children.links) ? children.links : [],
  }

  return (Array.isArray(evidenceRows) ? evidenceRows : [])
    .flatMap((evidence) => {
      const fieldPath = String(
        evidence.field_path ?? evidence.fieldPath ?? ""
      ).trim()
      if (!fieldPath) return []

      const fieldName = lastFieldPathSegment(fieldPath)
      const location =
        insertedChildren.location &&
        (LOCATION_EVIDENCE_FIELDS.has(fieldName) ||
          isFieldPathUnder(fieldPath, "extractedFields.location") ||
          isFieldPathUnder(fieldPath, "extractedFields.locations"))
          ? insertedChildren.location
          : null
      const contact =
        CONTACT_EVIDENCE_FIELDS.has(fieldName) ||
        isFieldPathUnder(fieldPath, "extractedFields.contacts") ||
        isFieldPathUnder(fieldPath, "contacts")
          ? findContactForField(fieldName, insertedChildren)
          : null
      const link =
        LINK_EVIDENCE_FIELDS.has(fieldName) ||
        isFieldPathUnder(fieldPath, "extractedFields.links") ||
        isFieldPathUnder(fieldPath, "links")
          ? findLinkForField(fieldName, insertedChildren)
          : null

      return [
        {
          import_record_id: evidence.import_record_id ?? null,
          source_id: evidence.source_id ?? canonical.sourceId ?? null,
          organization_id: organizationId,
          service_id: serviceId,
          location_id: location?.id ?? null,
          contact_id: contact?.id ?? null,
          link_id: link?.id ?? null,
          field_path: fieldPath,
          field_value:
            evidence.field_value ??
            evidence.fieldValue ??
            evidence.value ??
            null,
          confidence_score:
            evidence.confidence_score ?? evidence.confidenceScore ?? null,
          source_url: evidence.source_url ?? evidence.sourceUrl ?? null,
          evidence_type:
            evidence.evidence_type ?? evidence.evidenceType ?? "source",
          derived_from: readTextArray(
            evidence.derived_from ?? evidence.derivedFrom
          ),
          transformation: evidence.transformation ?? evidence.transform ?? null,
          evidence_metadata: {
            ...readEvidenceMetadata(
              evidence.evidence_metadata ??
                evidence.evidenceMetadata ??
                evidence.metadata
            ),
            promotedFromImport: true,
            originalEvidenceId: evidence.id ?? null,
            canonicalTarget: {
              organizationId,
              serviceId,
              locationId: location?.id ?? null,
              contactId: contact?.id ?? null,
              linkId: link?.id ?? null,
            },
          },
          observed_at:
            evidence.observed_at ??
            evidence.observedAt ??
            new Date().toISOString(),
        },
      ]
    })
    .filter(
      (evidence) =>
        evidence.organization_id ||
        evidence.service_id ||
        evidence.location_id ||
        evidence.contact_id ||
        evidence.link_id
    )
}

export function buildCanonicalPayload(record, publish) {
  const fields = resolveExtractedFields(record)
  const normalized = buildNormalizedImportFields(record)
  const now = new Date().toISOString()
  const organizationName = getFirstString(
    fields.organizationName,
    fields.organization_name,
    fields.name,
    fields.title,
    record.normalized_name
  )
  const serviceTitle = getFirstString(
    fields.serviceTitle,
    fields.service_title,
    fields.title,
    organizationName
  )

  if (!organizationName || !serviceTitle) {
    throw new Error(
      `Import record ${record.id} needs organizationName/name and serviceTitle/title before promotion.`
    )
  }

  const visibility = publish ? "published" : "draft"
  const reviewStatus = publish ? "approved" : "pending_review"
  const approvedAt = publish ? now : null
  const sourceUrl = getFirstString(
    record.source_url,
    fields.sourceUrl,
    fields.source_url,
    fields.websiteUrl,
    fields.website_url
  )

  const categoryKeys = buildCategoryKeys(fields, record)

  return {
    sourceId: record.source_id,
    confidenceScore: record.confidence_score,
    organization: {
      source_id: record.source_id,
      source_record_id: record.source_record_id,
      name: organizationName,
      tagline: getFirstString(fields.tagline, fields.subtitle),
      description: getFirstString(
        fields.organizationDescription,
        fields.organization_description,
        fields.description
      ),
      website_url: getFirstString(fields.websiteUrl, fields.website_url),
      donate_url: getFirstString(fields.donateUrl, fields.donate_url),
      logo_url: getFirstString(fields.logoUrl, fields.logo_url),
      favicon_url: getFirstString(fields.faviconUrl, fields.favicon_url),
      domain: normalized.normalized_domain,
      email: getFirstString(fields.email, fields.contactEmail),
      phone: getFirstString(fields.phone, fields.phoneNumber),
      normalized_email: normalized.normalized_email,
      normalized_phone: normalized.normalized_phone,
      visibility,
      review_status: reviewStatus,
      approved_at: approvedAt,
      source_url: sourceUrl,
      source_snapshot: record.raw_snapshot,
      last_seen_at: record.last_seen_at,
      last_verified_at: publish ? now : null,
    },
    service: {
      source_id: record.source_id,
      source_record_id: record.source_record_id,
      title: serviceTitle,
      subtitle: getFirstString(fields.serviceSubtitle, fields.subtitle),
      description: getFirstString(
        fields.serviceDescription,
        fields.description
      ),
      service_kind: fields.serviceKind ?? fields.service_kind ?? "service",
      delivery_modes: fieldArray(fields.deliveryModes ?? fields.delivery_modes),
      eligibility: getFirstString(fields.eligibility),
      cost: getFirstString(fields.cost),
      who_it_helps: getFirstString(fields.whoItHelps, fields.who_it_helps),
      intake_url: getFirstString(fields.intakeUrl, fields.intake_url),
      documents_needed: fieldArray(
        fields.documentsNeeded ?? fields.documents_needed
      ),
      appointment_info: getFirstString(
        fields.appointmentInfo,
        fields.appointment_info
      ),
      accessibility_notes: getFirstString(
        fields.accessibilityNotes,
        fields.accessibility_notes
      ),
      urgent_availability: getFirstString(
        fields.urgentAvailability,
        fields.urgent_availability
      ),
      languages: fieldArray(fields.languages),
      hours: readHours(fields.hours ?? record.hours),
      timezone: getFirstString(
        fields.timezone,
        fields.timeZone,
        record.timezone,
        record.timeZone
      ),
      appointment_required: readBoolean(
        fields.appointmentRequired ?? fields.appointment_required
      ),
      availability_status: normalizeEnum(
        fields.availabilityStatus ?? fields.availability_status,
        AVAILABILITY_STATUSES,
        "unknown"
      ),
      availability_notes: getFirstString(
        fields.availabilityNotes,
        fields.availability_notes
      ),
      temporary_closed_until: getFirstString(
        fields.temporaryClosedUntil,
        fields.temporary_closed_until
      ),
      coverage_area: fieldArray(fields.coverageArea ?? fields.coverage_area),
      visibility,
      review_status: reviewStatus,
      approved_at: approvedAt,
      source_url: sourceUrl,
      source_snapshot: record.raw_snapshot,
      last_seen_at: record.last_seen_at,
      last_verified_at: publish ? now : null,
    },
    categoryKeys,
    categoryConfidenceByKey: buildCategoryConfidenceByKey(
      fields,
      record.confidence_score
    ),
    location: buildLocationPayload(fields, record),
    contacts: buildContactPayloads(fields, record),
    links: buildLinkPayloads(fields, record, sourceUrl),
  }
}

export async function insertPromotionChildren(
  admin,
  payload,
  organization,
  service
) {
  const organizationId = organization.id
  const serviceId = service.id

  if (payload.categoryKeys.length > 0) {
    const { error } = await admin
      .from("resource_map_service_categories")
      .insert(
        payload.categoryKeys.map((categoryKey, index) => ({
          service_id: serviceId,
          category_key: categoryKey,
          is_primary: index === 0,
          confidence:
            payload.categoryConfidenceByKey?.[categoryKey] ??
            payload.confidenceScore,
          source_id: payload.sourceId,
        }))
      )
    if (error) throw error
  }

  const children = {
    location: null,
    contacts: [],
    links: [],
  }

  if (payload.location) {
    const { data, error } = await admin
      .from("resource_map_locations")
      .insert({
        ...payload.location,
        organization_id: organizationId,
        service_id: serviceId,
      })
      .select("id")
      .maybeSingle()
    if (error) throw error
    children.location = data ?? null
  }

  if (payload.contacts.length > 0) {
    const { data, error } = await admin
      .from("resource_map_contacts")
      .insert(
        payload.contacts.map((contact) => ({
          ...contact,
          organization_id: organizationId,
          service_id: serviceId,
        }))
      )
      .select("id,contact_type,value,url")
    if (error) throw error
    children.contacts = data ?? []
  }

  if (payload.links.length > 0) {
    const { data, error } = await admin
      .from("resource_map_links")
      .insert(
        payload.links.map((link) => ({
          ...link,
          organization_id: organizationId,
          service_id: serviceId,
        }))
      )
      .select("id,link_type,url")
    if (error) throw error
    children.links = data ?? []
  }

  return children
}
