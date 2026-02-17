"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { resolveDevtoolsAudience, resolveTesterMetadata } from "@/lib/devtools/audience"

type AdminTestingActionResult = { ok: true } | { error: string }

export async function resetOnboardingCompletionAction(): Promise<AdminTestingActionResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const audience = await resolveDevtoolsAudience({
    supabase,
    userId: user.id,
    fallbackIsTester: resolveTesterMetadata(user.user_metadata ?? null),
  })
  if (!audience.isAdmin && !audience.isTester) return { error: "Forbidden." }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      onboarding_completed: false,
      onboarding_completed_at: null,
    },
  })

  if (updateError) return { error: "Unable to update onboarding state." }
  return { ok: true }
}
