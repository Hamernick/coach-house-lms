import {
  buildOrganizationGeocodeQueries,
  normalizeOrganizationLocationFields,
  normalizeWhitespace,
} from "@/lib/location/organization-location"

export function buildOrganizationAddress({
  street,
  city,
  state,
  postal,
  country,
  fallbackAddress,
}: {
  street?: unknown
  city?: unknown
  state?: unknown
  postal?: unknown
  country?: unknown
  fallbackAddress?: unknown
}) {
  const normalized = normalizeOrganizationLocationFields({
    street,
    city,
    state,
    postal,
    country,
  })

  const addressLines: string[] = []
  if (normalized.street) addressLines.push(normalized.street)

  const locality = [normalized.city, normalized.state, normalized.postal].filter(Boolean).join(", ")
  if (locality) addressLines.push(locality)
  if (normalized.country) addressLines.push(normalized.country)

  if (addressLines.length > 0) {
    return addressLines.join("\n")
  }

  const normalizedFallback = normalizeWhitespace(fallbackAddress)
  return normalizedFallback.length > 0 ? normalizedFallback : null
}

export function readOrganizationLocationType(profile: Record<string, unknown>) {
  const raw = profile["location_type"] ?? profile["locationType"]
  if (typeof raw !== "string") return null
  const normalized = raw.trim().toLowerCase()
  if (normalized === "online" || normalized === "in_person") {
    return normalized
  }
  return null
}

export function getOrganizationAddressForGeocoding(profile: Record<string, unknown>) {
  const queries = buildOrganizationGeocodeQueries({
    street: profile["address_street"],
    city: profile["address_city"],
    state: profile["address_state"],
    postal: profile["address_postal"],
    country: profile["address_country"],
    fallbackAddress: profile["address"],
  })

  return queries[0] ?? null
}
