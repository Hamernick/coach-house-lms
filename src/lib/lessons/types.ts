// Shared lesson wizard types

export type ProviderSlug =
  | "youtube"
  | "google-drive"
  | "dropbox"
  | "loom"
  | "vimeo"
  | "notion"
  | "figma"
  | "generic"

export type FormFieldType =
  | "short_text"
  | "long_text"
  | "select"
  | "multi_select"
  | "slider"
  | "subtitle"
  | "budget_table"
  | "custom_program"

export type BudgetTableOption = {
  category: string
  description?: string
  costType?: string
  unit?: string
}

export type LessonLink = {
  id: string
  title: string
  url: string
  providerSlug: ProviderSlug
}

export type Resource = {
  id: string
  title: string
  url: string
  providerSlug: ProviderSlug
}

export type FormField = {
  id: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  description?: string
  options?: Array<string | BudgetTableOption>
  min?: number | null
  max?: number | null
  step?: number | null
  programTemplate?: string
}

export type ModuleDefinition = {
  id: string
  moduleId?: string
  title: string
  subtitle: string
  body: string
  videoUrl: string
  resources: Resource[]
  formFields: FormField[]
}

export interface LessonWizardPayload {
  title: string
  subtitle: string
  body: string
  videoUrl: string
  links: Array<{ title: string; url: string; provider?: ProviderSlug }>
  modules: Array<{
    moduleId?: string
    title: string
    subtitle: string
    body: string
    videoUrl: string
    resources: Array<{ title: string; url?: string | null; provider?: ProviderSlug | null }>
    formFields: Array<{
      label: string
      type: FormFieldType
      required: boolean
      placeholder?: string | null
      description?: string | null
      options?: Array<string | BudgetTableOption> | null
      min?: number | null
      max?: number | null
      step?: number | null
      programTemplate?: string | null
    }>
  }>
}

export type SliderRange = { min: number; max: number; step: number }
