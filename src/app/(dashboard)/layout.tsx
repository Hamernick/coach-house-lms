import type { CSSProperties, ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { createSupabaseServerClient } from "@/lib/supabase"
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog"
import { completeOnboardingAction } from "@/app/(dashboard)/onboarding/actions"
import { fetchSidebarTree } from "@/lib/academy"

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

  // Sidebar academy tree (DB-driven)
  const sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin })

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{
          name: displayName,
          email,
          avatar,
        }}
        isAdmin={isAdmin}
        classes={sidebarTree}
      />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <main className="flex flex-1 flex-col" role="main">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
          </div>
        </main>
      </SidebarInset>
      {user ? (
        <OnboardingDialog
          open={needsOnboarding}
          defaultEmail={email}
          onSubmit={completeOnboardingAction}
        />
      ) : null}
    </SidebarProvider>
  )
}
