export const UNITED_STATES_COUNTRY_NAME = "United States"

export const US_STATE_OPTIONS = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
  { value: "AS", label: "American Samoa" },
  { value: "GU", label: "Guam" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "PR", label: "Puerto Rico" },
  { value: "VI", label: "U.S. Virgin Islands" },
] as const

const US_STATE_NAME_BY_CODE = Object.fromEntries(
  US_STATE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<(typeof US_STATE_OPTIONS)[number]["value"], string>

const US_STATE_CODE_BY_NAME = Object.fromEntries(
  US_STATE_OPTIONS.map((option) => [normalizeAlpha(option.label), option.value]),
) as Record<string, (typeof US_STATE_OPTIONS)[number]["value"]>

const UNITED_STATES_COUNTRY_KEYS = new Set([
  "us",
  "usa",
  "unitedstates",
  "unitedstatesofamerica",
])

function normalizeAlpha(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "")
}

export function normalizeWhitespace(value: unknown) {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim()
}

function shouldTitleCase(value: string) {
  return /[A-Za-z]/.test(value) && (value === value.toUpperCase() || value === value.toLowerCase())
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|[\s/-])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`)
}

function resolveUsStateCode(value: string) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return null

  if (/^[A-Za-z]{2}$/.test(normalized)) {
    const upper = normalized.toUpperCase() as keyof typeof US_STATE_NAME_BY_CODE
    if (US_STATE_NAME_BY_CODE[upper]) {
      return upper
    }
  }

  const alphaKey = normalizeAlpha(normalized)
  if (!alphaKey) return null

  const exactMatch = US_STATE_CODE_BY_NAME[alphaKey]
  if (exactMatch) return exactMatch

  if (alphaKey.length >= 3) {
    const prefixMatches = US_STATE_OPTIONS.filter((option) =>
      normalizeAlpha(option.label).startsWith(alphaKey),
    )
    if (prefixMatches.length === 1) {
      return prefixMatches[0]!.value
    }
  }

  return null
}

export function isUnitedStatesCountry(value: unknown) {
  const normalized = normalizeAlpha(normalizeWhitespace(value))
  return UNITED_STATES_COUNTRY_KEYS.has(normalized)
}

export function normalizeCountryName(value: unknown) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return ""
  if (isUnitedStatesCountry(normalized)) return UNITED_STATES_COUNTRY_NAME
  if (shouldTitleCase(normalized) && normalized.length > 3) {
    return toTitleCase(normalized)
  }
  return normalized
}

export function normalizeCityName(value: unknown) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return ""
  if (shouldTitleCase(normalized) && normalized.length > 2) {
    return toTitleCase(normalized)
  }
  return normalized
}

export function normalizeRegionName({
  region,
  country,
}: {
  region: unknown
  country?: unknown
}) {
  const normalized = normalizeWhitespace(region)
  if (!normalized) return ""

  const normalizedCountry = normalizeCountryName(country)
  if (!normalizedCountry || isUnitedStatesCountry(normalizedCountry)) {
    const stateCode = resolveUsStateCode(normalized)
    if (stateCode) return stateCode
  }

  if (/^[A-Za-z]{2,3}$/.test(normalized)) {
    return normalized.toUpperCase()
  }

  if (shouldTitleCase(normalized) && normalized.length > 3) {
    return toTitleCase(normalized)
  }

  return normalized
}

export function normalizePostalCode(value: unknown) {
  const normalized = normalizeWhitespace(value)
  if (!normalized) return ""
  if (/[A-Za-z]/.test(normalized) && normalized === normalized.toLowerCase()) {
    return normalized.toUpperCase()
  }
  return normalized
}

export function normalizeStreetAddress(value: unknown) {
  return normalizeWhitespace(value)
}

export function normalizeOrganizationLocationFields({
  street,
  city,
  state,
  postal,
  country,
}: {
  street?: unknown
  city?: unknown
  state?: unknown
  postal?: unknown
  country?: unknown
}) {
  const normalizedCountry = normalizeCountryName(country)

  return {
    street: normalizeStreetAddress(street),
    city: normalizeCityName(city),
    state: normalizeRegionName({
      region: state,
      country: normalizedCountry,
    }),
    postal: normalizePostalCode(postal),
    country: normalizedCountry,
  }
}

export function formatCompactOrganizationLocation({
  city,
  state,
  country,
}: {
  city?: unknown
  state?: unknown
  country?: unknown
}) {
  const normalized = normalizeOrganizationLocationFields({ city, state, country })

  if (normalized.city && normalized.state) return `${normalized.city}, ${normalized.state}`
  if (normalized.city && normalized.country) return `${normalized.city}, ${normalized.country}`
  if (normalized.state && normalized.country && normalized.state !== normalized.country) {
    return `${normalized.state}, ${normalized.country}`
  }
  return normalized.city || normalized.state || normalized.country
}

export function formatFullOrganizationLocation({
  city,
  state,
  country,
}: {
  city?: unknown
  state?: unknown
  country?: unknown
}) {
  const normalized = normalizeOrganizationLocationFields({ city, state, country })
  return [normalized.city, normalized.state, normalized.country].filter(Boolean).join(", ")
}

function joinQueryParts(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.length > 0)).join(", ")
}

export function buildOrganizationGeocodeQueries({
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
  const fallback = normalizeWhitespace(fallbackAddress).replace(/\n+/g, ", ")

  const localityWithPostal = joinQueryParts([
    normalized.city,
    normalized.state,
    normalized.postal,
  ])
  const localityWithoutPostal = joinQueryParts([normalized.city, normalized.state])

  const queries = [
    joinQueryParts([normalized.street, localityWithPostal, normalized.country]),
    joinQueryParts([normalized.street, localityWithoutPostal, normalized.country]),
    joinQueryParts([normalized.city, normalized.state, normalized.postal, normalized.country]),
    joinQueryParts([normalized.city, normalized.state, normalized.country]),
    fallback,
  ]

  return Array.from(new Set(queries.filter((query) => query.length > 0)))
}
