import { redirect } from "next/navigation"
import type { SupabaseClient, Session } from "@supabase/supabase-js"

import {
  createSupabaseServerClient as createFromIndex,
} from "@/lib/supabase"
import {
  createSupabaseServerClient as createFromServer,
} from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

export type ServerSessionResult = {
  supabase: SupabaseClient<Database>
  session: Session | null
}

function resolveSupabase(): SupabaseClient<Database> {
  const a = (createFromServer as unknown as () => SupabaseClient<Database>)?.()
  if (a && (a as SupabaseClient<Database> | undefined)?.auth) return a
  const b = (createFromIndex as unknown as () => SupabaseClient<Database>)?.()
  return b
}

export async function getServerSession(): Promise<ServerSessionResult> {
  const supabase = resolveSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return { supabase, session }
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
