import { type PublicMapResourceCategoryKey } from "./resource-categories"
import { publicMapMarkerColorToRgba } from "./public-map-marker-fallback"
import { drawPublicMapResourceCategoryMarkerIcon } from "./public-map-marker-icons"
import {
  PUBLIC_MAP_MARKER_CANVAS_BACKING_SCALE,
  PUBLIC_MAP_SPECIAL_MARKER_CANVAS_HEIGHT,
  PUBLIC_MAP_SPECIAL_MARKER_CANVAS_WIDTH,
  PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_HEIGHT,
  PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_WIDTH,
} from "./public-map-marker-canvas-constants"
import { drawPublicMapRoundedRect } from "./public-map-marker-canvas-shapes"
import { type PublicMapTheme } from "./public-map-theme"

type SpecialMarkerCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

export type PublicMapSpecialPillMarkerChromeGeometry = {
  canvasHeight: number
  canvasWidth: number
  contentRadius: number
  iconBadgeRadius: number
  iconCenterX: number
  iconCenterY: number
  labelMaxWidth: number
  labelX: number
  labelY: number
  outerHeight: number
  outerRadius: number
  outerWidth: number
  outerX: number
  outerY: number
  surfaceStrokeWidth: number
}

export type PublicMapSpecialPillMarkerChromePalette = {
  iconBadgeFill: string
  iconBadgeStroke: string
  iconColor: string
  iconGlowColor: string
  shadowColor: string
  surfaceFill: string
  surfaceStroke: string
  textColor: string
}

function createSpecialMarkerCanvas() {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(
      PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_WIDTH,
      PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_HEIGHT
    )
  }
  const canvas = document.createElement("canvas")
  canvas.width = PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_WIDTH
  canvas.height = PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_HEIGHT
  return canvas
}

function getSpecialMarkerCanvasContext(
  canvas: HTMLCanvasElement | OffscreenCanvas
) {
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  })
  if (!context) return null

  context.scale(
    PUBLIC_MAP_MARKER_CANVAS_BACKING_SCALE,
    PUBLIC_MAP_MARKER_CANVAS_BACKING_SCALE
  )
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  return context
}

export function resolvePublicMapSpecialPillMarkerChromeGeometry(
  selected: boolean
): PublicMapSpecialPillMarkerChromeGeometry {
  const canvasWidth = PUBLIC_MAP_SPECIAL_MARKER_CANVAS_WIDTH
  const canvasHeight = PUBLIC_MAP_SPECIAL_MARKER_CANVAS_HEIGHT
  const outerWidth = selected ? 234 : 224
  const outerHeight = selected ? 56 : 52
  const outerX = (canvasWidth - outerWidth) / 2
  const outerY = (canvasHeight - outerHeight) / 2
  const iconBadgeRadius = selected ? 20.5 : 19
  const iconCenterX = outerX + iconBadgeRadius + (selected ? 12 : 11)
  const iconCenterY = canvasHeight / 2
  const labelX = iconCenterX + iconBadgeRadius + (selected ? 14 : 13)

  return {
    canvasHeight,
    canvasWidth,
    contentRadius: selected ? 14.2 : 13.4,
    iconBadgeRadius,
    iconCenterX,
    iconCenterY,
    labelMaxWidth: outerX + outerWidth - labelX - (selected ? 20 : 18),
    labelX,
    labelY: iconCenterY + 0.35,
    outerHeight,
    outerRadius: outerHeight / 2,
    outerWidth,
    outerX,
    outerY,
    surfaceStrokeWidth: selected ? 0.8 : 0.66,
  }
}

export function resolvePublicMapSpecialPillMarkerChromePalette(
  _theme: PublicMapTheme,
  selected: boolean,
  surfaceColor?: string | null
): PublicMapSpecialPillMarkerChromePalette {
  const normalizedSurfaceColor = surfaceColor?.trim() || "#0284c7"

  return {
    iconBadgeFill: selected
      ? "rgba(255, 255, 255, 0.64)"
      : "rgba(255, 255, 255, 0.54)",
    iconBadgeStroke: publicMapMarkerColorToRgba(
      normalizedSurfaceColor,
      selected ? 0.5 : 0.42
    ),
    iconColor: "#075985",
    iconGlowColor: publicMapMarkerColorToRgba(
      normalizedSurfaceColor,
      selected ? 0.32 : 0.24
    ),
    shadowColor: publicMapMarkerColorToRgba(
      normalizedSurfaceColor,
      selected ? 0.32 : 0.22
    ),
    surfaceFill: selected
      ? "rgba(186, 230, 253, 0.98)"
      : "rgba(224, 242, 254, 0.96)",
    surfaceStroke: publicMapMarkerColorToRgba(
      normalizedSurfaceColor,
      selected ? 0.58 : 0.48
    ),
    textColor: "#0C4A6E",
  }
}

