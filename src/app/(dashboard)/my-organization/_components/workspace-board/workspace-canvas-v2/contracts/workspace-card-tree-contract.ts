import {
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  resolveWorkspaceCanvasRailCardIds,
  type WorkspaceCanvasV2CardId,
} from "./workspace-card-contract"

type WorkspaceCanvasCardTreeNode = {
  id: WorkspaceCanvasV2CardId
  parentId: WorkspaceCanvasV2CardId | null
  children: WorkspaceCanvasV2CardId[]
}

function resolveWorkspaceCanvasTreeNode(cardId: WorkspaceCanvasV2CardId) {
  const parentId = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId].rail.parentId
  const children = resolveWorkspaceCanvasRailCardIds().filter(
    (candidateId) =>
      WORKSPACE_CANVAS_V2_CARD_CONTRACT[candidateId].rail.parentId === cardId,
  )

  return {
    id: cardId,
    parentId,
    children,
  } satisfies WorkspaceCanvasCardTreeNode
}

function resolveWorkspaceCanvasCardTree() {
  return Object.fromEntries(
    resolveWorkspaceCanvasRailCardIds().map((cardId) => [
      cardId,
      resolveWorkspaceCanvasTreeNode(cardId),
    ]),
  ) as Record<WorkspaceCanvasV2CardId, WorkspaceCanvasCardTreeNode>
}

export function getWorkspaceCanvasCardAncestors(cardId: WorkspaceCanvasV2CardId) {
  const tree = resolveWorkspaceCanvasCardTree()
  const ancestors: WorkspaceCanvasV2CardId[] = []
  let cursor = tree[cardId]?.parentId ?? null

  while (cursor) {
    ancestors.unshift(cursor)
    cursor = tree[cursor]?.parentId ?? null
  }

  return ancestors
}

export function getWorkspaceCanvasCardDescendants(cardId: WorkspaceCanvasV2CardId) {
  const tree = resolveWorkspaceCanvasCardTree()
  const descendants: WorkspaceCanvasV2CardId[] = []
  const queue = [...(tree[cardId]?.children ?? [])]

  while (queue.length > 0) {
    const next = queue.shift()!
    descendants.push(next)
    queue.push(...tree[next].children)
  }

  return descendants
}

export function resolveWorkspaceCanvasRailCardOrder() {
  return resolveWorkspaceCanvasRailCardIds().sort(
    (left, right) =>
      WORKSPACE_CANVAS_V2_CARD_CONTRACT[left].rail.order -
      WORKSPACE_CANVAS_V2_CARD_CONTRACT[right].rail.order,
  )
}
