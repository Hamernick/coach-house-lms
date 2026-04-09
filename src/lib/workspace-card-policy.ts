import { WORKSPACE_MAP_FEATURE_ENABLED } from "@/lib/workspace-map-feature"

export const WORKSPACE_DEPRECATED_CARD_IDS = [
  "brand-kit",
  "atlas",
] as const

export const WORKSPACE_TEMPORARILY_UNAVAILABLE_CARD_IDS = [
  "deck",
  "economic-engine",
  "communications",
] as const

export const WORKSPACE_REST_VISIBLE_CARD_IDS = [
  "roadmap",
  "accelerator",
  "organization-overview",
  "programs",
] as const

export function isWorkspaceTemporarilyUnavailableCardId(cardId: string) {
  return (
    WORKSPACE_TEMPORARILY_UNAVAILABLE_CARD_IDS as readonly string[]
  ).includes(cardId)
}

export function isWorkspaceRestVisibleCardId(cardId: string) {
  return (WORKSPACE_REST_VISIBLE_CARD_IDS as readonly string[]).includes(cardId)
}

export function resolveWorkspaceAlwaysHiddenCardIds() {
  const deprecatedHiddenCardIds = WORKSPACE_MAP_FEATURE_ENABLED
    ? (["brand-kit"] as const)
    : (["brand-kit", "atlas"] as const)

  return [
    ...deprecatedHiddenCardIds,
    ...WORKSPACE_TEMPORARILY_UNAVAILABLE_CARD_IDS,
  ] as const
}

export function resolveWorkspaceDefaultHiddenCardIds() {
  return [...resolveWorkspaceAlwaysHiddenCardIds()] as const
}
