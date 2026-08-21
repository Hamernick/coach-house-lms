export const PUBLIC_MAP_MARKER_OVERVIEW_OFFSET_COUNT = 36

const GOLDEN_ANGLE_RADIANS = Math.PI * (3 - Math.sqrt(5))

function roundOffset(value: number) {
  return Math.round(value * 10) / 10
}

export const PUBLIC_MAP_MARKER_OVERVIEW_OFFSETS = Array.from(
  { length: PUBLIC_MAP_MARKER_OVERVIEW_OFFSET_COUNT },
  (_, index): [number, number] => {
    if (index === 0) return [0, 8.5]
    const radius = 14 + Math.sqrt(index) * 6
    const angle = index * GOLDEN_ANGLE_RADIANS
    return [
      roundOffset(Math.cos(angle) * radius),
      roundOffset(8.5 + Math.sin(angle) * radius),
    ]
  }
)

export function normalizePublicMapMarkerOverviewOffsetIndex(value: number) {
  if (!Number.isFinite(value)) return 0
  const normalized = Math.trunc(value) % PUBLIC_MAP_MARKER_OVERVIEW_OFFSET_COUNT
  return normalized < 0
    ? normalized + PUBLIC_MAP_MARKER_OVERVIEW_OFFSET_COUNT
    : normalized
}
