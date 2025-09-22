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
  const supabase = await createSupabaseServerClient()
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
