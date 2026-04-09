import type { WorkspaceAcceleratorCardStep } from "../types"

const GENERIC_WORKSPACE_ACCELERATOR_STEP_TITLES = new Set([
  "assignment",
  "class",
  "complete",
  "deck",
  "lesson",
  "resources",
  "video",
])

export function resolveWorkspaceAcceleratorDisplayStepTitle({
  moduleTitle,
  stepTitle,
}: {
  moduleTitle: string
  stepTitle: string
}) {
  const normalizedModuleTitle = moduleTitle.trim()
  const normalizedStepTitle = stepTitle.trim()

  if (
    normalizedModuleTitle &&
    GENERIC_WORKSPACE_ACCELERATOR_STEP_TITLES.has(
      normalizedStepTitle.toLowerCase(),
    )
  ) {
    return normalizedModuleTitle
  }

  if (normalizedStepTitle) return normalizedStepTitle
  if (normalizedModuleTitle) return normalizedModuleTitle
  return ""
}

export function shouldShowWorkspaceAcceleratorModuleTitle({
  moduleTitle,
  stepTitle,
}: {
  moduleTitle: string
  stepTitle: string
}) {
  const normalizedModuleTitle = moduleTitle.trim()
  const normalizedStepTitle = stepTitle.trim()

  if (!normalizedModuleTitle) {
    return false
  }

  return (
    normalizedStepTitle.length === 0 ||
    normalizedModuleTitle.localeCompare(normalizedStepTitle, undefined, {
      sensitivity: "accent",
    }) !== 0
  )
}

export function resolveWorkspaceAcceleratorStepVideoUrl({
  step,
  placeholderVideoUrl,
}: {
  step: WorkspaceAcceleratorCardStep
  placeholderVideoUrl?: string | null
}) {
  const workspaceOnboardingView =
    step.moduleContext?.workspaceOnboarding?.view ?? null

  if (step.stepKind === "video") {
    return step.videoUrl
  }

  if (workspaceOnboardingView === "welcome") {
    return step.videoUrl ?? placeholderVideoUrl ?? null
  }

  return null
}
