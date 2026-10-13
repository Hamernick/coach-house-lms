function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export type PublicMapDrawerSnapPoints = readonly [string, string, string]

export function buildPublicMapDrawerSnapPoints(
  surfaceHeight: number,
): PublicMapDrawerSnapPoints {
  const safeSurfaceHeight = Math.max(0, Math.round(surfaceHeight))

  if (safeSurfaceHeight <= 0) {
    return ["168px", "336px", "520px"] as const
  }

  const collapsedHeight = Math.round(
    clamp(safeSurfaceHeight * 0.24, 168, 216),
  )
  const defaultHeight = Math.round(
    clamp(
      safeSurfaceHeight * 0.56,
      336,
      Math.max(360, safeSurfaceHeight - 88),
    ),
  )
  const expandedHeight = Math.round(
    clamp(
      safeSurfaceHeight * 0.9,
      Math.min(safeSurfaceHeight - 24, defaultHeight + 132),
      Math.max(defaultHeight + 132, safeSurfaceHeight - 16),
    ),
  )

  return [
    `${collapsedHeight}px`,
    `${defaultHeight}px`,
    `${expandedHeight}px`,
  ] as const
}
