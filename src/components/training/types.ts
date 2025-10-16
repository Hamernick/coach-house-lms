import type {
  ModuleAssignment,
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
  ModuleResource,
  ModuleResourceProvider,
} from "@/lib/modules"

export type {
  ModuleResource,
  ModuleResourceProvider,
  ModuleAssignment,
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
}

export type Module = {
  id: string
  title: string
  subtitle?: string
  idx?: number
  status?: "not_started" | "in_progress" | "completed"
  locked?: boolean
  progressPercent?: number
  durationMinutes?: number | null
  lessonCount?: number | null
  videoUrl?: string | null
  contentMd?: string | null
  resources?: ModuleResource[]
  assignment?: ModuleAssignment | null
  assignmentSubmission?: ModuleAssignmentSubmission | null
}

export type ClassDef = {
  id: string
  title: string
  blurb?: string
  description?: string
  slug?: string
  modules: Module[]
}
