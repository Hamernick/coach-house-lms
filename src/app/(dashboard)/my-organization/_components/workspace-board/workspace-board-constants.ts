export const WORKSPACE_CARD_IDS = [
  "organization-overview",
  "programs",
  "accelerator",
  "roadmap",
  "brand-kit",
  "economic-engine",
  "calendar",
  "communications",
  "deck",
  "atlas",
  "fiscal-sponsorship",
] as const

export type WorkspaceCardId = (typeof WORKSPACE_CARD_IDS)[number]

export const WORKSPACE_LAYOUT_PRESETS = [
  "balanced",
  "calendar-focused",
  "communications-focused",
] as const

export type WorkspaceLayoutPreset = (typeof WORKSPACE_LAYOUT_PRESETS)[number]

export const WORKSPACE_AUTO_LAYOUT_MODES = [
  "dagre-tree",
  "timeline",
] as const

export type WorkspaceAutoLayoutMode =
  (typeof WORKSPACE_AUTO_LAYOUT_MODES)[number]

export const WORKSPACE_JOURNEY_STAGES = [
  "foundation",
  "materials",
  "accelerator-entry",
  "operating",
] as const

export type WorkspaceJourneyStage =
  (typeof WORKSPACE_JOURNEY_STAGES)[number]

export type WorkspaceLayoutPresetMeta = {
  label: string
  shortLabel: string
  algorithmLabel: string
}

export const WORKSPACE_LAYOUT_PRESET_META: Record<
  WorkspaceLayoutPreset,
  WorkspaceLayoutPresetMeta
> = {
  balanced: {
    label: "Dashboard",
    shortLabel: "Dashboard",
    algorithmLabel: "Semantic grid",
  },
  "calendar-focused": {
    label: "Cadence",
    shortLabel: "Cadence",
    algorithmLabel: "Semantic grid · calendar focus",
  },
  "communications-focused": {
    label: "Narrative",
    shortLabel: "Narrative",
    algorithmLabel: "Semantic grid · communications focus",
  },
}

export const WORKSPACE_CARD_SIZES = ["sm", "md", "lg"] as const

export type WorkspaceCardSize = (typeof WORKSPACE_CARD_SIZES)[number]

export const WORKSPACE_VAULT_VIEW_MODES = [
  "dropzone",
  "search",
  "mini-viewer",
] as const

export type WorkspaceVaultViewMode = (typeof WORKSPACE_VAULT_VIEW_MODES)[number]
