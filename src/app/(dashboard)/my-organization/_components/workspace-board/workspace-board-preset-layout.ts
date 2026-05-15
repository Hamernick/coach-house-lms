import {
  WORKSPACE_CARD_IDS,
  type WorkspaceCardId,
  type WorkspaceCardSize,
  type WorkspaceLayoutPreset,
  type WorkspaceNodeState,
} from "./workspace-board-types"
import {
  DASHBOARD_GRID_GAP_X,
  DASHBOARD_GRID_GAP_Y,
  DASHBOARD_GRID_MARGIN_X,
  DASHBOARD_GRID_MARGIN_Y,
  DEFAULT_CARD_SIZES,
  PRESET_GRID_ROWS,
  resolveCardDimensions,
  roundToSnap,
} from "./workspace-board-layout-config"

function normalizeSize(
  value: unknown,
  fallback: WorkspaceCardSize,
): WorkspaceCardSize {
  if (value === "sm" || value === "md" || value === "lg") return value
  return fallback
}

export function normalizeNodeCardSize(
  cardId: WorkspaceCardId,
  value: unknown,
  fallback: WorkspaceCardSize,
): WorkspaceCardSize {
  const normalizedSize = normalizeSize(value, fallback)
  if (cardId === "communications" && normalizedSize === "sm") {
    return "md"
  }
  return normalizedSize
}

function resolveSizeLookup(nodes?: WorkspaceNodeState[]) {
  const lookup = new Map<WorkspaceCardId, WorkspaceCardSize>()
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (!WORKSPACE_CARD_IDS.includes(node.id)) continue
      lookup.set(
        node.id,
        normalizeNodeCardSize(node.id, node.size, DEFAULT_CARD_SIZES[node.id]),
      )
    }
  }
  return lookup
}

function buildGridLayout({
  rows,
  sizeLookup,
}: {
  rows: WorkspaceCardId[][]
  sizeLookup: Map<WorkspaceCardId, WorkspaceCardSize>
}) {
  const columnCount = Math.max(...rows.map((row) => row.length))
  const rowCount = rows.length

  const columnWidths = Array.from({ length: columnCount }, (_, columnIndex) => {
    let maxWidth = 0
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const cardId = rows[rowIndex]?.[columnIndex]
      if (!cardId) continue
      const size = sizeLookup.get(cardId) ?? DEFAULT_CARD_SIZES[cardId]
      maxWidth = Math.max(maxWidth, resolveCardDimensions(size, cardId).width)
    }
    return maxWidth
  })

  const rowHeights = rows.map((row) => {
    let maxHeight = 0
    for (const cardId of row) {
      const size = sizeLookup.get(cardId) ?? DEFAULT_CARD_SIZES[cardId]
      maxHeight = Math.max(
        maxHeight,
        resolveCardDimensions(size, cardId).height,
      )
    }
    return maxHeight
  })

  const positions = {} as Record<WorkspaceCardId, { x: number; y: number }>

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = rows[rowIndex] ?? []
    const rowStartY =
      DASHBOARD_GRID_MARGIN_Y +
      rowHeights.slice(0, rowIndex).reduce((sum, height) => sum + height, 0) +
      DASHBOARD_GRID_GAP_Y * rowIndex

    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cardId = row[columnIndex]!
      const size = sizeLookup.get(cardId) ?? DEFAULT_CARD_SIZES[cardId]
      const dimensions = resolveCardDimensions(size, cardId)
      const columnStartX =
        DASHBOARD_GRID_MARGIN_X +
        columnWidths
          .slice(0, columnIndex)
          .reduce((sum, width) => sum + width, 0) +
        DASHBOARD_GRID_GAP_X * columnIndex

      positions[cardId] = {
        x: roundToSnap(
          columnStartX +
            Math.max(0, (columnWidths[columnIndex]! - dimensions.width) / 2),
        ),
        y: roundToSnap(rowStartY),
      }
    }
  }

  return positions
}

export function buildPresetNodes(
  preset: WorkspaceLayoutPreset,
  existingNodes?: WorkspaceNodeState[],
): WorkspaceNodeState[] {
  const sizeLookup = resolveSizeLookup(existingNodes)
  const rows = PRESET_GRID_ROWS[preset]
  const layout = buildGridLayout({ rows, sizeLookup })

  return WORKSPACE_CARD_IDS.map((id) => {
    const position = layout[id]
    return {
      id,
      x: position.x,
      y: position.y,
      size: sizeLookup.get(id) ?? DEFAULT_CARD_SIZES[id],
    }
  })
}
