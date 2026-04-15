function normalizeAddressPart(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

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
  const normalizedStreet = normalizeAddressPart(street)
  const normalizedCity = normalizeAddressPart(city)
  const normalizedState = normalizeAddressPart(state)
  const normalizedPostal = normalizeAddressPart(postal)
  const normalizedCountry = normalizeAddressPart(country)

  const addressLines: string[] = []
  if (normalizedStreet) addressLines.push(normalizedStreet)

  const locality = [normalizedCity, normalizedState, normalizedPostal].filter(Boolean).join(", ")
  if (locality) addressLines.push(locality)
  if (normalizedCountry) addressLines.push(normalizedCountry)

  if (addressLines.length > 0) {
    return addressLines.join("\n")
  }

  return normalizeAddressPart(fallbackAddress)
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
  const address = buildOrganizationAddress({
    street: profile["address_street"],
    city: profile["address_city"],
    state: profile["address_state"],
    postal: profile["address_postal"],
    country: profile["address_country"],
    fallbackAddress: profile["address"],
  })

  if (!address) return null
  return address.replace(/\n+/g, ", ")
}
