import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "../_components/workspace-board/workspace-board-types"
import { buildAutoLayoutNodesForMode } from "../_components/workspace-board/workspace-board-auto-layout-modes"

function parseWorkspaceBoardTimestamp(value: string) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function isPersistedWorkspaceBoardStateNewer({
  incoming,
  persisted,
}: {
  incoming: WorkspaceBoardState
  persisted: WorkspaceBoardState
}) {
  const incomingUpdatedAt = parseWorkspaceBoardTimestamp(incoming.updatedAt)
  const persistedUpdatedAt = parseWorkspaceBoardTimestamp(persisted.updatedAt)

  if (persistedUpdatedAt === null) return false
  if (incomingUpdatedAt === null) return true

  return persistedUpdatedAt > incomingUpdatedAt
}

function buildWorkspaceAutoLayoutNodeLookup(boardState: WorkspaceBoardState) {
  return new Map(
    buildAutoLayoutNodesForMode({
      mode: boardState.autoLayoutMode,
      hiddenCardIds: boardState.hiddenCardIds,
      connections: boardState.connections,
    }).map((node) => [node.id, node] as const)
  )
}

function isNodeAtPosition(
  node: { x: number; y: number },
  position: { x: number; y: number } | undefined
) {
  return position ? node.x === position.x && node.y === position.y : false
}

function isPersistedManualNodePosition({
  persistedNode,
  autoLayoutNode,
}: {
  persistedNode: WorkspaceBoardState["nodes"][number]
  autoLayoutNode: WorkspaceBoardState["nodes"][number] | undefined
}) {
  return !isNodeAtPosition(persistedNode, autoLayoutNode)
}

export function mergeNewerPersistedWorkspaceNodeState({
  incoming,
  persisted,
}: {
  incoming: WorkspaceBoardState
  persisted: WorkspaceBoardState | null
}) {
  if (!persisted) return incoming

  const persistedNodesById = new Map(
    persisted.nodes.map((node) => [node.id, node] as const)
  )
  const persistedIsNewer = isPersistedWorkspaceBoardStateNewer({
    incoming,
    persisted,
  })
  const incomingAutoLayoutNodesById = buildWorkspaceAutoLayoutNodeLookup(incoming)
  const persistedAutoLayoutNodesById =
    buildWorkspaceAutoLayoutNodeLookup(persisted)
  let changed = false
  const nodes = incoming.nodes.map((node) => {
    const persistedNode = persistedNodesById.get(node.id)
    if (!persistedNode) return node
    const shouldPreservePersistedNode =
      persistedIsNewer ||
      (isNodeAtPosition(node, incomingAutoLayoutNodesById.get(node.id)) &&
        isPersistedManualNodePosition({
          persistedNode,
          autoLayoutNode: persistedAutoLayoutNodesById.get(node.id),
        }))
    if (!shouldPreservePersistedNode) return node

    if (
      persistedNode.x === node.x &&
      persistedNode.y === node.y &&
      persistedNode.size === node.size
    ) {
      return node
    }

    changed = true
    return {
      ...node,
      x: persistedNode.x,
      y: persistedNode.y,
      size: persistedNode.size,
    }
  })

  return changed
    ? {
        ...incoming,
        nodes,
      }
    : incoming
}

export function buildWorkspaceBoardStateWithPersistedNodePosition({
  boardState,
  cardId,
  x,
  y,
}: {
  boardState: WorkspaceBoardState
  cardId: WorkspaceCardId
  x: number
  y: number
}) {
  let changed = false
  const nodes = boardState.nodes.map((node) => {
    if (node.id !== cardId) return node
    if (node.x === x && node.y === y) return node

    changed = true
    return {
      ...node,
      x,
      y,
    }
  })

  return changed
    ? {
        ...boardState,
        nodes,
      }
    : boardState
}
