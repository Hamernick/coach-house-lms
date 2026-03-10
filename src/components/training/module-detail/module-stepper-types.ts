import type { RoadmapSectionStatus } from "@/lib/roadmap"

import type { ModuleAssignmentField, ModuleResource } from "../types"
import type { AssignmentValues } from "./utils"

export type ModuleStepperStep =
  | { id: string; label: string; type: "video"; stepIndex?: number }
  | { id: string; label: string; type: "notes"; stepIndex?: number }
  | { id: string; label: string; type: "resources"; stepIndex?: number }
  | {
      id: string
      label: string
      type: "assignment"
      sectionId: string
      description?: string
      roadmap?: boolean
      assignmentIndex?: number
      stepIndex?: number
    }
  | { id: string; label: string; type: "complete"; stepIndex?: number }

export type ModuleStepperStepStatus = "not_started" | "in_progress" | "complete"

export type ModuleStepperProps = {
  moduleId: string
  moduleTitle: string
  moduleSubtitle?: string | null
  classTitle: string
  embedUrl: string | null
  videoUrl: string | null
  fallbackUrl: string | null
  hasDeck: boolean
  lessonNotesContent?: string | null
  resources?: ModuleResource[]
  assignmentFields: ModuleAssignmentField[]
  initialValues: AssignmentValues
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  pending: boolean
  onSubmit: (values: AssignmentValues, options?: { silent?: boolean }) => void | Promise<unknown>
  statusLabel?: string | null
  statusVariant?: "default" | "secondary" | "destructive" | "outline"
  statusNote?: string | null
  helperText?: string | null
  errorMessage?: string | null
  updatedAt?: string | null
  completeOnSubmit: boolean
  nextHref?: string | null
  breakHref?: string
  nextLocked?: boolean
  moduleCount: number
  completedModuleCount: number
  isCurrentModuleCompleted: boolean
  stepperPlacement?: "header" | "body"
  showModuleHeading?: boolean
}
