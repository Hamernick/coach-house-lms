import type { SupabaseClient } from "@supabase/supabase-js"
import "server-only"

import { type Database, createSupabaseAdminClient } from "@/lib/supabase"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { CoachingCreditAccount } from "../credit-types"

export async function loadPersonalCoachingCreditAccount(
  userId: string,
  client?: SupabaseClient<Database>
): Promise<CoachingCreditAccount> {
  const { data, error } = await (client ?? createSupabaseAdminClient()).rpc(
    "coaching_credit_account",
    { p_user_id: userId }
  )
  if (error)
    throw supabaseErrorToError(error, "Unable to load coaching credits.")
  return data as unknown as CoachingCreditAccount
}
