import type {
  WorkspaceOntologyLayoutNode,
  WorkspaceOntologyPosition,
  WorkspaceOntologyProjection,
  WorkspaceOntologyRootGeometry,
  WorkspaceOntologyRootId,
} from "../types"
import {
  WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE,
  resolveWorkspaceOntologyNodeSize,
} from "./node-size"
import { buildWrappedBranchPositions } from "./wrapped-layout"

const BRANCH_GAP = 40

function sortBranchNodes(nodes: WorkspaceOntologyProjection["nodes"]) {
  return [...nodes]
}

export function buildWorkspaceOntologyBranchLayoutSignature({
  projection,
  rootId,
  root,
}: {
  projection: WorkspaceOntologyProjection
  rootId: WorkspaceOntologyRootId
  root: WorkspaceOntologyRootGeometry
}) {
  const branchNodes = sortBranchNodes(
    projection.nodes.filter((node) => node.rootId === rootId)
  )
  const branchNodeIds = new Set(branchNodes.map((node) => node.id))
  return JSON.stringify({
    root,
    nodes: branchNodes.map((node) => [
      node.id,
      node.parentId,
      node.depth,
      resolveWorkspaceOntologyNodeSize(node),
    ]),
    edges: projection.edges
      .filter(
        (edge) => edge.kind === "hierarchy" && branchNodeIds.has(edge.target)
      )
      .map((edge) => [edge.source, edge.target]),
  })
}

function buildFallbackBranchPositions({
  projection,
  rootGeometry,
}: {
  projection: WorkspaceOntologyProjection
  rootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
}) {
  const positions = new Map<string, WorkspaceOntologyPosition>()
  const siblingCounts = new Map<string, number>()
  for (const node of sortBranchNodes(projection.nodes)) {
    const root = rootGeometry[node.rootId]
    if (!root) continue
    const siblingIndex = siblingCounts.get(node.parentId) ?? 0
    siblingCounts.set(node.parentId, siblingIndex + 1)
    positions.set(node.id, {
      x:
        root.x +
        root.width +
        BRANCH_GAP +
        (node.depth - 1) *
          (WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE.width + BRANCH_GAP),
      y:
        root.y +
        root.height / 2 -
        WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE.height / 2 +
        siblingIndex * (WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE.height + BRANCH_GAP),
    })
  }
  return positions
}

export async function layoutWorkspaceOntology({
  projection,
  rootGeometry,
  previousLayoutNodes = [],
  dirtyRootIds,
}: {
  projection: WorkspaceOntologyProjection
  rootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
  previousLayoutNodes?: WorkspaceOntologyLayoutNode[]
  dirtyRootIds?: ReadonlySet<WorkspaceOntologyRootId>
}): Promise<WorkspaceOntologyLayoutNode[]> {
  const fallbackPositions = buildFallbackBranchPositions({
    projection,
    rootGeometry,
  })
  const orderedRoots = Object.entries(rootGeometry)
    .flatMap(([rawRootId, root]) =>
      root
        ? [
            {
              rootId: rawRootId as WorkspaceOntologyRootId,
              root,
            },
          ]
        : []
    )
    .sort(
      (left, right) =>
        left.root.y - right.root.y ||
        left.root.x - right.root.x ||
        left.rootId.localeCompare(right.rootId)
    )
  const branchPositionEntries = orderedRoots.map(({ rootId, root }) => {
    if (dirtyRootIds && !dirtyRootIds.has(rootId)) {
      return [rootId, new Map<string, WorkspaceOntologyPosition>()] as const
    }
    return [
      rootId,
      buildWrappedBranchPositions({ projection, rootId, root }),
    ] as const
  })
  const branchPositionsByRootId = new Map(branchPositionEntries)
  const previousPositionByNodeId = new Map(
    previousLayoutNodes
      .filter((node) => dirtyRootIds && !dirtyRootIds.has(node.rootId))
      .map((node) => [node.id, node.position] as const)
  )
  const fixedPositionByNodeId = previousPositionByNodeId
  const positionByNodeId = new Map(fixedPositionByNodeId)

  for (const { rootId } of orderedRoots) {
    const branchPositionMap = branchPositionsByRootId.get(rootId)
    const movableNodes = sortBranchNodes(
      projection.nodes.filter(
        (node) => node.rootId === rootId && !fixedPositionByNodeId.has(node.id)
      )
    )
    if (movableNodes.length === 0) continue
    for (const node of movableNodes) {
      const position = branchPositionMap?.get(node.id) ??
        fallbackPositions.get(node.id) ?? { x: 0, y: 0 }
      positionByNodeId.set(node.id, position)
    }
  }

  return projection.nodes.map((node) => {
    const position = positionByNodeId.get(node.id) ??
      fallbackPositions.get(node.id) ?? { x: 0, y: 0 }
    return { ...node, position, size: resolveWorkspaceOntologyNodeSize(node) }
  })
}
