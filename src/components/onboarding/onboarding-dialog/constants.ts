import type { ComponentType } from "react"
import CircleDollarSignIcon from "lucide-react/dist/esm/icons/circle-dollar-sign"
import HammerIcon from "lucide-react/dist/esm/icons/hammer"
import SearchIcon from "lucide-react/dist/esm/icons/search"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import { FORMATION_STATUS_OPTIONS } from "@/lib/organization/formation-status"
import type { FormationStatus, IntentFocus, Step } from "./types"

export const FORMATION_OPTIONS: Array<{
  value: FormationStatus
  label: string
  description: string
}> = FORMATION_STATUS_OPTIONS

export const BUILDER_STEPS: Step[] = [
  {
    id: "intent",
    title: "Choose your onboarding path",
    description:
      "Choose the path that matches how you want to use Coach House.",
  },
  {
    id: "pricing",
    title: "Unlock the builder workspace",
    description:
      "Choose a builder plan before you set up your organization workspace.",
  },
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
  {
    id: "community",
    title: "Join our communities",
    description:
      "Optional: hop into Discord or WhatsApp now so you can ask questions as you set things up.",
  },
]

export const MEMBER_STEPS: Step[] = [
  {
    id: "intent",
    title: "Choose your onboarding path",
    description:
      "Choose the path that matches how you want to use Coach House.",
  },
  {
    id: "account",
    title: "Set up your account",
    description: "A few details so we can personalize your internal member view.",
  },
  {
    id: "community",
    title: "Join our communities",
    description:
      "Optional: hop into Discord or WhatsApp now so you can ask questions as you get started.",
  },
]

export const STEPS = BUILDER_STEPS

export function resolveOnboardingSteps(intentFocus: IntentFocus | "") {
  return intentFocus === "find" || intentFocus === "fund" || intentFocus === "support"
    ? MEMBER_STEPS
    : BUILDER_STEPS
}

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
    label: "Build a nonprofit",
    description: "Set up your organization, roadmap, and operating foundation.",
    available: true,
    icon: HammerIcon,
  },
  {
    value: "find",
    label: "Find nonprofits",
    description: "Discover organizations, initiatives, and partners.",
    available: true,
    icon: SearchIcon,
  },
  {
    value: "fund",
    label: "Fund nonprofits",
    description: "Support organizations and track funded outcomes.",
    available: true,
    icon: CircleDollarSignIcon,
  },
  {
    value: "support",
    label: "Support teams",
    description: "Help operators and teams execute mission-critical work.",
    available: true,
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
  "roadmap",
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
