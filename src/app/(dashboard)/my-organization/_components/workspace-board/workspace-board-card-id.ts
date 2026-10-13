import {
  WORKSPACE_CARD_IDS,
  type WorkspaceCardId,
} from "./workspace-board-types"

const LEGACY_ACCELERATOR_CARD_IDS = ["formation-status"] as const

export function normalizeWorkspaceCardId(value: unknown): WorkspaceCardId | null {
  if (value === LEGACY_ACCELERATOR_CARD_IDS[0]) return "accelerator"
  if (typeof value !== "string") return null
  if (!WORKSPACE_CARD_IDS.includes(value as WorkspaceCardId)) return null
  return value as WorkspaceCardId
}
