import type { ReactNode } from "react"

export type StepperRailStatus = "not_started" | "in_progress" | "complete"

export type StepperRailStep = {
  id: string
  label: string
  status: StepperRailStatus
  roadmap?: boolean
  stepIndex?: number
  icon?: ReactNode
  description?: string
}
