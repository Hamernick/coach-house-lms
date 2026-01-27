"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import type { Database } from "@/lib/supabase/types"

type Result = { ok: true } | { error: string }

export async function markModuleCompleteAction(moduleId: string): Promise<Result> {
  if (!moduleId) return { error: "Missing module id." }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) return { error: "Unable to load user." }
  if (!user) return { error: "Not authenticated." }

  const payload: Database["public"]["Tables"]["module_progress"]["Insert"] = {
    user_id: user.id,
    module_id: moduleId,
    status: "completed",
  }

  const { error: upsertError } = await supabase
    .from("module_progress")
    .upsert(payload, { onConflict: "user_id,module_id" })

  if (upsertError) {
    return { error: "Unable to update progress." }
  }

  return { ok: true }
}
