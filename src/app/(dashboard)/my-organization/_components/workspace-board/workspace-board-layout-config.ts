import type {
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceLayoutPreset,
} from "./workspace-board-types"

export type CardDimensions = {
  width: number
  height: number
}

export const CARD_DIMENSIONS: Record<WorkspaceCardSize, CardDimensions> = {
  sm: { width: 320, height: 300 },
  md: { width: 440, height: 400 },
}

export const CARD_DIMENSION_OVERRIDES: Partial<
  Record<WorkspaceCardId, Partial<Record<WorkspaceCardSize, Partial<CardDimensions>>>>
> = {
  "organization-overview": {
    md: { height: 296 },
  },
  "formation-status": {
    sm: { height: 252 },
    md: { height: 340 },
  },
  "brand-kit": {
    sm: { height: 264 },
    md: { height: 292 },
  },
  "economic-engine": {
    md: { height: 216 },
  },
  calendar: {
    sm: { height: 320 },
  },
  communications: {
    sm: { height: 228 },
    md: { height: 236 },
  },
  deck: {
    sm: { height: 332 },
  },
  vault: {
    sm: { height: 344 },
    md: { height: 392 },
  },
  atlas: {
    sm: { height: 252 },
    md: { height: 304 },
  },
}

export const DASHBOARD_GRID_ROWS: WorkspaceCardId[][] = [
  ["formation-status", "organization-overview", "calendar"],
  ["brand-kit", "economic-engine", "communications"],
  ["deck", "vault", "atlas"],
]

export const DASHBOARD_GRID_GAP_X = 32
export const DASHBOARD_GRID_GAP_Y = 32
export const DASHBOARD_GRID_MARGIN_X = 72
export const DASHBOARD_GRID_MARGIN_Y = 72

export const PRESET_NODE_LAYOUTS: Record<
  WorkspaceLayoutPreset,
  Record<WorkspaceCardId, { x: number; y: number }>
> = {
  balanced: {
    "organization-overview": { x: 96, y: 96 },
    "formation-status": { x: 584, y: 96 },
    calendar: { x: 1072, y: 146 },
    "brand-kit": { x: 156, y: 544 },
    "economic-engine": { x: 584, y: 496 },
    communications: { x: 952, y: 496 },
    deck: { x: 148, y: 968 },
    vault: { x: 552, y: 952 },
    atlas: { x: 1032, y: 1008 },
  },
  "calendar-focused": {
    "organization-overview": { x: 760, y: 250 },
    "formation-status": { x: 120, y: 80 },
    "brand-kit": { x: 180, y: 520 },
    "economic-engine": { x: 1540, y: 350 },
    calendar: { x: 1010, y: 40 },
    communications: { x: 1010, y: 420 },
    deck: { x: 1480, y: 760 },
    vault: { x: 940, y: 830 },
    atlas: { x: 360, y: 940 },
  },
  "communications-focused": {
    "organization-overview": { x: 760, y: 250 },
    "formation-status": { x: 120, y: 80 },
    "brand-kit": { x: 180, y: 520 },
    "economic-engine": { x: 1540, y: 330 },
    calendar: { x: 1110, y: 40 },
    communications: { x: 960, y: 300 },
    deck: { x: 1510, y: 740 },
    vault: { x: 126, y: 930 },
    atlas: { x: 660, y: 930 },
  },
}

export const DEFAULT_CARD_SIZES: Record<WorkspaceCardId, WorkspaceCardSize> = {
  "organization-overview": "md",
  "formation-status": "sm",
  "brand-kit": "sm",
  "economic-engine": "md",
  calendar: "sm",
  communications: "md",
  deck: "md",
  vault: "sm",
  atlas: "md",
}

export const DEFAULT_HIDDEN_CARD_IDS: WorkspaceCardId[] = ["deck", "atlas"]

export const AUTO_LAYOUT_SNAP = 8

export function resolveCardDimensions(
  size: WorkspaceCardSize,
  cardId?: WorkspaceCardId,
): CardDimensions {
  const base = CARD_DIMENSIONS[size]
  if (!cardId) return base

  const override = CARD_DIMENSION_OVERRIDES[cardId]?.[size]
  if (!override) return base

  return {
    width: override.width ?? base.width,
    height: override.height ?? base.height,
  }
}

export function roundToSnap(value: number) {
  return Math.round(value / AUTO_LAYOUT_SNAP) * AUTO_LAYOUT_SNAP
}
