import {
  normalizeOrganizationNarrativeHtml,
  resolveLegacyOrganizationNarratives,
  resolveOrganizationNarratives,
  updateOrganizationNarratives,
  type OrganizationNarrativeKey,
  type OrganizationNarratives,
} from "./organization-narratives"
import { isRecord } from "./helpers"

export type MvvMigrationAction = {
  key: OrganizationNarrativeKey
  result: "preserved" | "copied_legacy" | "empty" | "conflict"
  sourceHash: string | null
  targetHash: string | null
}

export type MvvMigrationPlan = {
  actions: MvvMigrationAction[]
  changed: boolean
  nextProfile: Record<string, unknown>
  reviewRequired: boolean
}

function stableTextHash(value: string): string | null {
  if (!value) return null
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function comparable(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

export function planMissionVisionValuesMigration(
  profile: Record<string, unknown> | null | undefined,
  options: { now?: string } = {}
): MvvMigrationPlan {
  const sourceProfile = isRecord(profile) ? profile : {}
  const canonical = resolveOrganizationNarratives(sourceProfile, {
    includeLegacyFallback: false,
  })
  const legacy = resolveLegacyOrganizationNarratives(sourceProfile)
  const updates: Partial<OrganizationNarratives> = {}
  const actions = (
    ["mission", "vision", "values"] as OrganizationNarrativeKey[]
  ).map<MvvMigrationAction>((key) => {
    const targetValue = canonical[key]
    const sourceValue = legacy[key]
    const normalizedSource = normalizeOrganizationNarrativeHtml(sourceValue)

    if (targetValue.trim()) {
      const conflict =
        normalizedSource.trim().length > 0 &&
        comparable(normalizedSource) !== comparable(targetValue)
      return {
        key,
        result: conflict ? "conflict" : "preserved",
        sourceHash: stableTextHash(normalizedSource),
        targetHash: stableTextHash(targetValue),
      }
    }

    if (!normalizedSource.trim()) {
      return {
        key,
        result: "empty",
        sourceHash: null,
        targetHash: null,
      }
    }

    updates[key] = normalizedSource
    return {
      key,
      result: "copied_legacy",
      sourceHash: stableTextHash(normalizedSource),
      targetHash: stableTextHash(normalizedSource),
    }
  })

  const changed = Object.keys(updates).length > 0
  let nextProfile = changed
    ? updateOrganizationNarratives(sourceProfile, updates).nextProfile
    : { ...sourceProfile }

  if (changed) {
    const roadmap = isRecord(nextProfile.roadmap)
      ? { ...(nextProfile.roadmap as Record<string, unknown>) }
      : {}
    const migrations = isRecord(roadmap.migrations)
      ? { ...(roadmap.migrations as Record<string, unknown>) }
      : {}
    migrations.mvvSplitV1 = {
      appliedAt: options.now ?? new Date().toISOString(),
      actions,
    }
    roadmap.migrations = migrations
    nextProfile = { ...nextProfile, roadmap }
  }

  return {
    actions,
    changed,
    nextProfile,
    reviewRequired:
      canonical.mission.trim().length > 0 ||
      actions.some((action) => action.result === "conflict"),
  }
}