function drawSpecialPillMarkerIconBadge({
  context,
  geometry,
  palette,
  selected,
}: {
  context: SpecialMarkerCanvasContext
  geometry: PublicMapSpecialPillMarkerChromeGeometry
  palette: PublicMapSpecialPillMarkerChromePalette
  selected: boolean
}) {
  context.save()
  context.shadowColor = palette.iconGlowColor
  context.shadowBlur = selected ? 6 : 4
  context.shadowOffsetY = 0
  context.fillStyle = palette.iconBadgeFill
  context.beginPath()
  context.arc(
    geometry.iconCenterX,
    geometry.iconCenterY,
    geometry.iconBadgeRadius,
    0,
    Math.PI * 2
  )
  context.fill()
  context.restore()

  context.save()
  context.strokeStyle = palette.iconBadgeStroke
  context.lineWidth = selected ? 0.86 : 0.72
  context.beginPath()
  context.arc(
    geometry.iconCenterX,
    geometry.iconCenterY,
    geometry.iconBadgeRadius,
    0,
    Math.PI * 2
  )
  context.stroke()
  context.restore()
}

function drawSpecialPillMarkerIcon({
  context,
  geometry,
  palette,
  resourceCategory,
  selected,
}: {
  context: SpecialMarkerCanvasContext
  geometry: PublicMapSpecialPillMarkerChromeGeometry
  palette: PublicMapSpecialPillMarkerChromePalette
  resourceCategory: PublicMapResourceCategoryKey
  selected: boolean
}) {
  context.save()
  context.shadowColor = palette.iconGlowColor
  context.shadowBlur = selected ? 5 : 4
  context.shadowOffsetY = 0
  drawPublicMapResourceCategoryMarkerIcon({
    category: resourceCategory,
    color: palette.iconColor,
    context,
    geometry: {
      centerX: geometry.iconCenterX,
      centerY: geometry.iconCenterY,
      contentRadius: geometry.contentRadius,
    },
    iconScale: selected ? 1.18 : 1.12,
    selected,
  })
  context.restore()
}

function drawSpecialPillMarkerChrome({
  context,
  selected,
  surfaceColor,
  theme,
}: {
  context: SpecialMarkerCanvasContext
  selected: boolean
  surfaceColor?: string | null
  theme: PublicMapTheme
}) {
  const geometry = resolvePublicMapSpecialPillMarkerChromeGeometry(selected)
  const palette = resolvePublicMapSpecialPillMarkerChromePalette(
    theme,
    selected,
    surfaceColor
  )

  context.clearRect(0, 0, geometry.canvasWidth, geometry.canvasHeight)
  context.save()
  context.shadowColor = palette.shadowColor
  context.shadowBlur = selected ? 8 : 5
  context.shadowOffsetY = selected ? 2 : 1
  drawPublicMapRoundedRect({
    context,
    x: geometry.outerX,
    y: geometry.outerY,
    width: geometry.outerWidth,
    height: geometry.outerHeight,
    radius: geometry.outerRadius,
  })
  context.fillStyle = palette.surfaceFill
  context.fill()
  context.restore()

  context.save()
  drawPublicMapRoundedRect({
    context,
    x: geometry.outerX,
    y: geometry.outerY,
    width: geometry.outerWidth,
    height: geometry.outerHeight,
    radius: geometry.outerRadius,
  })
  context.strokeStyle = palette.surfaceStroke
  context.lineWidth = geometry.surfaceStrokeWidth
  context.stroke()
  context.restore()

  return { geometry, palette }
}

function measureMarkerTextWidth(
  context: SpecialMarkerCanvasContext,
  value: string
) {
  if (typeof context.measureText === "function") {
    return context.measureText(value).width
  }

  return value.length * 5.5
}

