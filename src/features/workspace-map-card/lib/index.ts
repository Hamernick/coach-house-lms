import type {
  WorkspaceMapChecklistItem,
  WorkspaceMapCardInput,
  WorkspaceMapOrganizationProfile,
  WorkspaceMapResolvedLocation,
} from "../types"

const MAPBOX_GEOCODE_ENDPOINT =
  "https://api.mapbox.com/geocoding/v5/mapbox.places"
const MAPBOX_STATIC_STYLE = "mapbox/streets-v12"
const DEFAULT_MAP_LOCATION = {
  lng: -98.5795,
  lat: 39.8283,
  zoom: 2.1,
}
const WORKSPACE_MAP_SESSION_CACHE_PREFIX = "workspace-map-location"

const resolvedLocationCache = new Map<string, WorkspaceMapResolvedLocation | null>()
const pendingLocationRequests = new Map<
  string,
  Promise<WorkspaceMapResolvedLocation | null>
>()

function toTrimmedString(value: string | null | undefined) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
}

function hasText(value: string | null | undefined) {
  return toTrimmedString(value).length > 0
}

function buildSessionStorageKey(cacheKey: string) {
  return `${WORKSPACE_MAP_SESSION_CACHE_PREFIX}:${cacheKey}`
}

function readCachedSessionLocation(cacheKey: string) {
  if (typeof window === "undefined") return null

  const raw = window.sessionStorage.getItem(buildSessionStorageKey(cacheKey))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as WorkspaceMapResolvedLocation | null
    if (
      parsed &&
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      typeof parsed.label === "string" &&
      (parsed.source === "organization" || parsed.source === "viewer")
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

function writeCachedSessionLocation(
  cacheKey: string,
  location: WorkspaceMapResolvedLocation | null,
) {
  if (typeof window === "undefined") return

  window.sessionStorage.setItem(
    buildSessionStorageKey(cacheKey),
    JSON.stringify(location),
  )
}

export function buildWorkspaceMapLocationLabel(
  profile: WorkspaceMapOrganizationProfile,
  fallbackTitle: string,
) {
  return (
    [
      profile.addressStreet,
      [profile.addressCity, profile.addressState].filter(Boolean).join(", "),
      profile.addressPostal,
      profile.addressCountry,
    ]
      .map(toTrimmedString)
      .filter(Boolean)
      .join(", ") ||
    toTrimmedString(profile.address) ||
    toTrimmedString(profile.name) ||
    toTrimmedString(fallbackTitle)
  )
}

export function buildWorkspaceMapLocationQuery(
  profile: WorkspaceMapOrganizationProfile,
  fallbackTitle: string,
) {
  const parts = [
    profile.addressStreet,
    profile.addressCity,
    profile.addressState,
    profile.addressPostal,
    profile.addressCountry,
    profile.address,
  ]
    .map(toTrimmedString)
    .filter(Boolean)

  if (parts.length === 0) {
    const fallback = toTrimmedString(profile.name) || toTrimmedString(fallbackTitle)
    return fallback.length > 0 ? fallback : ""
  }

  return Array.from(new Set(parts)).join(", ")
}

function buildWorkspaceMapLocationCacheKey({
  orgId,
  profile,
  fallbackTitle,
}: {
  orgId: string
  profile: WorkspaceMapOrganizationProfile
  fallbackTitle: string
}) {
  return `${orgId}:${buildWorkspaceMapLocationQuery(profile, fallbackTitle).toLowerCase()}`
}

async function geocodeWorkspaceMapLocation({
  query,
  token,
  label,
}: {
  query: string
  token: string
  label: string
}): Promise<WorkspaceMapResolvedLocation | null> {
  const normalizedQuery = toTrimmedString(query)
  if (!normalizedQuery || !token) return null

  const url =
    `${MAPBOX_GEOCODE_ENDPOINT}/${encodeURIComponent(normalizedQuery)}.json` +
    `?access_token=${token}&limit=1`

  try {
    const response = await fetch(url, { method: "GET", cache: "force-cache" })
    if (!response.ok) return null

    const payload = (await response.json()) as {
      features?: Array<{ center?: [number, number] }>
    }
    const center = payload.features?.[0]?.center
    if (!center || center.length < 2) return null

    const [lng, lat] = center
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

    return {
      lat,
      lng,
      label,
      source: "organization",
    }
  } catch {
    return null
  }
}

export async function resolveWorkspaceMapOrganizationLocation({
  orgId,
  profile,
  fallbackTitle,
  token,
}: {
  orgId: string
  profile: WorkspaceMapOrganizationProfile
  fallbackTitle: string
  token: string
}) {
  const cacheKey = buildWorkspaceMapLocationCacheKey({
    orgId,
    profile,
    fallbackTitle,
  })

  if (resolvedLocationCache.has(cacheKey)) {
    return resolvedLocationCache.get(cacheKey) ?? null
  }

  const sessionLocation = readCachedSessionLocation(cacheKey)
  if (sessionLocation) {
    resolvedLocationCache.set(cacheKey, sessionLocation)
    return sessionLocation
  }

  if (pendingLocationRequests.has(cacheKey)) {
    return pendingLocationRequests.get(cacheKey) ?? null
  }

  const query = buildWorkspaceMapLocationQuery(profile, fallbackTitle)
  const label = buildWorkspaceMapLocationLabel(profile, fallbackTitle)
  const request = geocodeWorkspaceMapLocation({
    query,
    token,
    label,
  }).then((location) => {
    resolvedLocationCache.set(cacheKey, location)
    writeCachedSessionLocation(cacheKey, location)
    pendingLocationRequests.delete(cacheKey)
    return location
  })

  pendingLocationRequests.set(cacheKey, request)
  return request
}

export function buildWorkspaceMapStaticPreviewUrl({
  token,
  location,
  width,
  height,
}: {
  token: string
  location: WorkspaceMapResolvedLocation | null
  width: number
  height: number
}) {
  if (!token) return null

  const marker = location
    ? `pin-s+0f172a(${location.lng.toFixed(5)},${location.lat.toFixed(5)})/`
    : ""
  const center = location
    ? `${location.lng.toFixed(5)},${location.lat.toFixed(5)},4.2,0`
    : `${DEFAULT_MAP_LOCATION.lng},${DEFAULT_MAP_LOCATION.lat},${DEFAULT_MAP_LOCATION.zoom},0`

  return `https://api.mapbox.com/styles/v1/${MAPBOX_STATIC_STYLE}/static/${marker}${center}/${width}x${height}?access_token=${token}&logo=false&attribution=false`
}

export function resolveWorkspaceMapChecklist({
  companyHref,
  profile,
}: Pick<WorkspaceMapCardInput, "companyHref" | "profile">): WorkspaceMapChecklistItem[] {
  const storyComplete =
    hasText(profile.vision) && hasText(profile.mission) && hasText(profile.values)
  const identityComplete =
    hasText(profile.name) &&
    hasText(profile.tagline) &&
    hasText(buildWorkspaceMapLocationLabel(profile, ""))
  const logoComplete = hasText(profile.logoUrl)

  return [
    {
      id: "story",
      label: "Vision, mission, and values",
      detail: storyComplete
        ? "Ready for your public map profile."
        : "Add all three to explain what the organization stands for.",
      href: companyHref,
      complete: storyComplete,
    },
    {
      id: "identity",
      label: "Organization basics",
      detail: identityComplete
        ? "Name, tagline, and address are in place."
        : "Complete the title, subtitle, and address fields.",
      href: companyHref,
      complete: identityComplete,
    },
    {
      id: "logo",
      label: "Profile image",
      detail: logoComplete
        ? "Your mark is ready to represent the organization."
        : "Upload a logo or profile image for the map card.",
      href: companyHref,
      complete: logoComplete,
    },
  ]
}

export function resolveWorkspaceMapCompletionSummary(items: WorkspaceMapChecklistItem[]) {
  const completedCount = items.filter((item) => item.complete).length

  return {
    completedCount,
    totalCount: items.length,
    allComplete: completedCount === items.length,
  }
}

export function normalizeWorkspaceMapCardInput(input: WorkspaceMapCardInput): WorkspaceMapCardInput {
  return {
    ...input,
    title: toTrimmedString(input.title) || "Map",
    companyHref: toTrimmedString(input.companyHref) || "/workspace?view=editor&tab=company",
    tutorialStepId: input.tutorialStepId ?? null,
  }
}
