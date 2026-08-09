import {
  PUBLIC_MAP_RESOURCE_CATEGORY_ICON_PATHS,
  PUBLIC_MAP_RESOURCE_CATEGORY_ICON_VIEWBOX_SIZE,
  type PublicMapResourceCategoryIconDefinition,
  resolvePublicMapResourceCategoryIconDefinition,
} from "./resource-category-icon-paths"
import type { PublicMapResourceCategoryKey } from "./resource-categories"

type MarkerIconContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

type MarkerIconGeometry = {
  centerX: number
  centerY: number
  contentRadius: number
}

const PUBLIC_MAP_DEFAULT_ICON_COLOR = "#FFFFFF"

function drawMarkerIconDefinition({
  color = PUBLIC_MAP_DEFAULT_ICON_COLOR,
  context,
  definition,
  geometry,
  iconScale,
  minimumIconSize = 8,
  selected,
}: {
  color?: string
  context: MarkerIconContext
  definition: PublicMapResourceCategoryIconDefinition
  geometry: MarkerIconGeometry
  iconScale?: number
  minimumIconSize?: number
  selected: boolean
}) {
  if (typeof Path2D === "undefined") return

  const iconSize = Math.max(
    minimumIconSize,
    geometry.contentRadius * (iconScale ?? (selected ? 1.36 : 1.28))
  )
  const scale = iconSize / definition.viewBoxSize

  context.save()
  context.translate(
    geometry.centerX - iconSize / 2,
    geometry.centerY - iconSize / 2
  )
  context.scale(scale, scale)

  if (definition.mode === "stroke") {
    context.lineCap = definition.strokeLinecap
    context.lineJoin = definition.strokeLinejoin
    context.lineWidth = definition.strokeWidth
    context.strokeStyle = color

    for (const path of definition.paths) {
      context.stroke(new Path2D(path))
    }
  } else {
    context.fillStyle = color

    for (const path of definition.paths) {
      context.fill(new Path2D(path))
    }
  }

  context.restore()
}

export function drawPublicMapResourceCategoryMarkerIcon({
  category,
  color,
  context,
  geometry,
  iconScale,
  minimumIconSize,
  selected,
}: {
  category: PublicMapResourceCategoryKey
  color?: string
  context: MarkerIconContext
  geometry: MarkerIconGeometry
  iconScale?: number
  minimumIconSize?: number
  selected: boolean
  strokeWidth?: number
}) {
  drawMarkerIconDefinition({
    color,
    context,
    definition: resolvePublicMapResourceCategoryIconDefinition(category),
    geometry,
    iconScale,
    minimumIconSize,
    selected,
  })
}

export function drawPublicMapGenericMarkerIcon({
  color,
  context,
  geometry,
  iconScale,
  minimumIconSize,
  selected,
}: {
  color?: string
  context: MarkerIconContext
  geometry: MarkerIconGeometry
  iconScale?: number
  minimumIconSize?: number
  selected: boolean
  strokeWidth?: number
}) {
  drawMarkerIconDefinition({
    color,
    context,
    definition: {
      mode: "fill",
      paths: PUBLIC_MAP_RESOURCE_CATEGORY_ICON_PATHS["users-round"]!,
      viewBoxSize: PUBLIC_MAP_RESOURCE_CATEGORY_ICON_VIEWBOX_SIZE,
    },
    geometry,
    iconScale,
    minimumIconSize,
    selected,
  })
}
