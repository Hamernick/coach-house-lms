import { cache } from "react"

import { fetchSidebarTree, type SidebarClass } from "@/lib/academy"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import { resolveOptionalAuthenticatedAppContext } from "@/lib/auth/request-context"
import { resolvePricingPlanTier, type PricingPlanTier } from "@/lib/billing/plan-tier"
import { loadAccessibleOrganizations } from "@/features/member-workspace"
import { publicSharingEnabled } from "@/lib/feature-flags"
import type { Json } from "@/lib/supabase"
import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import {
  EMPTY_STATE,
  type DashboardLayoutState,
} from "./dashboard-layout-state.types"

export type { DashboardLayoutState } from "./dashboard-layout-state.types"

const resolveDashboardLayoutStateCached = cache(async (): Promise<DashboardLayoutState> => {
  const requestContext = await resolveOptionalAuthenticatedAppContext()

  if (!requestContext) {
    return EMPTY_STATE
  }

  const { supabase, user, profileAudience, activeOrg } = requestContext

  let displayName: string | null = null
  let email: string | null = user.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let isTester = false
  let needsOnboarding = false
  let acceleratorProgress: number | null = null
  let showLiveBadges = false
  let showAccelerator = false
  let tutorialWelcomePlatform = false
  let tutorialWelcomeAccelerator = false
  let hasActiveSubscription = false
  let hasAcceleratorAccess = false
  let hasElectiveAccess = false
  let ownedElectiveModuleSlugs: string[] = []
  let showOrgAdmin = false
  let canAccessOrgAdmin = false
  let formationStatus: string | null = null
  let organizationName: string | null = null
  let currentPlanTier: PricingPlanTier = "free"
  let memberWorkspaceHeader: DashboardLayoutState["memberWorkspaceHeader"] = null

  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const metadataFirstName = typeof userMeta?.first_name === "string" ? userMeta.first_name.trim() : ""
  const metadataLastName = typeof userMeta?.last_name === "string" ? userMeta.last_name.trim() : ""
  const metadataFullName = [metadataFirstName, metadataLastName].filter(Boolean).join(" ").trim()
  const metadataAvatarUrl =
    (typeof userMeta?.avatar_url === "string" && userMeta.avatar_url.trim().length > 0
      ? userMeta.avatar_url
      : null) ??
    (typeof userMeta?.picture === "string" && userMeta.picture.trim().length > 0 ? userMeta.picture : null) ??
    (typeof userMeta?.avatar === "string" && userMeta.avatar.trim().length > 0 ? userMeta.avatar : null)
  const completed = Boolean(userMeta?.onboarding_completed)
  const metadataIntentFocus = typeof userMeta?.onboarding_intent_focus === "string" ? userMeta.onboarding_intent_focus : null
  const metadataRoleInterest = typeof userMeta?.onboarding_role_interest === "string" ? userMeta.onboarding_role_interest : null
  const metadataPhone = typeof userMeta?.phone === "string" ? userMeta.phone.trim() : ""
  const metadataOptInUpdates =
    typeof userMeta?.marketing_opt_in === "boolean" ? userMeta.marketing_opt_in : null
  const metadataNewsletterOptIn =
    typeof userMeta?.newsletter_opt_in === "boolean" ? userMeta.newsletter_opt_in : null

  displayName =
    profileAudience.fullName ??
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
    (metadataFullName || null)
  isAdmin = profileAudience.isAdmin
  isTester = profileAudience.isTester

  if (!email && typeof user.user_metadata?.email === "string") {
    email = user.user_metadata.email as string
  }

  avatar =
    profileAudience.avatarUrl ??
    metadataAvatarUrl

  needsOnboarding = !isAdmin && !completed

  const { orgId, role } = activeOrg
  showOrgAdmin = role === "owner" || role === "admin"
  if (isAdmin) {
    showOrgAdmin = true
  }
  if (orgId !== user.id) {
    needsOnboarding = false
  }

  const accessibleOrganizationsPromise =
    metadataIntentFocus !== "fund"
      ? loadAccessibleOrganizations(supabase, user.id)
      : Promise.resolve([])

  const [accessibleOrganizations, orgRowResult, entitlements] = await Promise.all([
    accessibleOrganizationsPromise,
    supabase
      .from("organizations")
      .select("profile, public_slug, is_public, is_public_roadmap")
      .eq("user_id", orgId)
      .maybeSingle<{
        profile: Json | null
        public_slug: string | null
        is_public: boolean | null
        is_public_roadmap: boolean | null
      }>(),
    fetchLearningEntitlements({
      supabase,
      userId: user.id,
      orgUserId: orgId,
      isAdmin,
    }),
  ])

  if (metadataIntentFocus !== "fund") {
    const resolvedActiveOrganization =
      accessibleOrganizations.find((organization) => organization.orgId === orgId) ??
      accessibleOrganizations[0] ??
      null

    if (resolvedActiveOrganization) {
      memberWorkspaceHeader = {
        activeOrganization: resolvedActiveOrganization,
        accessibleOrganizations,
      }
    }
  }

  const orgProfile = (orgRowResult.data?.profile as Record<string, unknown> | null) ?? null
  const orgPeople = Array.isArray(orgProfile?.org_people)
    ? (orgProfile.org_people as Array<Record<string, unknown>>)
    : []
  const orgSlug = typeof orgRowResult.data?.public_slug === "string" ? orgRowResult.data.public_slug.trim() : ""
  const fs = typeof orgProfile?.formationStatus === "string" ? orgProfile.formationStatus : null
  formationStatus = fs
  const orgName = typeof orgProfile?.name === "string" ? orgProfile.name.trim() : ""
  organizationName = orgName.length > 0 ? orgName : null
  const onboardingDefaults = buildOnboardingFlowDefaults({
    userId: user.id,
    email,
    displayName,
    avatarUrl: avatar,
    userMetadata: userMeta,
    orgProfile,
    orgSlug,
  })

  if (publicSharingEnabled) {
    const hasSlug = Boolean(
      orgRowResult.data?.public_slug && orgRowResult.data.public_slug.trim().length > 0,
    )
    showLiveBadges =
      hasSlug &&
      Boolean(orgRowResult.data?.is_public) &&
      Boolean(orgRowResult.data?.is_public_roadmap)
  }

  hasActiveSubscription = entitlements.hasActiveSubscription
  hasAcceleratorAccess = entitlements.hasAcceleratorAccess
  hasElectiveAccess = entitlements.hasElectiveAccess
  ownedElectiveModuleSlugs = entitlements.ownedElectiveModuleSlugs
  showAccelerator = hasAcceleratorAccess || hasElectiveAccess
  canAccessOrgAdmin = showOrgAdmin && (isAdmin || hasActiveSubscription)

  if (hasActiveSubscription) {
    const { data: activeSubscription } = await supabase
      .from("subscriptions")
      .select("status, metadata")
      .eq("user_id", orgId)
      .in("status", ["active", "trialing", "past_due", "incomplete"])
      .not("stripe_subscription_id", "ilike", "stub_%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: string | null; metadata: Json | null }>()

    currentPlanTier = resolvePricingPlanTier(activeSubscription ?? null)
    if (currentPlanTier === "free") {
      currentPlanTier = "organization"
    }
  }

  const tutorialsCompleted = Array.isArray(userMeta?.tutorials_completed)
    ? (userMeta?.tutorials_completed as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : []
  const tutorialsDismissed = Array.isArray(userMeta?.tutorials_dismissed)
    ? (userMeta?.tutorials_dismissed as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : []

  const welcomeEligible = !needsOnboarding && !isAdmin && completed
  tutorialWelcomePlatform =
    welcomeEligible &&
    !tutorialsCompleted.includes("platform") &&
    !tutorialsDismissed.includes("platform")
  tutorialWelcomeAccelerator =
    welcomeEligible &&
    showAccelerator &&
    !tutorialsCompleted.includes("accelerator") &&
    !tutorialsDismissed.includes("accelerator")

  let sidebarTree: SidebarClass[] = []
  if (isAdmin || showAccelerator) {
    sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })
  }

  return {
    userPresent: true,
    sidebarTree,
    user: {
      name: displayName,
      title: profileAudience.headline ?? onboardingDefaults.defaultTitle ?? null,
      email,
      avatar,
    },
    isAdmin,
    isTester,
    showOrgAdmin,
    canAccessOrgAdmin,
    acceleratorProgress,
    showAccelerator,
    showLiveBadges,
    hasActiveSubscription,
    hasAcceleratorAccess,
    hasElectiveAccess,
    ownedElectiveModuleSlugs,
    currentPlanTier,
    organizationName,
    tutorialWelcome: {
      platform: tutorialWelcomePlatform,
      accelerator: tutorialWelcomeAccelerator,
    },
    onboardingDefaults: {
      open: needsOnboarding,
      ...onboardingDefaults,
    },
    onboardingLocked: needsOnboarding,
    onboardingIntentFocus:
      metadataIntentFocus === "build" ||
      metadataIntentFocus === "find" ||
      metadataIntentFocus === "fund" ||
      metadataIntentFocus === "support"
        ? metadataIntentFocus
        : null,
    formationStatus,
    memberWorkspaceHeader,
  }
})

export async function resolveDashboardLayoutState(): Promise<DashboardLayoutState> {
  return resolveDashboardLayoutStateCached()
}
