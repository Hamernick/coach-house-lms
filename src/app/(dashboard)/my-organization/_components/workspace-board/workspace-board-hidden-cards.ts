import { DEFAULT_HIDDEN_CARD_IDS } from "./workspace-board-layout-config"
import {
  WORKSPACE_CARD_IDS,
  type WorkspaceBoardState,
  type WorkspaceCardId,
} from "./workspace-board-types"
import { normalizeWorkspaceCardId } from "./workspace-board-card-id"
import {
  getWorkspaceCanvasCardAncestors,
  getWorkspaceCanvasCardDescendants,
} from "./workspace-canvas-v2/contracts/workspace-card-tree-contract"

const ALWAYS_HIDDEN_CARD_IDS: WorkspaceCardId[] = ["brand-kit", "deck", "atlas"]
const FIXED_VISIBLE_CARD_IDS: WorkspaceCardId[] = ["organization-overview"]

function isWorkspaceTreeCardId(cardId: WorkspaceCardId) {
  return (
    cardId === "organization-overview" ||
    cardId === "programs" ||
    cardId === "vault" ||
    cardId === "accelerator" ||
    cardId === "economic-engine" ||
    cardId === "calendar" ||
    cardId === "communications"
  )
}

function areCardIdListsEqual(
  left: WorkspaceCardId[],
  right: WorkspaceCardId[]
) {
  if (left.length !== right.length) return false
  return left.every((cardId, index) => cardId === right[index])
}

function toWorkspaceHiddenSet({
  hiddenCardIds,
  nodeIdSet,
}: {
  hiddenCardIds: WorkspaceCardId[]
  nodeIdSet: Set<WorkspaceCardId>
}) {
  const hiddenSet = new Set<WorkspaceCardId>()

  for (const rawCardId of hiddenCardIds) {
    const normalizedCardId = normalizeWorkspaceCardId(rawCardId)
    if (!normalizedCardId) continue
    if (!nodeIdSet.has(normalizedCardId)) continue
    hiddenSet.add(normalizedCardId)
  }

  for (const cardId of ALWAYS_HIDDEN_CARD_IDS) {
    if (!nodeIdSet.has(cardId)) continue
    hiddenSet.add(cardId)
  }

  for (const cardId of FIXED_VISIBLE_CARD_IDS) {
    hiddenSet.delete(cardId)
  }

  return hiddenSet
}

function toHiddenCardIdList({
  hiddenSet,
  nodeIdSet,
}: {
  hiddenSet: Set<WorkspaceCardId>
  nodeIdSet: Set<WorkspaceCardId>
}) {
  return WORKSPACE_CARD_IDS.filter(
    (cardId) => nodeIdSet.has(cardId) && hiddenSet.has(cardId)
  )
}

function countVisibleCards({
  hiddenSet,
  nodeIdSet,
}: {
  hiddenSet: Set<WorkspaceCardId>
  nodeIdSet: Set<WorkspaceCardId>
}) {
  let visibleCount = 0
  for (const cardId of WORKSPACE_CARD_IDS) {
    if (!nodeIdSet.has(cardId)) continue
    if (hiddenSet.has(cardId)) continue
    visibleCount += 1
  }
  return visibleCount
}

function buildDefaultHiddenSet({
  nodeIdSet,
}: {
  nodeIdSet: Set<WorkspaceCardId>
}) {
  return toWorkspaceHiddenSet({
    hiddenCardIds: DEFAULT_HIDDEN_CARD_IDS,
    nodeIdSet,
  })
}

export function normalizeWorkspaceHiddenCardIds(
  value: unknown,
  {
    enforceFallbackVisibleCards = false,
    enforceFixedVisibleCards = true,
  }: {
    enforceFallbackVisibleCards?: boolean
    enforceFixedVisibleCards?: boolean
  } = {}
): WorkspaceCardId[] {
  const hiddenSet = new Set<WorkspaceCardId>()
  if (Array.isArray(value)) {
    for (const rawCardId of value) {
      const normalizedCardId = normalizeWorkspaceCardId(rawCardId)
      if (!normalizedCardId) continue
      hiddenSet.add(normalizedCardId)
    }
  } else {
    for (const cardId of DEFAULT_HIDDEN_CARD_IDS) {
      hiddenSet.add(cardId)
    }
  }

  for (const cardId of ALWAYS_HIDDEN_CARD_IDS) {
    hiddenSet.add(cardId)
  }

  if (enforceFixedVisibleCards) {
    for (const cardId of FIXED_VISIBLE_CARD_IDS) {
      hiddenSet.delete(cardId)
    }
  }

  // Migrate legacy default where vault was hidden with deck/atlas.
  const isLegacyToolingDefault =
    hiddenSet.size === 3 &&
    hiddenSet.has("deck") &&
    hiddenSet.has("atlas") &&
    hiddenSet.has("vault")
  if (isLegacyToolingDefault) {
    hiddenSet.delete("vault")
  }

  if (enforceFallbackVisibleCards) {
    const visibleCards = WORKSPACE_CARD_IDS.filter(
      (cardId) =>
        !hiddenSet.has(cardId) && !ALWAYS_HIDDEN_CARD_IDS.includes(cardId)
    )
    if (visibleCards.length < 2) {
      hiddenSet.delete("organization-overview")
      hiddenSet.delete("accelerator")
    }
  }

  return WORKSPACE_CARD_IDS.filter((cardId) => hiddenSet.has(cardId))
}

