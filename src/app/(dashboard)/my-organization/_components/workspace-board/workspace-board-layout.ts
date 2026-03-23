import {
  WORKSPACE_CARD_IDS,
  type WorkspaceAutoLayoutMode,
  type WorkspaceBoardState,
  type WorkspaceBoardAcceleratorState,
  type WorkspaceBoardVisibilityState,
  type WorkspaceCardId,
  type WorkspaceConnectionState,
  type WorkspaceCardSize,
  type WorkspaceLayoutPreset,
  type WorkspaceNodeState,
} from "./workspace-board-types"
import { buildAutoLayoutNodesForMode } from "./workspace-board-auto-layout-modes"
import { WORKSPACE_EDGE_SPECS } from "./workspace-board-copy"
import {
  DASHBOARD_GRID_GAP_X,
  DASHBOARD_GRID_GAP_Y,
  DASHBOARD_GRID_MARGIN_X,
  DASHBOARD_GRID_MARGIN_Y,
  DEFAULT_CARD_SIZES,
  DEFAULT_HIDDEN_CARD_IDS,
  PRESET_GRID_ROWS,
  resolveCardDimensions,
  roundToSnap,
} from "./workspace-board-layout-config"
import { normalizeWorkspaceCardId } from "./workspace-board-card-id"
import {
  normalizeWorkspaceHiddenCardIds,
  sanitizeWorkspaceBoardHiddenState,
  toggleWorkspaceBoardCardVisibility,
} from "./workspace-board-hidden-cards"
import {
  buildDefaultWorkspaceCommunicationsState,
  normalizeWorkspaceCommunicationsState,
} from "./workspace-board-layout-communications-state"
import {
  buildDefaultWorkspaceOnboardingFlowState,
  normalizeWorkspaceOnboardingFlowState,
} from "./workspace-board-onboarding-flow"
import {
  buildDefaultWorkspaceTrackerState,
  normalizeWorkspaceTrackerState,
} from "./workspace-board-layout-tracker-state"
import { normalizeWorkspaceBoardAcceleratorUiState } from "./workspace-board-visibility-reducer"

export { buildDefaultWorkspaceCommunicationsState } from "./workspace-board-layout-communications-state"
export { buildDefaultWorkspaceTrackerState } from "./workspace-board-layout-tracker-state"
export {
  isWorkspaceCardAutoHeight,
  resolveCardDimensions,
  resolveWorkspaceCardCanvasShellClassName,
  resolveWorkspaceCardCanvasShellStyle,
  resolveWorkspaceCardHeightModeClassName,
  resolveWorkspaceCardNodeStyle,
} from "./workspace-board-layout-config"
export {
  sanitizeWorkspaceBoardHiddenState,
  toggleWorkspaceBoardCardVisibility,
} from "./workspace-board-hidden-cards"

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.round(value)
}

function normalizeSize(
  value: unknown,
  fallback: WorkspaceCardSize
): WorkspaceCardSize {
  if (value === "sm" || value === "md" || value === "lg") return value
  return fallback
}

function normalizeNodeCardSize(
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

function isWorkspaceAutoLayoutMode(
  value: unknown,
): value is WorkspaceAutoLayoutMode {
  return value === "dagre-tree" || value === "timeline"
}

function normalizeWorkspaceAutoLayoutMode(
  value: unknown,
): WorkspaceAutoLayoutMode {
  if (value === "hub" || value === "dagre-tree") return "dagre-tree"
  if (value === "timeline") return "timeline"
  return "timeline"
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
        resolveCardDimensions(size, cardId).height
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
            Math.max(0, (columnWidths[columnIndex]! - dimensions.width) / 2)
        ),
        y: roundToSnap(rowStartY),
      }
    }
  }

  return positions
}

export function buildPresetNodes(
  preset: WorkspaceLayoutPreset,
  existingNodes?: WorkspaceNodeState[]
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

export function buildDefaultWorkspaceConnections(): WorkspaceConnectionState[] {
  return WORKSPACE_EDGE_SPECS.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }))
}

export function buildDefaultBoardState(
  preset: WorkspaceLayoutPreset = "balanced"
): WorkspaceBoardState {
  const autoLayoutMode: WorkspaceAutoLayoutMode = "timeline"
  const hiddenCardIds = [...DEFAULT_HIDDEN_CARD_IDS]
  const connections = buildDefaultWorkspaceConnections()
  return {
    version: 1,
    preset,
    autoLayoutMode,
    nodes: buildAutoLayoutNodesForMode({
      mode: autoLayoutMode,
      hiddenCardIds,
      connections,
    }),
    connections,
    communications: buildDefaultWorkspaceCommunicationsState(),
    tracker: buildDefaultWorkspaceTrackerState(),
    accelerator: buildDefaultWorkspaceAcceleratorState(),
    acceleratorUi: {
      stepOpen: false,
      lastStepId: null,
    },
    onboardingFlow: buildDefaultWorkspaceOnboardingFlowState(),
    hiddenCardIds,
    visibility: buildDefaultWorkspaceVisibilityState(),
    updatedAt: new Date().toISOString(),
  }
}

function buildDefaultWorkspaceAcceleratorState(): WorkspaceBoardAcceleratorState {
  return {
    activeStepId: null,
    completedStepIds: [],
  }
}

function buildDefaultWorkspaceVisibilityState(): WorkspaceBoardVisibilityState {
  return {
    allCardsHiddenExplicitly: false,
  }
}

