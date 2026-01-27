import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseErrorToError } from "@/lib/supabase/errors"
import type { Database } from "@/lib/supabase"

export type AdminProgressEntry = {
  id: string
  userId: string
  userLabel: string
  moduleTitle: string
  status: Database["public"]["Enums"]["module_progress_status"]
  updatedAt: string | null
  completedAt: string | null
}

export async function fetchRecentModuleProgress(limit = 25): Promise<AdminProgressEntry[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("module_progress")
    .select("id, user_id, status, completed_at, updated_at, modules ( title )")
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<Array<{
      id: string
      user_id: string
      status: Database["public"]["Enums"]["module_progress_status"]
      completed_at: string | null
      updated_at: string | null
      modules: { title: string | null } | null
    }>>()

  if (error) {
    throw supabaseErrorToError(error, "Unable to load module progress.")
  }

  const rows = data ?? []
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)))
  const userLabelById = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .returns<Array<{ id: string; full_name: string | null; email: string | null }>>()

    if (profileError) {
      throw supabaseErrorToError(profileError, "Unable to load user profiles.")
    }

    for (const profile of profiles ?? []) {
      const label = profile.full_name?.trim() || profile.email?.trim() || profile.id
      userLabelById.set(profile.id, label)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userLabel: userLabelById.get(row.user_id) ?? row.user_id,
    moduleTitle: row.modules?.title ?? "Unknown module",
    status: row.status,
    updatedAt: row.updated_at ?? null,
    completedAt: row.completed_at ?? null,
  }))
}
