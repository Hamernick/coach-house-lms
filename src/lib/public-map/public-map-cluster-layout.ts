export const PUBLIC_MAP_CLUSTER_LAYOUT_BASE_SIZE = 48
export const PUBLIC_MAP_CLUSTER_SPRITE_LAYOUT_VERSION =
  "packed-circle-v37-solid-color-center-marker"

export type PublicMapClusterVisibleDotCount = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type PublicMapClusterCircleLayout = {
  x: number
  y: number
  radius: number
}

export type PublicMapClusterShellMetrics = {
  avatarEdgeGap: number
  avatarGap: number
  center: number
  dotStrokeWidth: number
  paintedShellRadius: number
  shellRadius: number
  size: number
}

type ClusterSeedCircle = PublicMapClusterCircleLayout & {
  seedX: number
  seedY: number
}

const BASE_SHELL_INSET = 1.5
const BASE_AVATAR_EDGE_GAP = 1
const BASE_AVATAR_GAP = 0.01
const BASE_DOT_STROKE_RATIO = 0.024
const BASE_MIN_DOT_STROKE_WIDTH = 0.75
const SOLVER_ITERATIONS = 300
const SOLVER_RETRIES = 18
const EPSILON = 0.001

const DIAMETERS_BY_COUNT = {
  1: [31.68],
  2: [22.08, 19.2],
  3: [21.12, 17.28, 12.96],
  4: [20.16, 16.32, 12.48, 10.08],
  5: [19.68, 15.84, 12, 9.6, 8.16],
  6: [19.2, 15.36, 11.52, 9.12, 7.68, 7.2],
  7: [22, 17, 12.2, 12.2, 7.8, 8.8, 7.1],
} as const satisfies Record<PublicMapClusterVisibleDotCount, readonly number[]>

const SEEDS_BY_COUNT = {
  1: [{ x: 24, y: 24 }],
  2: [
    { x: 16.56, y: 17.28 },
    { x: 32.736, y: 32.112 },
  ],
  3: [
    { x: 15.6, y: 20.16 },
    { x: 33.6, y: 31.92 },
    { x: 33.6, y: 13.344 },
  ],
  4: [
    { x: 15.36, y: 18.72 },
    { x: 32.16, y: 32.64 },
    { x: 34.56, y: 14.4 },
    { x: 14.4, y: 35.52 },
  ],
  5: [
    { x: 16.32, y: 19.2 },
    { x: 31.68, y: 33.12 },
    { x: 35.52, y: 16.32 },
    { x: 14.4, y: 35.52 },
    { x: 26.8, y: 8.8 },
  ],
  6: [
    { x: 15.36, y: 20.64 },
    { x: 33.6, y: 30.72 },
    { x: 34.96, y: 15.88 },
    { x: 15.2, y: 35.52 },
    { x: 26, y: 8.72 },
    { x: 24.8, y: 39.6 },
  ],
  7: [
    { x: 16, y: 18 },
    { x: 32, y: 31.1 },
    { x: 35, y: 15.8 },
    { x: 10, y: 32.5 },
    { x: 25.7, y: 8.8 },
    { x: 23, y: 39.7 },
    { x: 16, y: 35.5 },
  ],
} as const satisfies Record<
  PublicMapClusterVisibleDotCount,
  readonly { x: number; y: number }[]
>

const normalizedLayoutCache = new Map<
  PublicMapClusterVisibleDotCount,
  readonly PublicMapClusterCircleLayout[]
>()

export function getPublicMapClusterDotStrokeWidth(size: number) {
  return Math.max(BASE_MIN_DOT_STROKE_WIDTH, size * BASE_DOT_STROKE_RATIO)
}

export function getPublicMapClusterShellMetrics(
  size: number
): PublicMapClusterShellMetrics {
  const scale = size / PUBLIC_MAP_CLUSTER_LAYOUT_BASE_SIZE
  const center = size / 2
  const shellRadius = center - BASE_SHELL_INSET * scale

  return {
    avatarEdgeGap: BASE_AVATAR_EDGE_GAP * scale,
    avatarGap: BASE_AVATAR_GAP * scale,
    center,
    dotStrokeWidth: getPublicMapClusterDotStrokeWidth(size),
    paintedShellRadius: shellRadius,
    shellRadius,
    size,
  }
}

export function resolveVisiblePublicMapClusterDotCount(
  count: number
): PublicMapClusterVisibleDotCount {
  const normalizedCount = Number.isFinite(count)
    ? Math.max(1, Math.floor(count))
    : 1

  return Math.min(7, normalizedCount) as PublicMapClusterVisibleDotCount
}

