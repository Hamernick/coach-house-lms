import type { ReactNode } from "react"

import { createSupabaseServerClient } from "@/lib/supabase"
import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"
import { fetchSidebarTree } from "@/lib/academy"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({ children, breadcrumbs }: { children: ReactNode; breadcrumbs?: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  let displayName: string | null = null
  let email: string | null = user?.email ?? null
  let avatar: string | null = null
  let isAdmin = false
  let needsOnboarding = false

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
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: true, forceAdmin: isAdmin })

  return (
    <DashboardShell
      breadcrumbs={breadcrumbs}
      sidebarTree={sidebarTree}
      user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
      isAdmin={isAdmin}
      onboardingProps={{
        enabled: Boolean(user && needsOnboarding),
        open: needsOnboarding,
        defaultEmail: email,
        onSubmit: completeOnboardingAction,
      }}
    >
      {children}
    </DashboardShell>
  )
}
