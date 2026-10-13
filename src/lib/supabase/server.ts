import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

import { env } from "@/lib/env"
import type { Database } from "./types"

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database, "public">
> {
  const cookieStore = (await cookies()) as unknown as {
    get: (name: string) => { value: string } | undefined
    set?: (options: { name: string; value: string } & CookieOptions) => void
    delete?: (name: string) => void
  }

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set?.({ name, value, ...options })
        },
        remove(name) {
          cookieStore.delete?.(name)
        },
      },
    }
  )
}
