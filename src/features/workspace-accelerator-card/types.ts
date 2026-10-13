export const WORKSPACE_ACCELERATOR_STEP_STATUS = ["not_started", "in_progress", "completed"] as const
export type WorkspaceAcceleratorStepStatus = (typeof WORKSPACE_ACCELERATOR_STEP_STATUS)[number]

export type WorkspaceAcceleratorCardSize = "sm" | "md"
export type WorkspaceAcceleratorCardMode = "setup" | "tasks"
export const WORKSPACE_ACCELERATOR_STEP_KIND = ["lesson", "video", "resources", "assignment", "deck"] as const
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
}

export type WorkspaceAcceleratorTaskStatus = "todo" | "in_progress" | "done"

export type WorkspaceAcceleratorTask = {
  id: string
  title: string
  status: WorkspaceAcceleratorTaskStatus
  priority?: "low" | "normal" | "high" | "critical" | null
  dueAt?: string | null
}

export type WorkspaceAcceleratorCardInput = {
  steps: WorkspaceAcceleratorCardStep[]
  size: WorkspaceAcceleratorCardSize
  mode?: WorkspaceAcceleratorCardMode
  tasks?: WorkspaceAcceleratorTask[]
  allowTaskUpdates?: boolean
  allowAutoResize?: boolean
  storageKey?: string
  onSizeChange?: (nextSize: WorkspaceAcceleratorCardSize) => void
  onTaskStatusToggle?: (taskId: string) => void
}
