import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"

import { env } from "@/lib/env"
import type { Database } from "./types"

export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 })
        },
      },
    }
  )
}
