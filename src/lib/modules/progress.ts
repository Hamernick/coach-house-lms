import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { ModuleProgressInsert } from "./types"

export async function markModuleCompleted({
  moduleId,
  userId,
  notes,
}: {
  moduleId: string
  userId: string
  notes?: ModuleProgressInsert["notes"]
}) {
  const supabase = await createSupabaseServerClient()

  const upsertPayload: ModuleProgressInsert = {
    user_id: userId,
    module_id: moduleId,
    status: "completed",
    completed_at: new Date().toISOString(),
    notes: notes ?? undefined,
  }

  const { error } = await supabase
    .from("module_progress")
    .upsert(upsertPayload, { onConflict: "user_id,module_id" })

  if (error) {
    throw supabaseErrorToError(error, "Unable to update module progress.")
  }
}
