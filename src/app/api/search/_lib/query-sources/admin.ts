import type { SupabaseClient } from "../types"

export async function fetchIsAdmin(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: string | null }>()
  return profile?.role === "admin"
}
