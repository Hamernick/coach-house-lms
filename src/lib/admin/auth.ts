import { redirect } from "next/navigation"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"

type RequireAdminResult = {
  supabase: SupabaseClient<Database>
  userId: string
}

async function requireAdminInternal(): Promise<RequireAdminResult> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/auth/sign-in")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return { supabase, userId: user.id }
}

export const requireAdmin = cache(requireAdminInternal)
