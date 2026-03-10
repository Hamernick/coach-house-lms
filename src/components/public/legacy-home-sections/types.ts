import { type ComponentType } from "react"

export type LegacyHomeSectionId = "hero" | "impact" | "platform" | "accelerator" | "process" | "news" | "team" | "cta"

export type LegacyHomeSectionNavItem = {
  id: LegacyHomeSectionId
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

export type LegacyHomeSectionProps = {
  withinCanvas?: boolean
}
