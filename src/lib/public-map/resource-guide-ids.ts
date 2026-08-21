export const PUBLIC_MAP_RESOURCE_GUIDE_IDS = [
  "chicago-food-access",
  "chicago-housing-shelter",
  "chicago-legal-help",
  "chicago-libraries-community-centers",
  "chicago-family-support",
  "chicago-health-care",
  "cooling-heat-relief",
  "nyc-cooling-centers",
  "manhattan-cooling-centers",
  "brooklyn-cooling-centers",
  "queens-cooling-centers",
  "bronx-cooling-centers",
  "staten-island-cooling-centers",
  "library-cooling-centers",
  "senior-cooling-centers",
  "community-center-cooling",
  "hydration-sites",
  "chicago-cooling-centers",
  "phoenix-heat-relief",
  "houston-cooling-centers",
  "miami-cooling-centers",
  "la-cooling-centers",
] as const

export type PublicMapResourceGuideId =
  (typeof PUBLIC_MAP_RESOURCE_GUIDE_IDS)[number]

const PUBLIC_MAP_RESOURCE_GUIDE_ID_SET = new Set<string>(
  PUBLIC_MAP_RESOURCE_GUIDE_IDS
)

export const PUBLIC_MAP_FEATURED_RESOURCE_GUIDE_IDS = [
  "chicago-food-access",
  "chicago-housing-shelter",
  "chicago-health-care",
  "cooling-heat-relief",
] as const satisfies readonly PublicMapResourceGuideId[]

export function isPublicMapResourceGuideId(
  value: unknown
): value is PublicMapResourceGuideId {
  return (
    typeof value === "string" && PUBLIC_MAP_RESOURCE_GUIDE_ID_SET.has(value)
  )
}

export function normalizePublicMapResourceGuideIds(
  value: unknown,
  limit = 40
): PublicMapResourceGuideId[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<PublicMapResourceGuideId>()
  for (const entry of value) {
    if (!isPublicMapResourceGuideId(entry)) continue
    unique.add(entry)
    if (unique.size >= limit) break
  }
  return Array.from(unique)
}
