import type {
  WorkspaceOntologyPosition,
  WorkspaceOntologyProjection,
  WorkspaceOntologyRootGeometry,
  WorkspaceOntologyRootId,
} from "../types"
import { resolveWorkspaceOntologyNodeSize } from "./node-size"

const MAX_COMFORTABLE_ROWS = 8
const ROW_GAP = 32
const LAYER_GAP = 96

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
    const depthHeight =
      nodes.reduce(
        (total, node) => total + resolveWorkspaceOntologyNodeSize(node).height,
        0
      ) +
      Math.max(0, nodes.length - 1) * ROW_GAP
    let depthY = root.y + root.height / 2 - depthHeight / 2

    for (const node of nodes) {
      const size = resolveWorkspaceOntologyNodeSize(node)
      positions.set(node.id, {
        x: Math.round(depthX),
        y: Math.round(depthY),
      })
      depthY += size.height + ROW_GAP
    }
    depthX += maxNodeWidth + LAYER_GAP
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
    if (nextCount > MAX_COMFORTABLE_ROWS) return true
    siblingCounts.set(node.parentId, nextCount)
  }
  return false
}
