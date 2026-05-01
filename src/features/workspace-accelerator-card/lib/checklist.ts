import { SECTION_DEFINITIONS } from "@/lib/roadmap/definitions"
import { isElectiveAddOnModule } from "@/lib/accelerator/elective-modules"
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
  [normalizeLessonGroupOrderLabel("Introduction"), 0],
  [normalizeLessonGroupOrderLabel("Formation"), 1],
  [normalizeLessonGroupOrderLabel("Strategic Foundations"), 2],
])

const INTRODUCTION_MODULE_SLUGS = new Set([
  "intro-idea-to-impact-accelerator",
  "introduction-idea-to-impact-accelerator",
])
const ORGANIZATION_SETUP_MODULE_SLUGS = [
  "organization-setup",
  "workspace-setup",
  "workspace-onboarding-organization-setup",
] as const
const ORGANIZATION_SETUP_MODULE_TITLES = new Set([
  "organization setup",
  "workspace setup",
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

function normalizeModuleSignal(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function isWorkspaceAcceleratorIntroductionStep(
  step: WorkspaceAcceleratorCardStep,
) {
  const moduleSlug = normalizeModuleSignal(step.moduleSlug)
  if (INTRODUCTION_MODULE_SLUGS.has(moduleSlug)) return true

  const moduleId = normalizeModuleSignal(step.moduleId)
  if (INTRODUCTION_MODULE_SLUGS.has(moduleId)) return true

  return normalizeModuleSignal(step.moduleTitle) ===
    "introduction: idea to impact accelerator"
}

function normalizeWorkspaceAcceleratorTitleSignal(
  value: string | null | undefined,
) {
  return normalizeModuleSignal(value)
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function isWorkspaceAcceleratorOrganizationSetupStep(
  step: Pick<
    WorkspaceAcceleratorCardStep,
    "moduleId" | "moduleSlug" | "moduleTitle" | "stepTitle"
  >,
) {
  const moduleSlug = normalizeModuleSignal(step.moduleSlug)
  const moduleId = normalizeModuleSignal(step.moduleId)
  if (
    ORGANIZATION_SETUP_MODULE_SLUGS.some(
      (signal) => moduleSlug.includes(signal) || moduleId.includes(signal),
    )
  ) {
    return true
  }

  return (
    ORGANIZATION_SETUP_MODULE_TITLES.has(
      normalizeWorkspaceAcceleratorTitleSignal(step.moduleTitle),
    ) ||
    ORGANIZATION_SETUP_MODULE_TITLES.has(
      normalizeWorkspaceAcceleratorTitleSignal(step.stepTitle),
    )
  )
}

export function resolveWorkspaceAcceleratorLessonGroupTitle(
  step: WorkspaceAcceleratorCardStep,
) {
  if (isWorkspaceAcceleratorIntroductionStep(step)) return "Introduction"
  if (isWorkspaceAcceleratorOrganizationSetupStep(step)) return "Formation"
  return normalizeLessonGroupLabel(step.groupTitle)
}

export function shouldHideWorkspaceAcceleratorFormationAddOnStep(
  step: Pick<WorkspaceAcceleratorCardStep, "moduleSlug" | "moduleTitle">,
) {
  return isElectiveAddOnModule({
    slug: step.moduleSlug,
    title: step.moduleTitle,
  })
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
    if (shouldHideWorkspaceAcceleratorFormationAddOnStep(step)) continue

    const label = resolveWorkspaceAcceleratorLessonGroupTitle(step)
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
    if (shouldHideWorkspaceAcceleratorFormationAddOnStep(step)) continue

    const groupKey = buildWorkspaceAcceleratorLessonGroupKey(
      resolveWorkspaceAcceleratorLessonGroupTitle(step),
    )
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
      groupTitle: resolveWorkspaceAcceleratorLessonGroupTitle(step),
      steps: [step],
      totalSteps: 1,
      completedStepCount: completed.has(step.id) ? 1 : 0,
      isCurrent: step.id === currentStepId,
    })
  }

  return Array.from(modules.values())
}

export function isWorkspaceAcceleratorChecklistModuleComplete({
  module,
  completedStepIds,
}: {
  module: WorkspaceAcceleratorChecklistModule
  completedStepIds: string[]
}) {
  const primaryStep = module.steps[0] ?? null
  if (
    primaryStep &&
    (primaryStep.status === "completed" || completedStepIds.includes(primaryStep.id))
  ) {
    return true
  }

  return module.totalSteps > 0 && module.completedStepCount >= module.totalSteps
}

export function calculateWorkspaceAcceleratorChecklistProgressPercent({
  modules,
  completedStepIds,
}: {
  modules: WorkspaceAcceleratorChecklistModule[]
  completedStepIds: string[]
}) {
  if (modules.length === 0) return 0

  const completedCount = modules.reduce(
    (sum, module) =>
      sum +
      (isWorkspaceAcceleratorChecklistModuleComplete({
        module,
        completedStepIds,
      })
        ? 1
        : 0),
    0,
  )

  return Math.min(100, Math.round((completedCount / modules.length) * 100))
}

export function resolveWorkspaceAcceleratorGuidedFirstModuleStepId(
  steps: WorkspaceAcceleratorCardStep[],
) {
  const visibleSteps = steps.filter(
    (step) => !shouldHideWorkspaceAcceleratorFormationAddOnStep(step),
  )
  return (
    visibleSteps.find((step) => isWorkspaceAcceleratorOrganizationSetupStep(step))
      ?.id ??
    visibleSteps[0]?.id ??
    null
  )
}
