import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { clientEnv } from "@/lib/env"
import type { Database } from "./types"

let browserClient: SupabaseClient<Database, "public"> | undefined

export function createSupabaseBrowserClient(): SupabaseClient<Database, "public"> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }

  return browserClient
}
