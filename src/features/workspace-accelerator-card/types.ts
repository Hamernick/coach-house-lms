import type {
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
  ModuleResource,
} from "@/lib/modules"
import type { AcceleratorReadinessSummary } from "@/lib/accelerator/readiness"

export const WORKSPACE_ACCELERATOR_STEP_STATUS = ["not_started", "in_progress", "completed"] as const
export type WorkspaceAcceleratorStepStatus = (typeof WORKSPACE_ACCELERATOR_STEP_STATUS)[number]

export type WorkspaceAcceleratorCardSize = "sm" | "md" | "lg"
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
  moduleSlug?: string | null
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
  groupOrder?: number | null
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
  slug?: string | null
  title: string
  description: string | null
  href: string
  status: WorkspaceAcceleratorStepStatus
  groupTitle: string
  groupOrder?: number | null
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
  readinessSummary?: AcceleratorReadinessSummary | null
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

export type WorkspaceAcceleratorLessonGroupSummary = {
  key: string
  label: string
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
  selectedLessonGroupKey?: string | null
  selectedLessonGroupLabel?: string | null
  lessonGroupOptions?: WorkspaceAcceleratorLessonGroupSummary[]
  firstVisibleChecklistStepId?: string | null
  isModuleViewerOpen?: boolean
  openModuleId?: string | null
  readinessSummary?: AcceleratorReadinessSummary | null
}

export type WorkspaceAcceleratorTutorialFocus =
  | "nav"
  | "picker"
  | "progress"
  | "first-module"
  | "close-module"

export type WorkspaceAcceleratorTutorialCallout = {
  focus: WorkspaceAcceleratorTutorialFocus
  title: string
  instruction: string
}

export type WorkspaceAcceleratorCardRuntimeActions = {
  goPrevious: () => void
  goNext: () => void
  markCurrentStepComplete: () => void
  selectLessonGroup: (nextLessonGroupKey: string) => void
}
