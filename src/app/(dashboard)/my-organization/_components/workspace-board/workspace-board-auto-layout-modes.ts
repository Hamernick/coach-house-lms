import dagre from "@dagrejs/dagre"

import { WORKSPACE_EDGE_SPECS } from "./workspace-board-copy"
import {
  DEFAULT_CARD_SIZES,
  resolveCardDimensions,
  roundToSnap,
} from "./workspace-board-layout-config"
import type {
  WorkspaceAutoLayoutMode,
  WorkspaceCardId,
  WorkspaceConnectionState,
  WorkspaceCardSize,
  WorkspaceNodeState,
} from "./workspace-board-types"
import { WORKSPACE_CARD_IDS } from "./workspace-board-types"

type WorkspaceNodePosition = {
  x: number
  y: number
}

type WorkspaceCardSizeLookup = Map<WorkspaceCardId, WorkspaceCardSize>

const WORKSPACE_CANVAS_START_X = 120
const TIMELINE_START_Y = 220
const TIMELINE_TRUNK_GAP_X = 72
const TIMELINE_LEAF_GAP_X = 88
const TIMELINE_LEAF_GAP_Y = 56
const DAGRE_START_Y = 192
const DAGRE_NODE_SEP = 56
const DAGRE_RANK_SEP = 112
const HIDDEN_UTILITY_POSITIONS = Object.freeze({
  programs: { x: WORKSPACE_CANVAS_START_X + 1080, y: TIMELINE_START_Y },
  "brand-kit": { x: WORKSPACE_CANVAS_START_X, y: TIMELINE_START_Y + 472 },
  deck: { x: WORKSPACE_CANVAS_START_X + 360, y: TIMELINE_START_Y + 472 },
  atlas: { x: WORKSPACE_CANVAS_START_X + 720, y: TIMELINE_START_Y + 472 },
} satisfies Partial<Record<WorkspaceCardId, WorkspaceNodePosition>>)

function resolveHiddenUtilityPosition(cardId: WorkspaceCardId) {
  return HIDDEN_UTILITY_POSITIONS[
    cardId as keyof typeof HIDDEN_UTILITY_POSITIONS
  ]
}

const WORKSPACE_TRUNK_CARD_IDS = [
  "organization-overview",
  "programs",
  "vault",
  "accelerator",
] as const satisfies readonly WorkspaceCardId[]

const WORKSPACE_LEAF_CARD_IDS = [
  "economic-engine",
  "calendar",
  "communications",
] as const satisfies readonly WorkspaceCardId[]

function resolveNodeSizeLookup(nodes?: WorkspaceNodeState[]) {
  const lookup = new Map<WorkspaceCardId, WorkspaceCardSize>()
  if (!Array.isArray(nodes)) return lookup

  for (const node of nodes) {
    if (!WORKSPACE_CARD_IDS.includes(node.id)) continue
    if (node.size !== "sm" && node.size !== "md" && node.size !== "lg") continue
    lookup.set(node.id, node.size)
  }
  return lookup
}

function resolveNodeSize(
  cardId: WorkspaceCardId,
  sizeLookup: WorkspaceCardSizeLookup,
) {
  return sizeLookup.get(cardId) ?? DEFAULT_CARD_SIZES[cardId]
}

function resolveVisibleCardSet(hiddenCardIds?: WorkspaceCardId[]) {
  return new Set(
    WORKSPACE_CARD_IDS.filter((cardId) => !(hiddenCardIds ?? []).includes(cardId)),
  )
}

function resolveFallbackPosition({
  cardId,
  existingNodes,
}: {
  cardId: WorkspaceCardId
  existingNodes?: WorkspaceNodeState[]
}) {
  const existing = existingNodes?.find((node) => node.id === cardId)
  if (existing) {
    return { x: existing.x, y: existing.y }
  }
  return resolveHiddenUtilityPosition(cardId) ?? {
    x: WORKSPACE_CANVAS_START_X,
    y: DAGRE_START_Y,
  }
}

