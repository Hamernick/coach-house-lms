import { createBrowserClient } from "@supabase/ssr"

import { clientEnv } from "@/lib/env"
import type { Database } from "./types"

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }

  return browserClient
}
