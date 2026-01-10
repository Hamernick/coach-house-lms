import type {
  ModuleAssignment,
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
  ModuleResource,
  ModuleResourceProvider,
  BudgetTableRow,
} from "@/lib/modules"

export type {
  ModuleResource,
  ModuleResourceProvider,
  ModuleAssignment,
  ModuleAssignmentField,
  ModuleAssignmentSubmission,
  BudgetTableRow,
}

export type Module = {
  id: string
  title: string
  subtitle?: string
  idx?: number
  published?: boolean
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
  hasDeck?: boolean
}

export type ClassDef = {
  id: string
  title: string
  blurb?: string
  description?: string
  slug?: string
  published?: boolean
  resources?: ModuleResource[]
  videoUrl?: string | null
  modules: Module[]
}