function buildDagreTreeLayout({
  sizeLookup,
  hiddenCardIds,
  existingNodes,
  connections,
}: {
  sizeLookup: WorkspaceCardSizeLookup
  hiddenCardIds?: WorkspaceCardId[]
  existingNodes?: WorkspaceNodeState[]
  connections?: WorkspaceConnectionState[]
}) {
  const positions = {} as Record<WorkspaceCardId, WorkspaceNodePosition>
  const visibleCardSet = resolveVisibleCardSet(hiddenCardIds)
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: "LR",
    align: "UL",
    nodesep: DAGRE_NODE_SEP,
    ranksep: DAGRE_RANK_SEP,
    marginx: WORKSPACE_CANVAS_START_X,
    marginy: DAGRE_START_Y,
  })

  for (const cardId of WORKSPACE_CARD_IDS) {
    if (!visibleCardSet.has(cardId)) continue
    const size = resolveNodeSize(cardId, sizeLookup)
    const dimensions = resolveCardDimensions(size, cardId)
    graph.setNode(cardId, {
      width: dimensions.width,
      height: dimensions.height,
    })
  }

  for (const connection of connections ?? WORKSPACE_EDGE_SPECS) {
    if (!visibleCardSet.has(connection.source) || !visibleCardSet.has(connection.target)) {
      continue
    }
    graph.setEdge(connection.source, connection.target)
  }

  dagre.layout(graph)

  for (const cardId of WORKSPACE_CARD_IDS) {
    if (!visibleCardSet.has(cardId)) continue
    const layoutNode = graph.node(cardId) as
      | { x?: number; y?: number; width?: number; height?: number }
      | undefined
    if (
      !layoutNode ||
      !Number.isFinite(layoutNode.x) ||
      !Number.isFinite(layoutNode.y) ||
      !Number.isFinite(layoutNode.width) ||
      !Number.isFinite(layoutNode.height)
    ) {
      positions[cardId] = resolveFallbackPosition({ cardId, existingNodes })
      continue
    }

    positions[cardId] = {
      x: roundToSnap((layoutNode.x ?? 0) - (layoutNode.width ?? 0) / 2),
      y: roundToSnap((layoutNode.y ?? 0) - (layoutNode.height ?? 0) / 2),
    }
  }

  for (const cardId of WORKSPACE_CARD_IDS) {
    if (positions[cardId]) continue
    positions[cardId] = resolveFallbackPosition({ cardId, existingNodes })
  }

  return positions
}

function buildTimelineLayout({
  sizeLookup,
  hiddenCardIds,
  existingNodes,
}: {
  sizeLookup: WorkspaceCardSizeLookup
  hiddenCardIds?: WorkspaceCardId[]
  existingNodes?: WorkspaceNodeState[]
}) {
  const positions = {} as Record<WorkspaceCardId, WorkspaceNodePosition>
  const visibleCardSet = resolveVisibleCardSet(hiddenCardIds)
  const visibleTrunkCards = WORKSPACE_TRUNK_CARD_IDS.filter((cardId) =>
    visibleCardSet.has(cardId),
  )
  const visibleLeafCards = WORKSPACE_LEAF_CARD_IDS.filter((cardId) =>
    visibleCardSet.has(cardId),
  )

  let cursorX = WORKSPACE_CANVAS_START_X
  let lastTrunkCardId: WorkspaceCardId = "organization-overview"
  for (const cardId of visibleTrunkCards) {
    const size = resolveNodeSize(cardId, sizeLookup)
    const dimensions = resolveCardDimensions(size, cardId)
    positions[cardId] = {
      x: roundToSnap(cursorX),
      y: roundToSnap(TIMELINE_START_Y),
    }
    cursorX += dimensions.width + TIMELINE_TRUNK_GAP_X
    lastTrunkCardId = cardId
  }

  if (visibleLeafCards.length > 0) {
    const leafAnchorId = visibleCardSet.has("accelerator")
      ? "accelerator"
      : lastTrunkCardId
    const anchorPosition = positions[leafAnchorId]
    const anchorDimensions = resolveCardDimensions(
      resolveNodeSize(leafAnchorId, sizeLookup),
      leafAnchorId,
    )
    const leafColumnX = roundToSnap(
      anchorPosition.x + anchorDimensions.width + TIMELINE_LEAF_GAP_X,
    )
    let currentLeafY = TIMELINE_START_Y

    for (const cardId of visibleLeafCards) {
      const size = resolveNodeSize(cardId, sizeLookup)
      const dimensions = resolveCardDimensions(size, cardId)
      positions[cardId] = {
        x: leafColumnX,
        y: roundToSnap(currentLeafY),
      }
      currentLeafY += dimensions.height + TIMELINE_LEAF_GAP_Y
    }
  }

  for (const cardId of WORKSPACE_CARD_IDS) {
    if (positions[cardId]) continue
    const existing = existingNodes?.find((node) => node.id === cardId)
    if (existing) {
      positions[cardId] = { x: existing.x, y: existing.y }
      continue
    }
    positions[cardId] = resolveHiddenUtilityPosition(cardId) ?? {
      x: WORKSPACE_CANVAS_START_X,
      y: TIMELINE_START_Y,
    }
  }

  return positions
}

export function buildAutoLayoutNodesForMode({
  mode,
  existingNodes,
  hiddenCardIds,
  connections,
}: {
  mode: WorkspaceAutoLayoutMode
  existingNodes?: WorkspaceNodeState[]
  hiddenCardIds?: WorkspaceCardId[]
  connections?: WorkspaceConnectionState[]
}): WorkspaceNodeState[] {
  const sizeLookup = resolveNodeSizeLookup(existingNodes)
  const positions =
    mode === "timeline"
      ? buildTimelineLayout({ sizeLookup, hiddenCardIds, existingNodes })
      : buildDagreTreeLayout({
          sizeLookup,
          hiddenCardIds,
          existingNodes,
          connections,
        })

  return WORKSPACE_CARD_IDS.map((id) => {
    const position = positions[id]
    return {
      id,
      x: position.x,
      y: position.y,
      size: resolveNodeSize(id, sizeLookup),
    }
  })
}
