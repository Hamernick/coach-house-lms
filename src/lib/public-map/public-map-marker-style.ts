import type mapboxgl from "mapbox-gl"

import {
  PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
  PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
} from "./public-map-geojson"
import { buildPublicMapSpecialPillMarkerPredicate } from "./public-map-marker-styles"

export const PUBLIC_MAP_APPLE_BLUE = "#007AFF"
export const PUBLIC_MAP_MARKER_IMAGE_SIZE = 288
export const PUBLIC_MAP_MARKER_VISUAL_SIZE = 36
export const PUBLIC_MAP_MARKER_SELECTED_VISUAL_SIZE = 42
export const PUBLIC_MAP_MARKER_SELECTION_TRANSITION = {
  delay: 0,
  duration: 160,
} as const
export const PUBLIC_MAP_MARKER_REDUCED_MOTION_TRANSITION = {
  delay: 0,
  duration: 0,
} as const
export const PUBLIC_MAP_CLUSTER_BADGE_SMALL_KEY = "cluster-badge-sm-hires-v1"
export const PUBLIC_MAP_CLUSTER_BADGE_MEDIUM_KEY = "cluster-badge-md-hires-v1"
export const PUBLIC_MAP_CLUSTER_BADGE_LARGE_KEY = "cluster-badge-lg-hires-v1"
export const PUBLIC_MAP_CLUSTER_BADGE_SHADOW_SMALL_KEY =
  "cluster-badge-shadow-sm-hires-v1"
export const PUBLIC_MAP_CLUSTER_BADGE_SHADOW_MEDIUM_KEY =
  "cluster-badge-shadow-md-hires-v1"
export const PUBLIC_MAP_CLUSTER_BADGE_SHADOW_LARGE_KEY =
  "cluster-badge-shadow-lg-hires-v1"
export const PUBLIC_MAP_POINT_SHADOW_KEY = "public-map-point-shadow-hires-v1"

export function resolvePublicMapClusterMarkerSize(
  pointCountExpression: unknown = ["get", "point_count"]
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
  pointCountExpression: unknown = ["get", "point_count"]
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
  pointCountExpression: unknown = ["get", "point_count"]
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

export function buildPublicMapClusterLabelExpression(): mapboxgl.ExpressionSpecification {
  return [
    "concat",
    ["to-string", ["get", "point_count_abbreviated"]],
    " resources",
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapClusterLabelTextSize(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    10,
    8,
    11,
    12,
    12,
    16,
    12.5,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapClusterLabelOffset() {
  return [0, 2.92]
}

export function buildPublicMapPointLabelExpression(): mapboxgl.ExpressionSpecification {
  return [
    "case",
    buildPublicMapSpecialPillMarkerPredicate(),
    "",
    ["coalesce", ["get", "name"], ""],
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapPointLabelTextSize(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    10,
    8,
    11,
    12,
    11.5,
    16,
    12,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapPointLabelOffset() {
  return [0, 1.55]
}

export function resolvePublicMapSelectedPointLabelOffset() {
  return [0, 2.62]
}

function buildPublicMapConditionalZoomNumberExpression(
  stops: Array<
    readonly [zoom: number, specialValue: number, standardValue: number]
  >
): mapboxgl.ExpressionSpecification {
  const specialMarkerPredicate = buildPublicMapSpecialPillMarkerPredicate()

  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    ...stops.flatMap(([zoom, specialValue, standardValue]) => [
      zoom,
      ["case", specialMarkerPredicate, specialValue, standardValue],
    ]),
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapPointIconSize(): mapboxgl.ExpressionSpecification {
  return buildPublicMapConditionalZoomNumberExpression([
    [3, 1.18, 1.56],
    [8, 1.26, 1.72],
    [11, 1.38, 1.94],
    [14, 1.5, 2.12],
    [16, 1.56, 2.24],
  ])
}

export function resolvePublicMapSelectedPointIconSize(): mapboxgl.ExpressionSpecification {
  return buildPublicMapConditionalZoomNumberExpression([
    [3, 1.26, 1.84],
    [8, 1.36, 2.02],
    [11, 1.5, 2.22],
    [14, 1.64, 2.38],
    [16, 1.7, 2.5],
  ])
}

export function resolvePublicMapPointShadowOpacity(): mapboxgl.ExpressionSpecification {
  return buildPublicMapConditionalZoomNumberExpression([
    [4, 0, 0.08],
    [8, 0, 0.14],
    [11, 0, 0.22],
    [14, 0, 0.32],
    [16, 0, 0.38],
  ])
}

export function resolvePublicMapPointShadowSize(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    1.42,
    8,
    1.58,
    11,
    1.78,
    14,
    1.96,
    16,
    2.08,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapSelectedPointShadowSize(): mapboxgl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    3,
    1.72,
    8,
    1.9,
    11,
    2.1,
    14,
    2.28,
    16,
    2.4,
  ] as mapboxgl.ExpressionSpecification
}

export function resolvePublicMapSelectedPointShadowOpacity(): mapboxgl.ExpressionSpecification {
  return buildPublicMapConditionalZoomNumberExpression([
    [3, 0, 0.18],
    [8, 0, 0.26],
    [11, 0, 0.34],
    [16, 0, 0.42],
  ])
}

export function buildPublicMapIconImageExpression(): mapboxgl.ExpressionSpecification {
  return [
    "coalesce",
    ["image", ["get", "markerImageKey"]],
    ["image", PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY],
  ] as mapboxgl.ExpressionSpecification
}

export function buildPublicMapSelectedIconImageExpression(): mapboxgl.ExpressionSpecification {
  return [
    "coalesce",
    ["image", ["concat", ["get", "markerImageKey"], "-selected"]],
    ["image", PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY],
  ] as mapboxgl.ExpressionSpecification
}
