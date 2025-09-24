import { redirect } from "next/navigation"
import type { SupabaseClient, Session } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

export type ServerSessionResult = {
  supabase: SupabaseClient<Database>
  session: Session | null
}

export async function getServerSession(): Promise<ServerSessionResult> {
  const supabase = createSupabaseServerClient()
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
  // TypeScript doesn't narrow after redirect(), assert non-null
  return { supabase, session: session! }
}