function truncateSpecialPillMarkerLabel({
  context,
  label,
  maxWidth,
}: {
  context: SpecialMarkerCanvasContext
  label: string
  maxWidth: number
}) {
  const normalizedLabel = label.trim().replace(/\s+/g, " ")
  if (measureMarkerTextWidth(context, normalizedLabel) <= maxWidth) {
    return normalizedLabel
  }

  const ellipsis = "\u2026"
  let truncated = normalizedLabel
  while (truncated.length > 1) {
    truncated = truncated.slice(0, -1).trimEnd()
    const candidate = `${truncated}${ellipsis}`
    if (measureMarkerTextWidth(context, candidate) <= maxWidth) {
      return candidate
    }
  }

  return ellipsis
}

function drawSpecialPillMarkerLabel({
  context,
  geometry,
  label,
  palette,
  selected,
}: {
  context: SpecialMarkerCanvasContext
  geometry: PublicMapSpecialPillMarkerChromeGeometry
  label: string
  palette: PublicMapSpecialPillMarkerChromePalette
  selected: boolean
}) {
  context.save()
  context.font = `${
    selected ? "800 19.4px" : "800 18.3px"
  } -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`
  context.fillStyle = palette.textColor
  context.textAlign = "left"
  context.textBaseline = "middle"
  context.fillText(
    truncateSpecialPillMarkerLabel({
      context,
      label,
      maxWidth: geometry.labelMaxWidth,
    }),
    geometry.labelX,
    geometry.labelY
  )
  context.restore()
}

function drawSameLocationBadge({
  context,
  count,
  geometry,
  selected,
  theme,
}: {
  context: SpecialMarkerCanvasContext
  count?: number
  geometry: PublicMapSpecialPillMarkerChromeGeometry
  selected: boolean
  theme: PublicMapTheme
}) {
  const normalizedCount =
    typeof count === "number" && Number.isFinite(count)
      ? Math.max(0, Math.floor(count))
      : 0
  if (normalizedCount <= 1) return

  const label = normalizedCount > 99 ? "99+" : normalizedCount.toString()
  const height = selected ? 16 : 14
  const width = Math.max(height, 8 + label.length * 6)
  const x = geometry.outerX + geometry.outerWidth - width + 3
  const y = geometry.outerY - 3
  const badgePalette = resolvePublicMapSpecialPillMarkerChromePalette(
    theme,
    selected
  )

  context.save()
  drawPublicMapRoundedRect({ context, x, y, width, height, radius: height / 2 })
  context.fillStyle = "rgba(255, 255, 255, 0.96)"
  context.fill()
  context.strokeStyle = badgePalette.surfaceStroke
  context.lineWidth = 1
  context.stroke()
  context.fillStyle = "#0C4A6E"
  context.font =
    "700 8.25px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(label, x + width / 2, y + height / 2 + 0.35)
  context.restore()
}

export function createPublicMapSpecialPillMarkerImage({
  label: _label,
  resourceCategory,
  sameLocationCount,
  selected,
  surfaceColor,
  theme = "light",
}: {
  label: string
  resourceCategory: PublicMapResourceCategoryKey
  sameLocationCount?: number
  selected: boolean
  surfaceColor?: string | null
  theme?: PublicMapTheme
}) {
  const canvas = createSpecialMarkerCanvas()
  const context = getSpecialMarkerCanvasContext(canvas)
  if (!context) return null
  const markerLabel = "Cooling center"

  const { geometry, palette } = drawSpecialPillMarkerChrome({
    context,
    selected,
    surfaceColor,
    theme,
  })
  drawSpecialPillMarkerIconBadge({ context, geometry, palette, selected })
  drawSpecialPillMarkerIcon({
    context,
    geometry,
    palette,
    resourceCategory,
    selected,
  })
  drawSpecialPillMarkerLabel({
    context,
    geometry,
    label: markerLabel,
    palette,
    selected,
  })
  drawSameLocationBadge({
    context,
    count: sameLocationCount,
    geometry,
    selected,
    theme,
  })

  return context.getImageData(
    0,
    0,
    PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_WIDTH,
    PUBLIC_MAP_SPECIAL_MARKER_IMAGE_BACKING_HEIGHT
  )
}
