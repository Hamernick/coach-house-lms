import { resolveWorkspaceDefaultHiddenCardIds } from "@/lib/workspace-card-policy"
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

const AUTO_HEIGHT_CARD_IDS = new Set<WorkspaceCardId>([
  "accelerator",
  "organization-overview",
  "programs",
  "roadmap",
  "deck",
  "calendar",
  "communications",
])

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
    md: { width: 552, height: 452 },
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
  roadmap: {
    sm: { height: 560 },
    md: { height: 600 },
    lg: { height: 680 },
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
    md: { width: 552, height: 708 },
    lg: { width: 560, height: 780 },
  },
  atlas: {
    sm: { width: 400, height: 372 },
    md: { width: 520, height: 428 },
  },
}

export const DASHBOARD_GRID_ROWS: WorkspaceCardId[][] = [
  ["organization-overview", "programs", "accelerator", "calendar"],
  ["roadmap", "deck", "brand-kit", "economic-engine"],
  ["communications", "atlas"],
]

const CALENDAR_FOCUSED_GRID_ROWS: WorkspaceCardId[][] = [
  ["organization-overview", "programs", "calendar", "accelerator"],
  ["roadmap", "deck", "communications", "economic-engine"],
  ["brand-kit", "atlas"],
]

const COMMUNICATIONS_FOCUSED_GRID_ROWS: WorkspaceCardId[][] = [
  ["organization-overview", "programs", "communications", "accelerator"],
  ["roadmap", "deck", "calendar", "economic-engine"],
  ["brand-kit", "atlas"],
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
  roadmap: "sm",
  "brand-kit": "sm",
  "economic-engine": "md",
  calendar: "sm",
  communications: "md",
  deck: "md",
  atlas: "md",
}

export const DEFAULT_HIDDEN_CARD_IDS: WorkspaceCardId[] = [
  ...resolveWorkspaceDefaultHiddenCardIds(),
]

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

  if (isWorkspaceCardAutoHeight(cardId)) {
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

export function isWorkspaceCardAutoHeight(cardId?: WorkspaceCardId) {
  return cardId ? AUTO_HEIGHT_CARD_IDS.has(cardId) : false
}

export function resolveWorkspaceCardHeightModeClassName(cardId?: WorkspaceCardId) {
  return isWorkspaceCardAutoHeight(cardId) ? "h-auto" : "h-full"
}

export function resolveWorkspaceCardCanvasShellStyle({
  size,
  cardId,
  isCanvasFullscreen = false,
}: {
  size: WorkspaceCardSize
  cardId?: WorkspaceCardId
  isCanvasFullscreen?: boolean
}) {
  const canvasNodeStyle = resolveWorkspaceCardNodeStyle(size, cardId)

  if (isCanvasFullscreen || isWorkspaceCardAutoHeight(cardId)) {
    return undefined
  }

  return {
    minHeight: canvasNodeStyle.minHeight,
    height: canvasNodeStyle.height,
  }
}

export function resolveWorkspaceCardCanvasShellClassName({
  size,
  cardId,
  isCanvasFullscreen = false,
}: {
  size: WorkspaceCardSize
  cardId?: WorkspaceCardId
  isCanvasFullscreen?: boolean
}) {
  if (isCanvasFullscreen) {
    return "h-full rounded-none border-0 shadow-none"
  }

  return [
    resolveWorkspaceCardHeightModeClassName(cardId),
    "shadow-none",
    "border-border/70 border",
    size === "sm" ? "rounded-[20px]" : "rounded-[24px]",
  ].join(" ")
}

export function roundToSnap(value: number) {
  return Math.round(value / AUTO_LAYOUT_SNAP) * AUTO_LAYOUT_SNAP
}
