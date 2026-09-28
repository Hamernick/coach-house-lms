import type { ComponentType, RefObject } from "react"

export type MobileNavigationItem = {
  id: string
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  href?: string
  onSelect?: () => void
  active?: boolean
  expanded?: boolean
  controls?: string
  buttonRef?: RefObject<HTMLButtonElement | null>
}
