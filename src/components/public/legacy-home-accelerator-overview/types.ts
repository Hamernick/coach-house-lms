import type { ReactNode } from "react"

export type AcceleratorPreviewStepState = "complete" | "active" | "pending"
export type AcceleratorPreviewModuleStatus =
  | "not_started"
  | "in_progress"
  | "completed"

export type AcceleratorPreviewModule = {
  index: number
  title: string
  description: string
  status: AcceleratorPreviewModuleStatus
  icon: ReactNode
  variant?: "default" | "coaching"
}

export type AcceleratorPreviewSlide = {
  id: string
  tab: string
  title: string
  subtitle: string
  modules: AcceleratorPreviewModule[]
  steps: Array<{ label: string; state: AcceleratorPreviewStepState }>
}

export type AcceleratorPreviewContext = {
  label: string
  detail: string
  points: [string, string]
}

export type RoadmapPreviewItem = {
  label: string
  state: "complete" | "in_progress" | "pending"
}
