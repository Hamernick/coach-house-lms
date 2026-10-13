import CircleDollarSign from "lucide-react/dist/esm/icons/circle-dollar-sign"
import LogIn from "lucide-react/dist/esm/icons/log-in"
import MapIcon from "lucide-react/dist/esm/icons/map"
import UserPlus from "lucide-react/dist/esm/icons/user-plus"
import type { ComponentType } from "react"

import {
  LEGACY_HOME_SECTION_NAV,
  type LegacyHomeSectionId,
} from "@/components/public/legacy-home-sections"

export type CanvasSectionId = LegacyHomeSectionId | "pricing" | "login" | "signup" | "find"

type CanvasNavItem = {
  id: CanvasSectionId
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  kind: "home"
}

const CANVAS_LABEL_OVERRIDES: Partial<Record<LegacyHomeSectionId, string>> = {
  hero: "Welcome",
  platform: "Platform",
  process: "Journey",
}

const HIDDEN_HOME_SECTIONS = new Set<LegacyHomeSectionId>(["impact", "process", "news", "team", "cta"])

export const CANVAS_NAV: CanvasNavItem[] = [
  ...LEGACY_HOME_SECTION_NAV.filter((item) => !HIDDEN_HOME_SECTIONS.has(item.id)).map((item) => ({
    ...item,
    label: CANVAS_LABEL_OVERRIDES[item.id] ?? item.label,
    kind: "home" as const,
  })),
  { id: "find", label: "Find", icon: MapIcon, kind: "home" },
  { id: "pricing", label: "Pricing", icon: CircleDollarSign, kind: "home" },
  { id: "login", label: "Sign in", icon: LogIn, kind: "home" },
  { id: "signup", label: "Sign up", icon: UserPlus, kind: "home" },
]

const HIDDEN_CANVAS_SECTION_IDS = new Set<CanvasSectionId>(["find", "login", "signup"])
export const VISIBLE_CANVAS_NAV = CANVAS_NAV.filter((item) => !HIDDEN_CANVAS_SECTION_IDS.has(item.id))
const HIDDEN_SIDEBAR_NAV_IDS = new Set<CanvasSectionId>()
export const SIDEBAR_CANVAS_NAV = VISIBLE_CANVAS_NAV.filter((item) => !HIDDEN_SIDEBAR_NAV_IDS.has(item.id))

const HOME_SECTION_IDS = new Set<LegacyHomeSectionId>(LEGACY_HOME_SECTION_NAV.map((item) => item.id))

export const ABOUT_LINK_HREF = "https://www.coachhousesolutions.org/"
export const WHEEL_INTENT_THRESHOLD = 90
export const WHEEL_INTENT_RESET_MS = 180
export const SECTION_WHEEL_LOCK_MS = 750
const OPEN_DIALOG_SELECTOR = "[data-slot='dialog-content'][data-state='open']"
const CANVAS_SECTION_ALIASES: Partial<Record<string, CanvasSectionId>> = {
  offerings: "platform",
  impact: "hero",
}

export function isHomeSectionId(sectionId: CanvasSectionId): sectionId is LegacyHomeSectionId {
  return HOME_SECTION_IDS.has(sectionId as LegacyHomeSectionId)
}

export function hasOpenDialog(): boolean {
  if (typeof document === "undefined") return false
  return Boolean(document.querySelector(OPEN_DIALOG_SELECTOR))
}

export function parseInitialSection(raw?: string): CanvasSectionId {
  const aliasMatch = raw ? CANVAS_SECTION_ALIASES[raw] : null
  if (aliasMatch) return aliasMatch

  const match = CANVAS_NAV.find((item) => item.id === raw)
  return match?.id ?? "hero"
}

export function resolveSectionAlias(raw?: string): CanvasSectionId | null {
  if (!raw) return null
  return CANVAS_SECTION_ALIASES[raw] ?? null
}