export function getPublicMapClusterNormalizedCircleLayout(
  count: number
): readonly PublicMapClusterCircleLayout[] {
  const visibleCount = resolveVisiblePublicMapClusterDotCount(count)
  const cached = normalizedLayoutCache.get(visibleCount)
  if (cached) return cached

  const baselineLayout = solveClusterCircleLayout(visibleCount).map(
    (circle) => ({
      x: circle.x / PUBLIC_MAP_CLUSTER_LAYOUT_BASE_SIZE,
      y: circle.y / PUBLIC_MAP_CLUSTER_LAYOUT_BASE_SIZE,
      radius: circle.radius / PUBLIC_MAP_CLUSTER_LAYOUT_BASE_SIZE,
    })
  )

  normalizedLayoutCache.set(visibleCount, baselineLayout)
  return baselineLayout
}

export function computePublicMapClusterCircleLayout(
  count: number,
  size: number
): PublicMapClusterCircleLayout[] {
  return getPublicMapClusterNormalizedCircleLayout(count).map((circle) => ({
    x: circle.x * size,
    y: circle.y * size,
    radius: circle.radius * size,
  }))
}

function solveClusterCircleLayout(
  count: PublicMapClusterVisibleDotCount
): PublicMapClusterCircleLayout[] {
  const metrics = getPublicMapClusterShellMetrics(
    PUBLIC_MAP_CLUSTER_LAYOUT_BASE_SIZE
  )
  let radii = DIAMETERS_BY_COUNT[count].map((diameter) => diameter / 2)

  for (let retry = 0; retry < SOLVER_RETRIES; retry += 1) {
    const circles = createSeedCircles({ count, radii })
    if (count === 1) return normalizeSolvedLayout(circles)

    relaxClusterLayout({ circles, count, metrics })
    if (doesLayoutSatisfyConstraints(circles, metrics)) {
      return normalizeSolvedLayout(circles)
    }

    radii = shrinkRadiiForRetry(radii)
  }

  const fallback = createSeedCircles({ count, radii })
  relaxClusterLayout({ circles: fallback, count, metrics })
  return normalizeSolvedLayout(fallback)
}

function createSeedCircles({
  count,
  radii,
}: {
  count: PublicMapClusterVisibleDotCount
  radii: number[]
}): ClusterSeedCircle[] {
  return SEEDS_BY_COUNT[count].map((seed, index) => ({
    x: seed.x,
    y: seed.y,
    radius: radii[index] ?? 1,
    seedX: seed.x,
    seedY: seed.y,
  }))
}

function relaxClusterLayout({
  circles,
  count,
  metrics,
}: {
  circles: ClusterSeedCircle[]
  count: PublicMapClusterVisibleDotCount
  metrics: PublicMapClusterShellMetrics
}) {
  for (let iteration = 0; iteration < SOLVER_ITERATIONS; iteration += 1) {
    pullTowardSeeds(circles, count)
    pullTowardCenter(circles, count, metrics)
    enforcePairGaps(circles, metrics)
    enforceParentBounds(circles, metrics)
    centerVisualMassIfNeeded(circles, count, metrics)
    enforcePairGaps(circles, metrics)
    enforceParentBounds(circles, metrics)
  }

  settlePairGaps(circles, metrics)
}

function pullTowardSeeds(
  circles: ClusterSeedCircle[],
  count: PublicMapClusterVisibleDotCount
) {
  const strength = count <= 2 ? 0.008 : count <= 4 ? 0.006 : 0.001

  for (const circle of circles) {
    circle.x += (circle.seedX - circle.x) * strength
    circle.y += (circle.seedY - circle.y) * strength
  }
}

function pullTowardCenter(
  circles: ClusterSeedCircle[],
  count: PublicMapClusterVisibleDotCount,
  metrics: PublicMapClusterShellMetrics
) {
  const strength = count <= 2 ? 0.002 : count <= 4 ? 0.004 : 0.003

  for (const circle of circles) {
    circle.x += (metrics.center - circle.x) * strength
    circle.y += (metrics.center - circle.y) * strength
  }
}

function settlePairGaps(
  circles: ClusterSeedCircle[],
  metrics: PublicMapClusterShellMetrics
) {
  for (let iteration = 0; iteration < 60; iteration += 1) {
    enforcePairGaps(circles, metrics, metrics.avatarGap * 2)
    enforceParentBounds(circles, metrics)
  }
}

function enforcePairGaps(
  circles: ClusterSeedCircle[],
  metrics: PublicMapClusterShellMetrics,
  avatarGap = metrics.avatarGap
) {
  for (let firstIndex = 0; firstIndex < circles.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < circles.length;
      secondIndex += 1
    ) {
      const first = circles[firstIndex]!
      const second = circles[secondIndex]!
      const dx = second.x - first.x
      const dy = second.y - first.y
      const distance = Math.hypot(dx, dy) || 0.0001
      const requiredDistance =
        getPaintedRadius(first, metrics) +
        getPaintedRadius(second, metrics) +
        avatarGap

      if (distance >= requiredDistance) continue

      const overlap = requiredDistance - distance
      const nx = dx / distance
      const ny = dy / distance
      const radiusSum = first.radius + second.radius
      const firstWeight = second.radius / radiusSum
      const secondWeight = first.radius / radiusSum

      first.x -= nx * overlap * firstWeight
      first.y -= ny * overlap * firstWeight
      second.x += nx * overlap * secondWeight
      second.y += ny * overlap * secondWeight
    }
  }
}

