import type { ReactNode } from "react"

import { redirect } from "next/navigation"

import { fetchSidebarTree } from "@/lib/academy"
import { AppShell } from "@/components/app-shell"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import type { Json } from "@/lib/supabase"
import { hasPaidTeamAccessFromSubscription } from "@/lib/billing/subscription-access"

export default async function AdminLayout({ children, breadcrumbs }: { children: ReactNode; breadcrumbs: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) {
    redirect("/login?redirect=/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; avatar_url: string | null }>()

  const displayName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? null
  const email = user?.email ?? null
  const avatar = profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined) ?? null

  const { data: roleRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()
  const isAdmin = roleRow?.role === "admin"
  const { orgId, role } = await resolveActiveOrganization(supabase, user.id)
  const showOrgAdmin = role === "owner" || role === "admin" || isAdmin
  let canAccessOrgAdmin = isAdmin
  if (!isAdmin && showOrgAdmin) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, metadata, created_at")
      .eq("user_id", orgId)
      .not("stripe_subscription_id", "ilike", "stub_%")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: string | null; metadata: Json | null }>()
    canAccessOrgAdmin = hasPaidTeamAccessFromSubscription(subscription ?? null)
  }
  let showAccelerator = isAdmin

  if (!isAdmin) {
    const { data: purchase } = await supabase
      .from("accelerator_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle<{ id: string }>()

    showAccelerator = Boolean(purchase)
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })

  return (
    <AppShell
      breadcrumbs={breadcrumbs}
      sidebarTree={sidebarTree}
      user={{ name: displayName, email, avatar }}
      isAdmin={isAdmin}
      showOrgAdmin={showOrgAdmin}
      canAccessOrgAdmin={canAccessOrgAdmin}
      showAccelerator={showAccelerator}
      context="platform"
    >
      {children}
    </AppShell>
  )
}
