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

  for (const step of steps) {
    const label = normalizeLessonGroupLabel(step.groupTitle)
    const key = buildWorkspaceAcceleratorLessonGroupKey(label)
    const existing = groups.get(key)

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
  }

  return Array.from(groups.values())
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
