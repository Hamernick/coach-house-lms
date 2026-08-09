import type mapboxgl from "mapbox-gl"

import type { PublicMapResourceCategoryKey } from "./resource-categories"

export const PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY = "standard"
export const PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY = "special-pill"

export type PublicMapMarkerStyleKey =
  | typeof PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY
  | typeof PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY

export function normalizePublicMapMarkerStyleKey(
  value: unknown
): PublicMapMarkerStyleKey {
  return value === PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY
    ? PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY
    : PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY
}

export function resolvePublicMapMarkerStyleKey({
  markerStyleKey,
  resourceCategory,
}: {
  markerStyleKey?: string | null
  resourceCategory?: PublicMapResourceCategoryKey | null
}): PublicMapMarkerStyleKey {
  if (markerStyleKey === PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY) {
    return PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY
  }

  return resourceCategory === "emergency_cooling_centers"
    ? PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY
    : PUBLIC_MAP_STANDARD_MARKER_STYLE_KEY
}

export function buildPublicMapSpecialPillMarkerPredicate(): mapboxgl.ExpressionSpecification {
  return [
    "==",
    ["get", "markerStyleKey"],
    PUBLIC_MAP_SPECIAL_PILL_MARKER_STYLE_KEY,
  ] as mapboxgl.ExpressionSpecification
}
