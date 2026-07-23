import type {
  WorkspaceOntologyPosition,
  WorkspaceOntologyProjection,
  WorkspaceOntologyRootGeometry,
  WorkspaceOntologyRootId,
} from "../types"
import { resolveWorkspaceOntologyNodeSize } from "./node-size"

const MAX_ROWS_PER_COLUMN = 8
const MAX_COLUMNS_PER_DEPTH_BAND = 5
const ROW_GAP = 32
const LAYER_GAP = 88
const COLUMN_GAP = 64
const BAND_GAP = 96

type BranchNode = WorkspaceOntologyProjection["nodes"][number]

function groupNodesByDepth(nodes: BranchNode[]) {
  const nodesByDepth = new Map<number, BranchNode[]>()
  for (const node of nodes) {
    nodesByDepth.set(node.depth, [
      ...(nodesByDepth.get(node.depth) ?? []),
      node,
    ])
  }
  return [...nodesByDepth.entries()].sort(
    ([leftDepth], [rightDepth]) => leftDepth - rightDepth
  )
}

function buildBandMetrics(nodes: BranchNode[]) {
  const rowCount = Math.min(MAX_ROWS_PER_COLUMN, nodes.length)
  const rowHeights = Array.from({ length: rowCount }, (_, rowIndex) =>
    Math.max(
      ...nodes
        .filter((_, index) => index % MAX_ROWS_PER_COLUMN === rowIndex)
        .map((node) => resolveWorkspaceOntologyNodeSize(node).height)
    )
  )
  const rowOffsets: number[] = []
  let cursor = 0
  for (const height of rowHeights) {
    rowOffsets.push(cursor)
    cursor += height + ROW_GAP
  }
  return {
    height: Math.max(0, cursor - ROW_GAP),
    rowHeights,
    rowOffsets,
  }
}

export function buildWrappedBranchPositions({
  projection,
  rootId,
  root,
}: {
  projection: WorkspaceOntologyProjection
  rootId: WorkspaceOntologyRootId
  root: WorkspaceOntologyRootGeometry
}) {
  const depthGroups = groupNodesByDepth(
    projection.nodes.filter((node) => node.rootId === rootId)
  )
  const positions = new Map<string, WorkspaceOntologyPosition>()
  let depthX = root.x + root.width + LAYER_GAP

  for (const [, nodes] of depthGroups) {
    const maxNodeWidth = Math.max(
      ...nodes.map((node) => resolveWorkspaceOntologyNodeSize(node).width)
    )
    const nodesPerBand = MAX_ROWS_PER_COLUMN * MAX_COLUMNS_PER_DEPTH_BAND
    const bands = Array.from(
      { length: Math.ceil(nodes.length / nodesPerBand) },
      (_, bandIndex) =>
        nodes.slice(bandIndex * nodesPerBand, (bandIndex + 1) * nodesPerBand)
    )
    const bandMetrics = bands.map(buildBandMetrics)
    const depthHeight =
      bandMetrics.reduce((total, band) => total + band.height, 0) +
      Math.max(0, bands.length - 1) * BAND_GAP
    let bandY = root.y + root.height / 2 - depthHeight / 2

    for (let bandIndex = 0; bandIndex < bands.length; bandIndex += 1) {
      const band = bands[bandIndex]
      const metrics = bandMetrics[bandIndex]
      for (let index = 0; index < band.length; index += 1) {
        const node = band[index]
        const size = resolveWorkspaceOntologyNodeSize(node)
        const columnIndex = Math.floor(index / MAX_ROWS_PER_COLUMN)
        const rowIndex = index % MAX_ROWS_PER_COLUMN
        positions.set(node.id, {
          x: Math.round(depthX + columnIndex * (maxNodeWidth + COLUMN_GAP)),
          y: Math.round(
            bandY +
              metrics.rowOffsets[rowIndex] +
              (metrics.rowHeights[rowIndex] - size.height) / 2
          ),
        })
      }
      bandY += metrics.height + BAND_GAP
    }

    const columnCount = Math.min(
      MAX_COLUMNS_PER_DEPTH_BAND,
      Math.ceil(nodes.length / MAX_ROWS_PER_COLUMN)
    )
    depthX +=
      columnCount * maxNodeWidth +
      Math.max(0, columnCount - 1) * COLUMN_GAP +
      LAYER_GAP
  }

  return positions
}

export function branchNeedsWrappedLayout({
  projection,
  rootId,
}: {
  projection: WorkspaceOntologyProjection
  rootId: WorkspaceOntologyRootId
}) {
  const siblingCounts = new Map<string, number>()
  for (const node of projection.nodes) {
    if (node.rootId !== rootId) continue
    const nextCount = (siblingCounts.get(node.parentId) ?? 0) + 1
    if (nextCount > MAX_ROWS_PER_COLUMN) return true
    siblingCounts.set(node.parentId, nextCount)
  }
  return false
}
