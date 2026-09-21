import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

// actorId must come from server-verified authentication, never request payloads.
// Each client carries its own audit context; no shared headers are mutated.
export function createSupabaseAdminClient(
  { actorId }: { actorId?: string } = {},
): SupabaseClient<Database, "public"> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    ...(actorId ? { global: { headers: { "x-coach-house-actor-id": actorId } } } : {}),
    auth: {
      persistSession: false,
    },
  })
}
