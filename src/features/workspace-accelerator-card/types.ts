import type {
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
  ModuleResource,
} from "@/lib/modules"

export const WORKSPACE_ACCELERATOR_STEP_STATUS = ["not_started", "in_progress", "completed"] as const
export type WorkspaceAcceleratorStepStatus = (typeof WORKSPACE_ACCELERATOR_STEP_STATUS)[number]

export type WorkspaceAcceleratorCardSize = "sm" | "md"
export const WORKSPACE_ACCELERATOR_STEP_KIND = ["lesson", "video", "resources", "assignment", "deck", "complete"] as const
export type WorkspaceAcceleratorStepKind = (typeof WORKSPACE_ACCELERATOR_STEP_KIND)[number]

export type WorkspaceAcceleratorCardStepResource = {
  id: string
  title: string
  url: string
  kind: string
}

export type WorkspaceAcceleratorCardStep = {
  id: string
  moduleId: string
  moduleTitle: string
  stepKind: WorkspaceAcceleratorStepKind
  stepTitle: string
  stepDescription: string | null
  href: string
  status: WorkspaceAcceleratorStepStatus
  stepSequenceIndex: number
  stepSequenceTotal: number
  moduleSequenceIndex: number
  moduleSequenceTotal: number
  groupTitle: string
  videoUrl: string | null
  durationMinutes: number | null
  resources: WorkspaceAcceleratorCardStepResource[]
  hasAssignment: boolean
  hasDeck: boolean
  moduleContext?: WorkspaceAcceleratorModuleContext | null
}

export type WorkspaceAcceleratorModuleContext = {
  classTitle: string
  lessonNotesContent: string | null
  moduleResources: ModuleResource[]
  assignmentFields: ModuleAssignmentField[]
  assignmentSubmission: ModuleAssignmentSubmission | null
  completeOnSubmit: boolean
}

export type WorkspaceAcceleratorTimelineModuleSeed = {
  id: string
  title: string
  description: string | null
  href: string
  status: WorkspaceAcceleratorStepStatus
  groupTitle: string
  videoUrl: string | null
  durationMinutes: number | null
  resources: WorkspaceAcceleratorCardStepResource[]
  hasAssignment: boolean
  hasDeck: boolean
  moduleContext?: WorkspaceAcceleratorModuleContext | null
}

export type WorkspaceAcceleratorCardInput = {
  steps: WorkspaceAcceleratorCardStep[]
  size: WorkspaceAcceleratorCardSize
  linkHrefOverride?: string | null
  allowAutoResize?: boolean
  storageKey?: string
  onSizeChange?: (nextSize: WorkspaceAcceleratorCardSize) => void
  initialCurrentStepId?: string | null
  initialCompletedStepIds?: string[]
  onProgressChange?: (state: WorkspaceAcceleratorCardProgressState) => void
}

export type WorkspaceAcceleratorCardProgressState = {
  currentStepId: string | null
  completedStepIds: string[]
}

export type WorkspaceAcceleratorCardRuntimeSnapshot = {
  currentStep: WorkspaceAcceleratorCardStep | null
  currentIndex: number
  totalSteps: number
  canGoPrevious: boolean
  canGoNext: boolean
  currentModuleStepIndex: number
  currentModuleStepTotal: number
  currentModuleCompletedCount: number
  isCurrentModuleCompleted: boolean
  isCurrentStepCompleted: boolean
}

export type WorkspaceAcceleratorCardRuntimeActions = {
  goPrevious: () => void
  goNext: () => void
  markCurrentStepComplete: () => void
}
