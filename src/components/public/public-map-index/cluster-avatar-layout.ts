export const CLUSTER_PREVIEW_MAX_MEMBERS = 7
export const CLUSTER_GLYPH_HOUSING_SIZE = 66
const CLUSTER_GLYPH_INSET = 2
export const CLUSTER_GLYPH_SIZE = CLUSTER_GLYPH_HOUSING_SIZE - CLUSTER_GLYPH_INSET * 2
const CLUSTER_GLYPH_EDGE_INSET = 2
const CLUSTER_GLYPH_SAFE_RADIUS_FACTOR = 0.44

export type ClusterAvatarLayoutNode = {
  size: number
  left: number
  top: number
  zIndex: number
  alpha: number
}

type ClusterAvatarTemplateNode = {
  x: number
  y: number
  radius: number
  zIndex: number
  alpha: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

export function resolveClusterAvatarLayout(
  avatarCount: number,
  glyphSize = CLUSTER_GLYPH_SIZE,
): ClusterAvatarLayoutNode[] {
  const clamped = Math.max(1, Math.min(CLUSTER_PREVIEW_MAX_MEMBERS, avatarCount || 1))
  const center = glyphSize / 2
  if (clamped === 1) {
    const size = Math.round(Math.min(glyphSize * 0.94, glyphSize - CLUSTER_GLYPH_EDGE_INSET * 2))
    const offset = Math.round((glyphSize - size) / 2)
    return [{ size, left: offset, top: offset, zIndex: 8, alpha: 0.92 }]
  }

  const ringProgress = (clamped - 2) / 5
  const restCount = clamped - 1
  const nodes: ClusterAvatarTemplateNode[] = [
    {
      x: center - glyphSize * lerp(0.14, 0.1, ringProgress),
      y: center - glyphSize * lerp(0.15, 0.11, ringProgress),
      radius: (glyphSize * lerp(0.66, 0.45, ringProgress)) / 2,
      zIndex: clamped + 2,
      alpha: 0.94,
    },
  ]
  const ringRadius = (glyphSize / 2) * lerp(0.44, 0.56, ringProgress)
  const secondaryMaxRatio = lerp(0.44, 0.29, ringProgress)
  const secondaryMinRatio = lerp(0.34, 0.19, ringProgress)
  const startAngle = -Math.PI * 0.1 - Math.PI / Math.max(5, restCount)

  for (let index = 0; index < restCount; index += 1) {
    const ratioProgress = restCount <= 1 ? 0 : index / (restCount - 1)
    const angle = startAngle + (index * (2 * Math.PI)) / restCount
    const sizeRatio = lerp(secondaryMaxRatio, secondaryMinRatio, ratioProgress)
    nodes.push({
      x: center + Math.cos(angle) * ringRadius,
      y: center + Math.sin(angle) * ringRadius,
      radius: (glyphSize * sizeRatio) / 2,
      zIndex: restCount - index + 1,
      alpha: lerp(0.9, 0.68, ratioProgress),
    })
  }

  for (let iteration = 0; iteration < 10; iteration += 1) {
    for (let index = 0; index < nodes.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
        const left = nodes[index]
        const right = nodes[nextIndex]
        const deltaX = right.x - left.x
        const deltaY = right.y - left.y
        const distance = Math.hypot(deltaX, deltaY) || 0.0001
        const minDistance = left.radius + right.radius + 1.2
        if (distance >= minDistance) continue

        const overlap = (minDistance - distance) / 2
        const unitX = deltaX / distance
        const unitY = deltaY / distance
        left.x -= unitX * overlap
        left.y -= unitY * overlap
        right.x += unitX * overlap
        right.y += unitY * overlap
      }

      const node = nodes[index]
      node.x = clamp(
        node.x,
        node.radius + CLUSTER_GLYPH_EDGE_INSET,
        glyphSize - node.radius - CLUSTER_GLYPH_EDGE_INSET,
      )
      node.y = clamp(
        node.y,
        node.radius + CLUSTER_GLYPH_EDGE_INSET,
        glyphSize - node.radius - CLUSTER_GLYPH_EDGE_INSET,
      )
    }
  }

  const safeMaxRadius = Math.max(
    10,
    Math.min((glyphSize / 2) * CLUSTER_GLYPH_SAFE_RADIUS_FACTOR, (glyphSize - CLUSTER_GLYPH_EDGE_INSET * 2) / 2),
  )
  for (const node of nodes) {
    node.radius = Math.min(node.radius, safeMaxRadius)
    node.x = clamp(
      node.x,
      node.radius + CLUSTER_GLYPH_EDGE_INSET,
      glyphSize - node.radius - CLUSTER_GLYPH_EDGE_INSET,
    )
    node.y = clamp(
      node.y,
      node.radius + CLUSTER_GLYPH_EDGE_INSET,
      glyphSize - node.radius - CLUSTER_GLYPH_EDGE_INSET,
    )
  }

  return nodes.map((entry) => {
    const left = clamp(
      entry.x - entry.radius,
      CLUSTER_GLYPH_EDGE_INSET,
      glyphSize - CLUSTER_GLYPH_EDGE_INSET - entry.radius * 2,
    )
    const top = clamp(
      entry.y - entry.radius,
      CLUSTER_GLYPH_EDGE_INSET,
      glyphSize - CLUSTER_GLYPH_EDGE_INSET - entry.radius * 2,
    )
    return {
      size: Math.round(entry.radius * 2),
      left: Math.round(left),
      top: Math.round(top),
      zIndex: entry.zIndex,
      alpha: entry.alpha,
    }
  })
}
