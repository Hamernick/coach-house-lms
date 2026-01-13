import type { ReactNode } from "react"

import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { isFreeTierSubscription } from "@/lib/meetings"
import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"
import { fetchSidebarTree } from "@/lib/academy"
import { fetchAcceleratorProgressSummary } from "@/lib/accelerator/progress"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { publicSharingEnabled } from "@/lib/feature-flags"

export default async function DashboardLayout({ children, breadcrumbs }: { children: ReactNode; breadcrumbs?: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw userError
  }

  let displayName: string | null = null
  let email: string | null = user?.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let needsOnboarding = false
  let onboardingVariant: "basic" | "accelerator" = "accelerator"
  let acceleratorProgress: number | null = null
  let showLiveBadges = false

  if (user) {
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

    const completed = Boolean((user.user_metadata as Record<string, unknown> | null)?.onboarding_completed)
    // Admins never see onboarding; students see it until completed
    needsOnboarding = !isAdmin && !completed

    if (needsOnboarding) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, metadata")
        .eq("user_id", user.id)
        .maybeSingle<{ status: string | null; metadata: Record<string, string | null> | null }>()
      const isFreeTier = isFreeTierSubscription(subscription ?? null)
      onboardingVariant = isFreeTier ? "basic" : "accelerator"
    }

    if (publicSharingEnabled) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("public_slug, is_public, is_public_roadmap")
        .eq("user_id", user.id)
        .maybeSingle<{ public_slug: string | null; is_public: boolean | null; is_public_roadmap: boolean | null }>()

      const hasSlug = Boolean(orgRow?.public_slug && orgRow.public_slug.trim().length > 0)
      showLiveBadges = hasSlug && Boolean(orgRow?.is_public) && Boolean(orgRow?.is_public_roadmap)
    }
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: true, forceAdmin: isAdmin })

  if (user) {
    try {
      const { percent } = await fetchAcceleratorProgressSummary({
        supabase,
        userId: user.id,
        isAdmin,
        classes: sidebarTree,
      })
      acceleratorProgress = percent
    } catch {
      acceleratorProgress = null
    }
  }

  return (
    <DashboardShell
      breadcrumbs={breadcrumbs}
      sidebarTree={sidebarTree}
      user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
      isAdmin={isAdmin}
      acceleratorProgress={acceleratorProgress}
      showLiveBadges={showLiveBadges}
      onboardingProps={{
        enabled: Boolean(user && needsOnboarding),
        open: needsOnboarding,
        defaultEmail: email,
        onSubmit: completeOnboardingAction,
        variant: onboardingVariant,
      }}
    >
      {children}
    </DashboardShell>
  )
}
