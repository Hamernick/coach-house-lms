import type { ReactNode } from "react"

import type { OnboardingDialogProps } from "@/components/onboarding/onboarding-dialog"
import type { SidebarClass } from "@/lib/academy"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"

export type AppShellProps = {
  children: ReactNode
  breadcrumbs?: ReactNode
  sidebarTree: SidebarClass[]
  user?: {
    name: string | null
    title?: string | null
    email: string | null
    avatar?: string | null
  } | null
  isAdmin: boolean
  isTester?: boolean
  showOrgAdmin?: boolean
  canAccessOrgAdmin?: boolean
  showLiveBadges?: boolean
  acceleratorProgress?: number | null
  showAccelerator?: boolean
  hasActiveSubscription?: boolean
  hasAcceleratorAccess?: boolean
  hasElectiveAccess?: boolean
  ownedElectiveModuleSlugs?: string[]
  currentPlanTier?: PricingPlanTier
  organizationName?: string | null
  tutorialWelcome?: { platform: boolean; accelerator: boolean }
  onboardingProps?: OnboardingDialogProps & { enabled: boolean }
  onboardingLocked?: boolean
  context?: "platform" | "accelerator" | "public" | "admin"
  formationStatus?: string | null
}
