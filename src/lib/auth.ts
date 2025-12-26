import { redirect } from "next/navigation"
import type { SupabaseClient, Session } from "@supabase/supabase-js"

import { createSupabaseServerClient as createFromServer } from "@/lib/supabase/server"
import { createSupabaseServerClient as createFromIndex } from "@/lib/supabase"
import { createClient, type SupabaseClient as CoreClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import type { Database } from "@/lib/supabase"

export type ServerSessionResult = {
  supabase: SupabaseClient<Database>
  session: Session | null
}

async function resolveSupabase(): Promise<SupabaseClient<Database>> {
  try {
    const a = await createFromServer()
    if (a && (a as unknown as { auth?: unknown }).auth) return a as unknown as SupabaseClient<Database>
  } catch {}
  try {
    const b = await createFromIndex()
    if (b && (b as unknown as { auth?: unknown }).auth) return b as unknown as SupabaseClient<Database>
  } catch {}
  // Test/fallback environment: create a non-SSR client without cookies
  const fallback = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as CoreClient<Database>
  return fallback as unknown as SupabaseClient<Database>
}

export async function getServerSession(): Promise<ServerSessionResult> {
  let supabase = (await resolveSupabase()) as SupabaseClient<Database> | undefined
  if (!supabase) {
    supabase = (createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as unknown) as SupabaseClient<Database>
  }
  const auth = (supabase as unknown as { auth?: unknown }).auth as
    | { getUser?: () => Promise<{ data?: { user?: unknown }; error?: unknown }>; getSession?: () => Promise<{ data?: { session?: unknown }; error?: unknown }> }
    | undefined

  // Prefer verified user retrieval; avoids relying on unverified cookie session payloads.
  if (typeof auth?.getUser === "function") {
    const { data: userData, error } = await auth.getUser()
    const user = (userData?.user ?? null) as Session["user"] | null
    if (!user || error) {
      return { supabase, session: null }
    }
    // Construct a minimal Session shape carrying the verified user.
    const minimalSession = ({ user } as unknown) as Session
    return { supabase, session: minimalSession }
  }

  // Test/mocks: fall back to getSession when getUser is unavailable.
  if (typeof auth?.getSession === "function") {
    const { data, error } = await auth.getSession()
    const session = (data?.session ?? null) as Session | null
    if (!session || error) {
      return { supabase, session: null }
    }
    return { supabase, session }
  }

  return { supabase, session: null }
}

export async function requireServerSession(redirectPath: string = "/dashboard"): Promise<
  { supabase: SupabaseClient<Database>; session: Session }
> {
  const { supabase, session } = await getServerSession()
  if (!session) {
    const encoded = encodeURIComponent(redirectPath)
    redirect(`/login?redirect=${encoded}`)
  }
  return { supabase, session: session! }
}
