import { SECTION_DEFINITIONS } from "@/lib/roadmap/definitions"
import type { WorkspaceAcceleratorCardStep } from "../types"

export type WorkspaceAcceleratorLessonGroupOption = {
  key: string
  label: string
  moduleIds: string[]
}

export type WorkspaceAcceleratorChecklistModule = {
  id: string
  title: string
  groupTitle: string
  steps: WorkspaceAcceleratorCardStep[]
  totalSteps: number
  completedStepCount: number
  isCurrent: boolean
}

function normalizeLessonGroupLabel(groupTitle: string) {
  const next = groupTitle.trim()
  return next.length > 0 ? next : "Accelerator"
}

function normalizeLessonGroupOrderLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const ROADMAP_LESSON_GROUP_ORDER = new Map(
  SECTION_DEFINITIONS.map((section, index) => [
    normalizeLessonGroupOrderLabel(section.title),
    index,
  ]),
)

const ROADMAP_LESSON_GROUP_ALIASES = new Map<string, string>([
  [
    normalizeLessonGroupOrderLabel("Theory of Change & Systems Thinking"),
    normalizeLessonGroupOrderLabel("Theory of Change"),
  ],
  [
    normalizeLessonGroupOrderLabel("Program Design & Delivery"),
    normalizeLessonGroupOrderLabel("Program"),
  ],
  [
    normalizeLessonGroupOrderLabel("Board Governance & Strategy"),
    normalizeLessonGroupOrderLabel("Board Strategy"),
  ],
])

const PREFERRED_LESSON_GROUP_ORDER = new Map<string, number>([
  [normalizeLessonGroupOrderLabel("Formation"), 0],
  [normalizeLessonGroupOrderLabel("Strategic Foundations"), 1],
])

function resolvePreferredLessonGroupOrderRank(label: string) {
  const normalizedLabel = normalizeLessonGroupOrderLabel(label)
  const exactRank = PREFERRED_LESSON_GROUP_ORDER.get(normalizedLabel)
  if (exactRank != null) return exactRank

  if (normalizedLabel.includes("formation")) {
    return PREFERRED_LESSON_GROUP_ORDER.get(
      normalizeLessonGroupOrderLabel("Formation"),
    )!
  }
  if (normalizedLabel.includes("strategic foundation")) {
    return PREFERRED_LESSON_GROUP_ORDER.get(
      normalizeLessonGroupOrderLabel("Strategic Foundations"),
    )!
  }

  return null
}

function resolveLessonGroupOrderRank(label: string) {
  const normalizedLabel = normalizeLessonGroupOrderLabel(label)
  const exactMatch = ROADMAP_LESSON_GROUP_ORDER.get(normalizedLabel)
  if (exactMatch != null) return exactMatch

  const aliasMatch = ROADMAP_LESSON_GROUP_ALIASES.get(normalizedLabel)
  if (aliasMatch) {
    const aliasedRank = ROADMAP_LESSON_GROUP_ORDER.get(aliasMatch)
    if (aliasedRank != null) return aliasedRank
  }

  for (const [canonicalLabel, rank] of ROADMAP_LESSON_GROUP_ORDER.entries()) {
    if (
      normalizedLabel.startsWith(canonicalLabel) ||
      canonicalLabel.startsWith(normalizedLabel)
    ) {
      return rank
    }
  }

  return null
}

export function formatWorkspaceAcceleratorModuleCompletionLabel(
  completedStepCount: number,
  totalSteps: number,
) {
  return `${completedStepCount} of ${totalSteps} complete`
}

export function resolveWorkspaceAcceleratorOpenModuleId({
  previousOpenModuleId,
  visibleModuleIds,
  currentModuleId,
  forceCurrentModuleOpen,
}: {
  previousOpenModuleId: string | null
  visibleModuleIds: string[]
  currentModuleId: string | null
  forceCurrentModuleOpen: boolean
}) {
  if (visibleModuleIds.length === 0) return null

  const visibleModuleIdSet = new Set(visibleModuleIds)

  if (
    forceCurrentModuleOpen &&
    currentModuleId &&
    visibleModuleIdSet.has(currentModuleId)
  ) {
    return currentModuleId
  }

  if (previousOpenModuleId && visibleModuleIdSet.has(previousOpenModuleId)) {
    return previousOpenModuleId
  }

  if (currentModuleId && visibleModuleIdSet.has(currentModuleId)) {
    return currentModuleId
  }

  return visibleModuleIds[0] ?? null
}

