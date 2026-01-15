"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"

type AdminTestingActionResult = { ok: true } | { error: string }

async function isAdminUser(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()

  if (error) return false
  return profile?.role === "admin"
}

export async function resetOnboardingCompletionAction(): Promise<AdminTestingActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const isAdmin = await isAdminUser(supabase, user.id)
  if (!isAdmin) return { error: "Forbidden." }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      onboarding_completed: false,
      onboarding_completed_at: null,
    },
  })

  if (updateError) return { error: "Unable to update onboarding state." }
  return { ok: true }
}