function enforceParentBounds(
  circles: ClusterSeedCircle[],
  metrics: PublicMapClusterShellMetrics
) {
  for (const circle of circles) {
    const dx = circle.x - metrics.center
    const dy = circle.y - metrics.center
    const distance = Math.hypot(dx, dy) || 0.0001
    const maxDistance =
      metrics.paintedShellRadius -
      metrics.avatarEdgeGap -
      getPaintedRadius(circle, metrics)

    if (maxDistance < 0) {
      circle.radius = Math.max(
        1,
        metrics.paintedShellRadius -
          metrics.avatarEdgeGap -
          metrics.dotStrokeWidth / 2
      )
      circle.x = metrics.center
      circle.y = metrics.center
      continue
    }

    if (distance <= maxDistance) continue

    circle.x = metrics.center + (dx / distance) * maxDistance
    circle.y = metrics.center + (dy / distance) * maxDistance
  }
}

function centerVisualMassIfNeeded(
  circles: ClusterSeedCircle[],
  count: PublicMapClusterVisibleDotCount,
  metrics: PublicMapClusterShellMetrics
) {
  const centroid = getAreaWeightedCentroid(circles)
  const offsetX = metrics.center - centroid.x
  const offsetY = metrics.center - centroid.y
  const offsetDistance = Math.hypot(offsetX, offsetY)
  const maxOffset = metrics.size * 0.035
  if (offsetDistance <= maxOffset) return

  const strength = count <= 2 ? 0.03 : count <= 4 ? 0.06 : 0.08
  for (const circle of circles) {
    circle.x += offsetX * strength
    circle.y += offsetY * strength
  }
}

function doesLayoutSatisfyConstraints(
  circles: ClusterSeedCircle[],
  metrics: PublicMapClusterShellMetrics
) {
  if (!areCirclesInsideShell(circles, metrics)) return false
  if (!doCirclePairsKeepGap(circles, metrics)) return false

  const centroid = getAreaWeightedCentroid(circles)
  return (
    Math.hypot(centroid.x - metrics.center, centroid.y - metrics.center) <=
    metrics.size * 0.04
  )
}

function areCirclesInsideShell(
  circles: ClusterSeedCircle[],
  metrics: PublicMapClusterShellMetrics
) {
  return circles.every((circle) => {
    const distanceToCenter = Math.hypot(
      circle.x - metrics.center,
      circle.y - metrics.center
    )

    return (
      distanceToCenter + getPaintedRadius(circle, metrics) <=
      metrics.paintedShellRadius - metrics.avatarEdgeGap + EPSILON
    )
  })
}

function doCirclePairsKeepGap(
  circles: ClusterSeedCircle[],
  metrics: PublicMapClusterShellMetrics
) {
  for (let firstIndex = 0; firstIndex < circles.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < circles.length;
      secondIndex += 1
    ) {
      const first = circles[firstIndex]!
      const second = circles[secondIndex]!
      const distance = Math.hypot(first.x - second.x, first.y - second.y)
      const minimumDistance =
        getPaintedRadius(first, metrics) +
        getPaintedRadius(second, metrics) +
        metrics.avatarGap

      if (distance + EPSILON < minimumDistance) return false
    }
  }

  return true
}

function getAreaWeightedCentroid(circles: ClusterSeedCircle[]) {
  let areaSum = 0
  let weightedX = 0
  let weightedY = 0

  for (const circle of circles) {
    const area = circle.radius * circle.radius
    areaSum += area
    weightedX += circle.x * area
    weightedY += circle.y * area
  }

  return {
    x: weightedX / areaSum,
    y: weightedY / areaSum,
  }
}

function getPaintedRadius(
  circle: Pick<PublicMapClusterCircleLayout, "radius">,
  metrics: PublicMapClusterShellMetrics
) {
  return circle.radius + metrics.dotStrokeWidth / 2
}

function shrinkRadiiForRetry(radii: number[]) {
  return radii.map((radius, index) => {
    if (index === 0) return radius * 0.99
    if (index === 1) return radius * 0.985
    return radius * 0.97
  })
}

function normalizeSolvedLayout(
  circles: ClusterSeedCircle[]
): PublicMapClusterCircleLayout[] {
  return circles.map((circle) => ({
    x: circle.x,
    y: circle.y,
    radius: circle.radius,
  }))
}
