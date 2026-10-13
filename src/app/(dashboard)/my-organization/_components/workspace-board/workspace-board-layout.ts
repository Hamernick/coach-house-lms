import {
  WORKSPACE_CARD_IDS,
  type WorkspaceBoardState,
  type WorkspaceCardId,
  type WorkspaceConnectionState,
  type WorkspaceCardSize,
  type WorkspaceLayoutPreset,
  type WorkspaceNodeState,
} from "./workspace-board-types"
import { WORKSPACE_EDGE_SPECS } from "./workspace-board-copy"
import {
  DASHBOARD_GRID_GAP_X,
  DASHBOARD_GRID_GAP_Y,
  DASHBOARD_GRID_MARGIN_X,
  DASHBOARD_GRID_MARGIN_Y,
  DASHBOARD_GRID_ROWS,
  DEFAULT_CARD_SIZES,
  DEFAULT_HIDDEN_CARD_IDS,
  PRESET_NODE_LAYOUTS,
  resolveCardDimensions,
  roundToSnap,
} from "./workspace-board-layout-config"
import { applyElkAutoLayout } from "./workspace-board-layout-elk"
import {
  buildDefaultWorkspaceCommunicationsState,
  normalizeWorkspaceCommunicationsState,
} from "./workspace-board-layout-communications-state"
import {
  buildDefaultWorkspaceTrackerState,
  normalizeWorkspaceTrackerState,
} from "./workspace-board-layout-tracker-state"

export { buildDefaultWorkspaceCommunicationsState } from "./workspace-board-layout-communications-state"
export { buildDefaultWorkspaceTrackerState } from "./workspace-board-layout-tracker-state"
export { resolveCardDimensions } from "./workspace-board-layout-config"

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.round(value)
}

function normalizeSize(value: unknown, fallback: WorkspaceCardSize): WorkspaceCardSize {
  if (value === "sm" || value === "md") return value
  return fallback
}

function resolveSizeLookup(nodes?: WorkspaceNodeState[]) {
  const lookup = new Map<WorkspaceCardId, WorkspaceCardSize>()
  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (!WORKSPACE_CARD_IDS.includes(node.id)) continue
      lookup.set(node.id, normalizeSize(node.size, DEFAULT_CARD_SIZES[node.id]))
    }
  }
  return lookup
}

function buildDashboardGridLayout(sizeLookup: Map<WorkspaceCardId, WorkspaceCardSize>) {
  const columnCount = Math.max(...DASHBOARD_GRID_ROWS.map((row) => row.length))
  const rowCount = DASHBOARD_GRID_ROWS.length

  const columnWidths = Array.from({ length: columnCount }, (_, columnIndex) => {
    let maxWidth = 0
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const cardId = DASHBOARD_GRID_ROWS[rowIndex]?.[columnIndex]
      if (!cardId) continue
      const size = sizeLookup.get(cardId) ?? DEFAULT_CARD_SIZES[cardId]
      maxWidth = Math.max(maxWidth, resolveCardDimensions(size, cardId).width)
    }
    return maxWidth
  })

  const rowHeights = DASHBOARD_GRID_ROWS.map((row) => {
    let maxHeight = 0
    for (const cardId of row) {
      const size = sizeLookup.get(cardId) ?? DEFAULT_CARD_SIZES[cardId]
      maxHeight = Math.max(maxHeight, resolveCardDimensions(size, cardId).height)
    }
    return maxHeight
  })

  const positions = {} as Record<WorkspaceCardId, { x: number; y: number }>

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = DASHBOARD_GRID_ROWS[rowIndex] ?? []
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
        columnWidths.slice(0, columnIndex).reduce((sum, width) => sum + width, 0) +
        DASHBOARD_GRID_GAP_X * columnIndex

      positions[cardId] = {
        x: roundToSnap(columnStartX + Math.max(0, (columnWidths[columnIndex]! - dimensions.width) / 2)),
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
  const layout = preset === "balanced" ? buildDashboardGridLayout(sizeLookup) : PRESET_NODE_LAYOUTS[preset]

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

export function buildDefaultWorkspaceConnections(): WorkspaceConnectionState[] {
  return WORKSPACE_EDGE_SPECS.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }))
}

