import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { fetchSidebarTree } from "@/lib/academy"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"
import {
  resolvePricingPlanTier,
  type PricingPlanTier,
} from "@/lib/billing/plan-tier"
import { resolveAccountBillingCancellationRisk } from "@/lib/billing/subscription-access"
import { AppShell } from "@/components/app-shell"
import { readAppSidebarDefaultOpen } from "@/components/app-shell/sidebar-state-server"
import {
  resolveProfileAudience,
  resolveTesterMetadata,
} from "@/lib/devtools/audience"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { Json } from "@/lib/supabase"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { isWorkspaceFoundationRolloutEnabled } from "@/lib/workspace/foundation-rollout"
import { WORKSPACE_ACCELERATOR_PATH } from "@/lib/workspace/routes"

export default async function AcceleratorLayout({
  children,
}: {
  children: ReactNode
}) {
  const [supabase, defaultSidebarOpen] = await Promise.all([
    createSupabaseServerClient(),
    readAppSidebarDefaultOpen(),
  ])
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }

  if (!user) {
    redirect("/login")
  }

  let displayName: string | null = null
  let displayTitle: string | null = null
  let email: string | null = user.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let isTester = false
  let showOrgAdmin = false
  let canAccessOrgAdmin = false
  let organizationName: string | null = null
  let currentPlanTier: PricingPlanTier = "free"
  let hasBillingCancellationRisk = false

  const fallbackIsTester = resolveTesterMetadata(user.user_metadata ?? null)
  const userMeta =
    (user.user_metadata as Record<string, unknown> | null) ?? null
  const metadataFirstName =
    typeof userMeta?.first_name === "string" ? userMeta.first_name.trim() : ""
  const metadataLastName =
    typeof userMeta?.last_name === "string" ? userMeta.last_name.trim() : ""
  const metadataFullName = [metadataFirstName, metadataLastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  const [profileAudience, activeOrg] = await Promise.all([
    resolveProfileAudience({
      supabase,
      userId: user.id,
      fallbackIsTester,
    }),
    resolveActiveOrganization(supabase, user.id),
  ])

  const { orgId, role } = activeOrg
  if (
    isWorkspaceFoundationRolloutEnabled({
      orgId,
      userId: user.id,
    })
  ) {
    redirect(WORKSPACE_ACCELERATOR_PATH)
  }

  displayName =
    profileAudience.fullName ??
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    (metadataFullName || null)
  displayTitle = profileAudience.headline
  isAdmin = profileAudience.isAdmin
  isTester = profileAudience.isTester

  if (!email && typeof user.user_metadata?.email === "string") {
    email = user.user_metadata.email as string
  }

  avatar =
    profileAudience.avatarUrl ??
    (typeof user.user_metadata?.avatar_url === "string"
      ? (user.user_metadata.avatar_url as string)
      : null)

  showOrgAdmin = role === "owner" || role === "admin" || isAdmin

  const [entitlements, orgRowResult, accountBillingResult] = await Promise.all([
    fetchLearningEntitlements({
      supabase,
      userId: user.id,
      orgUserId: orgId,
      isAdmin,
    }),
    supabase
      .from("organizations")
      .select("profile")
      .eq("user_id", orgId)
      .maybeSingle<{ profile: Json | null }>(),
    resolveAccountBillingCancellationRisk({
      supabase,
      userId: user.id,
    }),
  ])
  hasBillingCancellationRisk =
    "error" in accountBillingResult
      ? false
      : accountBillingResult.hasBillingCancellationRisk
  canAccessOrgAdmin =
    showOrgAdmin && (isAdmin || entitlements.hasActiveSubscription)

  const orgProfile =
    (orgRowResult.data?.profile as Record<string, unknown> | null) ?? null
  const orgName =
    typeof orgProfile?.name === "string" ? orgProfile.name.trim() : ""
  organizationName = orgName.length > 0 ? orgName : null

  if (entitlements.hasActiveSubscription) {
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
    if (currentPlanTier === "free" && entitlements.hasActiveSubscription) {
      currentPlanTier = "organization"
    }
  }

  if (!entitlements.hasAcceleratorAccess && !entitlements.hasElectiveAccess) {
    redirect(
      "/organization?paywall=organization&plan=organization&upgrade=accelerator-access&source=accelerator"
    )
  }

  const sidebarTree = await fetchSidebarTree({
    includeDrafts: isAdmin,
    forceAdmin: isAdmin,
  })

  return (
    <AppShell
      sidebarTree={sidebarTree}
      isAdmin={isAdmin}
      showOrgAdmin={showOrgAdmin}
      canAccessOrgAdmin={canAccessOrgAdmin}
      isTester={isTester}
      user={{
        name: displayName,
        title: displayTitle,
        email: email ?? null,
        avatar: avatar ?? null,
      }}
      showAccelerator={true}
      hasBillingCancellationRisk={hasBillingCancellationRisk}
      hasAcceleratorAccess={entitlements.hasAcceleratorAccess}
      hasElectiveAccess={entitlements.hasElectiveAccess}
      ownedElectiveModuleSlugs={entitlements.ownedElectiveModuleSlugs}
      currentPlanTier={currentPlanTier}
      organizationName={organizationName}
      defaultSidebarOpen={defaultSidebarOpen}
      context="accelerator"
    >
      {children}
    </AppShell>
  )
}
