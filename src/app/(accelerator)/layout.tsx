import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { fetchSidebarTree } from "@/lib/academy"
import { AcceleratorShell } from "@/components/accelerator/accelerator-shell"

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

  if (!isAdmin) {
    const { data: purchase } = await supabase
      .from("accelerator_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle<{ id: string }>()

    if (!purchase) {
      redirect("/pricing?upgrade=accelerator")
    }
  }

  const sidebarTree = await fetchSidebarTree({ includeDrafts: isAdmin, forceAdmin: isAdmin })

  return (
    <AcceleratorShell
      sidebarTree={sidebarTree}
      isAdmin={isAdmin}
      user={{ name: displayName, email: email ?? null, avatar: avatar ?? null }}
    >
      {children}
    </AcceleratorShell>
  )
}
