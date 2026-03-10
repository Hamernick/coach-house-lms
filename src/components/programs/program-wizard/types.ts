import type { ReactNode } from "react"
import type { ProgramWizardFormState } from "./schema"

export type ProgramRecord = {
  id: string
  title: string | null
  subtitle?: string | null
  description?: string | null
  location?: string | null
  location_type?: "in_person" | "online" | null
  location_url?: string | null
  image_url?: string | null
  duration_label?: string | null
  features?: string[] | null
  status_label?: string | null
  goal_cents?: number | null
  raised_cents?: number | null
  is_public?: boolean | null
  start_date?: string | null
  end_date?: string | null
  cta_label?: string | null
  cta_url?: string | null
  wizard_snapshot?: Record<string, unknown> | null
}

export type ProgramWizardProps = {
  mode?: "create" | "edit"
  program?: (Partial<ProgramRecord> & { id: string }) | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: ReactNode
}

export type StepMeta = {
  title: string
  helper: string
}

export type ProgramWizardFieldErrors = Record<string, string>

export type ProgramWizardUpdate = (
  patch: Partial<ProgramWizardFormState>,
) => void
