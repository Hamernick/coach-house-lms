import { redirect } from "next/navigation"
import { cache } from "react"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"

type RequireAdminResult = {
  supabase: SupabaseClient<Database>
  userId: string
}

function formatSupabaseError(error: unknown) {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== "object") return String(error)
  const record = error as Record<string, unknown>
  const code = typeof record.code === "string" ? record.code : null
  const message = typeof record.message === "string" ? record.message : null
  const details = typeof record.details === "string" ? record.details : null
  return [code, message, details].filter(Boolean).join(" — ") || "Unknown error"
}

async function requireAdminInternal(): Promise<RequireAdminResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    console.error("[admin-auth] Unable to load Supabase user.", userError)
    redirect("/login?redirect=/internal")
  }

  if (!user) {
    redirect("/login?redirect=/internal")
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  if (error) {
    throw new Error(`Unable to verify admin access: ${formatSupabaseError(error)}`)
  }

  if (!profile || profile.role !== "admin") {
    redirect("/organization")
  }

  return { supabase, userId: user.id }
}

export const requireAdmin = cache(requireAdminInternal)
