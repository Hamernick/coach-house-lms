import {
  PUBLIC_MAP_GROUP_ACCENTS,
  type PublicMapGroupKey,
} from "@/lib/public-map/groups"

const HOME_MAP_MARKER_CANVAS_SIZE = 72
const HOME_MAP_MARKER_BACKING_SCALE = 4
const HOME_MAP_MARKER_BACKING_SIZE =
  HOME_MAP_MARKER_CANVAS_SIZE * HOME_MAP_MARKER_BACKING_SCALE

export const HOME_MAP_MARKER_IMAGE_PIXEL_RATIO = 8

type HomeMapMarkerContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

type HomeMapMarkerInput = {
  label: string
  primaryGroup: PublicMapGroupKey
  selected: boolean
}

function colorToRgba(hex: string, alpha: number) {
  const value = Number.parseInt(hex.replace("#", ""), 16)
  if (!Number.isFinite(value)) return `rgba(47, 159, 143, ${alpha})`

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}

function createMarkerCanvas() {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(
      HOME_MAP_MARKER_BACKING_SIZE,
      HOME_MAP_MARKER_BACKING_SIZE
    )
  }

  const canvas = document.createElement("canvas")
  canvas.width = HOME_MAP_MARKER_BACKING_SIZE
  canvas.height = HOME_MAP_MARKER_BACKING_SIZE
  return canvas
}

function getMarkerContext(
  canvas: HTMLCanvasElement | OffscreenCanvas
): HomeMapMarkerContext | null {
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  }) as HomeMapMarkerContext | null
  if (!context) return null

  context.scale(HOME_MAP_MARKER_BACKING_SCALE, HOME_MAP_MARKER_BACKING_SCALE)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  return context
}

function buildInitials(label: string) {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .filter((letter): letter is string => Boolean(letter))
    .join("")
    .toUpperCase()
}

export function createHomeFindMapMarkerImage({
  label,
  primaryGroup,
  selected,
}: HomeMapMarkerInput) {
  const canvas = createMarkerCanvas()
  const context = getMarkerContext(canvas)
  if (!context) return null

  const center = HOME_MAP_MARKER_CANVAS_SIZE / 2
  const contentRadius = selected ? 17.2 : 13.8
  const outerRadius = selected ? 21.8 : 17.2
  const accent = PUBLIC_MAP_GROUP_ACCENTS[primaryGroup]
  const shadowColor = colorToRgba(accent, 0.62)

  context.clearRect(
    0,
    0,
    HOME_MAP_MARKER_CANVAS_SIZE,
    HOME_MAP_MARKER_CANVAS_SIZE
  )

  context.save()
  context.shadowColor = shadowColor
  context.shadowBlur = selected ? 13 : 11
  context.strokeStyle = colorToRgba(accent, 0.72)
  context.lineWidth = selected ? 1.28 : 1.12
  context.beginPath()
  context.arc(
    center,
    center,
    outerRadius + (selected ? 3 : 2.4),
    0,
    Math.PI * 2
  )
  context.stroke()
  context.restore()

  const surface = context.createRadialGradient(
    center - outerRadius * 0.08,
    center - outerRadius * 0.22,
    outerRadius * 0.1,
    center,
    center,
    outerRadius * 1.14
  )
  surface.addColorStop(0, colorToRgba(accent, selected ? 0.68 : 0.6))
  surface.addColorStop(0.38, colorToRgba(accent, selected ? 0.62 : 0.54))
  surface.addColorStop(0.72, colorToRgba(accent, selected ? 0.56 : 0.48))
  surface.addColorStop(1, colorToRgba(accent, selected ? 0.48 : 0.4))

  context.save()
  context.shadowColor = shadowColor
  context.shadowBlur = selected ? 13 : 11
  context.shadowOffsetY = selected ? 2 : 1
  context.fillStyle = surface
  context.beginPath()
  context.arc(center, center, outerRadius, 0, Math.PI * 2)
  context.fill()
  context.restore()

  context.save()
  context.beginPath()
  context.arc(center, center, contentRadius, 0, Math.PI * 2)
  context.clip()
  context.fillStyle = "#FFFFFF"
  context.font = `800 ${selected ? 10.5 : 8.5}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(buildInitials(label), center, center + 0.45)
  context.restore()

  return context.getImageData(
    0,
    0,
    HOME_MAP_MARKER_BACKING_SIZE,
    HOME_MAP_MARKER_BACKING_SIZE
  )
}
