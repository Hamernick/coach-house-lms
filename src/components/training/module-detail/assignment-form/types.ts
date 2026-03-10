import type { RoadmapSectionStatus } from "@/lib/roadmap"
import type { AssignmentValues } from "../utils"

export type AssignmentFieldRenderContext = {
  values: AssignmentValues
  pending: boolean
  autoSaving: boolean
  isStepper: boolean
  roadmapStatusBySectionId?: Record<string, RoadmapSectionStatus>
  isAcceleratorShell: boolean
  richTextMinHeight: number
  updateValue: (name: string, value: AssignmentValues[string]) => void
}
