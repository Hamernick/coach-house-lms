import { redirect } from "next/navigation"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"

type AdminContext = {
  supabase: ReturnType<typeof createSupabaseServerClient>
  userId: string
}

async function requireAdminInternal(): Promise<AdminContext> {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/sign-in")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return { supabase, userId: session.user.id }
}

export const requireAdmin = cache(requireAdminInternal)
