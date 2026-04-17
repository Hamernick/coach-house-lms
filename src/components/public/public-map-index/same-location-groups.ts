import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { formatFullOrganizationLocation } from "@/lib/location/organization-location"

const SAME_LOCATION_COORDINATE_PRECISION = 6

export type PublicMapSameLocationCapableOrganization = Pick<
  PublicMapOrganization,
  "id" | "name" | "latitude" | "longitude" | "address" | "addressStreet" | "city" | "state" | "country"
> & {
  latitude: number
  longitude: number
}

export type PublicMapSameLocationGroup<
  T extends PublicMapSameLocationCapableOrganization = PublicMapSameLocationCapableOrganization,
> = {
  key: string
  coordinates: [number, number]
  locationLabel: string | null
  organizations: T[]
}

export function resolveSameLocationGroupKey({
  longitude,
  latitude,
}: {
  longitude: number
  latitude: number
}) {
  return `${longitude.toFixed(SAME_LOCATION_COORDINATE_PRECISION)}:${latitude.toFixed(SAME_LOCATION_COORDINATE_PRECISION)}`
}

export function resolveSameLocationLabel(
  organization: Pick<
    PublicMapOrganization,
    "address" | "addressStreet" | "city" | "state" | "country"
  >,
) {
  const directAddress = organization.address?.trim()
  if (directAddress) return directAddress

  const locality = formatFullOrganizationLocation({
    city: organization.city,
    state: organization.state,
    country: organization.country,
  })
  const fallback = [organization.addressStreet?.trim(), locality]
    .filter((entry): entry is string => Boolean(entry && entry.length > 0))
    .join(", ")

  return fallback.length > 0 ? fallback : null
}

export function buildSameLocationGroups<
  T extends PublicMapSameLocationCapableOrganization,
>(organizations: T[]) {
  const groupsByKey = new Map<string, PublicMapSameLocationGroup<T>>()

  for (const organization of organizations) {
    const key = resolveSameLocationGroupKey({
      longitude: organization.longitude,
      latitude: organization.latitude,
    })
    const existing = groupsByKey.get(key)
    if (existing) {
      existing.organizations.push(organization)
      continue
    }

    groupsByKey.set(key, {
      key,
      coordinates: [organization.longitude, organization.latitude],
      locationLabel: resolveSameLocationLabel(organization),
      organizations: [organization],
    })
  }

  return Array.from(groupsByKey.values()).sort((left, right) =>
    left.key.localeCompare(right.key),
  )
}
