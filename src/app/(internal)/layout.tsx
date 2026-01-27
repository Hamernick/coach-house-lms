import type { ReactNode } from "react"

import { AppShell } from "@/components/app-shell"
import { fetchSidebarTree } from "@/lib/academy"
import { requireAdmin } from "@/lib/admin/auth"

export default async function InternalAdminLayout({
  children,
  breadcrumbs,
}: {
  children: ReactNode
  breadcrumbs?: ReactNode
}) {
  const { supabase, userId } = await requireAdmin()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle<{ full_name: string | null; avatar_url: string | null }>()

  const displayName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? null
  const email = user?.email ?? (typeof user?.user_metadata?.email === "string" ? user?.user_metadata?.email : null)
  const avatar = profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? null

  const sidebarTree = await fetchSidebarTree({ includeDrafts: true, forceAdmin: true })

  return (
    <AppShell
      breadcrumbs={breadcrumbs}
      sidebarTree={sidebarTree}
      user={{ name: displayName, email, avatar }}
      isAdmin
      showOrgAdmin
      showAccelerator
      context="platform"
    >
      {children}
    </AppShell>
  )
}
