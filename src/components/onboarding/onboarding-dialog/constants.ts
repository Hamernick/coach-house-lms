import type { ComponentType } from "react"
import CircleDollarSignIcon from "lucide-react/dist/esm/icons/circle-dollar-sign"
import HammerIcon from "lucide-react/dist/esm/icons/hammer"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import type { FormationStatus, IntentFocus, Step } from "./types"

export const FORMATION_OPTIONS: Array<{
  value: FormationStatus
  label: string
  description: string
}> = [
  {
    value: "pre_501c3",
    label: "Pre-501(c)(3)",
    description: "Just getting started.",
  },
  {
    value: "in_progress",
    label: "In progress",
    description: "Formation is underway.",
  },
  {
    value: "approved",
    label: "Approved",
    description: "We have a determination letter.",
  },
]

export const STEPS: Step[] = [
  {
    id: "org",
    title: "Create your organization",
    description:
      "This is your nonprofit’s workspace. You can change this later.",
  },
  {
    id: "account",
    title: "Set up your account",
    description: "A few details so we can personalize your workspace.",
  },
]

export type IntentOption = {
  value: IntentFocus
  label: string
  description: string
  available: boolean
  icon: ComponentType<{ className?: string }>
}

export const INTENT_OPTIONS: IntentOption[] = [
  {
    value: "build",
    label: "Build nonprofits",
    description: "Set up your organization, roadmap, and operating foundation.",
    available: true,
    icon: HammerIcon,
  },
  {
    value: "find",
    label: "Find nonprofits",
    description: "Discover organizations, initiatives, and partners.",
    available: false,
    icon: SearchIcon,
  },
  {
    value: "fund",
    label: "Fund nonprofits",
    description: "Support organizations and track funded outcomes.",
    available: false,
    icon: CircleDollarSignIcon,
  },
  {
    value: "support",
    label: "Support teams",
    description: "Help operators and teams execute mission-critical work.",
    available: false,
    icon: UsersIcon,
  },
]

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "pricing",
  "billing",
  "class",
  "dashboard",
  "people",
  "organization",
  "my-organization",
  "_next",
  "public",
  "favicon",
  "assets",
])

export const DRAFT_VALUE_KEYS = [
  "intentFocus",
  "roleInterest",
  "orgName",
  "orgSlug",
  "firstName",
  "lastName",
  "phone",
  "publicEmail",
  "title",
  "linkedin",
] as const

export const DRAFT_FLAG_KEYS = ["optInUpdates", "newsletterOptIn"] as const
