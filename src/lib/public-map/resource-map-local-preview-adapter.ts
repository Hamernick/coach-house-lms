import type {
  ExternalResourceMapItem,
  PublicMapResourceContact,
  PublicMapResourceLink,
} from "./resource-map-items"
import { resolveResourceAvailability } from "./resource-availability"
import {
  isPublicMapResourceTopLevelCategoryKey,
  type PublicMapResourceCategoryKey,
} from "./resource-categories"
import {
  isPublicMapTechnicalSourceUrl,
  shouldShowPublicMapResourceLink,
} from "./resource-link-visibility"
import {
  normalizeContactType,
  normalizeDeliveryModes,
  normalizeLinkType,
  normalizeUrl,
  readArray,
  readDomain,
  readFields,
  readFirstString,
  readNumber,
  readObject,
  resolveCategories,
  type JsonRecord,
} from "./resource-map-local-preview-normalizers"
import { resolveResourceDescription } from "./resource-map-local-preview-description"

const GENERIC_CIVIC_OWNER_PATTERN =
  /(?:^townships?$|township$|county$|municipalit(?:y|ies)$|counties$|cities$)/i
const GENERIC_SERVICE_TITLE_PATTERN = /^(?:restrooms?|facilities?)$/i
const NYC_FINDER_COOLING_SOURCE_IDS = new Set([
  "nyc-arcgis-cooling-centers",
  "nyc-arcgis-cool-options",
])

function cleanDisplayText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null
}

function normalizeDisplayText(value: string | null | undefined) {
  return cleanDisplayText(value)?.toLowerCase() ?? ""
}

function resolveDisplaySubtitle({
  originalTitle,
  subtitle,
  title,
}: {
  originalTitle?: string
  subtitle: string | null
  title: string
}) {
  const normalizedSubtitle = normalizeDisplayText(subtitle)
  if (!normalizedSubtitle) return null
  if (normalizedSubtitle === normalizeDisplayText(title)) return null
  if (normalizedSubtitle === normalizeDisplayText(originalTitle)) return null
  return subtitle
}

function textHasCoolingDisplayContext(value: string | null | undefined) {
  return /\b(cooling|heat relief|hydration)\b/i.test(value ?? "")
}

function resolveCoolingResourceDisplayTitle({
  sourceCategoryText,
  title,
}: {
  sourceCategoryText: string | null
  title: string
}) {
  const cleanedTitle = cleanDisplayText(title)
  if (!cleanedTitle || textHasCoolingDisplayContext(cleanedTitle)) {
    return title
  }

  const serviceLabel = /hydration|fountain|water/i.test(
    sourceCategoryText ?? ""
  )
    ? "hydration station"
    : "cooling center"

  return `${cleanedTitle} ${serviceLabel}`
}

