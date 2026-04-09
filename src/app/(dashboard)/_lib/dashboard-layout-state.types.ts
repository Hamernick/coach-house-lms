import type { SidebarClass } from "@/lib/academy"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import type { OnboardingFlowDefaults } from "@/components/onboarding/onboarding-dialog/types"
import type { MemberWorkspaceHeaderState } from "@/features/member-workspace"

export type DashboardLayoutState = {
  userPresent: boolean
  sidebarTree: SidebarClass[]
  user: {
    name: string | null
    title: string | null
    email: string | null
    avatar: string | null
  }
  isAdmin: boolean
  isTester: boolean
  showOrgAdmin: boolean
  canAccessOrgAdmin: boolean
  acceleratorProgress: number | null
  showAccelerator: boolean
  showLiveBadges: boolean
  hasActiveSubscription: boolean
  hasAcceleratorAccess: boolean
  hasElectiveAccess: boolean
  ownedElectiveModuleSlugs: string[]
  currentPlanTier: PricingPlanTier
  organizationName: string | null
  tutorialWelcome: {
    platform: boolean
    accelerator: boolean
  }
  onboardingDefaults: OnboardingFlowDefaults & {
    open: boolean
  }
  onboardingLocked: boolean
  onboardingIntentFocus: "build" | "find" | "fund" | "support" | null
  formationStatus: string | null
  memberWorkspaceHeader: MemberWorkspaceHeaderState | null
}

export const EMPTY_STATE: DashboardLayoutState = {
  userPresent: false,
  sidebarTree: [],
  user: {
    name: null,
    title: null,
    email: null,
    avatar: null,
  },
  isAdmin: false,
  isTester: false,
  showOrgAdmin: false,
  canAccessOrgAdmin: false,
  acceleratorProgress: null,
  showAccelerator: false,
  showLiveBadges: false,
  hasActiveSubscription: false,
  hasAcceleratorAccess: false,
  hasElectiveAccess: false,
  ownedElectiveModuleSlugs: [],
  currentPlanTier: "free",
  organizationName: null,
  tutorialWelcome: {
    platform: false,
    accelerator: false,
  },
  onboardingDefaults: {
    open: false,
  },
  onboardingLocked: false,
  onboardingIntentFocus: null,
  formationStatus: null,
  memberWorkspaceHeader: null,
}