export function buildWorkspaceAcceleratorLessonGroupKey(groupTitle: string) {
  return normalizeLessonGroupLabel(groupTitle).toLowerCase().replace(/\s+/g, "-")
}

export function buildWorkspaceAcceleratorLessonGroupOptions(
  steps: WorkspaceAcceleratorCardStep[],
): WorkspaceAcceleratorLessonGroupOption[] {
  const groups = new Map<string, WorkspaceAcceleratorLessonGroupOption>()
  const insertionOrder = new Map<string, number>()
  const explicitGroupOrder = new Map<string, number>()

  for (const step of steps) {
    const label = normalizeLessonGroupLabel(step.groupTitle)
    const key = buildWorkspaceAcceleratorLessonGroupKey(label)
    const existing = groups.get(key)

    if (
      typeof step.groupOrder === "number" &&
      Number.isFinite(step.groupOrder) &&
      !explicitGroupOrder.has(key)
    ) {
      explicitGroupOrder.set(key, step.groupOrder)
    }

    if (existing) {
      if (!existing.moduleIds.includes(step.moduleId)) {
        existing.moduleIds.push(step.moduleId)
      }
      continue
    }

    groups.set(key, {
      key,
      label,
      moduleIds: [step.moduleId],
    })
    insertionOrder.set(key, insertionOrder.size)
  }

  return Array.from(groups.values()).sort((left, right) => {
    const leftPreferredOrder = resolvePreferredLessonGroupOrderRank(left.label)
    const rightPreferredOrder = resolvePreferredLessonGroupOrderRank(right.label)
    if (leftPreferredOrder != null && rightPreferredOrder != null) {
      if (leftPreferredOrder !== rightPreferredOrder) {
        return leftPreferredOrder - rightPreferredOrder
      }
    } else if (leftPreferredOrder != null) {
      return -1
    } else if (rightPreferredOrder != null) {
      return 1
    }

    const leftExplicitOrder = explicitGroupOrder.get(left.key)
    const rightExplicitOrder = explicitGroupOrder.get(right.key)

    if (leftExplicitOrder != null && rightExplicitOrder != null) {
      if (leftExplicitOrder !== rightExplicitOrder) {
        return leftExplicitOrder - rightExplicitOrder
      }
    } else if (leftExplicitOrder != null) {
      return -1
    } else if (rightExplicitOrder != null) {
      return 1
    }

    const leftRank = resolveLessonGroupOrderRank(left.label)
    const rightRank = resolveLessonGroupOrderRank(right.label)

    if (leftRank != null && rightRank != null && leftRank !== rightRank) {
      return leftRank - rightRank
    }
    if (leftRank != null && rightRank == null) return -1
    if (leftRank == null && rightRank != null) return 1

    return (insertionOrder.get(left.key) ?? 0) - (insertionOrder.get(right.key) ?? 0)
  })
}

export function buildWorkspaceAcceleratorChecklistModules({
  steps,
  completedStepIds,
  selectedGroupKey,
  currentStepId,
}: {
  steps: WorkspaceAcceleratorCardStep[]
  completedStepIds: string[]
  selectedGroupKey: string
  currentStepId: string | null
}): WorkspaceAcceleratorChecklistModule[] {
  const completed = new Set(completedStepIds)
  const modules = new Map<string, WorkspaceAcceleratorChecklistModule>()

  for (const step of steps) {
    const groupKey = buildWorkspaceAcceleratorLessonGroupKey(step.groupTitle)
    if (selectedGroupKey && groupKey !== selectedGroupKey) continue

    const existing = modules.get(step.moduleId)
    if (existing) {
      existing.steps.push(step)
      existing.totalSteps += 1
      if (completed.has(step.id)) existing.completedStepCount += 1
      if (step.id === currentStepId) existing.isCurrent = true
      continue
    }

    modules.set(step.moduleId, {
      id: step.moduleId,
      title: step.moduleTitle,
      groupTitle: normalizeLessonGroupLabel(step.groupTitle),
      steps: [step],
      totalSteps: 1,
      completedStepCount: completed.has(step.id) ? 1 : 0,
      isCurrent: step.id === currentStepId,
    })
  }

  return Array.from(modules.values())
}
