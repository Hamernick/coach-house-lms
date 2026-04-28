import type { WorkspaceAcceleratorCardStep } from "../types"

function normalizeModuleSlug(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function getStepModuleSlug(step: WorkspaceAcceleratorCardStep) {
  return normalizeModuleSlug(step.moduleSlug) || normalizeModuleSlug(step.moduleId)
}

function isWorkspaceAcceleratorWelcomePreviewCandidate(step: WorkspaceAcceleratorCardStep) {
  return (
    step.moduleContext?.workspaceOnboarding?.view === "welcome" ||
    step.moduleId === "workspace-onboarding-welcome" ||
    step.id.startsWith("workspace-onboarding-welcome")
  )
}

function hasWorkspaceAcceleratorStepVideo(step: WorkspaceAcceleratorCardStep) {
  return typeof step.videoUrl === "string" && step.videoUrl.trim().length > 0
}

export function resolveWorkspaceAcceleratorPlaceholderVideoUrl({
  steps,
  currentStepId,
}: {
  steps: WorkspaceAcceleratorCardStep[]
  currentStepId?: string | null
}) {
  const welcomeVideoUrl =
    steps.find(
      (step) =>
        step.id !== currentStepId &&
        hasWorkspaceAcceleratorStepVideo(step) &&
        isWorkspaceAcceleratorWelcomePreviewCandidate(step),
    )?.videoUrl ?? null

  if (welcomeVideoUrl) return welcomeVideoUrl

  return (
    steps.find(
      (step) =>
        step.id !== currentStepId &&
        hasWorkspaceAcceleratorStepVideo(step),
    )?.videoUrl ?? null
  )
}

function findVideoStepByModuleSlug({
  steps,
  moduleSlug,
}: {
  steps: WorkspaceAcceleratorCardStep[]
  moduleSlug: string
}) {
  return (
    steps.find(
      (step) =>
        getStepModuleSlug(step) === moduleSlug &&
        step.stepKind === "video",
    ) ?? null
  )
}

function resolveInterModuleVideoNavigation({
  currentStep,
  steps,
}: {
  currentStep: WorkspaceAcceleratorCardStep
  steps: WorkspaceAcceleratorCardStep[]
}) {
  if (currentStep.stepKind !== "video") {
    return {
      previousStepId: null,
      nextStepId: null,
    }
  }

  const moduleSlug = getStepModuleSlug(currentStep)
  if (moduleSlug === "what-is-the-need") {
    return {
      previousStepId: null,
      nextStepId: findVideoStepByModuleSlug({
        steps,
        moduleSlug: "ai-the-need",
      })?.id ?? null,
    }
  }

  if (moduleSlug === "ai-the-need") {
    return {
      previousStepId: findVideoStepByModuleSlug({
        steps,
        moduleSlug: "what-is-the-need",
      })?.id ?? null,
      nextStepId: null,
    }
  }

  return {
    previousStepId: null,
    nextStepId: null,
  }
}

export function resolveWorkspaceAcceleratorModuleStepNavigation({
  currentModuleSteps,
  steps = currentModuleSteps,
  currentStepId,
}: {
  steps?: WorkspaceAcceleratorCardStep[]
  currentModuleSteps: WorkspaceAcceleratorCardStep[]
  currentStepId?: string | null
}) {
  if (!currentStepId || currentModuleSteps.length === 0) {
    return {
      canGoPrevious: false,
      canGoNext: false,
      previousStepId: null,
      nextStepId: null,
    }
  }

  const currentModuleStepIndex = currentModuleSteps.findIndex(
    (step) => step.id === currentStepId,
  )
  if (currentModuleStepIndex < 0) {
    return {
      canGoPrevious: false,
      canGoNext: false,
      previousStepId: null,
      nextStepId: null,
    }
  }

  const currentStep = currentModuleSteps[currentModuleStepIndex]
  if (!currentStep) {
    return {
      canGoPrevious: false,
      canGoNext: false,
      previousStepId: null,
      nextStepId: null,
    }
  }

  const interModuleVideoNavigation = resolveInterModuleVideoNavigation({
    currentStep,
    steps,
  })
  const previousStepId =
    interModuleVideoNavigation.previousStepId ??
    currentModuleSteps[currentModuleStepIndex - 1]?.id ??
    null
  const nextStepId =
    interModuleVideoNavigation.nextStepId ??
    currentModuleSteps[currentModuleStepIndex + 1]?.id ??
    null

  return {
    canGoPrevious: Boolean(previousStepId),
    canGoNext: Boolean(nextStepId),
    previousStepId,
    nextStepId,
  }
}
