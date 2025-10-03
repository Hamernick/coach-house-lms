import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase"

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) redirect("/login?redirect=/dashboard")
  // Intentionally empty dashboard for now
  return null
}
