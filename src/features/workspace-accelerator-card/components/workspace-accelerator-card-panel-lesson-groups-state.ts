import type { WorkspaceAcceleratorLessonGroupOption } from "../lib"

type ResolveWorkspaceAcceleratorLessonGroupFilterArgs = {
  lessonGroupOptions: WorkspaceAcceleratorLessonGroupOption[]
  currentLessonGroupKey: string
  previousCurrentLessonGroupKey: string
  previousLessonGroupFilter: string
  pendingLessonGroupSelectionKey: string | null
}

type ResolveWorkspaceAcceleratorLessonGroupFilterResult = {
  nextLessonGroupFilter: string
  nextPendingLessonGroupSelectionKey: string | null
}

function hasLessonGroupOption(
  lessonGroupOptions: WorkspaceAcceleratorLessonGroupOption[],
  key: string | null | undefined,
): key is string {
  if (!key) return false
  return lessonGroupOptions.some((option) => option.key === key)
}

export function resolveWorkspaceAcceleratorLessonGroupFilter({
  lessonGroupOptions,
  currentLessonGroupKey,
  previousCurrentLessonGroupKey,
  previousLessonGroupFilter,
  pendingLessonGroupSelectionKey,
}: ResolveWorkspaceAcceleratorLessonGroupFilterArgs): ResolveWorkspaceAcceleratorLessonGroupFilterResult {
  if (lessonGroupOptions.length === 0) {
    return {
      nextLessonGroupFilter: "",
      nextPendingLessonGroupSelectionKey: null,
    }
  }

  const fallbackLessonGroupKey = hasLessonGroupOption(
    lessonGroupOptions,
    currentLessonGroupKey,
  )
    ? currentLessonGroupKey
    : (lessonGroupOptions[0]?.key ?? "")

  if (
    hasLessonGroupOption(lessonGroupOptions, pendingLessonGroupSelectionKey)
  ) {
    return {
      nextLessonGroupFilter: pendingLessonGroupSelectionKey,
      nextPendingLessonGroupSelectionKey:
        currentLessonGroupKey === pendingLessonGroupSelectionKey
          ? null
          : pendingLessonGroupSelectionKey,
    }
  }

  if (
    !hasLessonGroupOption(lessonGroupOptions, previousLessonGroupFilter)
  ) {
    return {
      nextLessonGroupFilter: fallbackLessonGroupKey,
      nextPendingLessonGroupSelectionKey: null,
    }
  }

  const currentLessonGroupChanged =
    previousCurrentLessonGroupKey !== currentLessonGroupKey

  if (
    currentLessonGroupChanged &&
    hasLessonGroupOption(lessonGroupOptions, currentLessonGroupKey) &&
    previousLessonGroupFilter !== currentLessonGroupKey
  ) {
    return {
      nextLessonGroupFilter: currentLessonGroupKey,
      nextPendingLessonGroupSelectionKey: null,
    }
  }

  return {
    nextLessonGroupFilter: previousLessonGroupFilter,
    nextPendingLessonGroupSelectionKey: null,
  }
}
