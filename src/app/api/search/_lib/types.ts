import { createSupabaseServerClient } from "@/lib/supabase"

export type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export type SearchRow = {
  id: string
  label: string
  subtitle: string | null
  href: string
  group_name: string
  rank: number | null
}
