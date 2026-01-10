import type { Database } from "@/lib/supabase"

export type ModuleResourceProvider =
  | "youtube"
  | "google-drive"
  | "dropbox"
  | "loom"
  | "vimeo"
  | "notion"
  | "figma"
  | "generic"

export type ModuleResource = {
  label: string
  url: string
  provider: ModuleResourceProvider
}

export type BudgetTableRow = {
  category: string
  description: string
  costType: string
  unit: string
  units: string
  costPerUnit: string
  totalCost: string
}

export type ModuleAssignmentField = {
  name: string
  label: string
  type:
    | "short_text"
    | "long_text"
    | "select"
    | "multi_select"
    | "slider"
    | "subtitle"
    | "budget_table"
    | "custom_program"
  required: boolean
  placeholder?: string
  description?: string
  options?: string[]
  min?: number | null
  max?: number | null
  step?: number | null
  programTemplate?: string
  orgKey?: string
  assistContext?: string
  rows?: BudgetTableRow[]
}

export type ModuleAssignment = {
  fields: ModuleAssignmentField[]
  completeOnSubmit: boolean
}

export type ModuleAssignmentSubmission = {
  answers: Record<string, unknown>
  status: "submitted" | "accepted" | "revise"
  updatedAt: string | null
}

export type ModuleRecord = {
  id: string
  idx: number
  slug: string
  title: string
  description: string | null
  videoUrl: string | null
  contentMd: string | null
  durationMinutes: number | null
  published: boolean
  hasDeck: boolean
  resources: ModuleResource[]
  assignment: ModuleAssignment | null
  assignmentSubmission: ModuleAssignmentSubmission | null
}

export type ModuleProgressStatus = "not_started" | "in_progress" | "completed"

export type ClassModuleResult = {
  classId: string
  classTitle: string
  classDescription: string | null
  classSubtitle?: string | null
  classPublished: boolean
  classVideoUrl?: string | null
  classResources?: ModuleResource[]
  modules: ModuleRecord[]
  progressMap: Record<string, ModuleProgressStatus>
}

export type ModuleProgressInsert = Database["public"]["Tables"]["module_progress"]["Insert"]
