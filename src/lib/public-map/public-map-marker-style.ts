import type mapboxgl from "mapbox-gl"

export const PUBLIC_MAP_APPLE_BLUE = "#007AFF"
export const PUBLIC_MAP_MARKER_IMAGE_SIZE = 72
export const PUBLIC_MAP_MARKER_VISUAL_SIZE = 36
export const PUBLIC_MAP_MARKER_SELECTED_VISUAL_SIZE = 42
export const PUBLIC_MAP_CLUSTER_BADGE_SMALL_KEY = "cluster-badge-sm"
export const PUBLIC_MAP_CLUSTER_BADGE_MEDIUM_KEY = "cluster-badge-md"
export const PUBLIC_MAP_CLUSTER_BADGE_LARGE_KEY = "cluster-badge-lg"
export const PUBLIC_MAP_CLUSTER_BADGE_SHADOW_SMALL_KEY = "cluster-badge-shadow-sm"
export const PUBLIC_MAP_CLUSTER_BADGE_SHADOW_MEDIUM_KEY = "cluster-badge-shadow-md"
export const PUBLIC_MAP_CLUSTER_BADGE_SHADOW_LARGE_KEY = "cluster-badge-shadow-lg"
export const PUBLIC_MAP_POINT_SHADOW_KEY = "public-map-point-shadow"

export function resolvePublicMapClusterMarkerSize(
  pointCountExpression: unknown = ["get", "point_count"],
): mapboxgl.ExpressionSpecification {
  return [
    "step",
    pointCountExpression,
    20,
    5,
    23,
    20,
    27,
    100,
    31,
  ] as mapboxgl.ExpressionSpecification
}

export function buildPublicMapClusterBadgeImageExpression(): mapboxgl.ExpressionSpecification {
  return [
    "step",
    ["get", "point_count"],
    PUBLIC_MAP_CLUSTER_BADGE_SMALL_KEY,
    20,
    PUBLIC_MAP_CLUSTER_BADGE_MEDIUM_KEY,
    100,
    PUBLIC_MAP_CLUSTER_BADGE_LARGE_KEY,
  ] as mapboxgl.ExpressionSpecification
}

export function buildPublicMapClusterBadgeShadowImageExpression(): mapboxgl.ExpressionSpecification {
  return [
    "step",
    ["get", "point_count"],
    PUBLIC_MAP_CLUSTER_BADGE_SHADOW_SMALL_KEY,
    20,
    PUBLIC_MAP_CLUSTER_BADGE_SHADOW_MEDIUM_KEY,
    100,
    PUBLIC_MAP_CLUSTER_BADGE_SHADOW_LARGE_KEY,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapClusterShadowSize(
  pointCountExpression: unknown = ["get", "point_count"],
): mapboxgl.ExpressionSpecification {
  return [
    "step",
    pointCountExpression,
    22,
    5,
    25,
    20,
    29,
    100,
    33,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapClusterTextSize(
  pointCountExpression: unknown = ["get", "point_count"],
): mapboxgl.ExpressionSpecification {
  return [
    "step",
    pointCountExpression,
    11,
    20,
    12,
    100,
    13,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapPointIconSize(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    0.9,
    11,
    1,
    16,
    1.06,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapSelectedPointIconSize(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    1.14,
    11,
    1.2,
    16,
    1.28,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapPointShadowOpacity(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    13.65,
    0,
    14.35,
    0.92,
  ] as mapboxgl.ExpressionSpecification
}

export function buildPublicMapIconImageExpression(): mapboxgl.ExpressionSpecification {
  return [
    "coalesce",
    ["image", ["get", "markerImageKey"]],
    ["image", "public-map-marker-fallback"],
  ] as mapboxgl.ExpressionSpecification
}

export function buildPublicMapSelectedIconImageExpression(): mapboxgl.ExpressionSpecification {
  return [
    "coalesce",
    ["image", ["concat", ["get", "markerImageKey"], "-selected"]],
    ["image", "public-map-marker-fallback-selected"],
  ] as mapboxgl.ExpressionSpecification
}
