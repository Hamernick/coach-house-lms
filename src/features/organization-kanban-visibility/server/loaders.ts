import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import type { OrganizationKanbanVisibilityData } from "../types"

type ServerClient = SupabaseClient<Database>

function isMissingPreferencesTable(error: { code?: string | null }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

export async function loadOrganizationKanbanVisibility({
  supabase,
  userId,
}: {
  supabase: ServerClient
  userId: string
}): Promise<OrganizationKanbanVisibilityData> {
  const { data, error } = await supabase
    .from("organization_staff_kanban_preferences")
    .select("organization_id")
    .eq("staff_user_id", userId)
    .order("organization_id")
    .returns<Array<{ organization_id: string }>>()

  if (error && isMissingPreferencesTable(error)) {
    return { available: false, hiddenOrganizationIds: [] }
  }
  if (error) throw new Error("Unable to load your Kanban visibility.")

  return {
    available: true,
    hiddenOrganizationIds: (data ?? []).map((row) => row.organization_id),
  }
}
