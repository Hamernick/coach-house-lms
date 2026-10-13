import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import { buildOnboardingFlowDefaults } from "./defaults"

// Callers supply the authenticated request user's ID, never the selected
// organization's owner ID. Recovery retains that user's existing identity.
export async function buildSavedOnboardingFlowDefaults({
  supabase,
  needsOnboarding,
  ...input
}: Parameters<typeof buildOnboardingFlowDefaults>[0] & {
  supabase: SupabaseClient<Database>
  needsOnboarding: boolean
}) {
  if (!needsOnboarding) return buildOnboardingFlowDefaults(input)

  const { data, error } = await supabase
    .from("public_handles")
    .select("handle")
    .eq("owner_type", "person")
    .eq("profile_id", input.userId)
    .maybeSingle<{ handle: string }>()
  if (error) {
    throw supabaseErrorToError(error, "Unable to load your existing username.")
  }
  return buildOnboardingFlowDefaults({
    ...input,
    personHandle: data?.handle ?? null,
  })
}