export function sanitizeWorkspaceBoardHiddenState(
  state: WorkspaceBoardState
): WorkspaceBoardState {
  const nodeIdSet = new Set(state.nodes.map((node) => node.id))
  let nextHiddenSet = toWorkspaceHiddenSet({
    hiddenCardIds: state.hiddenCardIds,
    nodeIdSet,
  })
  const visibleCount = countVisibleCards({ hiddenSet: nextHiddenSet, nodeIdSet })
  const allCardsHidden = visibleCount === 0
  const hiddenExplicitly = state.visibility?.allCardsHiddenExplicitly === true

  // Heal legacy poisoned snapshots that arrived with every card hidden but
  // without an explicit user intent marker.
  if (allCardsHidden && !hiddenExplicitly) {
    nextHiddenSet = buildDefaultHiddenSet({ nodeIdSet })
  }

  const nextHiddenCardIds = toHiddenCardIdList({
    hiddenSet: nextHiddenSet,
    nodeIdSet,
  })
  const nextVisibility =
    allCardsHidden && hiddenExplicitly
      ? { allCardsHiddenExplicitly: true }
      : { allCardsHiddenExplicitly: false }

  if (areCardIdListsEqual(nextHiddenCardIds, state.hiddenCardIds)) {
    if ((state.visibility?.allCardsHiddenExplicitly ?? false) === nextVisibility.allCardsHiddenExplicitly) {
      return state
    }
  }
  return {
    ...state,
    hiddenCardIds: nextHiddenCardIds,
    visibility: nextVisibility,
  }
}

export function toggleWorkspaceBoardCardVisibility(
  state: WorkspaceBoardState,
  cardId: WorkspaceCardId
): WorkspaceBoardState {
  if (ALWAYS_HIDDEN_CARD_IDS.includes(cardId)) return state
  if (FIXED_VISIBLE_CARD_IDS.includes(cardId)) return state

  const nodeIdSet = new Set(state.nodes.map((node) => node.id))
  if (!nodeIdSet.has(cardId)) return state

  const nextHiddenSet = toWorkspaceHiddenSet({
    hiddenCardIds: state.hiddenCardIds,
    nodeIdSet,
  })

  if (nextHiddenSet.has(cardId)) {
    nextHiddenSet.delete(cardId)
    if (isWorkspaceTreeCardId(cardId)) {
      for (const ancestorId of getWorkspaceCanvasCardAncestors(cardId)) {
        nextHiddenSet.delete(ancestorId)
      }
    }
  } else {
    nextHiddenSet.add(cardId)
    if (isWorkspaceTreeCardId(cardId)) {
      for (const descendantId of getWorkspaceCanvasCardDescendants(cardId)) {
        nextHiddenSet.add(descendantId)
      }
    }
  }

  for (const fixedCardId of FIXED_VISIBLE_CARD_IDS) {
    nextHiddenSet.delete(fixedCardId)
  }

  const nextHiddenCardIds = toHiddenCardIdList({ hiddenSet: nextHiddenSet, nodeIdSet })
  const nextVisibleCount = countVisibleCards({ hiddenSet: nextHiddenSet, nodeIdSet })
  const nextVisibility = {
    allCardsHiddenExplicitly: nextVisibleCount === 0,
  }
  if (areCardIdListsEqual(nextHiddenCardIds, state.hiddenCardIds)) {
    if ((state.visibility?.allCardsHiddenExplicitly ?? false) === nextVisibility.allCardsHiddenExplicitly) {
      return state
    }
  }

  return {
    ...state,
    hiddenCardIds: nextHiddenCardIds,
    visibility: nextVisibility,
  }
}