function normalizeWorkspaceAcceleratorState(
  value: unknown
): WorkspaceBoardAcceleratorState {
  if (!value || typeof value !== "object") {
    return buildDefaultWorkspaceAcceleratorState()
  }

  const record = value as Partial<WorkspaceBoardAcceleratorState>
  const activeStepId =
    typeof record.activeStepId === "string" &&
    record.activeStepId.trim().length > 0
      ? record.activeStepId
      : null
  const completedStepIds = Array.isArray(record.completedStepIds)
    ? record.completedStepIds.filter(
        (stepId): stepId is string =>
          typeof stepId === "string" && stepId.trim().length > 0
      )
    : []

  return {
    activeStepId,
    completedStepIds,
  }
}

function normalizeWorkspaceVisibilityState(
  value: unknown
): WorkspaceBoardVisibilityState {
  if (!value || typeof value !== "object") {
    return buildDefaultWorkspaceVisibilityState()
  }

  const record = value as Partial<WorkspaceBoardVisibilityState>
  return {
    allCardsHiddenExplicitly: record.allCardsHiddenExplicitly === true,
  }
}

function normalizeNodeState(
  value: unknown,
  fallbackMode: WorkspaceAutoLayoutMode,
  hiddenCardIds?: WorkspaceCardId[],
  connections?: WorkspaceConnectionState[],
): WorkspaceNodeState[] {
  const fallbackMap = new Map(
    buildAutoLayoutNodesForMode({
      mode: fallbackMode,
      hiddenCardIds,
      connections,
    }).map((node) => [node.id, node])
  )
  if (!Array.isArray(value)) {
    return buildAutoLayoutNodesForMode({
      mode: fallbackMode,
      hiddenCardIds,
      connections,
    })
  }

  const next: WorkspaceNodeState[] = []
  const seenNodeIds = new Set<WorkspaceCardId>()
  for (const rawNode of value) {
    if (!rawNode || typeof rawNode !== "object") continue
    const nodeRecord = rawNode as Partial<WorkspaceNodeState>
    const normalizedNodeId = normalizeWorkspaceCardId(nodeRecord.id)
    if (!normalizedNodeId || seenNodeIds.has(normalizedNodeId)) continue
    const fallback = fallbackMap.get(normalizedNodeId)
    if (!fallback) continue
    seenNodeIds.add(normalizedNodeId)
    next.push({
      id: normalizedNodeId,
      x: normalizeNumber(nodeRecord.x, fallback.x),
      y: normalizeNumber(nodeRecord.y, fallback.y),
      size: normalizeNodeCardSize(normalizedNodeId, nodeRecord.size, fallback.size),
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
    const normalizedSource = normalizeWorkspaceCardId(connectionRecord.source)
    const normalizedTarget = normalizeWorkspaceCardId(connectionRecord.target)
    if (!normalizedSource || !normalizedTarget) continue
    if (normalizedSource === normalizedTarget) continue

    const key = `${normalizedSource}->${normalizedTarget}`
    if (dedupe.has(key)) continue
    dedupe.add(key)

    next.push({
      id:
        typeof connectionRecord.id === "string" &&
        connectionRecord.id.trim().length > 0
          ? connectionRecord.id
          : `edge-${normalizedSource}-to-${normalizedTarget}`,
      source: normalizedSource,
      target: normalizedTarget,
    })
  }

  return next.length > 0 ? next : fallback
}

export function normalizeWorkspaceBoardState(
  value: unknown
): WorkspaceBoardState {
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
  const autoLayoutMode = normalizeWorkspaceAutoLayoutMode(record.autoLayoutMode)
  const normalizedAccelerator = normalizeWorkspaceAcceleratorState(
    record.accelerator
  )
  const normalizedHiddenCardIds = normalizeWorkspaceHiddenCardIds(record.hiddenCardIds)
  const normalizedConnections = normalizeConnectionState(record.connections)

  return {
    version: 1,
    preset,
    autoLayoutMode,
    nodes: normalizeNodeState(
      record.nodes,
      autoLayoutMode,
      normalizedHiddenCardIds,
      normalizedConnections,
    ),
    connections: normalizedConnections,
    communications: normalizeWorkspaceCommunicationsState(
      record.communications
    ),
    tracker: normalizeWorkspaceTrackerState(record.tracker),
    accelerator: normalizedAccelerator,
    acceleratorUi: normalizeWorkspaceBoardAcceleratorUiState(
      record.acceleratorUi,
      normalizedAccelerator.activeStepId,
    ),
    onboardingFlow: normalizeWorkspaceOnboardingFlowState(record.onboardingFlow),
    hiddenCardIds: normalizedHiddenCardIds,
    visibility: normalizeWorkspaceVisibilityState(record.visibility),
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim().length > 0
        ? record.updatedAt
        : new Date().toISOString(),
  }
}

export function applyAutoLayout(
  nodes: WorkspaceNodeState[],
  modeOrPreset: WorkspaceLayoutPreset | WorkspaceAutoLayoutMode,
  {
    hiddenCardIds,
    connections,
  }: {
    hiddenCardIds?: WorkspaceCardId[]
    connections?: WorkspaceConnectionState[]
  } = {},
): Promise<WorkspaceNodeState[]> {
  if (isWorkspaceAutoLayoutMode(modeOrPreset)) {
    return Promise.resolve(
      buildAutoLayoutNodesForMode({
        mode: modeOrPreset,
        existingNodes: nodes,
        hiddenCardIds,
        connections,
      }),
    )
  }
  return Promise.resolve(buildPresetNodes(modeOrPreset, nodes))
}