function stripCoolingPrefix(value: string | null | undefined) {
  const normalized = cleanDisplayText(value)
  if (!normalized) return null
  return (
    normalized
      .replace(/\bcooling centers?\b/gi, "")
      .replace(/\bheat relief resources?\b/gi, "")
      .replace(/\bhydration stations?\b/gi, "Hydration station")
      .replace(/[;|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  )
}

function readSourceCategoryText(fields: JsonRecord, record: JsonRecord) {
  return readFirstString(
    fields["sourceCategoryText"],
    fields["source_category_text"],
    fields["category"],
    record["sourceCategoryText"],
    record["source_category_text"],
    record["category"]
  )
}

function isGenericResourceTitle({
  sourceLabel,
  sourceCategoryText,
  title,
}: {
  sourceLabel: string | null
  sourceCategoryText: string | null
  title: string
}) {
  const cleanedTitle = cleanDisplayText(title)
  if (!cleanedTitle) return false
  const coolingContext = /cooling|heat relief|hydration/i.test(
    [sourceCategoryText, sourceLabel].filter(Boolean).join(" ")
  )
  if (!coolingContext) return false

  if (GENERIC_CIVIC_OWNER_PATTERN.test(cleanedTitle)) return true
  if (GENERIC_SERVICE_TITLE_PATTERN.test(cleanedTitle)) return true

  return (
    /^city of /i.test(cleanedTitle) &&
    /PG&E|Cooling Centers 2026/i.test(sourceLabel ?? "")
  )
}

function buildDisplayResourceTitle({
  address,
  city,
  sourceCategoryText,
}: {
  address: string | null
  city: string | null
  sourceCategoryText: string | null
}) {
  const sourceParts = (sourceCategoryText ?? "")
    .split(/[;|]/u)
    .map(stripCoolingPrefix)
    .filter((entry): entry is string => Boolean(entry))
  const facilityType = sourceParts.find(
    (entry) => !/^hydration station$/i.test(entry)
  )
  const hasHydrationContext = /hydration|fountain|water/i.test(
    sourceCategoryText ?? ""
  )
  const base = hasHydrationContext
    ? "Hydration station"
    : facilityType
      ? `${facilityType} cooling center`
      : "Cooling center"
  const place = cleanDisplayText(city) ?? cleanDisplayText(address)

  return place ? `${base} - ${place}` : base
}

function selectPrimaryResourceCategory(
  categories: readonly PublicMapResourceCategoryKey[]
) {
  return (
    categories.find(
      (category) => !isPublicMapResourceTopLevelCategoryKey(category)
    ) ??
    categories[0] ??
    "community"
  )
}

function isNycFinderCoolingSource(fields: JsonRecord, record: JsonRecord) {
  const sourceId = readFirstString(record["sourceId"], record["source_id"])
  if (sourceId && NYC_FINDER_COOLING_SOURCE_IDS.has(sourceId)) return true

  const sourceUrl = readFirstString(
    record["sourceUrl"],
    record["source_url"],
    fields["sourceUrl"],
    fields["source_url"]
  )
  return /finder\.nyc\.gov\/coolingcenters/i.test(sourceUrl ?? "")
}

function prioritizeNycFinderCoolingCategories(
  categories: readonly PublicMapResourceCategoryKey[]
) {
  const rest = categories.filter(
    (category) =>
      category !== "emergency_cooling_centers" && category !== "emergency"
  )
  return (
    ["emergency_cooling_centers", ...rest] as PublicMapResourceCategoryKey[]
  ).slice(0, 4)
}

function isCoolingResourceSource({
  sourceCategoryText,
  sourceLabel,
}: {
  sourceCategoryText: string | null
  sourceLabel: string | null
}) {
  return /cooling|heat relief|hydration/i.test(
    [sourceCategoryText, sourceLabel].filter(Boolean).join(" ")
  )
}

function prioritizeCoolingResourceCategories(
  categories: readonly PublicMapResourceCategoryKey[]
) {
  const rest = categories.filter(
    (category) =>
      category !== "emergency_cooling_centers" && category !== "emergency"
  )
  return [
    "emergency_cooling_centers",
    ...rest,
  ] as PublicMapResourceCategoryKey[]
}

function buildLinks(
  fields: JsonRecord,
  record: JsonRecord,
  id: string
): PublicMapResourceLink[] {
  const explicitLinks = [
    ...readArray(fields["links"]),
    ...readArray(fields["public_links"]),
    ...readArray(record["links"]),
    ...readArray(record["public_links"]),
  ]
    .flatMap((entry, index): PublicMapResourceLink[] => {
      const link = readObject(entry)
      if (!link) return []
      const url = normalizeUrl(link["url"] ?? link["href"])
      if (!url) return []
      const type = normalizeLinkType(link["type"] ?? link["link_type"])
      return [
        {
          id: readFirstString(link["id"], `${id}:link:${index}`)!,
          label: readFirstString(link["label"], link["title"]) ?? "Resource",
          url,
          type,
          domain: readFirstString(link["domain"]) ?? readDomain(url),
          isPrimary: link["isPrimary"] === true || link["is_primary"] === true,
        },
      ]
    })
    .filter(shouldShowPublicMapResourceLink)

  const websiteUrl = normalizeUrl(
    readFirstString(
      fields["websiteUrl"],
      fields["website_url"],
      fields["website"],
      record["websiteUrl"],
      record["website_url"]
    )
  )
  if (!websiteUrl || isPublicMapTechnicalSourceUrl(websiteUrl)) {
    return explicitLinks
  }

  return [
    {
      id: `${id}:website`,
      label: "Website",
      url: websiteUrl,
      type: "website" as const,
      domain: readDomain(websiteUrl),
      isPrimary: true,
    },
    ...explicitLinks.filter((link) => link.url !== websiteUrl),
  ]
}

function buildContacts(
  fields: JsonRecord,
  record: JsonRecord,
  id: string
): PublicMapResourceContact[] {
  const explicitContacts = [
    ...readArray(fields["contacts"]),
    ...readArray(fields["public_contacts"]),
    ...readArray(record["contacts"]),
    ...readArray(record["public_contacts"]),
  ].flatMap((entry, index): PublicMapResourceContact[] => {
    const contact = readObject(entry)
    if (!contact) return []
    const value = readFirstString(
      contact["value"],
      contact["phone"],
      contact["email"]
    )
    if (!value) return []
    const type = normalizeContactType(
      contact["type"] ?? contact["contact_type"]
    )
    return [
      {
        id: readFirstString(contact["id"], `${id}:contact:${index}`)!,
        label:
          readFirstString(contact["label"], contact["name"]) ??
          (type === "email" ? "Email" : type === "phone" ? "Phone" : "Contact"),
        value,
        type,
        url: normalizeUrl(contact["url"]),
        isPrimary:
          contact["isPrimary"] === true || contact["is_primary"] === true,
      },
    ]
  })

  const phone = readFirstString(
    fields["phone"],
    fields["phoneNumber"],
    record["phone"]
  )
  const email = readFirstString(
    fields["email"],
    fields["contactEmail"],
    record["email"]
  )

  return [
    ...(phone
      ? [
          {
            id: `${id}:phone`,
            label: "Phone",
            value: phone,
            type: "phone" as const,
            url: `tel:${phone}`,
            isPrimary: explicitContacts.length === 0,
          },
        ]
      : []),
    ...(email
      ? [
          {
            id: `${id}:email`,
            label: "Email",
            value: email,
            type: "email" as const,
            url: `mailto:${email}`,
            isPrimary: false,
          },
        ]
      : []),
    ...explicitContacts,
  ]
}

export function buildExternalResourceMapItemFromLocalPreviewRecord(
  record: JsonRecord,
  index: number
): ExternalResourceMapItem | null {
  const fields = readFields(record)
  const rawId =
    readFirstString(
      record["item_id"],
      record["service_id"],
      record["sourceRecordId"],
      record["source_record_id"],
      record["id"]
    ) ?? `local-${index + 1}`
  const sourceId = readFirstString(record["sourceId"], record["source_id"])
  const scopedRawId = sourceId ? `${sourceId}:${rawId}` : rawId
  const title = readFirstString(
    fields["title"],
    fields["serviceTitle"],
    fields["service_title"],
    fields["name"],
    fields["organizationName"],
    fields["organization_name"],
    record["title"],
    record["name"]
  )
  if (!title) return null

  const id = `local_resource_map:${scopedRawId}`
  const organizationName = readFirstString(
    fields["organizationName"],
    fields["organization_name"],
    fields["providerName"],
    fields["provider_name"],
    record["organizationName"],
    record["organization_name"]
  )
  const sourceLabel =
    readFirstString(
      record["sourceLabel"],
      record["source_label"],
      record["sourceName"]
    ) ?? "Local preview"
  const sourceCategoryText = readSourceCategoryText(fields, record)
  const address =
    readFirstString(
      fields["address"],
      fields["fullAddress"],
      record["address"]
    ) ?? null
  const addressStreet =
    readFirstString(
      fields["addressStreet"],
      fields["address_line1"],
      fields["streetAddress"],
      record["addressStreet"],
      record["address_line1"]
    ) ?? null
  const city = readFirstString(fields["city"], record["city"])
  const state = readFirstString(fields["state"], record["state"])
  const shouldDeriveDisplayTitle = isGenericResourceTitle({
    sourceLabel,
    sourceCategoryText,
    title,
  })
  const hasCoolingSourceContext = isCoolingResourceSource({
    sourceCategoryText,
    sourceLabel,
  })
  const displayTitle = shouldDeriveDisplayTitle
    ? buildDisplayResourceTitle({
        address,
        city,
        sourceCategoryText,
      })
    : hasCoolingSourceContext
      ? resolveCoolingResourceDisplayTitle({
          sourceCategoryText,
          title,
        })
      : title
  const rawSubtitle = shouldDeriveDisplayTitle
    ? readFirstString(fields["subtitle"], record["subtitle"], address, city)
    : readFirstString(fields["subtitle"], record["subtitle"], organizationName)
  const subtitle = resolveDisplaySubtitle({
    originalTitle: title,
    subtitle: rawSubtitle,
    title: displayTitle,
  })
  const categories = resolveCategories(fields, record)
  const resourceCategories = isNycFinderCoolingSource(fields, record)
    ? prioritizeNycFinderCoolingCategories(categories)
    : hasCoolingSourceContext
      ? prioritizeCoolingResourceCategories(categories).slice(0, 4)
      : categories.length > 0
        ? categories
        : (["community"] as const)
  const primaryResourceCategory =
    selectPrimaryResourceCategory(resourceCategories)
  const deliveryModes = normalizeDeliveryModes(
    fields["deliveryModes"] ??
      fields["delivery_modes"] ??
      record["deliveryModes"]
  )
  const links = buildLinks(fields, record, id)
  const contacts = buildContacts(fields, record, id)
  const hours = fields["hours"] ?? record["hours"]
  const availability = resolveResourceAvailability({
    hours,
    timezone:
      readFirstString(
        fields["timezone"],
        fields["timeZone"],
        record["timezone"],
        record["timeZone"]
      ) ?? null,
    appointmentRequired:
      fields["appointmentRequired"] === true ||
      fields["appointment_required"] === true ||
      record["appointmentRequired"] === true ||
      record["appointment_required"] === true,
    availabilityStatus:
      readFirstString(
        fields["availabilityStatus"],
        fields["availability_status"],
        record["availabilityStatus"],
        record["availability_status"]
      ) ?? null,
    availabilityNotes:
      readFirstString(
        fields["availabilityNotes"],
        fields["availability_notes"],
        record["availabilityNotes"],
        record["availability_notes"]
      ) ?? null,
    temporaryClosedUntil:
      readFirstString(
        fields["temporaryClosedUntil"],
        fields["temporary_closed_until"],
        record["temporaryClosedUntil"],
        record["temporary_closed_until"]
      ) ?? null,
  })
  const sourceUrl = normalizeUrl(
    readFirstString(
      record["sourceUrl"],
      record["source_url"],
      fields["sourceUrl"]
    )
  )
  const description = resolveResourceDescription({
    city: city ?? null,
    description: readFirstString(fields["description"], record["description"]),
    sourceCategoryText,
    state: state ?? null,
  })

  return {
    id,
    itemType: "external_resource",
    title: displayTitle,
    subtitle,
    description,
    latitude: readNumber(
      fields["latitude"],
      fields["lat"],
      record["latitude"],
      record["lat"]
    ),
    longitude: readNumber(
      fields["longitude"],
      fields["lng"],
      fields["lon"],
      record["longitude"],
      record["lng"],
      record["lon"]
    ),
    address,
    addressStreet,
    city,
    state,
    country:
      readFirstString(fields["country"], record["country"]) ?? "United States",
    orgCategory: null,
    resourceCategories: [...resourceCategories],
    primaryResourceCategory,
    verificationStatus: "external_data",
    sourceLabel,
    sourceUrl,
    lastVerifiedAt:
      readFirstString(record["lastVerifiedAt"], record["last_verified_at"]) ??
      null,
    visibility: "superadmin_preview",
    markerImageUrl:
      normalizeUrl(
        readFirstString(
          fields["logoUrl"],
          fields["logo_url"],
          fields["imageUrl"],
          record["logoUrl"]
        )
      ) ?? null,
    logoUrl: normalizeUrl(
      readFirstString(fields["logoUrl"], fields["logo_url"], record["logoUrl"])
    ),
    faviconUrl: normalizeUrl(
      readFirstString(
        fields["faviconUrl"],
        fields["favicon_url"],
        record["faviconUrl"]
      )
    ),
    aliases: readArray(fields["aliases"]).map(String),
    deliveryModes,
    hoursLabel:
      readFirstString(fields["hoursLabel"], record["hoursLabel"]) ??
      availability.label,
    availability,
    lastUpdatedAt:
      readFirstString(record["lastUpdatedAt"], record["last_updated_at"]) ??
      null,
    links,
    contacts,
    services: [
      {
        id,
        title,
        description,
        whoItHelps: readFirstString(
          fields["whoItHelps"],
          fields["who_it_helps"]
        ),
        eligibility: readFirstString(
          fields["eligibility"],
          record["eligibility"]
        ),
        cost: readFirstString(fields["cost"], record["cost"]),
        languages: readArray(fields["languages"]).map(String),
        intakeUrl: normalizeUrl(
          readFirstString(fields["intakeUrl"], fields["intake_url"])
        ),
        appointmentInfo: readFirstString(
          fields["appointmentInfo"],
          fields["appointment_info"]
        ),
        documentsNeeded: readArray(
          fields["documentsNeeded"] ?? fields["documents_needed"]
        ).map(String),
        accessibilityNotes: readFirstString(
          fields["accessibilityNotes"],
          fields["accessibility_notes"]
        ),
        urgentAvailability: readFirstString(
          fields["urgentAvailability"],
          fields["urgent_availability"]
        ),
        availability,
        serviceArea: readArray(
          fields["coverageArea"] ?? fields["coverage_area"]
        ).map(String),
        deliveryModes,
      },
    ],
  }
}
