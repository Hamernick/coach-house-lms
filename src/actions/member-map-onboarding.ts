"use server"

import { redirect } from "next/navigation"

import { FIND_PATH } from "@/lib/find/routes"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { trackUserJourneyMilestone } from "@/lib/user-journey"

export async function completeMemberMapOnboardingAction(form: FormData) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError && !isSupabaseAuthSessionMissingError(userError)) {
    throw supabaseErrorToError(userError, "Unable to load user.")
  }
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`${FIND_PATH}?member_onboarding=1`)}`
    )
  }

  const intentFocusRaw = String(form.get("intentFocus") || "").trim()
  const intentFocus =
    intentFocusRaw === "find" ||
    intentFocusRaw === "fund" ||
    intentFocusRaw === "support"
      ? intentFocusRaw
      : "find"

  const { error: updateUserError } = await supabase.auth.updateUser({
    data: {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_intent_focus: intentFocus,
    },
  })

  if (updateUserError) {
    console.error(
      "completeMemberMapOnboardingAction: auth metadata update failed",
      {
        userId: user.id,
        message: updateUserError.message,
      }
    )
    throw supabaseErrorToError(updateUserError, "Unable to finish onboarding.")
  }

  await trackUserJourneyMilestone({
    userId: user.id,
    orgId: user.id,
    eventName: "member_onboarding_completed",
    journey: "member_onboarding",
    source: "member_map_onboarding_action",
    surface: "find_map_onboarding",
    checkpoint: "member_onboarding_completed",
    metadata: { intentFocus },
  })

  redirect(`${FIND_PATH}?member_onboarding=0&source=member_onboarding`)
}
