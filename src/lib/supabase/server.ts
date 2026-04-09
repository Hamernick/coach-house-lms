import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cache } from "react"
import { cookies } from "next/headers"

import { env } from "@/lib/env"
import type { Database } from "./types"

type NextCookieStore = {
  get: (name: string) => { value: string } | undefined
  getAll: () => Array<{ name: string; value: string }>
  set?: (options: { name: string; value: string } & CookieOptions) => void
}

function isReadOnlyCookiesError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Cookies can only be modified in a Server Action or Route Handler")
  )
}

async function createSupabaseServerClientInternal(): Promise<
  SupabaseClient<Database, "public">
> {
  const cookieStore = (await cookies()) as unknown as NextCookieStore

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookieValues) {
          try {
            for (const { name, value, options } of cookieValues) {
              cookieStore.set?.({ name, value, ...options })
            }
          } catch (error) {
            if (!isReadOnlyCookiesError(error)) {
              throw error
            }
          }
        },
      },
    }
  )
}

export const createSupabaseServerClient = cache(createSupabaseServerClientInternal)
