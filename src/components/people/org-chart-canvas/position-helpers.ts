import {
  NODE_HEIGHT,
  NODE_WIDTH,
} from "./constants"
import type {
  FlowNode,
  PositionSnapshot,
  PositionValue,
} from "./types"

export function isFinitePosition(pos: unknown): pos is PositionValue {
  return Boolean(pos) &&
    typeof pos === "object" &&
    Number.isFinite((pos as PositionValue).x) &&
    Number.isFinite((pos as PositionValue).y)
}

export function getPositionExtent(
  nodes: FlowNode[],
): [[number, number], [number, number]] {
  if (nodes.length === 0) {
    return [
      [-1200, -1200],
      [1200, 1200],
    ]
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const node of nodes) {
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + NODE_WIDTH)
    maxY = Math.max(maxY, node.position.y + NODE_HEIGHT)
  }

  return [
    [Math.floor(minX - 1200), Math.floor(minY - 900)],
    [Math.ceil(maxX + 1200), Math.ceil(maxY + 900)],
  ]
}

export function snapshotFromNodes(nodes: FlowNode[]): PositionSnapshot {
  return Object.fromEntries(
    nodes.map((node) => [
      node.id,
      {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      },
    ]),
  )
}

export function snapshotsEqual(
  left: PositionSnapshot | undefined,
  right: PositionSnapshot,
) {
  if (!left) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  for (const key of rightKeys) {
    const leftPos = left[key]
    const rightPos = right[key]
    if (!leftPos || !rightPos) return false
    if (leftPos.x !== rightPos.x || leftPos.y !== rightPos.y) return false
  }
  return true
}
