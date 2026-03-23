import type { WorkspaceAcceleratorCardStep } from "../types"

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
