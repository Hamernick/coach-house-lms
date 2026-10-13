import type mapboxgl from "mapbox-gl"
import type { FogSpecification } from "mapbox-gl"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"

export const PUBLIC_MAP_SATELLITE_STYLE = "mapbox://styles/mapbox/satellite-v9"
export const MAP_STYLE = PUBLIC_MAP_SATELLITE_STYLE
export const PUBLIC_MAP_SPACE_FOG = {
  range: [0.8, 8],
  color: "rgba(18, 22, 30, 0.78)",
  "high-color": "rgba(88, 108, 138, 0.35)",
  "space-color": "#05070d",
  "horizon-blend": 0.08,
  "star-intensity": 0.28,
} satisfies FogSpecification
export const FAVORITES_STORAGE_KEY = "public-map:favorites:v1"
export const SAVED_QUERIES_STORAGE_KEY = "public-map:saved-queries:v1"
export const RECENT_ORGANIZATIONS_STORAGE_KEY =
  "public-map:recent-organizations:v1"
export const RECENT_ORGANIZATIONS_LIMIT = 40

export type PreferenceMode = "unknown" | "guest" | "authenticated"
export type SidebarMode = "search" | "details" | "hidden"

export function resolvePublicMapStyleForTheme(_theme: PublicMapTheme) {
  return MAP_STYLE
}

export function applyPublicMapSpaceFog(map: Pick<mapboxgl.Map, "setFog">) {
  map.setFog(PUBLIC_MAP_SPACE_FOG)
}
