import {
  resolvePublicMapResourceCategoryInputKey,
  type PublicMapResourceCategoryKey,
} from "./resource-categories"
import type {
  PublicMapResourceContactType,
  PublicMapResourceDeliveryMode,
  PublicMapResourceLinkType,
} from "./resource-map-items"

export type JsonRecord = Record<string, unknown>

const DELIVERY_MODES = new Set<string>([
  "in_person",
  "online",
  "phone",
  "hybrid",
  "mobile",
])

const LINK_TYPES = new Set<string>([
  "website",
  "donate",
  "intake",
  "apply",
  "referral",
  "resource",
  "calendar",
  "social",
  "source",
  "other",
])

const CONTACT_TYPES = new Set<string>([
  "email",
  "phone",
  "sms",
  "whatsapp",
  "contact_form",
  "person",
  "other",
])

export function readObject(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

export function readFields(record: JsonRecord) {
  return (
    readObject(record["extractedFields"]) ??
    readObject(record["extracted_fields"]) ??
    readObject(record["fields"]) ??
    record
  )
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function readFirstString(...values: unknown[]) {
  for (const value of values) {
    const stringValue = readString(value)
    if (stringValue) return stringValue
  }
  return null
}

export function readNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

export function readArray(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function resolveCategories(fields: JsonRecord, record: JsonRecord) {
  const values = [
    ...readArray(fields["resourceCategories"]),
    ...readArray(fields["resource_categories"]),
    ...readArray(fields["categories"]),
    ...readArray(record["resourceCategories"]),
    ...readArray(record["resource_categories"]),
    ...readArray(record["categories"]),
    fields["primaryResourceCategory"],
    fields["primary_resource_category"],
    fields["category"],
    fields["category_key"],
    fields["subcategory"],
    fields["subcategoryKey"],
    fields["subcategory_key"],
    record["primaryResourceCategory"],
    record["primary_resource_category"],
    record["category"],
    record["category_key"],
    record["subcategory"],
    record["subcategoryKey"],
    record["subcategory_key"],
  ]
  const categories = values.flatMap((value) => {
    const resolved = resolvePublicMapResourceCategoryInputKey(value)
    return resolved ? [resolved] : []
  })

  return [...new Set(categories)].slice(0, 4)
}

export function normalizeDeliveryModes(
  value: unknown
): PublicMapResourceDeliveryMode[] {
  return readArray(value).flatMap((entry) => {
    const normalized = normalizeToken(String(entry))
    if (!DELIVERY_MODES.has(normalized)) return []
    return [normalized as PublicMapResourceDeliveryMode]
  })
}

export function normalizeLinkType(value: unknown): PublicMapResourceLinkType {
  const normalized = normalizeToken(readString(value))
  return LINK_TYPES.has(normalized)
    ? (normalized as PublicMapResourceLinkType)
    : "other"
}

export function normalizeContactType(
  value: unknown
): PublicMapResourceContactType {
  const normalized = normalizeToken(readString(value))
  return CONTACT_TYPES.has(normalized)
    ? (normalized as PublicMapResourceContactType)
    : "other"
}

export function normalizeUrl(value: unknown) {
  const url = readString(value)
  if (!url) return null
  if (
    /^https?:\/\//i.test(url) ||
    /^tel:/i.test(url) ||
    /^mailto:/i.test(url)
  ) {
    return url
  }
  if (url.includes(".") && !url.includes(" ")) return `https://${url}`
  return url
}

export function readDomain(value: unknown) {
  const url = normalizeUrl(value)
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
