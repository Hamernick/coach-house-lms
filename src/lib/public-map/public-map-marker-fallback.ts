import {
  PUBLIC_MAP_GROUP_ACCENTS,
  type PublicMapGroupKey,
} from "@/lib/public-map/groups"

type MarkerFallbackContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

export type PublicMapMarkerFallbackGeometry = {
  centerX: number
  centerY: number
  contentRadius: number
}

type MarkerFallbackInput = {
  context: MarkerFallbackContext
  drawLabel?: boolean
  geometry: PublicMapMarkerFallbackGeometry
  label: string
  markerAccentColor?: string | null
  primaryGroup?: PublicMapGroupKey | null
  selected: boolean
  suppressSelectedCheck?: boolean
  verificationStatus?: string | null
}

export function resolvePublicMapMarkerFallbackAccent(
  primaryGroup: PublicMapGroupKey | null | undefined,
  markerAccentColor?: string | null
) {
  if (markerAccentColor?.trim()) return markerAccentColor.trim()
  return PUBLIC_MAP_GROUP_ACCENTS[primaryGroup ?? "community"]
}

export function publicMapMarkerColorToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const value = Number.parseInt(normalized, 16)
  if (!Number.isFinite(value)) return `rgba(0, 122, 255, ${alpha})`
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function buildInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const letters =
    parts.length > 1 ? [parts[0]?.[0], parts[1]?.[0]] : [parts[0]?.[0]]
  return letters
    .filter((entry): entry is string => Boolean(entry))
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function drawVerifiedCheck({
  context,
  geometry,
  accent,
}: {
  context: MarkerFallbackContext
  geometry: PublicMapMarkerFallbackGeometry
  accent: string
}) {
  const { centerX, centerY } = geometry
  context.save()
  context.strokeStyle = "#FFFFFF"
  context.lineCap = "round"
  context.lineJoin = "round"
  context.lineWidth = 2.35
  context.beginPath()
  context.moveTo(centerX - 5.4, centerY + 0.35)
  context.lineTo(centerX - 1.55, centerY + 4.05)
  context.lineTo(centerX + 6.2, centerY - 5.3)
  context.stroke()

  context.strokeStyle = publicMapMarkerColorToRgba(accent, 0.26)
  context.lineWidth = 1.1
  context.beginPath()
  context.moveTo(centerX - 5.4, centerY + 0.35)
  context.lineTo(centerX - 1.55, centerY + 4.05)
  context.lineTo(centerX + 6.2, centerY - 5.3)
  context.stroke()

  context.restore()
}

export function fillPublicMapMarkerFallback({
  context,
  drawLabel = true,
  geometry,
  label,
  markerAccentColor = null,
  primaryGroup = "community",
  selected,
  suppressSelectedCheck = false,
  verificationStatus = null,
}: MarkerFallbackInput) {
  const accent = resolvePublicMapMarkerFallbackAccent(
    primaryGroup,
    markerAccentColor
  )
  if (!drawLabel || suppressSelectedCheck) return

  const initials = buildInitials(label)
  if (initials.length === 0) return

  if (selected && verificationStatus === "verified_platform") {
    drawVerifiedCheck({ context, geometry, accent })
    return
  }

  context.fillStyle = "#FFFFFF"
  context.font = `800 ${selected ? 10.5 : 8.5}px -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(initials, geometry.centerX, geometry.centerY + 0.45)
}
