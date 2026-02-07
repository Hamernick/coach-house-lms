import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { fetchSidebarTree } from "@/lib/academy"
import { AppShell } from "@/components/app-shell"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { fetchLearningEntitlements } from "@/lib/accelerator/entitlements"

export default async function AcceleratorLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
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
  let email: string | null = user.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let tutorialWelcome = false
  let showOrgAdmin = false

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; role: string | null; avatar_url: string | null }>()

  displayName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null
  isAdmin = profile?.role === "admin"

  if (!email && typeof user.user_metadata?.email === "string") {
    email = user.user_metadata.email as string
  }

  avatar = profile?.avatar_url ?? (typeof user.user_metadata?.avatar_url === "string" ? (user.user_metadata.avatar_url as string) : null)

  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  showOrgAdmin = role === "owner" || role === "admin" || isAdmin

  const entitlements = await fetchLearningEntitlements({
    supabase,
    userId: user.id,
    orgUserId: orgId,
    isAdmin,
  })

  const userMeta = (user.user_metadata as Record<string, unknown> | null) ?? null
  const onboardingCompleted = Boolean(userMeta?.onboarding_completed)
  const tutorialsCompleted = Array.isArray(userMeta?.tutorials_completed)
    ? (userMeta?.tutorials_completed as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  const tutorialsDismissed = Array.isArray(userMeta?.tutorials_dismissed)
    ? (userMeta?.tutorials_dismissed as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  tutorialWelcome = !isAdmin && onboardingCompleted && !tutorialsCompleted.includes("accelerator") && !tutorialsDismissed.includes("accelerator")

  if (!entitlements.hasAcceleratorAccess && !entitlements.hasElectiveAccess) {
    redirect("/pricing?upgrade=accelerator")
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })

  return (
    <AppShell
      sidebarTree={sidebarTree}
      isAdmin={isAdmin}
      showOrgAdmin={showOrgAdmin}
      tutorialWelcome={{ platform: false, accelerator: tutorialWelcome }}
      user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
      showAccelerator={true}
      hasAcceleratorAccess={entitlements.hasAcceleratorAccess}
      hasElectiveAccess={entitlements.hasElectiveAccess}
      ownedElectiveModuleSlugs={entitlements.ownedElectiveModuleSlugs}
      context="accelerator"
    >
      {children}
    </AppShell>
  )
}