export function buildDefaultBoardState(preset: WorkspaceLayoutPreset = "balanced"): WorkspaceBoardState {
  return {
    version: 1,
    preset,
    nodes: buildPresetNodes(preset),
    connections: buildDefaultWorkspaceConnections(),
    communications: buildDefaultWorkspaceCommunicationsState(),
    tracker: buildDefaultWorkspaceTrackerState(),
    hiddenCardIds: [...DEFAULT_HIDDEN_CARD_IDS],
    updatedAt: new Date().toISOString(),
  }
}

function normalizeHiddenCardIds(value: unknown): WorkspaceCardId[] {
  if (!Array.isArray(value)) return [...DEFAULT_HIDDEN_CARD_IDS]
  return WORKSPACE_CARD_IDS.filter((cardId) => value.includes(cardId))
}

function normalizeNodeState(value: unknown, fallbackPreset: WorkspaceLayoutPreset): WorkspaceNodeState[] {
  const fallbackMap = new Map(buildPresetNodes(fallbackPreset).map((node) => [node.id, node]))
  if (!Array.isArray(value)) {
    return buildPresetNodes(fallbackPreset)
  }

  const next: WorkspaceNodeState[] = []
  for (const rawNode of value) {
    if (!rawNode || typeof rawNode !== "object") continue
    const nodeRecord = rawNode as Partial<WorkspaceNodeState>
    if (!nodeRecord.id || !WORKSPACE_CARD_IDS.includes(nodeRecord.id)) continue
    const fallback = fallbackMap.get(nodeRecord.id)
    if (!fallback) continue
    next.push({
      id: nodeRecord.id,
      x: normalizeNumber(nodeRecord.x, fallback.x),
      y: normalizeNumber(nodeRecord.y, fallback.y),
      size: normalizeSize(nodeRecord.size, fallback.size),
    })
  }

  const present = new Set(next.map((node) => node.id))
  for (const id of WORKSPACE_CARD_IDS) {
    if (present.has(id)) continue
    const fallback = fallbackMap.get(id)
    if (!fallback) continue
    next.push(fallback)
  }

  return next
}

function normalizeConnectionState(value: unknown): WorkspaceConnectionState[] {
  const fallback = buildDefaultWorkspaceConnections()
  if (!Array.isArray(value)) {
    return fallback
  }

  const dedupe = new Set<string>()
  const next: WorkspaceConnectionState[] = []

  for (const rawConnection of value) {
    if (!rawConnection || typeof rawConnection !== "object") continue
    const connectionRecord = rawConnection as Partial<WorkspaceConnectionState>
    if (!connectionRecord.source || !WORKSPACE_CARD_IDS.includes(connectionRecord.source)) continue
    if (!connectionRecord.target || !WORKSPACE_CARD_IDS.includes(connectionRecord.target)) continue
    if (connectionRecord.source === connectionRecord.target) continue

    const key = `${connectionRecord.source}->${connectionRecord.target}`
    if (dedupe.has(key)) continue
    dedupe.add(key)

    next.push({
      id:
        typeof connectionRecord.id === "string" && connectionRecord.id.trim().length > 0
          ? connectionRecord.id
          : `edge-${connectionRecord.source}-to-${connectionRecord.target}`,
      source: connectionRecord.source,
      target: connectionRecord.target,
    })
  }

  return next.length > 0 ? next : fallback
}

export function normalizeWorkspaceBoardState(value: unknown): WorkspaceBoardState {
  if (!value || typeof value !== "object") {
    return buildDefaultBoardState()
  }

  const record = value as Partial<WorkspaceBoardState>
  const preset: WorkspaceLayoutPreset =
    record.preset === "calendar-focused" ||
    record.preset === "communications-focused" ||
    record.preset === "balanced"
      ? record.preset
      : "balanced"

  return {
    version: 1,
    preset,
    nodes: normalizeNodeState(record.nodes, preset),
    connections: normalizeConnectionState(record.connections),
    communications: normalizeWorkspaceCommunicationsState(record.communications),
    tracker: normalizeWorkspaceTrackerState(record.tracker),
    hiddenCardIds: normalizeHiddenCardIds(record.hiddenCardIds),
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim().length > 0
        ? record.updatedAt
        : new Date().toISOString(),
  }
}

export function applyAutoLayout(
  nodes: WorkspaceNodeState[],
  preset: WorkspaceLayoutPreset,
): Promise<WorkspaceNodeState[]> {
  const fallbackNodes = buildPresetNodes(preset, nodes)
  if (preset === "balanced") {
    return Promise.resolve(fallbackNodes)
  }
  return applyElkAutoLayout({ nodes, preset, fallbackNodes })
}
