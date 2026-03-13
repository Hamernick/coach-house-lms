import type {
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceLayoutPreset,
} from "./workspace-board-types"

export type CardDimensions = {
  width: number
  height: number
}

export type WorkspaceCardNodeStyle = {
  width: number
  height?: number
  minHeight?: number
}

export const CARD_DIMENSIONS: Record<WorkspaceCardSize, CardDimensions> = {
  sm: { width: 320, height: 300 },
  md: { width: 440, height: 400 },
  lg: { width: 560, height: 500 },
}

export const CARD_DIMENSION_OVERRIDES: Partial<
  Record<
    WorkspaceCardId,
    Partial<Record<WorkspaceCardSize, Partial<CardDimensions>>>
  >
> = {
  "organization-overview": {
    md: { width: 528, height: 432 },
  },
  programs: {
    md: { height: 620 },
    lg: { width: 560, height: 700 },
  },
  accelerator: {
    sm: { width: 400, height: 252 },
    md: { width: 480, height: 520 },
    lg: { width: 1180, height: 720 },
  },
  "brand-kit": {
    sm: { height: 360 },
    md: { height: 396 },
  },
  "economic-engine": {
    md: { height: 216 },
  },
  calendar: {
    sm: { height: 432 },
    md: { height: 500 },
  },
  communications: {
    sm: { width: 440, height: 456 },
    md: { width: 560, height: 620 },
    lg: { width: 640, height: 720 },
  },
  deck: {
    sm: { height: 332 },
  },
  vault: {
    sm: { height: 432 },
    md: { height: 456 },
    lg: { height: 540 },
  },
  atlas: {
    sm: { height: 252 },
    md: { height: 304 },
  },
}

export const DASHBOARD_GRID_ROWS: WorkspaceCardId[][] = [
  ["organization-overview", "programs", "accelerator", "calendar"],
  ["vault", "brand-kit", "economic-engine", "communications"],
  ["deck", "atlas"],
]

const CALENDAR_FOCUSED_GRID_ROWS: WorkspaceCardId[][] = [
  ["organization-overview", "programs", "calendar", "accelerator"],
  ["vault", "brand-kit", "communications", "economic-engine"],
  ["deck", "atlas"],
]

const COMMUNICATIONS_FOCUSED_GRID_ROWS: WorkspaceCardId[][] = [
  ["organization-overview", "programs", "communications", "accelerator"],
  ["vault", "brand-kit", "calendar", "economic-engine"],
  ["deck", "atlas"],
]

export const PRESET_GRID_ROWS: Record<
  WorkspaceLayoutPreset,
  WorkspaceCardId[][]
> = {
  balanced: DASHBOARD_GRID_ROWS,
  "calendar-focused": CALENDAR_FOCUSED_GRID_ROWS,
  "communications-focused": COMMUNICATIONS_FOCUSED_GRID_ROWS,
}

export const DASHBOARD_GRID_GAP_X = 32
export const DASHBOARD_GRID_GAP_Y = 32
export const DASHBOARD_GRID_MARGIN_X = 72
export const DASHBOARD_GRID_MARGIN_Y = 72

export const DEFAULT_CARD_SIZES: Record<WorkspaceCardId, WorkspaceCardSize> = {
  "organization-overview": "md",
  programs: "md",
  accelerator: "sm",
  "brand-kit": "sm",
  "economic-engine": "md",
  calendar: "sm",
  communications: "md",
  deck: "md",
  vault: "sm",
  atlas: "md",
}

export const DEFAULT_HIDDEN_CARD_IDS: WorkspaceCardId[] = ["brand-kit", "deck", "atlas"]

export const AUTO_LAYOUT_SNAP = 8

export function resolveCardDimensions(
  size: WorkspaceCardSize,
  cardId?: WorkspaceCardId
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

export function resolveWorkspaceCardNodeStyle(
  size: WorkspaceCardSize,
  cardId?: WorkspaceCardId,
): WorkspaceCardNodeStyle {
  const dimensions = resolveCardDimensions(size, cardId)

  if (
    cardId === "accelerator" ||
    cardId === "organization-overview" ||
    cardId === "programs" ||
    cardId === "calendar"
  ) {
    return {
      width: dimensions.width,
    }
  }

  return {
    width: dimensions.width,
    height: dimensions.height,
    minHeight: dimensions.height,
  }
}

export function roundToSnap(value: number) {
  return Math.round(value / AUTO_LAYOUT_SNAP) * AUTO_LAYOUT_SNAP
}
